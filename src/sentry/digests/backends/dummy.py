from contextlib import contextmanager
from typing import TYPE_CHECKING, Any, Iterable, Iterator, Optional, Sequence

from sentry.digests import Record, ScheduleEntry
from sentry.digests.backends.base import Backend

if TYPE_CHECKING:
    from sentry.models import Project


class DummyBackend(Backend):
    def add(
        self,
        key: str,
        record: Record[Any],
        increment_delay: Optional[int] = None,
        maximum_delay: Optional[int] = None,
        timestamp: Optional[float] = None,
    ) -> bool:
        pass

    def enabled(self, project: "Project") -> bool:
        return False

    @contextmanager
    def digest(
        self, key: str, minimum_delay: Optional[int] = None
    ) -> Iterator[Sequence[Record[Any]]]:
        yield []

    def schedule(
        self, deadline: float, timestamp: Optional[float] = None
    ) -> Optional[Iterable[ScheduleEntry]]:
        return None
        # yield  # TODO(mgaeta): Make this a generator and fix return type.

    def maintenance(self, deadline: float, timestamp: Optional[float] = None) -> None:
        pass
