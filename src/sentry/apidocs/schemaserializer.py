import inspect
from typing import Optional, _GenericAlias, _TypedDictMeta

from drf_spectacular.extensions import OpenApiSerializerExtension
from drf_spectacular.openapi import (
    build_array_type,
    build_basic_type,
    build_object_type,
    is_basic_type,
)
from drf_spectacular.plumbing import get_doc, safe_ref

PUBLIC_SERIALIZERS = set()


def map_field_from_type(t):
    required = True
    if type(t) == _TypedDictMeta:
        return map_typedict(t)

    if is_basic_type(t):
        schema = build_basic_type(t)
        if schema is None:
            return None
        return schema

    if t.__origin__ == list:
        return build_array_type(map_field_from_type(t.__args__[0]))

    return {"type": "string", "required": True}


def map_typedict(t):
    # TODO: register nested TypedDicts as components
    properties = {}
    required = set()
    for k, v in t.__annotations__.items():
        properties[k] = map_field_from_type(v)
        # if field_required:
        #     required.add(k)
    # return build_object_type(properties, required=set(), description="")
    return {"type": "object", "properties": properties, "required": []}


class PublicSchemaResponseSerializerExtension(OpenApiSerializerExtension):
    priority = 0
    target_class = (
        "sentry.api.serializers.models.organization_member.OrganizationMemberSCIMSerializer"
    )
    match_subclasses = True

    def get_name(self) -> Optional[str]:
        return "test"

    def map_serializer(self, auto_schema, direction):
        required = set()
        sig = inspect.signature(self.target_class.serialize)
        properties = map_typedict(sig.return_annotation)

        # a = build_object_type(
        #     properties=properties,
        #     required=required,
        #     description=""
        #     # description=get_doc(self.target_class.__class__),
        # )
        return properties

    # @classmethod
    # def _matches(cls, target) -> bool:
    #     print(target)
    #     print("344444")
    #     print(PUBLIC_SERIALIZERS)
    #     for k, v in target.items():
    #         if f"{v.__module__}.{v.__name__}" in PUBLIC_SERIALIZERS:
    #             return True
