import datetime

from django.utils import timezone
from snuba_sdk.column import Column
from snuba_sdk.conditions import Condition, Op, Or

from sentry.search.events.snql_filter import Filter
from sentry.testutils.cases import TestCase


class GetSnubaQueryArgsTest(TestCase):
    def test_simple(self):
        result = Filter(
            "user.email:foo@example.com release:1.2.1",
            {
                "project_id": [1, 2, 3],
                "organization_id": 1,
                "start": datetime.datetime(2015, 5, 18, 10, 15, 1, tzinfo=timezone.utc),
                "end": datetime.datetime(2015, 5, 19, 10, 15, 1, tzinfo=timezone.utc),
            },
        )

        assert result.where == [
            Condition(Column("email"), Op.EQ, "foo@example.com"),
            Condition(Column("release"), Op.EQ, "1.2.1"),
            Condition(
                Column("timestamp"),
                Op.GTE,
                datetime.datetime(2015, 5, 18, 10, 15, 1, tzinfo=timezone.utc),
            ),
            Condition(
                Column("timestamp"),
                Op.LT,
                datetime.datetime(2015, 5, 19, 10, 15, 1, tzinfo=timezone.utc),
            ),
            Condition(Column("project_id"), Op.IN, [1, 2, 3]),
        ]

    def test_trace_id(self):
        result = Filter("trace:a0fa8803753e40fd8124b21eeb2986b5")
        assert result.where == [
            Condition(Column("contexts[trace.trace_id]"), Op.EQ, "a0fa8803753e40fd8124b21eeb2986b5")
        ]

    def test_environment_param(self):
        params = {"environment": ["", "prod"]}
        result = Filter("", params)
        # Should generate OR conditions
        assert result.where == [
            Or(
                conditions=[
                    Condition(Column("environment"), Op.IS_NULL),
                    Condition(Column("environment"), Op.EQ, "prod"),
                ]
            )
        ]

        params = {"environment": ["dev", "prod"]}
        result = Filter("", params)
        assert result.where == [
            Condition(Column("environment"), Op.IN, ["dev", "prod"]),
        ]
