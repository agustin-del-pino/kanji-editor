import requests

# Define the query data
query = [
    {
        'japanese': '気を付けて',
        'english': 'Take care!'
    },
    {
        'japanese': 'お元気ですか？',
        'english': 'Are you ok?'
    }
]

# Send the POST request
response = requests.post('https://api.furiousgana.com', json=query)

# Handle the response
if response.status_code == 200:
    print(response.json())  # Here is your data
else:
    print(f"Request failed with status code {response.status_code}")
