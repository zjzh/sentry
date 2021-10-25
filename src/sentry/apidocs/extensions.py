from typing import Any, Dict, List

from drf_spectacular.extensions import OpenApiAuthenticationExtension

# from sentry.scim.endpoints.members import OrganizationSCIMMemberDetails, OrganizationSCIMMemberIndex

# print(OrganizationSCIMMemberDetails.get_authenticators())


class TokenAuthExtension(OpenApiAuthenticationExtension):
    target_class = "sentry.api.authentication.TokenAuthentication"
    name = "auth_token"

    def get_security_definition(self, auto_schema):
        return {"type": "http", "scheme": "bearer"}

    def get_security_requirement(self, auto_schema):
        view = auto_schema.view
        permissions = []
        for permission in auto_schema.view.get_permissions():
            for p in permission.scope_map.get(auto_schema.method, []):
                permissions.append(p)

        return {self.name: permissions}
