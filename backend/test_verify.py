from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

# ensure /api/hello works
print('api/hello', client.get('/api/hello').status_code, client.get('/api/hello').text)

# try verify-quest with dummy image
data = {'quest_description': 'foo'}
files = {'image': ('test.jpg', b'\xff\xd8\xff' + b'0'*100, 'image/jpeg')}
resp = client.post('/api/verify-quest', data=data, files=files)
print('/api/verify-quest', resp.status_code, resp.text)
