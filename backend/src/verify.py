import io
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
from pathlib import Path

# load_dotenv("key.env") # This loads the .env file
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / "key.env"

load_dotenv(dotenv_path=env_path)
API_KEY = os.getenv("API_KEY")
if API_KEY:
    # This prints the first 4 and last 4 characters so you can verify it matches your dashboard
    # without revealing the whole key here.
    print(f"✅ KEY FOUND: {API_KEY[:4]}...{API_KEY[-4:]}")
    print(f"📏 LENGTH: {len(API_KEY)} characters")
else:
    print("❌ KEY NOT FOUND: os.getenv returned None")
print("="*40 + "\n")
#client = genai.Client(api_key=API_KEY)
client = genai.Client(api_key=API_KEY, http_options={'api_version': 'v1beta'})

class VerificationResult(BaseModel):
    verified: bool
    reason: str
    confidence_score: int

# client = genai.Client(api_key="API_KEY")

def get_gps_data(image_bytes: bytes):
    """Helper to pull GPS from photo if it exists."""
    img = Image.open(io.BytesIO(image_bytes))
    exif = img._getexif()
    if not exif: return None
    # ... logic to extract lat/long ...
    return "GPS Found" # Simplified for now

def verify_quest_completion(image_bytes: bytes, location_name: str, context: str):
    image_part = types.Part.from_bytes(
        data=image_bytes, 
        mime_type="image/jpeg"
    )
    # 1. OPTIONAL: Check Metadata first
    gps = get_gps_data(image_bytes)
    print(f"DEBUG: Photo Metadata status: {gps}")

    # 2. RUN VISION CHECK (This is your current code)
    img = Image.open(io.BytesIO(image_bytes))
    
    # We make the prompt even stricter to 'instill' better judging
    prompt = f"Verify if this image shows {location_name}. Context: {context}"

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[prompt, image_part],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=VerificationResult, # Forces the AI to follow your rules
        )
    )

    return response.parsed.model_dump()