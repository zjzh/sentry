from drf_spectacular.utils import OpenApiParameter


class GLOBAL_PARAMS:
    ORG_SLUG = OpenApiParameter(
        name="organization_slug",
        description="The slug of the organization.",
        required=True,
        type=str,
        location="path",
    )


class SCIM_PARAMS:
    MEMBER_ID = OpenApiParameter(
        name="member_id",
        location="path",
        required=True,
        type=int,
        description="The id of the member you'd like to query.",
    )
