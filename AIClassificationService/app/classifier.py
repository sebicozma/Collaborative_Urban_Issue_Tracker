import json
import logging

from openai import AsyncOpenAI

from .config import settings
from .models import ClassificationResult, ReportCreatedPayload

logger = logging.getLogger(__name__)

VALID_CATEGORIES = {"waste", "road", "lighting", "water", "safety", "other"}

# Shared async client — reuses the same HTTP connection pool across messages
_client = AsyncOpenAI(api_key=settings.openai_api_key)


def _build_messages(payload: ReportCreatedPayload) -> list:
    """Build the GPT-4o message list, attaching any HTTP image URLs for vision."""
    prompt = f"""You are an urban infrastructure issue classifier for a city reporting system.

A citizen submitted the following report. Classify it and return a JSON object.

Title: {payload.title}
Description: {payload.description}
User-selected category: {payload.category}

Valid categories: waste, road, lighting, water, safety, other

Respond with ONLY a JSON object in this exact format:
{{"classifiedCategory": "<one of the valid categories>", "confidence": <float 0.0-1.0>}}"""

    content: list = [{"type": "text", "text": prompt}]

    # Include any HTTP image attachments so GPT-4o can use vision
    for url in payload.attachments or []:
        if url.startswith("http"):
            content.append({"type": "image_url", "image_url": {"url": url, "detail": "low"}})

    return [{"role": "user", "content": content}]


async def classify_report(payload: ReportCreatedPayload) -> ClassificationResult:
    """Call GPT-4o and return a classification result.

    Falls back to the user-provided category if the model returns something unexpected.
    """
    messages = _build_messages(payload)

    response = await _client.chat.completions.create(
        model=settings.model_version,
        messages=messages,
        response_format={"type": "json_object"},
        max_tokens=100,
        temperature=0,  # deterministic output
    )

    raw = json.loads(response.choices[0].message.content)

    category = raw.get("classifiedCategory", payload.category)
    if category not in VALID_CATEGORIES:
        logger.warning(
            "GPT-4o returned unknown category '%s' for report %s — falling back to '%s'",
            category, payload.report_id, payload.category,
        )
        category = payload.category

    # Clamp confidence to [0, 1] in case the model goes out of range
    confidence = max(0.0, min(1.0, float(raw.get("confidence", 0.5))))

    return ClassificationResult(
        classified_category=category,
        confidence=confidence,
        model_version=settings.model_version,
    )
