import functools
import logging
from concurrent.futures import as_completed, wait

from sentry.nodestore.base import NodeStorage
from sentry.utils.concurrent import SynchronousExecutor
from sentry.utils.services import import_string

logger = logging.getLogger(__name__)


class MultiNodeStorage(NodeStorage):
    def __init__(self, backends, executor=None) -> None:
        self.__backends = [
            import_string(backend_path)(**backend_options)
            for backend_path, backend_options in backends
        ]

        if executor is not None:
            executor_path, executor_options = executor
            self.__exectutor = import_string(executor_path)(**executor_options)
        else:
            self.__exectutor = SynchronousExecutor()

        # XXX: disable intermediate caching layer
        for backend in self.__backends:
            backend._cache_backend_name = None

    def _get_bytes(self, id):
        futures = {
            self.__executor.submit(functools.partial(backend._get_bytes, id)): backend
            for backend in self.__backends
        }

        for future in as_completed(futures.keys()):
            try:
                result = future.result()
            except Exception as e:
                logger.warning(
                    "Failed to execute %r (using %r) due to error: %r",
                    future,
                    futures[future],
                    e,
                    exc_info=True,
                )
            else:
                if result is not None:
                    return result

        return None

    def _set_bytes(self, id, data, ttl=None):
        futures = {
            self.__executor.submit(functools.partial(backend._set_bytes, id, data, ttl)): backend
            for backend in self.__backends
        }

        results = wait(futures.keys())

        for future in results.done:
            try:
                future.result()
            except Exception as e:
                logger.warning(
                    "Failed to execute %r (using %r) due to error: %r",
                    future,
                    futures[future],
                    e,
                    exc_info=True,
                )

    def delete(self, id):
        futures = {
            self.__executor.submit(functools.partial(backend.delete, id)): backend
            for backend in self.__backends
        }

        results = wait(futures.keys())

        for future in results.done:
            try:
                future.result()
            except Exception as e:
                logger.warning(
                    "Failed to execute %r (using %r) due to error: %r",
                    future,
                    futures[future],
                    e,
                    exc_info=True,
                )

        self._delete_cache_item(id)

    def cleanup(self):
        for backend in self.__backends:
            backend.cleanup()

    def bootstrap(self):
        for backend in self.__backends:
            backend.bootstrap()
