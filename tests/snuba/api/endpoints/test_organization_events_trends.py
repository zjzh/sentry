from __future__ import absolute_import

import six
from datetime import timedelta

from django.core.urlresolvers import reverse

from sentry.testutils import OrganizationEventsTestCase
from sentry.testutils.cases import TestCase
from sentry.testutils.helpers import parse_link_header
from sentry.testutils.helpers.datetime import iso_format
from sentry.api.event_search import get_filter
from sentry.api.endpoints.organization_events_trends import OrganizationEventsTrendsEndpointBase


class OrganizationEventsTrendsBase(OrganizationEventsTestCase):
    def setUp(self):
        super(OrganizationEventsTrendsBase, self).setUp()
        self.enabled_features = {"organizations:performance-view": True}
        self.transaction = "/country_by_code/"

        self.store_event(
            offset=timedelta(minutes=30),
            duration=timedelta(seconds=2),
            prototype="transaction",
            data={"user": {"email": "foo@example.com"}, "transaction": self.transaction},
        )

        second = [0, 2, 10]
        for i in range(3):
            self.store_event(
                offset=timedelta(hours=1, minutes=30 + i),
                duration=timedelta(seconds=second[i]),
                prototype="transaction",
                data={
                    "user": {"email": "foo{}@example.com".format(i)},
                    "transaction": self.transaction,
                },
            )

        self.expected_data = {
            "count_range_1": 1,
            "count_range_2": 3,
            "transaction": self.transaction,
            "project": self.project.slug,
        }

    def assert_event(self, data):
        for key, value in self.expected_data.items():
            assert data[key] == value, key


class OrganizationEventsTrendsEndpointTest(OrganizationEventsTrendsBase):
    def setUp(self):
        super(OrganizationEventsTrendsEndpointTest, self).setUp()
        self.url = reverse(
            "sentry-api-0-organization-events-trends",
            kwargs={"organization_slug": self.project.organization.slug},
        )

    def test_simple(self):
        response = self.do_request(
            {
                "start": iso_format(self.start),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendType": "regression",
            }
        )

        assert response.status_code == 200, response.content

        events = response.data

        assert len(events["data"]) == 1
        self.expected_data.update(
            {
                "aggregate_range_1": 2000,
                "aggregate_range_2": 2000,
                "count_percentage": 3.0,
                "trend_difference": 0.0,
                "trend_percentage": 1.0,
            }
        )
        self.assert_event(events["data"][0])

    def test_p75(self):
        response = self.do_request(
            {
                "start": iso_format(self.start),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendFunction": "p75()",
            }
        )

        assert response.status_code == 200, response.content

        events = response.data

        assert len(events["data"]) == 1
        self.expected_data.update(
            {
                "aggregate_range_1": 2000,
                "aggregate_range_2": 6000,
                "count_percentage": 3.0,
                "trend_difference": 4000.0,
                "trend_percentage": 3.0,
            }
        )
        self.assert_event(events["data"][0])

    def test_p95(self):
        response = self.do_request(
            {
                "start": iso_format(self.start),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendFunction": "p95()",
            }
        )

        assert response.status_code == 200, response.content

        events = response.data

        assert len(events["data"]) == 1
        self.expected_data.update(
            {
                "aggregate_range_1": 2000,
                "aggregate_range_2": 9200,
                "count_percentage": 3.0,
                "trend_difference": 7200.0,
                "trend_percentage": 4.6,
            }
        )
        self.assert_event(events["data"][0])

    def test_p99(self):
        response = self.do_request(
            {
                "start": iso_format(self.start),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendFunction": "p99()",
            }
        )

        assert response.status_code == 200, response.content

        events = response.data

        assert len(events["data"]) == 1
        self.expected_data.update(
            {
                "aggregate_range_1": 2000,
                "aggregate_range_2": 9840,
                "count_percentage": 3.0,
                "trend_difference": 7840.0,
                "trend_percentage": 4.92,
            }
        )
        self.assert_event(events["data"][0])

    def test_trend_percentage_query_alias(self):
        queries = [
            ("trend_percentage():>0%", "regression", 1),
            ("trend_percentage():392%", "regression", 1),
            ("trend_percentage():>0%", "improved", 0),
            ("trend_percentage():392%", "improved", 0),
        ]
        for query_data in queries:
            response = self.do_request(
                {
                    "start": iso_format(self.start),
                    "end": iso_format(self.end),
                    "field": ["project", "transaction"],
                    "query": "event.type:transaction {}".format(query_data[0]),
                    "trendType": query_data[1],
                    # Use p99 since it has the most significant change
                    "trendFunction": "p99()",
                }
            )

            assert response.status_code == 200, response.content

            events = response.data

            assert len(events["data"]) == query_data[2], query_data

    def test_trend_difference_query_alias(self):
        queries = [
            ("trend_difference():>7s", "regression", 1),
            ("trend_difference():7.84s", "regression", 1),
            ("trend_difference():>7s", "improved", 0),
            ("trend_difference():7.84s", "improved", 0),
        ]
        for query_data in queries:
            response = self.do_request(
                {
                    "start": iso_format(self.start),
                    "end": iso_format(self.end),
                    "field": ["project", "transaction"],
                    "query": "event.type:transaction {}".format(query_data[0]),
                    "trendType": query_data[1],
                    # Use p99 since it has the most significant change
                    "trendFunction": "p99()",
                }
            )

            assert response.status_code == 200, response.content

            events = response.data

            assert len(events["data"]) == query_data[2], query_data

    def test_avg_trend_function(self):
        response = self.do_request(
            {
                "start": iso_format(self.start),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendFunction": "avg(transaction.duration)",
            }
        )

        assert response.status_code == 200, response.content

        events = response.data

        assert len(events["data"]) == 1
        self.expected_data.update(
            {
                "aggregate_range_1": 2000,
                "aggregate_range_2": 4000,
                "count_percentage": 3.0,
                "trend_difference": 2000.0,
                "trend_percentage": 2.0,
            }
        )
        self.assert_event(events["data"][0])

    def test_invalid_trend_function(self):
        response = self.do_request(
            {
                "start": iso_format(self.start),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendFunction": "apdex(450)",
            }
        )

        assert response.status_code == 400

    def test_divide_by_zero(self):
        response = self.do_request(
            {
                "start": iso_format(self.start - timedelta(hours=2)),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
            }
        )
        assert response.status_code == 200, response.content

        events = response.data

        assert len(events["data"]) == 1
        self.expected_data.update(
            {
                "count_range_2": 4,
                "count_range_1": 0,
                "aggregate_range_1": 0,
                "aggregate_range_2": 2000.0,
                "count_percentage": None,
                "trend_difference": 0,
                "trend_percentage": None,
            }
        )
        self.assert_event(events["data"][0])

    def test_auto_aggregation(self):
        # absolute_correlation is automatically added, and not a part of data otherwise
        response = self.do_request(
            {
                "start": iso_format(self.start - timedelta(hours=2)),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction absolute_correlation():>0.2",
            }
        )
        assert response.status_code == 200, response.content

        events = response.data

        assert len(events["data"]) == 1
        assert events["data"][0].pop("absolute_correlation") > 0.2
        self.expected_data.update(
            {
                "count_range_2": 4,
                "count_range_1": 0,
                "aggregate_range_1": 0,
                "aggregate_range_2": 2000.0,
                "count_percentage": None,
                "trend_difference": 0,
                "trend_percentage": None,
            }
        )
        self.assert_event(events["data"][0])


class OrganizationEventsTrendsStatsEndpointTest(OrganizationEventsTrendsBase):
    def setUp(self):
        super(OrganizationEventsTrendsStatsEndpointTest, self).setUp()
        self.url = reverse(
            "sentry-api-0-organization-events-trends-stats",
            kwargs={"organization_slug": self.project.organization.slug},
        )

    def test_simple(self):
        response = self.do_request(
            {
                "start": iso_format(self.start),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
            }
        )
        assert response.status_code == 200, response.content

        events = response.data["events"]
        result_stats = response.data["stats"]

        assert len(events["data"]) == 1
        self.expected_data.update(
            {
                "aggregate_range_1": 2000,
                "aggregate_range_2": 2000,
                "count_percentage": 3.0,
                "trend_difference": 0.0,
                "trend_percentage": 1.0,
            }
        )
        self.assert_event(events["data"][0])

        stats = result_stats["{},{}".format(self.project.slug, self.transaction)]
        assert [attrs for time, attrs in stats["data"]] == [
            [{"count": 2000}],
            [{"count": 2000}],
        ]

    def test_p75(self):
        response = self.do_request(
            {
                "start": iso_format(self.start),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendFunction": "p75()",
            }
        )

        assert response.status_code == 200, response.content

        events = response.data["events"]
        result_stats = response.data["stats"]

        assert len(events["data"]) == 1
        self.expected_data.update(
            {
                "aggregate_range_1": 2000,
                "aggregate_range_2": 6000,
                "count_percentage": 3.0,
                "trend_difference": 4000.0,
                "trend_percentage": 3.0,
            }
        )
        self.assert_event(events["data"][0])

        stats = result_stats["{},{}".format(self.project.slug, self.transaction)]
        assert [attrs for time, attrs in stats["data"]] == [
            [{"count": 2000}],
            [{"count": 6000}],
        ]

    def test_p95(self):
        response = self.do_request(
            {
                "start": iso_format(self.start),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendFunction": "p95()",
            }
        )

        assert response.status_code == 200, response.content

        events = response.data["events"]
        result_stats = response.data["stats"]

        assert len(events["data"]) == 1
        self.expected_data.update(
            {
                "aggregate_range_1": 2000,
                "aggregate_range_2": 9200,
                "count_percentage": 3.0,
                "trend_difference": 7200.0,
                "trend_percentage": 4.6,
            }
        )
        self.assert_event(events["data"][0])

        stats = result_stats["{},{}".format(self.project.slug, self.transaction)]
        assert [attrs for time, attrs in stats["data"]] == [
            [{"count": 2000}],
            [{"count": 9200}],
        ]

    def test_p99(self):
        response = self.do_request(
            {
                "start": iso_format(self.start),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendFunction": "p99()",
            }
        )

        assert response.status_code == 200, response.content

        events = response.data["events"]
        result_stats = response.data["stats"]

        assert len(events["data"]) == 1
        self.expected_data.update(
            {
                "aggregate_range_1": 2000,
                "aggregate_range_2": 9840,
                "count_percentage": 3.0,
                "trend_difference": 7840.0,
                "trend_percentage": 4.92,
            }
        )
        self.assert_event(events["data"][0])

        stats = result_stats["{},{}".format(self.project.slug, self.transaction)]
        assert [attrs for time, attrs in stats["data"]] == [
            [{"count": 2000}],
            [{"count": 9840}],
        ]

    def test_avg_trend_function(self):
        response = self.do_request(
            {
                "start": iso_format(self.start),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendFunction": "avg(transaction.duration)",
            }
        )

        assert response.status_code == 200, response.content

        events = response.data["events"]
        result_stats = response.data["stats"]

        assert len(events["data"]) == 1
        self.expected_data.update(
            {
                "aggregate_range_1": 2000,
                "aggregate_range_2": 4000,
                "count_percentage": 3.0,
                "trend_difference": 2000.0,
                "trend_percentage": 2.0,
            }
        )
        self.assert_event(events["data"][0])

        stats = result_stats["{},{}".format(self.project.slug, self.transaction)]
        assert [attrs for time, attrs in stats["data"]] == [
            [{"count": 2000}],
            [{"count": 4000}],
        ]

    def test_trend_with_middle(self):
        response = self.do_request(
            {
                "start": iso_format(self.start),
                "middle": iso_format(self.start + timedelta(hours=1, minutes=31)),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendFunction": "avg(transaction.duration)",
            }
        )
        assert response.status_code == 200, response.content

        events = response.data["events"]
        result_stats = response.data["stats"]

        assert len(events["data"]) == 1
        self.expected_data.update(
            {
                "count_range_2": 2,
                "count_range_1": 2,
                "aggregate_range_1": 1000,
                "aggregate_range_2": 6000,
                "count_percentage": 1.0,
                "trend_difference": 5000.0,
                "trend_percentage": 6.0,
            }
        )
        self.assert_event(events["data"][0])

        stats = result_stats["{},{}".format(self.project.slug, self.transaction)]
        assert [attrs for time, attrs in stats["data"]] == [
            [{"count": 2000}],
            [{"count": 4000}],
        ]

    def test_invalid_middle_date(self):
        response = self.do_request(
            {
                "start": iso_format(self.start),
                "middle": "blah",
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendFunction": "avg(transaction.duration)",
            }
        )

        assert response.status_code == 400

        response = self.do_request(
            {
                "start": iso_format(self.start),
                "middle": iso_format(self.start - timedelta(hours=2)),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendFunction": "avg(transaction.duration)",
            }
        )
        assert response.status_code == 400

        response = self.do_request(
            {
                "start": iso_format(self.start),
                "middle": iso_format(self.end + timedelta(hours=2)),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendFunction": "avg(transaction.duration)",
            }
        )
        assert response.status_code == 400

    def test_invalid_trend_function(self):
        response = self.do_request(
            {
                "start": iso_format(self.start),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "trendFunction": "apdex(450)",
            }
        )
        assert response.status_code == 400

    def test_divide_by_zero(self):
        response = self.do_request(
            {
                "start": iso_format(self.start - timedelta(hours=2)),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
            }
        )
        assert response.status_code == 200, response.content

        events = response.data["events"]
        result_stats = response.data["stats"]

        assert len(events["data"]) == 1
        self.expected_data.update(
            {
                "count_range_2": 4,
                "count_range_1": 0,
                "aggregate_range_1": 0,
                "aggregate_range_2": 2000.0,
                "count_percentage": None,
                "trend_difference": 0,
                "trend_percentage": None,
            }
        )
        self.assert_event(events["data"][0])

        stats = result_stats["{},{}".format(self.project.slug, self.transaction)]
        assert [attrs for time, attrs in stats["data"]] == [
            [{"count": 0}],
            [{"count": 0}],
            [{"count": 2000}],
            [{"count": 2000}],
        ]


class OrganizationEventsTrendsPagingTest(OrganizationEventsTestCase):
    def setUp(self):
        super(OrganizationEventsTrendsPagingTest, self).setUp()
        self.enabled_features = {"organizations:performance-view": True}
        self.url = reverse(
            "sentry-api-0-organization-events-trends-stats",
            kwargs={"organization_slug": self.project.organization.slug},
        )

        # Make 10 transactions for paging
        for i in range(10):
            for j in range(2):
                self.store_event(
                    offset=timedelta(minutes=30),
                    duration=timedelta(hours=j, seconds=2),
                    prototype="transaction",
                    data={
                        "user": {"email": "foo@example.com"},
                        "transaction": "transaction_{}{}".format("1" if i < 5 else "2", i),
                    },
                )

    def _parse_links(self, header):
        # links come in {url: {...attrs}}, but we need {rel: {...attrs}}
        links = {}
        for url, attrs in six.iteritems(parse_link_header(header)):
            links[attrs["rel"]] = attrs
            attrs["href"] = url
        return links

    def test_pagination(self):
        response = self.do_request(
            {
                # Set the timeframe to where the second range has no transactions so all the counts/percentile are 0
                "start": iso_format(self.start - timedelta(hours=2)),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction",
                "project": [self.project.id],
            }
        )
        assert response.status_code == 200, response.content

        links = self._parse_links(response["Link"])
        assert links["previous"]["results"] == "false"
        assert links["next"]["results"] == "true"
        assert len(response.data["events"]["data"]) == 5

        with self.feature(self.enabled_features):
            response = self.client.get(links["next"]["href"], format="json")
        assert response.status_code == 200, response.content

        links = self._parse_links(response["Link"])
        assert links["previous"]["results"] == "true"
        assert links["next"]["results"] == "false"
        assert len(response.data["events"]["data"]) == 5

    def test_pagination_with_query(self):
        response = self.do_request(
            {
                # Set the timeframe to where the second range has no transactions so all the counts/percentile are 0
                "start": iso_format(self.start - timedelta(hours=2)),
                "end": iso_format(self.end),
                "field": ["project", "transaction"],
                "query": "event.type:transaction transaction:transaction_1*",
                "project": [self.project.id],
            }
        )
        assert response.status_code == 200, response.content

        links = self._parse_links(response["Link"])
        assert links["previous"]["results"] == "false"
        assert links["next"]["results"] == "false"
        assert len(response.data["events"]["data"]) == 5


class OrganizationEventsTrendsAliasTest(TestCase):
    def setUp(self):
        self.improved_aliases = OrganizationEventsTrendsEndpointBase.get_function_aliases(
            "improved"
        )
        self.regression_aliases = OrganizationEventsTrendsEndpointBase.get_function_aliases(
            "regression"
        )

    def test_simple(self):
        result = get_filter(
            "trend_percentage():>0% trend_difference():>0", {"aliases": self.improved_aliases}
        )

        assert result.having == [
            ["trend_percentage", "<", 1.0],
            ["trend_difference", "<", 0.0],
        ]

        result = get_filter(
            "trend_percentage():>0% trend_difference():>0", {"aliases": self.regression_aliases}
        )

        assert result.having == [
            ["trend_percentage", ">", 1.0],
            ["trend_difference", ">", 0.0],
        ]

    def test_and_query(self):
        result = get_filter(
            "trend_percentage():>0% AND trend_percentage():<100%",
            {"aliases": self.improved_aliases},
        )

        assert result.having == [["trend_percentage", "<", 1.0], ["trend_percentage", ">", 0.0]]

        result = get_filter(
            "trend_percentage():>0% AND trend_percentage():<100%",
            {"aliases": self.regression_aliases},
        )

        assert result.having == [["trend_percentage", ">", 1.0], ["trend_percentage", "<", 2.0]]

    def test_or_query(self):
        result = get_filter(
            "trend_percentage():>0% OR trend_percentage():<100%",
            {"aliases": self.improved_aliases},
        )

        assert result.having == [
            [
                [
                    "or",
                    [["less", ["trend_percentage", 1.0]], ["greater", ["trend_percentage", 0.0]]],
                ],
                "=",
                1,
            ]
        ]

        result = get_filter(
            "trend_percentage():>0% OR trend_percentage():<100%",
            {"aliases": self.regression_aliases},
        )

        assert result.having == [
            [
                [
                    "or",
                    [["greater", ["trend_percentage", 1.0]], ["less", ["trend_percentage", 2.0]]],
                ],
                "=",
                1,
            ]
        ]

    def test_greater_than(self):
        result = get_filter("trend_difference():>=0", {"aliases": self.improved_aliases})

        assert result.having == [["trend_difference", "<=", 0.0]]

        result = get_filter("trend_difference():>=0", {"aliases": self.regression_aliases})

        assert result.having == [["trend_difference", ">=", 0.0]]

    def test_negation(self):
        result = get_filter("!trend_difference():>=0", {"aliases": self.improved_aliases})

        assert result.having == [["trend_difference", ">", 0.0]]

        result = get_filter("!trend_difference():>=0", {"aliases": self.regression_aliases})

        assert result.having == [["trend_difference", "<", 0.0]]
