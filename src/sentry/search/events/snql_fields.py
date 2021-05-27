from collections import defaultdict
from typing import List, Union

from snuba_sdk.column import Column
from snuba_sdk.function import Function

from sentry.exceptions import InvalidSearchQuery
from sentry.search.events.constants import TAG_KEY_RE, VALID_FIELD_PATTERN
from sentry.search.events.fields import FIELD_ALIASES, is_function
from sentry.search.events.snql_filter import Filter
from sentry.utils.snuba import resolve_column


class Fields:
    def __init__(
        self,
        selected_columns: List[str],
        snql_filter: Filter,
    ):
        self.filter = snql_filter
        self.aggregations = []
        self.aggregate_fields = defaultdict(set)
        self.columns = []
        self.groupby = []
        self.project_key = ""
        self.functions = {}
        self.resolve_column_name = resolve_column(snql_filter.dataset)

        for field in selected_columns:
            if isinstance(field, str) and field.strip() == "":
                continue
            field = self.resolve_field(field)
            if isinstance(field, Column) and field not in self.columns:
                self.columns.append(field)

    def column(self, name: str) -> Column:
        return Column(self.resolve_column_name(name))

    def resolve_field(self, field) -> Union[Column, Function]:
        if not isinstance(field, str):
            raise InvalidSearchQuery("Field names must be strings")

        match = is_function(field)
        if match:
            raise NotImplementedError(f"{field} not implemented in snql field parsing yet")

        if field in FIELD_ALIASES:
            raise NotImplementedError(f"{field} not implemented in snql field parsing yet")

        tag_match = TAG_KEY_RE.search(field)
        field = tag_match.group("tag") if tag_match else field

        if VALID_FIELD_PATTERN.match(field):
            return self.column(field)
        else:
            raise InvalidSearchQuery(f"Invalid characters in field {field}")

    @property
    def select(self):
        return self.aggregations + self.columns
