from datetime import datetime
from typing import Any, Callable, Mapping, Optional, Sequence, Union

from parsimonious.exceptions import ParseError
from snuba_sdk.column import Column
from snuba_sdk.conditions import Condition, Op, Or
from snuba_sdk.function import Function

from sentry.api.event_search import SearchFilter, SearchKey, SearchValue, parse_search_query
from sentry.exceptions import InvalidSearchQuery
from sentry.search.events.constants import EQUALITY_OPERATORS, NO_CONVERSION_FIELDS
from sentry.utils.snuba import Dataset, resolve_column

OPERATOR_MAP: Mapping[str, Op] = {
    "=": Op.EQ,
    "!=": Op.NEQ,
    "IN": Op.IN,
    "NOT IN": Op.NOT_IN,
}


class Filter:
    # Starting with an allowlist for now so we can convert things incrementally
    # At a certain point we should just flip to a denylist of what's left
    field_allowlist = {
        "trace",
        "release",
        "user.email",
    }

    def __init__(self, query=None, params=None, dataset=None):
        self.key_conversion_map: Mapping[
            str,
            Callable[
                [SearchFilter, str, Mapping[str, Union[int, str, datetime]]],
                Optional[Sequence[Any]],
            ],
        ] = {
            "environment": self._environment_filter_converter,
        }
        if dataset is None:
            dataset = Dataset.Discover
        self.dataset = dataset
        self.where = []
        self.having = []
        self.resolve_column_name = resolve_column(self.dataset)
        # NOTE: this function assumes project permissions check already happened
        self.projects_to_filter = set()
        self.parsed_terms = []

        if query is not None:
            try:
                self.parsed_terms = parse_search_query(query, allow_boolean=True, params=params)
            except ParseError as e:
                raise InvalidSearchQuery(f"Parse error: {e.expr.name} (column {e.column():d})")

        for term in self.parsed_terms:
            if isinstance(term, SearchFilter):
                self.format_search_filter(term)

        self.projects_to_filter = list(self.projects_to_filter)

        if params:
            self.parse_params(params)

    def column(self, name: str) -> Column:
        return Column(self.resolve_column_name(name))

    def convert_search_filter_to_snql_where(
        self,
        search_filter: SearchFilter,
    ) -> Optional[Condition]:
        name = search_filter.key.name
        value = search_filter.value.value

        # We want to use group_id elsewhere so shouldn't be removed from the dataset
        # but if a user has a tag with the same name we want to make sure that works
        if name in {"group_id"}:
            name = f"tags[{name}]"

        if name in NO_CONVERSION_FIELDS:
            return
        elif name in self.key_conversion_map:
            return self.key_conversion_map[name](search_filter, name)
        elif name in self.field_allowlist:
            lhs = self.column(name)

            # Handle checks for existence
            if search_filter.operator in ("=", "!=") and search_filter.value.value == "":
                if search_filter.key.is_tag:
                    return Condition(lhs, OPERATOR_MAP[search_filter.operator], value)
                else:
                    # If not a tag, we can just check that the column is null.
                    return Condition(
                        Function("ifNull", [lhs]), OPERATOR_MAP[search_filter.operator], 1
                    )

            if search_filter.value.is_wildcard():
                condition = Condition(
                    Function("match", [lhs, f"'(?i){value}'"]),
                    OPERATOR_MAP[search_filter.operator],
                    1,
                )
            else:
                condition = Condition(lhs, OPERATOR_MAP[search_filter.operator], value)

            return condition
        else:
            raise NotImplementedError(f"{name} not implemented in snql filter parsing yet")

    def format_search_filter(self, term):
        converted_filter = self.convert_search_filter_to_snql_where(term)
        if converted_filter:
            self.where.append(converted_filter)

    def parse_params(self, params):
        """Keys included as url params take precedent if same key is included in search
        They are also considered safe and to have had access rules applied unlike conditions
        from the query string.
        """
        if "start" in params:
            self.where.append(Condition(self.column("timestamp"), Op.GTE, params["start"]))
        if "end" in params:
            self.where.append(Condition(self.column("timestamp"), Op.LT, params["end"]))

        if "project_id" in params:
            self.where.append(
                Condition(
                    self.column("project_id"),
                    Op.IN,
                    self.projects_to_filter if self.projects_to_filter else params["project_id"],
                )
            )

        if "environment" in params:
            term = SearchFilter(SearchKey("environment"), "=", SearchValue(params["environment"]))
            self.where.append(self.convert_search_filter_to_snql_where(term))

    def _environment_filter_converter(
        self,
        search_filter: SearchFilter,
        name: str,
    ):
        # conditions added to env_conditions can be OR'ed
        env_conditions = []
        value = search_filter.value.value
        values = set(value if isinstance(value, (list, tuple)) else [value])
        # sorted for consistency
        values = sorted([str(value) for value in values])
        environment = self.column("environment")
        # the "no environment" environment is null in snuba
        if "" in values:
            values.remove("")
            operator = Op.IS_NULL if search_filter.operator == "=" else Op.IS_NOT_NULL
            env_conditions.append(Condition(environment, operator))
        if len(values) == 1:
            operator = Op.EQ if search_filter.operator in EQUALITY_OPERATORS else Op.NEQ
            env_conditions.append(Condition(environment, operator, values.pop()))
        elif values:
            operator = Op.IN if search_filter.operator in EQUALITY_OPERATORS else Op.NOT_IN
            env_conditions.append(Condition(environment, operator, values))
        if len(env_conditions) > 1:
            return Or(conditions=env_conditions)
        else:
            return env_conditions[0]
