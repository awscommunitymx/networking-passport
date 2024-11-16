import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta, timezone

import boto3
from botocore.exceptions import ClientError
from utils import generate_http_response

# Inicializar cliente de DynamoDB
dynamodb = boto3.client("dynamodb")

table_name = os.environ.get("DYNAMODB_TABLE_NAME")
index_name = os.environ.get("INDEX_NAME")

# Clave secreta para firmar y verificar el JWT
SECRET_KEY = "my_super_secret_key"


# Función para decodificar el JWT sin librerías externas
def base64url_decode(input: str):
    rem = len(input) % 4
    if rem > 0:
        input += "=" * (4 - rem)
    return base64.urlsafe_b64decode(input)


def verify_jwt(token, secret_key):
    try:
        # Separar el token en sus tres partes (header, payload, signature)
        header_b64, payload_b64, signature_b64 = token.split(".")

        # Verificar la firma
        signing_input = f"{header_b64}.{payload_b64}".encode()
        signature = base64url_decode(signature_b64)
        key = secret_key.encode()
        expected_signature = hmac.new(key, signing_input, hashlib.sha256).digest()

        if not hmac.compare_digest(signature, expected_signature):
            return None

        # Decodificar el payload
        payload_json = base64url_decode(payload_b64).decode("utf-8")
        payload = json.loads(payload_json)

        # Verificar que el token no haya expirado
        if "exp" in payload and datetime.utcnow().timestamp() > payload["exp"]:
            return None

        return payload
    except Exception as e:
        print(f"Error verifying JWT: {e}")
        return None

def can_register(user_id, sponsor_id):
    now = datetime.now(timezone.utc)
    ten_minutes_ago = now - timedelta(minutes=10)

    # Query the latest session for the user with the sponsor
    response = dynamodb.query(
        TableName=table_name,
        KeyConditionExpression="PK = :user_pk AND begins_with(SK, :sponsor_sk)",
        ExpressionAttributeValues={
            ":user_pk": {"S": f"USER#{user_id}"},
            ":sponsor_sk": {"S": f"SPONSOR#{sponsor_id}"},
        },
        ScanIndexForward=False,  # Sort in descending order to get the latest session first
        Limit=1
    )

    # Check if there is a recent session
    items = response.get('Items', [])
    if items:
        last_session = items[0]
        last_timestamp = datetime.fromisoformat(last_session['created_at']['S'])

        # Ensure the last session was more than 10 minutes ago
        if last_timestamp > ten_minutes_ago:
            return False

    # Otherwise, allow the registration
    return True


# Función para guardar o actualizar el sello y los comentarios
def lambda_handler(event, context):
    # Parsear el cuerpo de la solicitud
    try:
        body = json.loads(event["body"])
        short_id = body["short_id"]
        jwt_token = body["jwt"]
    except (KeyError, json.JSONDecodeError) as e:
        return generate_http_response(400, {"error": "Invalid input"})

    # Verificar el JWT y extraer el sponsor_id
    jwt_payload = verify_jwt(jwt_token, SECRET_KEY)
    if jwt_payload is None:
        return generate_http_response(403, {"error": "Invalid or expired JWT"})

    sponsor_id = jwt_payload.get("sponsor_id")
    if not sponsor_id:
        return generate_http_response(403, {"error": "JWT does not contain sponsor_id"})

    notes = body.get("notes", "")  # Notas opcionales

    try:
        # Buscar al usuario por short_id
        response_user = dynamodb.query(
            TableName=table_name,
            IndexName=index_name,
            KeyConditionExpression="short_id = :sid",
            ExpressionAttributeValues={":sid": {"S": short_id}},
        )

        # Verificar si el usuario existe
        if not response_user["Items"]:
            return generate_http_response(404, {"error": "User not found"})

        user_id = response_user["Items"][0]["user_id"]["S"]

        now = datetime.now(timezone.utc).isoformat()

        if not can_register(user_id, sponsor_id):
            return generate_http_response(403, {"error": "User already registered"})

        dynamodb.put_item(
            TableName=table_name,
            Item={
                "PK": {"S": f"USER#{user_id}"},
                "SK": {"S": f"SPONSOR#{sponsor_id}#{now}"},
                "created_at": {"S": now},
            },
        )

        return generate_http_response(
            200, {"message": "Stamp and notes saved successfully"}
        )

    except ClientError as e:
        print(f"Error accessing DynamoDB: {e}")
        return generate_http_response(500, {"error": "Error accessing DynamoDB"})
