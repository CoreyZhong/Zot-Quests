"""
Quest generation using Gemini (text-only). Uses QUEST_GENERATION_GEMINI_API_KEY.
"""

import json
import logging
import os
import tempfile
import threading
import uuid
from typing import Any

from pydantic import BaseModel
from google import genai
from starlette.concurrency import run_in_threadpool

# model and env key names; debug mode enabled by env var
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
KEY_ENV = "QUEST_GENERATION_GEMINI_API_KEY"
DEBUG_MODE = os.getenv("QUEST_DEBUG", "false").lower() in ("1", "true", "yes")

# logger for warnings and debug output
logger = logging.getLogger(__name__)

# thread-safe lazy initialization of GenAI client
_client_lock = threading.Lock()
_genai_client: genai.Client | None = None


def _get_client() -> genai.Client:
    """Return a shared GenAI client instance, constructing it if needed."""
    global _genai_client
    if _genai_client is not None:
        return _genai_client
    with _client_lock:
        if _genai_client is not None:
            return _genai_client
        api_key = os.environ.get(KEY_ENV)
        if not api_key:
            raise ValueError(f"Missing {KEY_ENV} environment variable")
        _genai_client = genai.Client(api_key=api_key)
        return _genai_client


class QuestRequest(BaseModel):
    """Empty request body; model kept for FastAPI validation."""
    pass


def build_prompt(_: QuestRequest | None = None) -> str:
    """Construct the natural language prompt sent to the Gemini model."""
    return (
        "Respond with ONLY a single valid JSON array of exactly 3 quest objects (one easy, one medium, one hard) and nothing else.\n"
        "Each quest must include: category (easy|medium|hard), description (string), timeLimit (integer minutes), coinReward (integer).\n"
        "Rules:\n"
        "- Fun, safe, campus-appropriate for University of California, Irvine students; no illegal/dangerous/harmful/harassing/damaging activities.\n"
        "- Feasible within the provided time limit.\n"
        "- All quests should be completable within the University of California, Irvine campus.\n"
        "- Difficulty mapping: easy, medium, hard.\n"
        "- Coin rewards: easy=3, medium=5, hard=7.\n"
        "- Vary the quests; ensure they are distinct and verifiable by a photo.\n"
        "Some potential quest ideas include but are not limited to:\n"
        "- find something with a certain color\n"
        "- find something anteater related\n"
        "- find certain plants/trees (only if gemini is able to clearly identify them)\n"
        "- find and take a picture of someone with some type of clothing (that gemini can reliably identify)\n"
        "- find a well-known building on campus\n"
        "Output must be only the JSON array (no Markdown, no commentary).\n"
        "Time limit should be a random number that is a multiple of 5, between 5 and 60 minutes, depending on the difficulty.\n"
        "Don't ask player to show their id, or any potentially sensitive personal info.\n"
        "Users will complete their quests by submitting an image which will be verified through AI; ensure that generated quests are not easily falsifiable or exploitable through unrelated images.\n"
    )


def _extract_text_from_resp(resp: Any) -> str:
    """Pull raw text out of various response object shapes."""
    if hasattr(resp, "text") and resp.text:
        return resp.text
    try:
        return resp.candidates[0].content.parts[0].text
    except Exception:
        return str(resp)


def _parse_json_from_text(text: str) -> Any:
    """Find and validate quest JSON inside arbitrary text."""
    def _is_valid_quests(parsed: Any) -> bool:
        required = {"category", "description", "timeLimit", "coinReward"}
        allowed_categories = {"easy", "medium", "hard"}

        def _valid_item(item: Any) -> bool:
            if not isinstance(item, dict):
                return False
            if not required.issubset(item.keys()):
                return False
            if item.get("category") not in allowed_categories:
                return False
            if not isinstance(item.get("description"), str):
                return False
            if not isinstance(item.get("timeLimit"), (int, float)):
                return False
            if item.get("coinReward") not in (3, 5, 7):
                return False
            return True

        if isinstance(parsed, list):
            return bool(parsed) and all(_valid_item(p) for p in parsed)
        if isinstance(parsed, dict):
            return _valid_item(parsed)
        return False

    original_error = None
    try:
        parsed = json.loads(text)
        if _is_valid_quests(parsed):
            return parsed if isinstance(parsed, list) else [parsed]
    except json.JSONDecodeError as e:
        original_error = e

    n = len(text)
    i = 0
    while i < n:
        ch = text[i]
        if ch not in "[{":
            i += 1
            continue
        open_ch = ch
        close_ch = "}" if open_ch == "{" else "]"
        depth = 0
        j = i
        while j < n:
            c = text[j]
            if c == open_ch:
                depth += 1
            elif c == close_ch:
                depth -= 1
                if depth == 0:
                    candidate = text[i : j + 1]
                    try:
                        parsed = json.loads(candidate)
                        if _is_valid_quests(parsed):
                            return parsed if isinstance(parsed, list) else [parsed]
                    except json.JSONDecodeError:
                        pass
                    break
            j += 1
        i = j + 1

    if original_error is not None:
        raise original_error
    raise ValueError("Failed to extract valid quest JSON from model response")


async def generate_quests(body: QuestRequest) -> list:
    """Invoke the model and return parsed list of quests."""
    client = _get_client()
    prompt = build_prompt(body)

    def call_model():
        return client.models.generate_content(
            model=MODEL_NAME,
            contents=[{"parts": [{"text": prompt}]}],
        )

    resp = await run_in_threadpool(call_model)
    text = _extract_text_from_resp(resp)

    try:
        return _parse_json_from_text(text)
    except Exception:
        raw = str(text)
        truncated = raw if len(raw) <= 2000 else raw[:2000] + "... [truncated]"
        logger.warning("Failed to parse model response (truncated): %s", truncated)
        if DEBUG_MODE:
            try:
                path = os.path.join(tempfile.gettempdir(), f"quests_raw_{uuid.uuid4().hex}.txt")
                with open(path, "w", encoding="utf-8") as f:
                    f.write(raw)
                logger.info("Wrote debug artifact for parse failure: %s", path)
            except Exception:
                logger.exception("Unable to write debug artifact for parse failure")
        raise
