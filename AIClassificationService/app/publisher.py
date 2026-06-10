import json
import uuid
from datetime import datetime, timezone

import aio_pika

from .models import ClassificationResult, ReportClassifiedPayload


async def publish_classified(
    exchange: aio_pika.Exchange,
    report_id: str,
    result: ClassificationResult,
    incoming_headers: dict,
) -> None:
    """Publish a report.classified event to the urban.events exchange."""
    now = datetime.now(timezone.utc).isoformat()

    payload = ReportClassifiedPayload(
        report_id=report_id,
        model_version=result.model_version,
        classified_category=result.classified_category,
        confidence=result.confidence,
        classified_at=now,
    )

    # Event envelope headers required by the AsyncAPI contract
    headers = {
        "eventId": str(uuid.uuid4()),
        "eventType": "report.classified",
        "eventVersion": "v1",
        "occurredAt": now,
        "producer": "ai-classification-service",
        # Carry the correlationId forward from the triggering event
        "correlationId": incoming_headers.get("correlationId", str(uuid.uuid4())),
        # causationId points to the event that caused this one
        "causationId": incoming_headers.get("eventId"),
    }

    message = aio_pika.Message(
        body=json.dumps(payload.model_dump(by_alias=True)).encode(),
        content_type="application/json",
        headers=headers,
        delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
    )

    await exchange.publish(message, routing_key="report.classified")
