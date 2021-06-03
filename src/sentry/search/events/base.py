from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional

from snuba_sdk.column import Column
from snuba_sdk.function import CurriedFunction

from sentry.models import Environment
from sentry.search.events.constants import SNQL_FIELD_ALLOWLIST
from sentry.search.events.types import Alias, SelectType, WhereType
from sentry.utils.snuba import Dataset, quantize_time, resolve_column


@dataclass
class FilterParams:
    start: Optional[datetime]
    end: Optional[datetime]
    project_id: List[int]
    organization_id: int
    environment: Optional[List[str]] = None
    environment_objects: Optional[List[Environment]] = None
    team_id: Optional[List[int]] = None
    user_id: Optional[int] = None
    function_aliases: Optional[Dict[str, Alias]] = None
    group_id: Optional[List[int]] = None

    def validate_snuba_params(self):
        """Certain fields are required for snuba filters"""
        assert len(self.project_id) > 0, "project ids are required for snuba params"

    def quantize_date_params(self):
        assert isinstance(self.start, datetime), "start is required for snuba params"
        assert isinstance(self.end, datetime), "end is required for snuba params"

        duration = (self.end - self.start).total_seconds()
        # Only perform rounding on durations longer than an hour
        if duration > 3600:
            # Round to 15 minutes if over 30 days, otherwise round to the minute
            round_to = 15 * 60 if duration >= 30 * 24 * 3600 else 60
            for key in ["start", "end"]:
                setattr(
                    self,
                    key,
                    quantize_time(getattr(self, key), self.organization_id, duration=round_to),
                )


class QueryBase:
    field_allowlist = SNQL_FIELD_ALLOWLIST

    def __init__(
        self,
        dataset: Dataset,
        params: FilterParams,
        orderby: Optional[List[str]] = None,
    ):
        # Function is a subclass of CurriedFunction
        self.aggregates: List[CurriedFunction] = []
        self.columns: List[SelectType] = []
        self.where: List[WhereType] = []

        self.params = params
        self.dataset = dataset
        self.orderby_columns: List[str] = orderby if orderby else []

        self.resolve_column_name = resolve_column(self.dataset)

    def column(self, name: str) -> Column:
        return Column(self.resolve_column_name(name))
