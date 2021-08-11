import logging
import uuid
from datetime import datetime, timedelta

from sentry.event_manager import EventManager
from sentry.models.hackingpatterns import HackingPatterns
from sentry.models.ipreputation import IpReputation
from sentry.snuba.discover import query
from sentry.tasks.base import instrumented_task, retry

logger = logging.getLogger("sentry.tasks.api_security")


DOS_TRIGGER = 1


def _is_malicious_ip(ip_address):
    ip_reputation_service = IpReputation()
    reputation = ip_reputation_service.get(ip_address)
    return reputation and reputation["risk_level"] > 1


def _create_malicious_ip_event(ip_address):
    manager = EventManager(
        data={
            "event_id": uuid.uuid1().hex,
            "level": logging.ERROR,
            "transaction": ip_address,
            "tags": {"security_finding": "malicious_ip"},
            "message": "Attempted access from malicious IP",
            "user": {"ip_address": ip_address},
            "fingerprint": [ip_address, "malicious_ip"],
        }
    )
    manager.normalize()
    manager.save(1)


def _unusual_volume(count):
    return int(count) > DOS_TRIGGER


def _create_high_volume_event(ip_address, count):
    manager = EventManager(
        data={
            "event_id": uuid.uuid1().hex,
            "level": logging.ERROR,
            "transaction": f"{count} calls from {ip_address} in 5 minutes",
            "tags": {"call_count": count, "security_finding": "high_volume"},
            "message": "Unusually High Call Volume",
            "user": {"ip_address": ip_address},
            "fingerprint": [ip_address, "high_call_volume"],
        }
    )
    manager.normalize()
    manager.save(1)


def _create_hacking_pattern_event(title, pattern, event_id):
    manager = EventManager(
        data={
            "event_id": uuid.uuid1().hex,
            "level": logging.ERROR,
            "transaction": title,
            "tags": {
                "hacking_pattern": pattern,
                "original_event_id": event_id,
                "security_finding": "hacking_pattern",
            },
            "message": "Hacking pattern detected",
            "fingerprint": [title, "hacking_pattern"],
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
        query="has:user.ip !has:security_finding",
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
        if _unusual_volume(query_result["count"]):
            _create_high_volume_event(query_result["user.ip"], query_result["count"])


@instrumented_task(
    name="sentry.tasks.api_security.patterns",
    queue="api_security",
    default_retry_delay=60 * 5,
    max_retries=2,
)
@retry()
def patterns_task():
    now = datetime.now()
    results = query(
        selected_columns=["id", "title"],
        query="!has:security_finding",
        params={
            "organization_id": 1,
            "project_id": [1],
            "start": now - timedelta(seconds=20),
            "end": now,
        },
    )
    logger.info(results)
    for query_result in results["data"]:
        hacking_patterns_service = HackingPatterns()
        pattern = hacking_patterns_service.get(query_result["title"])

        if pattern is not None:
            _create_hacking_pattern_event(query_result["title"], pattern, query_result["id"])
