import json
import boto3
import base64
import hmac
import hashlib
from datetime import datetime
from botocore.exceptions import ClientError
import os

# Inicializar cliente de DynamoDB
dynamodb = boto3.client('dynamodb')

table_name = os.environ.get('DYNAMODB_TABLE_NAME')
index_name = os.environ.get('INDEX_NAME')

# Clave secreta para firmar y verificar el JWT
SECRET_KEY = "my_super_secret_key"

# Función para decodificar el JWT sin librerías externas
def base64url_decode(input: str):
    rem = len(input) % 4
    if rem > 0:
        input += '=' * (4 - rem)
    return base64.urlsafe_b64decode(input)

def verify_jwt(token, secret_key):
    try:
        # Separar el token en sus tres partes (header, payload, signature)
        header_b64, payload_b64, signature_b64 = token.split('.')
        
        # Verificar la firma
        signing_input = f"{header_b64}.{payload_b64}".encode()
        signature = base64url_decode(signature_b64)
        key = secret_key.encode()
        expected_signature = hmac.new(key, signing_input, hashlib.sha256).digest()
        
        if not hmac.compare_digest(signature, expected_signature):
            return None
        
        # Decodificar el payload
        payload_json = base64url_decode(payload_b64).decode('utf-8')
        payload = json.loads(payload_json)
        
        # Verificar que el token no haya expirado
        if 'exp' in payload and datetime.utcnow().timestamp() > payload['exp']:
            return None
        
        return payload
    except Exception as e:
        print(f"Error verifying JWT: {e}")
        return None

# Función para guardar o actualizar el sello y los comentarios
def lambda_handler(event, context):
    # Parsear el cuerpo de la solicitud
    try:
        body = json.loads(event['body'])
        short_id = body['short_id']
        jwt_token = body['jwt']
    except (KeyError, json.JSONDecodeError) as e:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid input', 'details': str(e)})
        }

    # Verificar el JWT y extraer el sponsor_id
    jwt_payload = verify_jwt(jwt_token, SECRET_KEY)
    if jwt_payload is None:
        return {
            'statusCode': 403,
            'body': json.dumps({'error': 'Invalid or expired JWT'})
        }

    sponsor_id = jwt_payload.get('sponsor_id')
    if not sponsor_id:
        return {
            'statusCode': 403,
            'body': json.dumps({'error': 'JWT does not contain sponsor_id'})
        }

    notes = body.get('notes', '')  # Notas opcionales

    try:
        # Buscar al usuario por short_id
        response_user = dynamodb.query(
            TableName=table_name,
            IndexName=index_name,
            KeyConditionExpression='short_id = :sid',
            ExpressionAttributeValues={
                ':sid': {'S': short_id}
            }
        )

        # Verificar si el usuario existe
        if not response_user['Items']:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'User not found'})
            }

        user_id = response_user['Items'][0]['user_id']['S']

        # Buscar si ya existe una relación USER<>SPONSOR
        response_relation = dynamodb.get_item(
            TableName=table_name,
            Key={
                'PK': {'S': f"USER#{user_id}"},
                'SK': {'S': f"SPONSOR#{sponsor_id}"}
            }
        )

        # Si la relación ya existe, simplemente actualizar las notas
        if 'Item' in response_relation:
            dynamodb.update_item(
                TableName=table_name,
                Key={
                    'PK': {'S': f"USER#{user_id}"},
                    'SK': {'S': f"SPONSOR#{sponsor_id}"}
                },
                UpdateExpression='SET notes = :notes',
                ExpressionAttributeValues={
                    ':notes': {'S': notes}
                }
            )
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'Notes updated successfully'})
            }

        # Si no existe la relación, crearla y guardar las notas
        timestamp = datetime.utcnow().isoformat()
        dynamodb.put_item(
            TableName=table_name,
            Item={
                'PK': {'S': f"USER#{user_id}"},
                'SK': {'S': f"SPONSOR#{sponsor_id}"},
                'notes': {'S': notes},
                'timestamp': {'S': timestamp}
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Stamp and notes saved successfully'})
        }

    except ClientError as e:
        print(f"Error accessing DynamoDB: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Error accessing DynamoDB'})
        }
