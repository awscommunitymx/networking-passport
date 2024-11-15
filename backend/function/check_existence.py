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
    # Obtener el short_id de la solicitud HTTP enviada por API Gateway
    try:
        short_id = event["queryStringParameters"]["short_id"]
    except KeyError:
        return generate_http_response(400, {"error": "short_id is required"})

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

        # Obtener la información de contacto
        item = response["Items"][
            0
        ]  # Suponemos que el short_id es único y tomamos el primer resultado
        contact_info = item.get("contact_information", {}).get("M", {})

        email = contact_info.get("email", {}).get("S")
        phone = contact_info.get("phone", {}).get("S")
        initialized = item.get("initialized", {}).get(
            "BOOL", False
        )  # Obtener el valor de initialized (suponiendo que es un campo booleano)

        # Revisar si tiene tanto celular como correo electrónico
        if email and phone:
            return generate_http_response(
                200, {"method": "both", "initialized": initialized}
            )
        elif email:
            return generate_http_response(
                200, {"method": "email", "initialized": initialized}
            )
        else:
            return generate_http_response(
                200, {"method": "phone", "initialized": initialized}
            )

    except ClientError as e:
        print(f"An error occurred: {e}")
        return generate_http_response(500, {"error": "Error accessing DynamoDB"})
