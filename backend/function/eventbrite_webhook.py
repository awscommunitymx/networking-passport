import json
import os
import string
import hashlib
import boto3
import requests
from botocore.exceptions import ClientError

from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, CORSConfig
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
secretsmanager = boto3.client('secretsmanager')

app = APIGatewayRestResolver()
logger = Logger()
tracer = Tracer()

# Configuration from environment variables
TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME")
SQS_QUEUE_URL = os.environ.get("QUEUE_URL")
SECRET_NAME = os.environ.get("SECRET_NAME")

# Modificamos BASE62 para usar solo mayúsculas y números
BASE36 = string.digits + string.ascii_uppercase

# Retrieve the private token from Secrets Manager
secret = secretsmanager.get_secret_value(SecretId=SECRET_NAME)
PRIVATE_TOKEN = secret.get('SecretString')

if not PRIVATE_TOKEN:
    raise ValueError("Private token not found in Secrets Manager")

def base36_encode(num, alphabet=BASE36):
    """Encode a positive number into Base36."""
    if num == 0:
        return alphabet[0]
    arr = []
    base = len(alphabet)
    while num:
        num, rem = divmod(num, base)
        arr.append(alphabet[rem])
    arr.reverse()
    return ''.join(arr)

def generate_event_code(data):
    # Concatenate relevant data to create a unique string
    unique_string = f"{data['barcode']}_{data['email']}_{data['first_name']}_{data['last_name']}"
    
    # Generate a SHA256 hash of the unique string
    hash_object = hashlib.sha256(unique_string.encode())
    hash_int = int(hash_object.hexdigest(), 16)
    
    # Use the first 36 bits (6 characters in Base36) of the hash
    truncated_hash = hash_int & ((1 << 36) - 1)
    
    # Encode to Base36
    event_code = base36_encode(truncated_hash)
    
    # Pad with leading zeros if necessary to ensure 6 characters
    event_code = event_code.zfill(6)
    
    return event_code

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST, log_event=True)
@tracer.capture_lambda_handler
def lambda_handler(event, context):
    # Parse the incoming webhook payload
    body = json.loads(event['body'])
    
    # Extract the API URL for the attendee
    api_url = body['api_url']

    # Make a GET request to Eventbrite API to retrieve attendee details
    headers = {
        'Authorization': f'Bearer {PRIVATE_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        attendee_data = response.json()
        print(attendee_data)
        
        # Extract and validate the required information
        extracted_data = extract_and_validate_data(attendee_data)
        logger.info(f"Extracted data: {extracted_data}")
        
        event_code = generate_event_code(extracted_data)
        extracted_data['short_id'] = event_code
        logger.info(f"Generated event code: {event_code}")
        logger.info(f"Data with event code: {extracted_data}")
        
        # Try to save to DynamoDB
        db_operation_result = save_to_dynamodb(extracted_data)
        logger.info(f"DB operation result: {db_operation_result}")
        
        # Send message to SQS
        sqs_result = send_to_sqs_fifo(extracted_data)
        logger.info(f"SQS message sent: {sqs_result}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'attendee_data': extracted_data,
                'db_operation': db_operation_result,
                'sqs_message_sent': sqs_result
            })
        }
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Error retrieving attendee data: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps('Error retrieving attendee data')
        }
    except KeyError as e:
        logger.error(f"Error extracting data from JSON: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error processing attendee data: Missing key {str(e)}')
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps('Unexpected error processing the request')
        }

def extract_and_validate_data(attendee_data):

    profile = attendee_data.get('profile', {})
    
    return {
        'first_name': profile.get('first_name', ''),
        'last_name': profile.get('last_name', ''),
        'cell_phone': profile.get('cell_phone', ''),
        'email': profile.get('email', ''),
        'job_title': profile.get('job_title', ''),
        'company': profile.get('company', ''),
        'gender': profile.get('gender', ''),
        'barcode': attendee_data['barcodes'][0]['barcode'],
        'initialized': False
    }

@tracer.capture_method
def save_to_dynamodb(data):
    logger.info(f"Data to save: {data}")
    logger.info(f"Table name: {TABLE_NAME}")
    table = dynamodb.Table(TABLE_NAME)
    try:
        logger.info("Saving to DynamoDB")

        item = {
            'PK': f"USER#{data.get('barcode')}",
            'SK': "PROFILE",
            'first_name': data.get('first_name'),
            'last_name': data.get('last_name'),
            'short_id': data.get('short_id'),
            'user_id': data.get('barcode'),
            'initialized': data.get('initialized'),
            'company': data.get('company'),
            'contact_information': {
                'email': data.get('email'),
                'phone': data.get('cell_phone')
            },
            'gender': data.get('gender'),
            'role': data.get('job_title')
        }

        logger.info(f"Item to save: {item}")

        _response = table.put_item(
            TableName=TABLE_NAME,
            Item=item,
            ConditionExpression='attribute_not_exists(PK) OR (attribute_exists(PK) AND initialized = :false)',
            ExpressionAttributeValues={
                ':false': False
            }
        )
        logger.info(f"Record created or updated for barcode: {data['barcode']}")
        return "Record created or updated"
    except ClientError as e:
        if e.response.get('Error', {}).get('Code') == 'ConditionalCheckFailedException':
            logger.warning(f"Record with barcode {data['barcode']} already exists and is initialized. No update performed.")
            return "Record already exists and is initialized, no update performed"
        else:
            logger.error(f"Error saving to DynamoDB: {str(e)}")
            raise

        
@tracer.capture_method
def send_to_sqs_fifo(data):
    try:
        response = sqs.send_message(
            QueueUrl=SQS_QUEUE_URL,
            MessageBody=json.dumps(data),
            MessageGroupId=data['barcode'],
            MessageDeduplicationId=data['barcode']
        )
        logger.info(f"Message sent to SQS for barcode: {data['barcode']}")
        return {
            'success': True,
            'message_id': response['MessageId'],
            'sequence_number': response['SequenceNumber']
        }
    except ClientError as e:
        logger.error(f"Error sending message to SQS: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }