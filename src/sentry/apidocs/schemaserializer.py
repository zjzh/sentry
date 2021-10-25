import inspect
from typing import (
    Optional,
    Union,
    _GenericAlias,
    _TypedDictMeta,
    get_args,
    get_origin,
    get_type_hints,
)

from drf_spectacular.extensions import OpenApiSerializerExtension
from drf_spectacular.openapi import (
    build_array_type,
    build_basic_type,
    build_object_type,
    is_basic_type,
)
from drf_spectacular.plumbing import get_doc, safe_ref

PUBLIC_SERIALIZERS = set()


def is_optional(field):
    # https://stackoverflow.com/a/58841311
    return get_origin(field) is Union and type(None) in get_args(field)


def map_field_from_type(t):
    if type(t) == _TypedDictMeta:
        return map_typedict(t), True

    if is_basic_type(t):
        schema = build_basic_type(t)
        if schema is None:
            return None
        return schema, True

    if get_origin(t) is list:
        field, required = map_field_from_type(t.__args__[0])
        return build_array_type(field), True

    if is_optional(t):
        return map_field_from_type(get_args(t)[0])[0], False

    breakpoint()
    return {"type": "string", "required": True}, True


def map_typedict(t):
    # TODO: register nested TypedDicts as components
    properties = {}
    required = set()
    for k, v in get_type_hints(t).items():
        field, field_required = map_field_from_type(v)
        properties[k] = field
        if field_required:
            required.add(k)
    # return build_object_type(properties, required=set(), description="")
    return {"type": "object", "properties": properties, "required": list(required)}


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
            return (
                issubclass(get_class(target), cls.target_class)
                and f"{target.__module__}.{target.__name__}" in PUBLIC_SERIALIZERS
            )
        else:
            return get_class(target) == cls.target_class
