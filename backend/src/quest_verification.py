"""
Quest completion verification using Gemini (image + text). Uses QUEST_VERIFICATION_GEMINI_API_KEY.
Same structure as quest_generation: config at top, async entry points, run_in_threadpool for blocking calls.
"""

import io
import logging
import os
from typing import Any

from pydantic import BaseModel
from google import genai
from google.genai import types
from starlette.concurrency import run_in_threadpool

try:
    from PIL import Image
    _PIL_AVAILABLE = True
except ImportError:
    _PIL_AVAILABLE = False

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
KEY_ENV = "QUEST_VERIFICATION_GEMINI_API_KEY"

logger = logging.getLogger(__name__)


class VerificationResult(BaseModel):
    verified: bool
    reason: str
    confidence_score: int


def _get_client():
    api_key = os.environ.get(KEY_ENV)
    if not api_key:
        raise ValueError(f"Missing {KEY_ENV} environment variable")
    return genai.Client(api_key=api_key, http_options={"api_version": "v1beta"})


def _get_gps_data(image_bytes: bytes) -> Any:
    """Optional: pull GPS from photo EXIF if present. Logged for debugging."""
    if not _PIL_AVAILABLE:
        return None
    try:
        img = Image.open(io.BytesIO(image_bytes))
        exif = img.getexif() if hasattr(img, "getexif") else getattr(img, "_getexif", lambda: None)()
        if not exif:
            return None
        return "GPS Found"
    except Exception:
        return None


def _call_vision_sync(prompt: str, image_bytes: bytes, mime_type: str) -> dict[str, Any]:
    """Blocking Gemini vision call. Call via run_in_threadpool from async code."""
    client = _get_client()
    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[prompt, image_part],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=VerificationResult,
        ),
    )
    return response.parsed.model_dump()


async def verify_quest_image(
    quest_description: str,
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
) -> dict[str, Any]:
    """
    Verify that an image shows completion of the given quest.
    Returns {"verified": bool, "reason": str, "confidence_score": int}.
    """
    gps = _get_gps_data(image_bytes)
    logger.debug("Photo metadata (GPS): %s", gps)
    prompt = f"Verify whether this image shows the following quest completed: {quest_description}. Return verified=true only if the image clearly shows the described task completed."
    return await run_in_threadpool(_call_vision_sync, prompt, image_bytes, mime_type)


async def verify_at_location(
    image_bytes: bytes,
    mime_type: str,
    location_name: str,
    context: str,
) -> dict[str, Any]:
    """
    Verify that an image shows the given location. Used by POST /verify/{location_id}.
    Returns {"verified": bool, "reason": str, "confidence_score": int}.
    """
    gps = _get_gps_data(image_bytes)
    logger.debug("Photo metadata (GPS): %s", gps)
    prompt = f"Verify if this image shows {location_name}. Context: {context}"
    return await run_in_threadpool(_call_vision_sync, prompt, image_bytes, mime_type)
