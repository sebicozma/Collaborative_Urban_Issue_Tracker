import asyncio
import logging
from contextlib import asynccontextmanager

import aio_pika
from fastapi import FastAPI

from .config import settings
from .consumer import run_consumer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Connecting to RabbitMQ at %s", settings.rabbitmq_url)

    # connect_robust retries automatically if RabbitMQ isn't ready yet
    connection = await aio_pika.connect_robust(settings.rabbitmq_url)

    # Run the consumer loop as a background asyncio task
    consumer_task = asyncio.create_task(run_consumer(connection))

    yield  # app is running

    logger.info("Shutting down — cancelling consumer task")
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass
    await connection.close()


app = FastAPI(title="AI Classification Service", version="0.1.0", lifespan=lifespan)


@app.get("/health")
async def health():
    """Simple liveness probe used by Docker and load balancers."""
    return {"status": "ok", "service": "ai-classification"}
