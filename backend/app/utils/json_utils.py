"""JSON utilities."""
import json
import re


def safe_parse_json(text: str) -> dict | None:
    """Strip markdown code fences then parse JSON. Returns None on failure."""
    if not text:
        return None
    # Remove ```json ... ``` or ``` ... ```
    cleaned = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("`").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to find first { ... } block
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return None


def repair_json_prompt(bad_json: str, schema_desc: str) -> str:
    """Return a prompt asking Gemini to fix malformed JSON."""
    return (
        f"The following JSON is malformed or incomplete. "
        f"Fix it so it exactly matches this schema:\n{schema_desc}\n\n"
        f"Return ONLY valid JSON with no explanation.\n\nBad JSON:\n{bad_json}"
    )
