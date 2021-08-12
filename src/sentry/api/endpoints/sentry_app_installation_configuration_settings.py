from rest_framework.response import Response

from sentry.api.bases import SentryAppInstallationBaseEndpoint
from sentry.api.serializers import serialize
from sentry.mediators.external_requests.configuration_settings_requester import (
    ConfigurationSettingsRequester,
)


class SentryAppInstallationConfigurationSettingsEndpoint(SentryAppInstallationBaseEndpoint):
    def post(self, request, installation):
        data = request.data.copy()

        if not {"uri"}.issubset(data.keys()):
            return Response(status=400)

        uri = data.get("uri")
        del data["uri"]

        try:
            configuration_settings = ConfigurationSettingsRequester.run(
                install=installation, fields=data, uri=uri, http_method="POST"
            )
        except Exception:
            return Response({"error": "Error communicating with Sentry App service"}, status=400)

        return Response(serialize(configuration_settings), status=200)
