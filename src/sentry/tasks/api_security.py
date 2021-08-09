import logging
from datetime import datetime, timedelta

from sentry.snuba.discover import query
from sentry.tasks.base import instrumented_task, retry

logger = logging.getLogger("sentry.tasks.api_security")


class SecurityException(BaseException):
    pass


def _is_malicious_ip(ip_address):
    return ip_address == "2601:642:4002:ba70:538:a4b:5a27:921e"


def _create_security_issue():
    logger.error("Received a request from a malicious IP Address")


@instrumented_task(
    name="sentry.tasks.api_security.test",
    queue="api_security",
    default_retry_delay=60 * 5,
    max_retries=2,
)
@retry(exclude=SecurityException)
def test_task():
    """Runs every 5 minutes"""
    now = datetime.now()
    results = query(
        selected_columns=["user.ip", "count()"],
        query="has:user.ip",
        params={
            "organization_id": 1,
            "project_id": [1],
            "start": now - timedelta(seconds=20),
            "end": now,
        },
        orderby="-count()",
    )
    logger.info(results)
    for query_result in results["data"]:
        if _is_malicious_ip(query_result["user.ip"]):
            _create_security_issue()
