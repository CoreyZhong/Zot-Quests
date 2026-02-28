"""
This file defines the FastAPI app for the API and all of its routes.
To run this API, use the FastAPI CLI
$ fastapi dev src/api.py

In this project, the backend is focused on AI-related functionality and trusts
Supabase for authentication and data storage. The frontend should authenticate
with Supabase directly and send the Supabase access token to any protected
endpoints on this API.
"""

from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env so SUPABASE_JWT_SECRET is available (whether run from backend/ or repo root)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import random

from fastapi import Depends, FastAPI, UploadFile, File

from auth import CurrentUser, get_current_user


# The app which manages all of the API routes
app = FastAPI()


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


@app.post("/verify-quest")
async def verify_quest(
    quest_description: str,
    image: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, object]:
    """
    Example protected endpoint for AI-based quest verification.

    The client must:
    - Authenticate with Supabase to obtain an access token.
    - Call this endpoint with `Authorization: Bearer <token>`.
    - Include the quest description and an image upload.

    This stub currently does not perform any real AI verification. You can
    integrate your preferred model provider (OpenAI, Gemini, etc.) here and
    return a verdict that the frontend can use to update Supabase.
    """

    # TODO: Replace this stub with a real AI call.
    _ = await image.read()

    return {
        "userId": current_user.id,
        "questDescription": quest_description,
        "verified": False,
        "reason": "AI verification not yet implemented",
    }
