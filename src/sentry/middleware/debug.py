from django.conf import settings
from django.utils.deprecation import MiddlewareMixin


class NoIfModifiedSinceMiddleware(MiddlewareMixin):
    def __init__(self):
        if not settings.DEBUG:
            from django.core.exceptions import MiddlewareNotUsed

            raise MiddlewareNotUsed

    def process_request(self, request):
        request.META.pop("HTTP_IF_MODIFIED_SINCE", None)
