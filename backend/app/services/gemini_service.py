"""Gemini service – direct official REST API with API key rotation, exponential backoff, and caching."""
from __future__ import annotations
import os
import time
import base64
import io
import itertools
from typing import Generator, List, Optional
from dotenv import load_dotenv
from PIL import Image
import requests

load_dotenv()

_api_keys: list[str] = []
_key_cycle: Optional[Generator[str, None, None]] = None
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
# Fallback chain: models confirmed working for this API key tier
_FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash"]
_response_cache: dict[str, str] = {}


def _load_keys() -> None:
    global _api_keys, _key_cycle
    raw = os.getenv("GEMINI_API_KEYS", "") or os.getenv("GEMINI_API_KEY", "")
    _api_keys = [k.strip() for k in raw.split(",") if k.strip()]
    if _api_keys:
        _key_cycle = itertools.cycle(_api_keys)
    else:
        _key_cycle = None


def get_next_key() -> str:
    """Return the next API key in round-robin rotation."""
    global _key_cycle
    if _key_cycle is None:
        _load_keys()
    if not _api_keys or _key_cycle is None:
        single_key = os.getenv("GEMINI_API_KEY", "")
        if single_key:
            return single_key
        raise RuntimeError("No GEMINI_API_KEYS configured. Please add GEMINI_API_KEYS to backend/.env")
    return next(_key_cycle)


def _call_rest_with_retry(model_name: str, parts: list[dict], retries: int = 4) -> str:
    """Calls Gemini REST generateContent endpoint directly with automatic key rotation and backoff."""
    last_exception = None
    delay = 1.5
    fallback_idx = 0

    for attempt in range(retries):
        try:
            key = get_next_key()
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
            payload = {"contents": [{"parts": parts}]}
            resp = requests.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=90,
            )

            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    content_parts = candidates[0].get("content", {}).get("parts", [])
                    if content_parts:
                        return "".join(p.get("text", "") for p in content_parts)
                return ""

            err_text = resp.text.lower()
            # If 404 or model not available for this key, fall back to alternatives
            if resp.status_code == 404 or "not found" in err_text or "no longer available" in err_text:
                if fallback_idx < len(_FALLBACK_MODELS):
                    model_name = _FALLBACK_MODELS[fallback_idx]
                    fallback_idx += 1
                    continue

            # If rate limited (429) or temporary server error (503)
            if resp.status_code in (429, 503, 500) or "quota" in err_text or "resource_exhausted" in err_text:
                time.sleep(delay)
                delay *= 2
                continue
            else:
                last_exception = f"HTTP {resp.status_code}: {resp.text[:300]}"
                time.sleep(delay)
                delay *= 1.5

        except Exception as e:
            last_exception = e
            time.sleep(delay)
            delay *= 1.5

    raise RuntimeError(f"Gemini API call failed after {retries} retries: {last_exception}")


def call_text(prompt: str, model_name: Optional[str] = None) -> str:
    """Make a text-only Gemini API call."""
    cache_key = f"text:{hash(prompt)}"
    if cache_key in _response_cache:
        return _response_cache[cache_key]

    model = model_name or os.getenv("GEMINI_MODEL", DEFAULT_MODEL)
    parts = [{"text": prompt}]
    result = _call_rest_with_retry(model, parts)
    _response_cache[cache_key] = result
    return result


def call_vision(image_paths: List[str], prompt: str, model_name: Optional[str] = None) -> str:
    """Make a vision Gemini API call with multiple image files."""
    file_sigs = []
    for p in image_paths:
        if os.path.exists(p):
            file_sigs.append(f"{p}:{os.path.getmtime(p)}")
    cache_key = f"vision:{hash(prompt)}:{','.join(file_sigs)}"
    if cache_key in _response_cache:
        return _response_cache[cache_key]

    model = model_name or os.getenv("GEMINI_MODEL", DEFAULT_MODEL)
    parts: list[dict] = [{"text": prompt}]

    for p in image_paths:
        if os.path.exists(p):
            try:
                im = Image.open(p)
                if im.mode not in ("RGB", "L"):
                    im = im.convert("RGB")
                # Resize to max 1200px for speed and staying within free-tier limits
                if max(im.size) > 1200:
                    im.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                buf = io.BytesIO()
                im.save(buf, format="JPEG", quality=85)
                b64_data = base64.b64encode(buf.getvalue()).decode("utf-8")
                parts.append({"inline_data": {"mime_type": "image/jpeg", "data": b64_data}})
            except Exception as img_err:
                print(f"Warning: Failed to load image {p}: {img_err}")

    result = _call_rest_with_retry(model, parts)
    _response_cache[cache_key] = result
    return result


_load_keys()
