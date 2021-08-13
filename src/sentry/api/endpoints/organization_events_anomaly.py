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


FILES = {
    "safari": "safari_june_6_june_20.json",
    "fastly_cdn": "fastly_cdn_june_22_july_7.json",
    "fastly_cdn_no_mavg": "fastly_cdn_no_mavg_june_22_july_7.json",
    "js": "javascript_errors_june_1_july_31.json",
    "org": "api_0_organizations_{organization_slug}_may_1_june_15.json",
    "http_4xx": "http_4XX_codes_06_01_08_01.json",
}
DATASETS = {}

# HACK: loading up the precomputed data
for dataset, file_name in FILES.items():
    with open(f"datasets/{file_name}") as dataset_file:
        DATASETS[dataset] = json.loads(dataset_file.read())


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

        with sentry_sdk.start_span(op="discover.endpoint", description="dataset_selection"):
            data = DATASETS

            # TODO: dataset selection with this
            dataset = request.GET.get("dataset")
            if dataset not in data:
                return Response("bad dataset", status=400)
            data = data[dataset]

            sensitivity = request.GET.get("sensitivity")
            key = f"threshold_{sensitivity}"
            if key not in data:
                return Response("bad sensitivity", status=400)
            data = data[key]

            smoothing = request.GET.get("smoothing")
            key = f"smoothing_{smoothing}"
            if key not in data:
                return Response("bad smoothing", status=400)
            data = data[key]

        with sentry_sdk.start_span(op="discover.endpoint", description="timeseries_filtering"):
            data = [entry for entry in data if start_ts <= entry["unix_timestamp"] < end_ts]

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

            if dataset == "js":
                zipped = zip(results["count"], results["lower_band"], results["upper_band"])
                for count_entry, lower_band_entry, upper_band_entry in zipped:
                    x = (count_entry["count"] - lower_band_entry["count"]) / 2
                    lower_band_entry["count"] = count_entry["count"] - x
                    x = (upper_band_entry["count"] - count_entry["count"]) / 2
                    upper_band_entry["count"] = count_entry["count"] + x

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
