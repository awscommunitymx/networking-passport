import json
import os

import boto3
from botocore.exceptions import ClientError
from utils import generate_http_response

# Inicializar cliente de DynamoDB
dynamodb = boto3.client("dynamodb")

table_name = os.environ.get("DYNAMODB_TABLE_NAME")
index_name = os.environ.get("INDEX_NAME")


# Función para consultar los sellos que un asistente ya tiene
def lambda_handler(event, context):
    try:
        # Obtener el short_id del asistente desde los parámetros
        short_id = event["queryStringParameters"]["short_id"]

        # Buscar al usuario por short_id
        response_user = dynamodb.query(
            TableName=table_name,
            IndexName=index_name,
            KeyConditionExpression="short_id = :sid",
            ExpressionAttributeValues={":sid": {"S": short_id}},
        )
        print(f"Querying DynamoDB table {table_name} for short_id {short_id} in GSI {index_name}")

        print(f"Response: {response_user}")

        # Verificar si el usuario existe
        if not response_user["Items"]:
            return generate_http_response(404, {"error": "User not found"})

        user_id = response_user["Items"][0]["user_id"]["S"]

        return generate_http_response(200, {
            "first_name": response_user["Items"][0]["first_name"]["S"],
            "last_name": response_user["Items"][0]["last_name"]["S"],
            "role": response_user["Items"][0].get("role", {}).get("S"),
            "company": response_user["Items"][0].get("company", {}).get("S"),
        })

    except ClientError as e:
        print(f"Error accessing DynamoDB: {e}")
        return generate_http_response(500, {"error": "Error accessing DynamoDB"})
