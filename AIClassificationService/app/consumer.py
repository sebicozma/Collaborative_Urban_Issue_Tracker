import json
import logging

import aio_pika
import openai
from pydantic import ValidationError

from .classifier import classify_report
from .models import ReportCreatedPayload
from .publisher import publish_classified

logger = logging.getLogger(__name__)


async def _handle_message(message: aio_pika.IncomingMessage, exchange: aio_pika.Exchange) -> None:
    """Process a single report.created message end-to-end."""
    try:
        body = json.loads(message.body.decode())
        # model_validate handles the camelCase -> snake_case alias mapping
        payload = ReportCreatedPayload.model_validate(body)

        logger.info("Classifying report %s ('%s')", payload.report_id, payload.title)

        result = await classify_report(payload)

        logger.info(
            "Report %s → category='%s' confidence=%.2f",
            payload.report_id, result.classified_category, result.confidence,
        )

        await publish_classified(exchange, payload.report_id, result, dict(message.headers or {}))
        await message.ack()

    except (json.JSONDecodeError, ValidationError) as e:
        # Message is malformed — dead-letter it so we don't loop forever
        logger.error("Malformed message, sending to dead letter: %s", e)
        await message.nack(requeue=False)

    except openai.RateLimitError as e:
        # Transient OpenAI issue — requeue so it gets retried
        logger.warning("OpenAI rate limit hit, requeueing message: %s", e)
        await message.nack(requeue=True)

    except openai.APIError as e:
        # Other OpenAI errors (auth, invalid request) — dead-letter
        logger.error("OpenAI API error, sending to dead letter: %s", e)
        await message.nack(requeue=False)

    except Exception as e:
        logger.error("Unexpected error processing message, sending to dead letter: %s", e, exc_info=True)
        await message.nack(requeue=False)


async def run_consumer(connection: aio_pika.RobustConnection) -> None:
    """Main consumer loop. Runs until the task is cancelled."""
    channel = await connection.channel()
    # Process one message at a time so we don't overwhelm the OpenAI API
    await channel.set_qos(prefetch_count=1)

    # Declare idempotently — these match the definitions already loaded by RabbitMQ
    exchange = await channel.declare_exchange(
        "urban.events",
        aio_pika.ExchangeType.TOPIC,
        durable=True,
    )

    queue = await channel.declare_queue(
        "ai-classification.report-created",
        durable=True,
        arguments={
            "x-dead-letter-exchange": "urban.events.dlx",
            "x-dead-letter-routing-key": "ai-classification.report-created.dead",
        },
    )

    # The binding also exists in rabbitmq/definitions.json, but declaring it here
    # keeps the consumer working against a broker without those definitions.
    await queue.bind(exchange, routing_key="report.created")

    logger.info("Listening on queue 'ai-classification.report-created'...")

    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            await _handle_message(message, exchange)
