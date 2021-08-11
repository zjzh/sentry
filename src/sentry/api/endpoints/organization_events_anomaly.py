import math

import sentry_sdk
from rest_framework.response import Response

from sentry.api.bases import OrganizationEventsV2EndpointBase
from sentry.api.serializers.snuba import SnubaTSResultSerializer
from sentry.api.utils import get_date_range_from_params
from sentry.exceptions import InvalidSearchQuery
from sentry.snuba.discover import zerofill
from sentry.utils import json
from sentry.utils.dates import get_rollup_from_request
from sentry.utils.snuba import SnubaTSResult

meh = 0.5
poor = 0.7


def scale_anomaly_score(data):
    x = 0

    for entry in data:
        y = (entry["scaled_score"] + 1) / 2

        if y > poor:
            x += 2
        elif y > meh:
            x += 1
        else:
            x -= 1

        x = max(x, 0)
        x = min(x, 60)

        sigmoid = 1.1 / (1 + math.exp(-(x - 20) / 10))
        y = y * sigmoid

        entry["scaled_score"] = y


# HACK: loading up the precomputed data
with open("final_output.json") as prophet_file:
    DATA = json.loads(prophet_file.read())
    for key in DATA:
        scale_anomaly_score(DATA[key])


class OrganizationEventsAnomalyEndpoint(OrganizationEventsV2EndpointBase):
    # HACK: DON'T DO THIS IN PRODUCTION, THIS REMOVES ALL FORMS OF AUTHENTICATION
    permission_classes = ()

    def get(self, request, organization):
        with sentry_sdk.start_span(op="discover.endpoint", description="date_params"):
            start, end = get_date_range_from_params(request.GET, optional=False)
            params = {"start": start, "end": end}

            start = params["start"]
            start_ts = int(start.timestamp())

            end = params["end"]
            end_ts = int(end.timestamp())

        with sentry_sdk.start_span(op="discover.endpoint", description="dataset_selection"):
            # TODO: dataset selection with this
            smoothing = request.GET.get("smoothing")

            sensitivity = request.GET.get("sensitivity")
            threshold = (
                "0.99" if sensitivity == "low" else "0.95" if sensitivity == "high" else "0.9"
            )
            key = f"threshold_{threshold}"
            if key not in DATA:
                return Response("bad sensitivity", status=400)
            dataset = DATA[key]

        with sentry_sdk.start_span(op="discover.endpoint", description="rollup_params"):
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

        with sentry_sdk.start_span(op="discover.endpoint", description="timeseries_filtering"):
            data = [entry for entry in dataset if start_ts <= entry["unix_timestamp"] < end_ts]

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

        with sentry_sdk.start_span(op="discover.endpoint", description="timeseries_grouping"):
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
                    results[k][-1]["count"].append(entry[v])

        with sentry_sdk.start_span(op="discover.endpoint", description="timeseries_rollup"):
            for entry in results["count"]:
                entry["count"] = sum(entry["count"])

            for entry in results["anomaly_score"]:
                # entry["count"] = sum(entry["count"]) / len(entry["count"])
                entry["count"] = max(entry["count"])

            for entry in results["lower_band"]:
                entry["count"] = sum(entry["count"])

            for entry in results["upper_band"]:
                entry["count"] = sum(entry["count"])

        with sentry_sdk.start_span(op="discover.endpoint", description="timeseries_serializing"):
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
