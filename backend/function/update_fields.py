import json
import os

import boto3
from botocore.exceptions import ClientError
from utils import generate_http_response

# Inicializamos el cliente de DynamoDB
dynamodb = boto3.client("dynamodb")

# Definir el nombre de la tabla
table_name = os.environ.get("DYNAMODB_TABLE_NAME")
index_name = os.environ.get("INDEX_NAME")


def lambda_handler(event, context):
    # Parseamos el cuerpo de la solicitud
    try:
        body = json.loads(event["body"])
        short_id = body["short_id"]
        unlock_key = body["unlock_key"]
        company = body["company"]
        role = body["role"]
        email = body["email"]
        phone = body["phone"]
        share_email = body["share_email"]
        share_phone = body["share_phone"]
        pin = body["pin"]
        social_links = body["social_links"]
        gender = body.get("gender", None)
        profile = body.get("profile", None)
        age_range = body.get("age_range", None)
        area_of_interest = body.get("area_of_interest", None)
    except (KeyError, json.JSONDecodeError) as e:
        return generate_http_response(400, {"error": "Invalid input"})

    try:
        # Realizamos el query usando el índice global secundario (GSI)
        response = dynamodb.query(
            TableName=table_name,
            IndexName=index_name,
            KeyConditionExpression="short_id = :sid",
            ExpressionAttributeValues={":sid": {"S": short_id}},
        )

        # Revisar si el ítem existe
        if "Items" not in response or len(response["Items"]) == 0:
            return generate_http_response(404, {"error": "short_id not found"})

        # Obtener el item de DynamoDB
        item = response["Items"][0]
        stored_unlock_key = item.get("unlock_key", {}).get("S")

        # Validar el unlock_key recibido
        if stored_unlock_key != unlock_key:
            return generate_http_response(403, {"error": "Invalid unlock_key"})

        # Crear el objeto social_links para DynamoDB
        social_links_dynamo = []
        for link in social_links:
            social_links_dynamo.append(
                {"M": {"name": {"S": link["name"]}, "url": {"S": link["url"]}}}
            )

        # Actualizamos los datos en DynamoDB, incluyendo las preguntas demográficas
        dynamodb.update_item(
            TableName=table_name,
            Key={"PK": item["PK"], "SK": item["SK"]},
            UpdateExpression="SET contact_information.email = :email, company = :company, #r = :role, \
                             contact_information.phone = :phone, contact_information.share_email = :share_email, \
                             contact_information.share_phone = :share_phone, pin = :pin, social_links = :social_links, \
                             gender = :gender, profile = :profile, age_range = :age_range, area_of_interest = :area_of_interest, \
                             initialized = :initialized REMOVE unlock_key",
            ExpressionAttributeValues={
                ":email": {"S": email},
                ":phone": {"S": phone},
                ":share_email": {"BOOL": share_email},
                ":share_phone": {"BOOL": share_phone},
                ":pin": {"S": pin},
                ":social_links": {"L": social_links_dynamo},
                ":gender": {"S": gender} if gender else {"NULL": True},
                ":profile": {"S": profile} if profile else {"NULL": True},
                ":age_range": {"S": age_range} if age_range else {"NULL": True},
                ":area_of_interest": (
                    {"S": area_of_interest} if area_of_interest else {"NULL": True}
                ),
                ":initialized": {"BOOL": True},
                ":company": {"S": company},
                ":role": {"S": role},
            },
            ExpressionAttributeNames={"#r": "role"},
        )

        return generate_http_response(200, {"message": "Profile updated successfully"})

    except ClientError as e:
        print(f"An error occurred: {e}")
        return generate_http_response(
            500, {"error": "Error accessing or updating DynamoDB"}
        )
