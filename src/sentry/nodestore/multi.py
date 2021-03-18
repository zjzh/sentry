from sentry.nodestore.base import NodeStorage
from sentry.utils.services import import_string


class MultiNodeStorage(NodeStorage):
    def __init__(self, backends) -> None:
        self.__backends = [import_string(path)(**options) for path, options in backends]

        # XXX: disable intermediate caching layer
        for backend in self.__backends:
            backend._cache_backend_name = None

    def _get_bytes(self, id):
        results = (backend._get_bytes(id) for backend in self.__backends)

        for result in results:
            if result is not None:
                return result

        return None

    def _set_bytes(self, id, data, ttl=None):
        for backend in self.__backends:
            backend._set_bytes(id, data, ttl)

    def cleanup(self):
        for backend in self.__backends:
            backend.cleanup()

    def bootstrap(self):
        for backend in self.__backends:
            backend.bootstrap()
