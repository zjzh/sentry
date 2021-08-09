from rest_framework.response import Response

from sentry.api.bases import OrganizationEventsV2EndpointBase
from sentry.api.serializers.snuba import SnubaTSResultSerializer
from sentry.exceptions import InvalidSearchQuery
from sentry.snuba.discover import zerofill
from sentry.utils import json
from sentry.utils.dates import get_rollup_from_request
from sentry.utils.snuba import SnubaTSResult

# HACK: loading up the precomputed data
with open('prophet_v1_june13_june_20.json') as prophet_file:
    DATA = json.loads(prophet_file.read())


class OrganizationEventsAnomalyEndpoint(OrganizationEventsV2EndpointBase):
    def get(self, request, organization):
        params = self.get_snuba_params(
            request, organization, check_global_views=False
        )

        start = params["start"]
        start_ts = int(start.timestamp())

        end = params["end"]
        end_ts = int(end.timestamp())

        rollup = get_rollup_from_request(
            request,
            params,
            default_interval=None,
            error=InvalidSearchQuery(
                "Your interval and date range would create too many results. "
                "Use a larger interval, or a smaller date range."
            ),
            top_events=0,
        )

        data = [entry for entry in DATA if start_ts <= entry["unix_timestamp"] < end_ts]

        results = {
            "count": [],
            "anomaly_score": [],
            "lower_band": [],
            "upper_band": [],
        }

        mapping = {
            "count": "y",
            "anomaly_score": "scaled_score",
            "lower_band": "yhat_lower",
            "upper_band": "yhat_upper",
        }

        # assuming data is sorted in ascending timestamps
        for entry in data:
            timestamp = entry["unix_timestamp"] // rollup * rollup
            if not results["count"] or results["count"][-1].get("time") != timestamp:
                for series in results.values():
                    series.append({})

            if results["count"][-1].get("time") is None:
                for series in results.values():
                    series[-1]["time"] = timestamp
                    series[-1]["count"] = []

            for k, v in mapping.items():
                if v == 'scaled_score':
                    results[k][-1]["count"].append((entry[v] + 1) / 2.0)
                else:
                    results[k][-1]["count"].append(entry[v])

        for entry in results["count"]:
            entry["count"] = sum(entry["count"])

        for entry in results["anomaly_score"]:
            entry["count"] = sum(entry["count"]) / len(entry["count"])

        for entry in results["lower_band"]:
            entry["count"] = sum(entry["count"])

        for entry in results["upper_band"]:
            entry["count"] = sum(entry["count"])

        serializer = SnubaTSResultSerializer(organization, None, request.user)

        for k, v in results.items():
            result = SnubaTSResult(
                {"data": zerofill(v, start, end, rollup, "time")},
                start,
                end,
                rollup,
            )
            results[k] = serializer.serialize(result)

        return Response(results, status=200)
