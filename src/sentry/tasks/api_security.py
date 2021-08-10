import logging
import uuid
from datetime import datetime, timedelta

from sentry.event_manager import EventManager
from sentry.models.ipreputation import IpReputation
from sentry.snuba.discover import query
from sentry.tasks.base import instrumented_task, retry

logger = logging.getLogger("sentry.tasks.api_security")


def _is_malicious_ip(ip_address):
    if ip_address == "127.0.0.1":
        return True
    ip_reputation_service = IpReputation()
    reputation = ip_reputation_service.get(ip_address)
    return reputation and reputation["risk_level"] > 1


def _create_malicious_ip_event(ip_address):
    manager = EventManager(
        data={
            "event_id": uuid.uuid1().hex,
            "level": logging.ERROR,
            "logger": ip_address,
            "tags": [],
            "message": "Attempted access from malicious IP",
            "debug_meta": {"value": ip_address},
            "user": {
                "ip_address": ip_address,
            },
        }
    )
    manager.normalize()
    manager.save(1)


@instrumented_task(
    name="sentry.tasks.api_security.test",
    queue="api_security",
    default_retry_delay=60 * 5,
    max_retries=2,
)
@retry()
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
            _create_malicious_ip_event(query_result["user.ip"])
