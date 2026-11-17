"""Response parsing utilities for Gemini output."""
import json
import re


def parse_json_from_response(text: str) -> dict:
    """
    Extract the first JSON object found in a Gemini text response.
    Raises ValueError if no valid JSON block is found.
    """
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON found in Gemini response")
    return json.loads(match.group())


def safe_float(value, default: float = 0.0) -> float:
    """Coerce value to float, returning default on failure."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default
