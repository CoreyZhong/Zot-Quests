from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

print("hitting /hello")
resp = client.get("/hello")
print(resp.status_code)
print(resp.text)

# also test an API route
resp2 = client.get("/api/hello")
print('/api/hello', resp2.status_code, resp2.text)
