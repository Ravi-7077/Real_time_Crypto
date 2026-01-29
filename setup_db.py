import boto3

def create_table():
    # Connect to Local DynamoDB
    dynamodb = boto3.resource('dynamodb', endpoint_url="http://localhost:8000")

    try:
        table = dynamodb.create_table(
            TableName='CryptoHistory',
            KeySchema=[
                {'AttributeName': 'coin_id', 'KeyType': 'HASH'},  # Partition key
                {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}  # Sort key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'coin_id', 'AttributeType': 'S'},
                {'AttributeName': 'timestamp', 'AttributeType': 'N'}
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            }
        )
        print("✅ Table 'CryptoHistory' creating...")
        table.wait_until_exists()
        print("✅ Table created successfully!")
    except Exception as e:
        print(f"⚠️  Table already exists or error: {e}")

if __name__ == '__main__':
    create_table()