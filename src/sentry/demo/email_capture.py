from rest_framework import serializers

from sentry.api.base import Endpoint
from sentry.api.serializers.rest_framework.base import CamelSnakeSerializer

from .marketo_client import MarketoClient

client = MarketoClient()


class EmailCaptureSerialier(CamelSnakeSerializer):
    email = serializers.EmailField(required=True)


class EmailCaptureEndpoint(Endpoint):
    # Disable authentication and permission requirements.
    permission_classes = []

    def post(self, request):
        serializer = EmailCaptureSerialier(data=request.data)

        if not serializer.is_valid():
            return self.respond(serializer.errors, status=400)

        email = serializer.validated_data["email"]
        client.submit_form(email)
        return self.respond(status=200)
