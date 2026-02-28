"""
This file defines the FastAPI app for the API and all of its routes.
To run this API, use the FastAPI CLI
$ fastapi dev src/api.py
"""

import random
from verify import verify_quest_completion
from fastapi import FastAPI, HTTPException, File, UploadFile

# The app which manages all of the API routes
app = FastAPI()

LOCATION_DATA = {
    "dbh": {"name": "Donald Bren Hall", "ctx": "6th floor balcony, glass railings, park view."},
    "fountain": {"name": "Infinity Fountain", "ctx": "Circular water feature, brick plaza."},
    "statue": {"name": "Anteater Statue", "ctx": "Bronze statue near Bren Events Center."}
}
# The decorator declares the function as a FastAPI route on the given path.
# This route in particular is a GET route at "/hello" which returns the example
# dictionary as a JSON response with the status code 200 by default.
@app.get("/hello")
async def hello() -> dict[str, str]:
    """Get hello message."""
    return {"message": "Hello from FastAPI"}


# The route can also handle query parameters encoded in the URL after the path,
# e.g. `/random?maximum=1000`
# If the value isn't an integer, FastAPI will return an error response
# with a validation error describing the invalid input.
@app.get("/random")
async def get_random_item(maximum: int) -> dict[str, int]:
    """Get an item with a random ID."""
    return {"itemId": random.randint(0, maximum)}


@app.post("/verify/{location_id}")
async def verify_image(location_id: str, file: UploadFile = File(...)):
    # 1. Read the image data sent by the phone/browser
    image_bytes = await file.read()
    # 1. Validate the uploaded file type
    allowed_content_types = {
        "image/jpeg",
        "image/png",
        "image/heic",
        "image/heif",
    }
    content_type = file.content_type
    if content_type not in allowed_content_types:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    # 2. Read the image data sent by the phone/browser
    image_bytes = await file.read()
    
    # 3. Get the quest details from your data
    data = LOCATION_DATA.get(location_id.lower())
    
    # 4. Ask Gemini to "look" at the photo
    # This calls the function we discussed earlier
    result = verify_quest_completion(
        image_bytes,
        content_type,
        data["name"],
        data["ctx"],
    )
    
    return result