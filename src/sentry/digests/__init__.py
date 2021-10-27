from dataclasses import dataclass
from datetime import datetime
from typing import TYPE_CHECKING, Generic, Literal, Mapping, NamedTuple, Optional, Sequence, TypeVar

from django.conf import settings

from sentry.utils.dates import to_datetime
from sentry.utils.services import LazyServiceWrapper

if TYPE_CHECKING:
    from sentry.models import Group, Rule


T = TypeVar("T")


@dataclass(frozen=True)
class Record(Generic[T]):
    __slots__ = ["key", "value", "timestamp"]

    key: str
    value: T
    timestamp: float

    @property
    def datetime(self) -> Optional[datetime]:
        return to_datetime(self.timestamp)  # type: ignore


class ScheduleEntry(NamedTuple):
    key: str
    timestamp: float


Digest = Mapping["Rule", Mapping["Group", Sequence[Record[T]]]]


def get_option_key(
    plugin: str, option: Literal["increment_delay", "maximum_delay", "minimum_delay"]
) -> str:
    return f"digests:{plugin}:{option}"


from .backends.base import Backend  # NOQA
from .backends.dummy import DummyBackend  # NOQA

backend = LazyServiceWrapper(
    Backend, settings.SENTRY_DIGESTS, settings.SENTRY_DIGESTS_OPTIONS, (DummyBackend,)
)
backend.expose(locals())
