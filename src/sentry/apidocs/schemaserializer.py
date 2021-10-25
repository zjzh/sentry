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


def get_class(obj) -> type:
    return obj if inspect.isclass(obj) else obj.__class__


class PublicSchemaResponseSerializerExtension(OpenApiSerializerExtension):
    priority = 0
    target_class = "sentry.api.serializers.base.Serializer"
    match_subclasses = True

    def get_name(self) -> Optional[str]:
        return self.target.__name__

    def map_serializer(self, auto_schema, direction):
        required = set()
        sig = inspect.signature(self.target.serialize)

        # breakpoint()
        if type(sig.return_annotation) != _TypedDictMeta:
            return {"type": "string", "required": True}

        properties = map_typedict(sig.return_annotation)

        # a = build_object_type(
        #     properties=properties,
        #     required=required,
        #     description=""
        #     # description=get_doc(self.target_class.__class__),
        # )
        return properties

    @classmethod
    def _matches(cls, target) -> bool:
        if isinstance(cls.target_class, str):
            cls._load_class()

        if cls.target_class is None:
            return False  # app not installed
        elif cls.match_subclasses:
            print(issubclass(get_class(target), cls.target_class))
            return (
                issubclass(get_class(target), cls.target_class)
                and f"{target.__module__}.{target.__name__}" in PUBLIC_SERIALIZERS
            )
        else:
            return get_class(target) == cls.target_class
