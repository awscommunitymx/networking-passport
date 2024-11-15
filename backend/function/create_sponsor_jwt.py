import json
import boto3
import base64
import hmac
import hashlib
from datetime import datetime, timedelta
from botocore.exceptions import ClientError
import os

# Inicializar el cliente de DynamoDB
dynamodb = boto3.client('dynamodb')

table_name = os.environ.get('DYNAMODB_TABLE_NAME')

# Clave secreta para firmar el JWT (debería almacenarse de forma segura)
SECRET_KEY = "my_super_secret_key"

# Función para codificar en base64 URL-safe
def base64url_encode(input: bytes):
    return base64.urlsafe_b64encode(input).decode('utf-8').replace('=', '') 

# Función para generar el JWT
def jwt(sponsor_id, sponsor_name, secret_key):
    segments = []
    
    # Crear el encabezado y el payload
    header = {"typ": "JWT", "alg": "HS256"}
    expiration_time = datetime.utcnow() + timedelta(hours=24)
    payload = {
        "sponsor_id": sponsor_id,
        "sponsor_name": sponsor_name,
        "exp": int(expiration_time.timestamp())
    }
    
    # Convertir a JSON y codificar en Base64
    json_header = json.dumps(header, separators=(",", ":")).encode()
    json_payload = json.dumps(payload, separators=(",", ":")).encode()
    
    # Agregar el header y el payload a los segmentos
    segments.append(base64url_encode(json_header))
    segments.append(base64url_encode(json_payload))
    
    # Firmar con HMAC usando HS256
    signing_input = ".".join(segments).encode()
    key = secret_key.encode()
    signature = hmac.new(key, signing_input, hashlib.sha256).digest()

    # Codificar la firma en Base64 y agregar a los segmentos
    segments.append(base64url_encode(signature))
    
    # Unir todo en el formato final JWT: header.payload.signature
    encoded_string = ".".join(segments)

    return encoded_string

def lambda_handler(event, context):
    try:
        # Obtener el body de la solicitud y validarlo
        body = json.loads(event['body'])
        
        if 'sponsor_id' not in body or 'sponsor_key' not in body:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Missing id_sponsor or key'})
            }
        
        sponsor_id = body['sponsor_id']
        sponsor_key = body['sponsor_key']
        
        # Formatear el PK utilizando el id_sponsor
        pk = f"SPONSOR#{sponsor_id}"
        
        # Consultar en DynamoDB para verificar el PK y key
        response = dynamodb.get_item(
            TableName=table_name,
            Key={
                'PK': {'S': pk},
                'SK': {'S': 'PROFILE'}
            }
        )

        # Verificar si el sponsor existe
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Sponsor not found'})
            }

        sponsor = response['Item']
        
        # Verificar si la key proporcionada coincide
        if sponsor['key']['S'] != sponsor_key:
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Invalid key sponsor'})
            }

        # Obtener sponsor_id y sponsor_name
        sponsor_id = sponsor['sponsor_id']['S']
        sponsor_name = sponsor['sponsor_name']['S']

        # Generar el JWT firmado por 24 horas
        token = jwt(sponsor_id, sponsor_name, SECRET_KEY)

        # Devolver el JWT
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'token': token})
        }

    except ClientError as e:
        print(f"Error accessing DynamoDB: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Error accessing DynamoDB'})
        }
    except Exception as e:
        print(f"Error generating token: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Error generating token'})
        }
