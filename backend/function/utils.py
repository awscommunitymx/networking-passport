import json


def generate_http_response(status_code: int, body: dict) -> dict:
    """Generate a HTTP response with CORS headers

    Args:
        status_code (int): _description_
        body (dict): _description_

    Returns:
        dict: _description_
    """
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": json.dumps(body),
    }
