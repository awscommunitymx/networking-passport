import boto3
from boto3.dynamodb.conditions import Key, Attr
import json
import os
from datetime import datetime, timedelta
from collections import defaultdict

def scan_dynamo_table():
    dynamodb = boto3.resource('dynamodb')
    table_name = 'communitydaymx24'
    table = dynamodb.Table(table_name)

    items = []
    response = table.scan(
        FilterExpression=Attr('PK').begins_with('USER#') & Attr('SK').begins_with('SPONSOR#')
    )
    items.extend(response['Items'])

    while 'LastEvaluatedKey' in response:
        response = table.scan(
            FilterExpression=Attr('PK').begins_with('USER#') & Attr('SK').begins_with('SPONSOR#'),
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        items.extend(response['Items'])

    return items

def save_to_file(data, filename):
    with open(filename, 'w') as f:
        json.dump(data, f)

def load_from_file(filename):
    with open(filename, 'r') as f:
        return json.load(f)

def is_file_recent(filename, max_age_hours=24):
    if not os.path.exists(filename):
        return False
    file_time = datetime.fromtimestamp(os.path.getmtime(filename))
    return datetime.now() - file_time < timedelta(hours=max_age_hours)

def get_users_with_four_sponsors(filename='user_sponsors.json', max_age_hours=24):
    if is_file_recent(filename, max_age_hours):
        print("Loading data from file...")
        items = load_from_file(filename)
    else:
        print("Scanning DynamoDB table...")
        items = scan_dynamo_table()
        save_to_file(items, filename)

    # Group sponsors by user
    user_sponsors = defaultdict(list)
    for item in items:
        user_sponsors[item['PK']].append(item['SK'])

    # Filter users with exactly 4 sponsors
    users_with_four_sponsors = {
        user: sponsors
        for user, sponsors in user_sponsors.items()
        if len(sponsors) == 4
    }

    return users_with_four_sponsors

# Usage
users_with_four_sponsors = get_users_with_four_sponsors()
print(f"Total users with exactly 4 sponsors: {len(users_with_four_sponsors)}")

profiles_filename = 'user_profiles.json'

with open(profiles_filename, 'r') as f:
    user_profiles = json.load(f)

# Process and print details of users with 4 sponsors
for user, sponsors in users_with_four_sponsors.items():
    user_id = user.split('#')[1]
    profile = next((profile for profile in user_profiles if profile['user_id'] == user_id), None)
    if profile:
        print(f"{profile['first_name']} {profile['last_name']}")
        