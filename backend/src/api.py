"""
This file defines the FastAPI app for the API and all of its routes.
To run this API, use the FastAPI CLI
$ fastapi dev src/api.py

In this project, the backend is focused on AI-related functionality and trusts
Supabase for authentication and data storage. The frontend should authenticate
with Supabase directly and send the Supabase access token to any protected
endpoints on this API.
"""

# standard library utilities used in this module
from pathlib import Path
import logging
import os
import random
import uuid

# dotenv loads `.env` so environment variables are available locally
from dotenv import load_dotenv

# explicitly load `.env` from workspace root, not cwd
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# FastAPI imports for routes, errors, uploads, and form data
from fastapi import Depends, FastAPI, HTTPException, UploadFile, File, Form

# package-relative imports for project modules (src is a package)

# (the FastAPI import above already covers all required symbols)

# use package-relative imports so the module works when `src` is
# imported as a package (`python -m uvicorn src.main`).
from .auth import CurrentUser, get_current_user
from .quest_generation import QuestRequest, generate_quests
from .quest_verification import verify_quest_image, verify_at_location

# FastAPI app instance; mounted at /api for frontend proxying
app = FastAPI()

# configure logging; LOG_LEVEL env var controls verbosity
logger = logging.getLogger(__name__)
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
root_logger = logging.getLogger()
if not root_logger.handlers:
    logging.basicConfig(level=getattr(logging, log_level, logging.INFO))

# friendly location IDs mapped to name/context for verification
LOCATION_DATA = {
    "dbh": {"name": "Donald Bren Hall", "ctx": "6th floor balcony, glass railings, park view."},
    "fountain": {"name": "Infinity Fountain", "ctx": "Circular water feature, brick plaza."},
    "statue": {"name": "Anteater Statue", "ctx": "Bronze statue near Bren Events Center."},
}

# allowed MIME types for uploaded images; others are rejected
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/heic", "image/heif"}


@app.get("/hello")
async def hello():
    # simple health check used during development
    print("hello endpoint hit")
    return {"message": "Hello from FastAPI"}


@app.get("/random")
async def get_random_item(maximum: int) -> dict[str, int]:
    """Simple example route illustrating a query parameter.

    Returns a JSON object containing a randomly‑chosen integer between zero
    and ``maximum``. not used by the frontend but helpful when testing the
    API server setup.
    """
    return {"itemId": random.randint(0, maximum)}


@app.post("/quests/generate")
async def generate_quest(body: QuestRequest):
    """Create a batch of quests using the text-generation model.

    Expects a JSON body matching ``QuestRequest``. Errors are translated
    into HTTPExceptions so callers receive a proper status code instead of
    an unhandled traceback.
    """
    try:
        return await generate_quests(body)
    except ValueError as e:
        msg = str(e)
        if "Missing" in msg and "environment variable" in msg:
            raise HTTPException(status_code=500, detail=msg) from e
        raise HTTPException(
            status_code=502,
            detail={"error": "Failed to parse model response"},
        ) from e
    except Exception as exc:
        error_id = uuid.uuid4().hex
        logger.exception("Model call failed (%s)", error_id)
        raise HTTPException(
            status_code=502,
            detail={"error": "Model call failed", "error_id": error_id},
        ) from exc


@app.post("/verify-quest")
async def verify_quest(
    # frontend uses this endpoint to submit proof images
    # quest_description form field from multipart data
    quest_description: str = Form(...),
    image: UploadFile = File(...),
    # auth optional during development; frontend doesn't send token yet
    current_user: CurrentUser | None = Depends(get_current_user),
) -> dict[str, object]:
    """Verify quest completion with an image."""
    # log parameters for debugging and auth issues
    print(f"verify_quest called: description={quest_description!r}, user={current_user}")
    print(f"  received file content_type={image.content_type!r}, filename={image.filename!r}")
    content_type = image.content_type or "image/jpeg"
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    image_bytes = await image.read()
    try:
        result = await verify_quest_image(quest_description, image_bytes, content_type)
    except ValueError as ve:
        # translate internal errors (e.g. bad image or AI failure) to a 502
        raise HTTPException(status_code=502, detail=str(ve)) from ve

    return {
        # current_user may be None in development; the frontend doesn't rely on
        # this value yet so just propagate null.
        "userId": current_user.id if current_user is not None else None,
        "questDescription": quest_description,
        "verified": result["verified"],
        "reason": result["reason"],
        "confidence_score": result.get("confidence_score"),
    }


@app.post("/verify/{location_id}")
async def verify_image(location_id: str, file: UploadFile = File(...)) -> dict[str, object]:
    """Endpoint used by location‑specific checks.

    The caller provides a path parameter identifying the location (e.g.
    ``/verify/dbh``). the handler looks up the human-readable name and
    contextual description, then delegates to the shared verification
    logic in ``quest_verification``.
    """
    content_type = file.content_type or "image/jpeg"
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    image_bytes = await file.read()
    data = LOCATION_DATA.get(location_id.lower())
    if not data:
        raise HTTPException(status_code=404, detail="Unknown location")
    result = await verify_at_location(image_bytes, content_type, data["name"], data["ctx"])
    return result
