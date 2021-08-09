import logging

from sentry.tasks.base import instrumented_task, retry

logger = logging.getLogger("sentry.tasks.api_security")


@instrumented_task(
    name="sentry.tasks.api_security.test",
    queue="api_security",
    default_retry_delay=60 * 5,
    max_retries=2,
)
@retry()
def test_task():
    logger.info("=" * 80)
    logger.info("The task worked!!!")
    logger.info("=" * 80)
