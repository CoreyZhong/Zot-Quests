"""
This file defines the FastAPI app for the API and all of its routes.
To run this API, use the FastAPI CLI
$ fastapi dev src/api.py
"""

import json
import os
import random
import re
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai
from starlette.concurrency import run_in_threadpool


# The app which manages all of the API routes
app = FastAPI()


MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
KEY_ENV = "GEMINI_API_KEY"


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




class QuestRequest(BaseModel):
    category: str
    timeLimitMinutes: int
    difficulty: str


def build_prompt(req: QuestRequest) -> str:
    # Force JSON-only output and give a short schema
    return (
        "Respond with ONLY a single valid JSON array of quest objects and nothing else.\n"

        """You are generating fun, safe side quests for UCI students.\n
        Rules: \n
        Generate 3 quests given these constraints: \n
        - The quest must be fun and engaging for UCI students.\n
        - The quest must be safe and not encourage any dangerous behavior.\n
        - The quest must be feasible to complete within a reasonable time frame (e.g. a hour)\n
        - The quest must be appropriate for a college campus setting.\n
        - The quest must not involve any illegal activities.\n
        - The quest must not involve any activities that could cause harm to oneself or others.\n
        - The quest must not involve any activities that could damage property.\n
        - The quest must not involve any activities that could be considered harassment or bullying.\n
        _ The quest includes taking a picture to prove that it has been completed at the end, so something that can be verified with a photo.\n
        Some potential quest categories include:\n 
        - find something with a certain color\n
        - find something anteater related\n
        - find a certain plants/trees(only if gemini is able to clearly identify them)\n
        - find and take a picture of someone with some type of clothing(that gemini can reliably identify)\n
        """

        "Each object must include the keys: title (string), description (string), verificationPrompt (string).\n"
        f"Category: {req.category}. Time limit: {req.timeLimitMinutes} minutes. Difficulty: {req.difficulty}.\n"
        "Generate 1 concise quest matching the constraints."
    )


def extract_text_from_resp(resp: Any) -> str:
    if hasattr(resp, "text") and resp.text:
        return resp.text
    try:
        return resp.candidates[0].content[0].text  # SDK common shape
    except Exception:
        return str(resp)


def parse_json_from_text(text: str) -> Any:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
        if m:
            return json.loads(m.group(0))
        raise



@app.post("/quests/generate")
async def generate_quest(body: QuestRequest):
    """Generate a quest using Gemini (Google GenAI SDK) and return parsed JSON.

    Expects `GEMINI_API_KEY` to be set in the environment. Uses `MODEL_NAME`.
    """

    api_key = os.environ.get(KEY_ENV)
    if not api_key:
        raise HTTPException(status_code=500, detail=f"Missing {KEY_ENV} environment variable")

    client = genai.Client(api_key=api_key)

    prompt = build_prompt(body)

    # run blocking SDK call in threadpool to avoid blocking the event loop
    def call_model():
        return client.models.generate_content(
            model=MODEL_NAME,
            contents=[{"parts": [{"text": prompt}]}]
        )

    try:
        resp = await run_in_threadpool(call_model)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Model call failed: {exc}") from exc

    text = extract_text_from_resp(resp)

    try:
        parsed = parse_json_from_text(text)
    except Exception:
        # Save raw output for debugging and return helpful error
        try:
            with open("backend/quests_raw.txt", "w") as f:
                f.write(str(text))
        except Exception:
            pass
        raise HTTPException(status_code=502, detail={"error": "Failed to parse model response", "raw": str(text)})

    return parsed
