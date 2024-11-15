import json
import os

import boto3
from botocore.exceptions import ClientError

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

        # Verificar si el usuario existe
        if not response_user["Items"]:
            return {
                "statusCode": 404,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "User not found"}),
            }

        user_id = response_user["Items"][0]["user_id"]["S"]

        # Obtener todos los sellos que tiene el asistente consultando por PK
        response_stamps = dynamodb.query(
            TableName=table_name,
            KeyConditionExpression="PK = :pk AND begins_with(SK, :prefix)",
            ExpressionAttributeValues={
                ":pk": {"S": f"USER#{user_id}"},
                ":prefix": {"S": "SPONSOR#"},
            },
        )

        # Si no hay sellos
        if not response_stamps["Items"]:
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"message": "No stamps yet"}),
            }

        # Extraer los sellos
        stamps = []
        for item in response_stamps["Items"]:
            # Accedemos al valor de 'S' en SK antes de llamar a split()
            sponsor_id = item["SK"]["S"].split("#")[1]
            stamps.append(
                {"sponsor_id": sponsor_id, "timestamp": item["timestamp"]["S"]}
            )

        # Devolver los sellos en la respuesta
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"stamps": stamps}),
        }

    except ClientError as e:
        print(f"Error accessing DynamoDB: {e}")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Error accessing DynamoDB"}),
        }
