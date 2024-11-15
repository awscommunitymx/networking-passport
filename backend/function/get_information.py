import json
import os

import boto3
from botocore.exceptions import ClientError
from utils import generate_http_response

# Inicializamos el cliente de DynamoDB
dynamodb = boto3.client("dynamodb")
# Inicializar cliente de SQS
sqs = boto3.client("sqs")

# Definir el nombre de la tabla y el índice global secundario (GSI)
table_name = os.environ.get("DYNAMODB_TABLE_NAME")
index_name = os.environ.get("INDEX_NAME")
queue_url = os.environ.get("QUEUE_URL")


def lambda_handler(event, context):
    try:
        # Obtener parámetros
        short_id = event["queryStringParameters"]["short_id"]
        pin = event["queryStringParameters"].get("pin")
        unlock_key = event["queryStringParameters"].get("unlock_key")
    except KeyError:
        return generate_http_response(400, {"error": "short_id is required"})

    try:
        # Query DynamoDB
        response = dynamodb.query(
            TableName=table_name,
            IndexName=index_name,
            KeyConditionExpression="short_id = :sid",
            ExpressionAttributeValues={":sid": {"S": short_id}},
        )

        if not response.get("Items"):
            return generate_http_response(404, {"error": "short_id not found"})

        item = response["Items"][0]

        # Validación de PIN/unlock_key
        stored_pin = item.get("pin", {}).get("S")
        stored_unlock_key = item.get("unlock_key", {}).get("S")

        if pin and pin != stored_pin:
            return generate_http_response(403, {"error": "Invalid PIN"})
        elif unlock_key and unlock_key != stored_unlock_key:
            return generate_http_response(403, {"error": "Invalid unlock_key"})

        # Procesar registro SQS
        try:
            pk = item["PK"]["S"]
            sk = item["SK"]["S"]
            device = event["queryStringParameters"].get("device")

            if device:
                sqs.send_message(
                    QueueUrl=queue_url,
                    MessageBody=json.dumps({"PK": pk, "SK": sk, "device": device}),
                )
        except Exception as e:
            print(f"Error sending message to SQS: {e}")

        # Extraer información básica
        first_name = item.get("first_name", {}).get("S", "")
        last_name = item.get("last_name", {}).get("S", "")
        role = item.get("role", {}).get("S", "")
        gender = item.get("gender", {}).get("S", "")
        company = item.get("company", {}).get("S", "")

        # Procesar información de contacto
        contact_info = item.get("contact_information", {}).get("M", {})

        # Debug
        print("Contact info from DynamoDB:", json.dumps(contact_info))
        print(
            "Auth method - PIN:", pin is not None, "unlock_key:", unlock_key is not None
        )

        # Determinar qué información compartir basado en el método de autenticación
        is_using_unlock_key = unlock_key is not None and unlock_key == stored_unlock_key

        if is_using_unlock_key:
            # Si usa unlock_key, mostrar toda la información
            email = contact_info.get("email", {}).get("S")
            phone = contact_info.get("phone", {}).get("S")
            print("Using unlock_key - Email:", email, "Phone:", phone)
        else:
            # Si usa PIN, aplicar preferencias de privacidad
            share_email = contact_info.get("share_email", {}).get("BOOL")
            share_phone = contact_info.get("share_phone", {}).get("BOOL")
            print(
                "Privacy settings - Share email:",
                share_email,
                "Share phone:",
                share_phone,
            )

            # Aplicar preferencias
            email = contact_info.get("email", {}).get("S") if share_email else None
            phone = contact_info.get("phone", {}).get("S") if share_phone else None
            print("After privacy check - Email:", email, "Phone:", phone)

        # Procesar social links
        social_links = [
            {
                "name": link.get("M", {}).get("name", {}).get("S"),
                "url": link.get("M", {}).get("url", {}).get("S"),
            }
            for link in item.get("social_links", {}).get("L", [])
            if link.get("M", {}).get("url", {}).get("S", "").strip()
        ]

        # Construir vCard
        vcard_parts = [
            "BEGIN:VCARD",
            "VERSION:3.0",
            f"N:{first_name} {last_name}",
            f"ORG:{company}",
            f"ROLE:{role}",
        ]

        if email:
            vcard_parts.append(f"EMAIL:{email}")
        if phone:
            vcard_parts.append(f"TEL:{phone}")

        for link in social_links:
            if link["url"]:
                vcard_parts.append(f'URL;TYPE={link["name"]}:{link["url"]}')

        vcard_parts.append("END:VCARD")
        vcard = "\n".join(vcard_parts)

        # Construir respuesta
        response_data = {
            "first_name": first_name,
            "last_name": last_name,
            "role": role,
            "company": company,
            "gender": gender,
            "social_links": social_links,
            "vcard": vcard,
        }

        # Solo incluir información de contacto si está disponible
        if email:
            response_data["email"] = email
        if phone:
            response_data["phone"] = phone

        return generate_http_response(200, response_data)

    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return generate_http_response(500, {"error": "Error accessing DynamoDB"})
    except Exception as e:
        print(f"Unexpected error: {e}")
        return generate_http_response(500, {"error": "Unexpected error occurred"})
