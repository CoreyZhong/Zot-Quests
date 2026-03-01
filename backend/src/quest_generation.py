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

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
KEY_ENV = "QUEST_GENERATION_GEMINI_API_KEY"
DEBUG_MODE = os.getenv("QUEST_DEBUG", "false").lower() in ("1", "true", "yes")

logger = logging.getLogger(__name__)

# Thread-safe lazy singleton so we don't re-instantiate the client on every request.
_client_lock = threading.Lock()
_genai_client: genai.Client | None = None


def _get_client() -> genai.Client:
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
    category: str
    timeLimitMinutes: int
    difficulty: str


def build_prompt(req: QuestRequest) -> str:
    return (
        "Respond with ONLY a single valid JSON array of 3 quest objects and nothing else.\n"
        "You are generating fun, safe side quests for UCI students.\n"
        "Rules:\n"
        "Generate 3 quests given these constraints:\n"
        "- The quest must be fun and engaging for UCI students.\n"
        "- The quest must be safe and not encourage any dangerous behavior.\n"
        "- The quest must be feasible to complete within a reasonable time frame (e.g. an hour).\n"
        "- The quest must be appropriate for a college campus setting.\n"
        "- The quest must not involve any illegal activities.\n"
        "- The quest must not involve any activities that could cause harm to oneself or others.\n"
        "- The quest must not involve any activities that could damage property.\n"
        "- The quest must not involve any activities that could be considered harassment or bullying.\n"
        "- The quest includes taking a picture to prove that it has been completed at the end, so something that can be verified with a photo.\n"
        "Some potential quest categories include:\n"
        "- find something with a certain color\n"
        "- find something anteater related\n"
        "- find certain plants/trees (only if gemini is able to clearly identify them)\n"
        "- find and take a picture of someone with some type of clothing (that gemini can reliably identify)\n"
        "Each object must include the keys: title (string), description (string), verificationPrompt (string).\n"
        f"Category: {req.category}. Time limit: {req.timeLimitMinutes} minutes. Difficulty: {req.difficulty}.\n"
    )


def _extract_text_from_resp(resp: Any) -> str:
    if hasattr(resp, "text") and resp.text:
        return resp.text
    try:
        return resp.candidates[0].content.parts[0].text
    except Exception:
        return str(resp)


def _parse_json_from_text(text: str) -> Any:
    def _is_valid_quests(parsed: Any) -> bool:
        required = {"title", "description", "verificationPrompt"}
        if isinstance(parsed, list):
            if not parsed:
                return False
            for item in parsed:
                if not isinstance(item, dict):
                    return False
                if not required.issubset(item.keys()):
                    return False
            return True
        if isinstance(parsed, dict):
            return required.issubset(parsed.keys())
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
    """
    Call Gemini to generate quests. Returns list of quest dicts.
    Raises ValueError for missing API key or parse failure; lets other exceptions propagate.
    """
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
