import boto3
from boto3.dynamodb.conditions import Key, Attr
import simplejson as json
import os
from datetime import datetime, timedelta

def scan_dynamo_table():
    dynamodb = boto3.resource('dynamodb')
    table_name = 'communitydaymx24'
    table = dynamodb.Table(table_name)

    items = []
    response = table.scan(
        FilterExpression=Attr('PK').begins_with('USER#') & Attr('SK').eq('PROFILE')
    )
    items.extend(response['Items'])

    while 'LastEvaluatedKey' in response:
        response = table.scan(
            FilterExpression=Attr('PK').begins_with('USER#') & Attr('SK').eq('PROFILE'),
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        items.extend(response['Items'])

    return items

def save_to_file(data, filename):
    with open(filename, 'w') as f:
        json.dump(data, f, use_decimal=True)

def load_from_file(filename):
    with open(filename, 'r') as f:
        return json.load(f)

def is_file_recent(filename, max_age_hours=24):
    if not os.path.exists(filename):
        return False
    file_time = datetime.fromtimestamp(os.path.getmtime(filename))
    return datetime.now() - file_time < timedelta(hours=max_age_hours)

def get_user_profiles(filename='user_profiles.json', max_age_hours=24):
    if is_file_recent(filename, max_age_hours):
        print("Loading data from file...")
        return load_from_file(filename)
    else:
        print("Scanning DynamoDB table...")
        data = scan_dynamo_table()
        save_to_file(data, filename)
        return data

def get_most_scans(profiles):
    return sorted(profiles, key=lambda x: x.get('scanned_count', 0), reverse=True)

def save_users_with_completed_passport(profiles, filename='completed_passport_users.json'):
    completed_passport_users = [profile for profile in profiles if profile.get('completed_passport', False)]
    save_to_file(completed_passport_users, filename)

# Usage
user_profiles = get_user_profiles()
print(f"Total items: {len(user_profiles)}")

most_scans = get_most_scans(user_profiles)
print("Most scans:")

for profile in most_scans[:10]:
    print(f"\t{profile['first_name']} {profile['last_name']} - {profile.get('scanned_count', 0)} scans")