from rest_framework.response import Response
from rest_framework.serializers import ValidationError

from sentry.api.bases import (
    OrganizationEndpoint,
    SentryAppBaseEndpoint,
    add_integration_platform_metric_tag,
)
from sentry.api.paginator import OffsetPaginator
from sentry.api.serializers import serialize
from sentry.coreapi import APIError
from sentry.mediators import sentry_app_components
from sentry.models import Project, SentryAppComponent, SentryAppInstallation


class SentryAppComponentsEndpoint(SentryAppBaseEndpoint):
    def get(self, request, sentry_app):
        return self.paginate(
            request=request,
            queryset=sentry_app.components.all(),
            paginator_cls=OffsetPaginator,
            on_results=lambda x: serialize(x, request.user),
        )


class OrganizationSentryAppComponentsEndpoint(OrganizationEndpoint):
    @add_integration_platform_metric_tag
    def get(self, request, organization):
        project_id = request.GET.get("projectId")
        component_types = request.GET.get("filter", [])
        if not project_id and "configuration-settings" not in component_types:
            raise ValidationError("Required parameter 'projectId' is missing")

        try:
            if "configuration-settings" in component_types:
                # TODO(nisanthan): Get any random project for proof of concept
                project = Project.objects.get(organization_id=organization.id)
            else:
                project = Project.objects.get(id=project_id, organization_id=organization.id)
        except Project.DoesNotExist:
            return Response([], status=404)

        components = []

        for install in SentryAppInstallation.get_installed_for_org(organization.id):
            _components = SentryAppComponent.objects.filter(sentry_app_id=install.sentry_app_id)

            if len(component_types):
                _components = _components.filter(type=component_types)

            for component in _components:
                try:
                    sentry_app_components.Preparer.run(
                        component=component, install=install, project=project
                    )
                    components.append(component)
                except APIError:
                    continue

        return self.paginate(
            request=request,
            queryset=components,
            paginator_cls=OffsetPaginator,
            on_results=lambda x: serialize(x, request.user),
        )
