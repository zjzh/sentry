from datetime import datetime
from typing import Callable, Mapping, Optional, Union

from parsimonious.exceptions import ParseError
from snuba_sdk.column import Column
from snuba_sdk.conditions import And, Condition, Op, Or
from snuba_sdk.function import Function

from sentry.api.event_search import SearchFilter, SearchKey, SearchValue, parse_search_query
from sentry.exceptions import InvalidSearchQuery
from sentry.models import Project
from sentry.models.group import Group
from sentry.search.events.constants import (
    ARRAY_FIELDS,
    EQUALITY_OPERATORS,
    ERROR_UNHANDLED_ALIAS,
    ISSUE_ALIAS,
    ISSUE_ID_ALIAS,
    KEY_TRANSACTION_ALIAS,
    NO_CONVERSION_FIELDS,
    PROJECT_ALIAS,
    PROJECT_NAME_ALIAS,
    RELEASE_ALIAS,
    USER_DISPLAY_ALIAS,
)
from sentry.search.events.fields import FIELD_ALIASES
from sentry.search.events.filter import to_list, translate_transaction_status
from sentry.search.utils import parse_release
from sentry.utils.dates import to_timestamp
from sentry.utils.validators import INVALID_EVENT_DETAILS

OPERATOR_MAP: Mapping[str, Op] = {
    "=": Op.EQ,
    "!=": Op.NEQ,
    "IN": Op.IN,
    "NOT IN": Op.NOT_IN,
}


def _environment_filter_converter(
    search_filter: SearchFilter,
    name: str,
    params: Optional[Mapping[str, Union[int, str, datetime]]],
) -> Or:
    # conditions added to env_conditions are OR'd
    env_conditions = []
    value = search_filter.value.value
    values = set(value) if isinstance(value, (list, tuple)) else {value}
    # the "no environment" environment is null in snuba
    if "" in values:
        values.remove("")
        operator = "IS NULL" if search_filter.operator == "=" else "IS NOT NULL"
        env_conditions.append(Condition(Column("environment"), OPERATOR_MAP[operator], None))

    if len(values) == 1:
        operator = "=" if search_filter.operator in EQUALITY_OPERATORS else "!="
        env_conditions.append(
            Condition(Column("environment"), OPERATOR_MAP[operator], values.pop())
        )
    elif values:
        operator = "IN" if search_filter.operator in EQUALITY_OPERATORS else "NOT IN"
        env_conditions.append(Condition(Column("environment"), OPERATOR_MAP[operator], values))

    return Or(conditions=env_conditions)


def _message_filter_converter(
    search_filter: SearchFilter,
    name: str,
    params: Optional[Mapping[str, Union[int, str, datetime]]],
) -> Condition:
    value = search_filter.value.value
    if search_filter.value.is_wildcard():
        # XXX: We don't want the '^$' values at the beginning and end of
        # the regex since we want to find the pattern anywhere in the
        # message. Strip off here
        value = search_filter.value.value[1:-1]
        return Condition(
            Function("match", ["message", f"'(?i){value}'"]),
            OPERATOR_MAP[search_filter.operator],
            1,
        )
    elif value == "":
        operator = "=" if search_filter.operator == "=" else "!="
        return Condition(Column("message"), Op.EQ, value)
    else:
        # https://clickhouse.yandex/docs/en/query_language/functions/string_search_functions/#position-haystack-needle
        # positionCaseInsensitive returns 0 if not found and an index of 1 or more if found
        # so we should flip the operator here
        operator = "!=" if search_filter.operator in EQUALITY_OPERATORS else "="
        if search_filter.is_in_filter:
            return Condition(
                Function(
                    "multiSearchFirstPositionCaseInsensitive",
                    [
                        "message",
                        # XXX: Not sure if this Function is still needed, keeping it for now to make this first pass
                        # easier
                        Function("array", [f"'{v}'" for v in value]),
                    ],
                ),
                OPERATOR_MAP[operator],
                0,
            )

        # make message search case insensitive
        return Condition(
            Function("positionCaseInsensitive", ["message", f"'{value}'"]),
            OPERATOR_MAP[operator],
            0,
        )


def _transaction_status_filter_converter(
    search_filter: SearchFilter,
    name: str,
    params: Optional[Mapping[str, Union[int, str, datetime]]],
) -> Condition:
    # Handle "has" queries
    if search_filter.value.raw_value == "":
        return Condition(Function("isNull", [name]), OPERATOR_MAP[search_filter.operator], 1)

    if search_filter.is_in_filter:
        internal_value = [
            translate_transaction_status(val) for val in search_filter.value.raw_value
        ]
    else:
        internal_value = translate_transaction_status(search_filter.value.raw_value)

    return Condition(Column(name), OPERATOR_MAP[search_filter.operator], internal_value)


def _issue_id_filter_converter(
    search_filter: SearchFilter,
    name: str,
    params: Optional[Mapping[str, Union[int, str, datetime]]],
) -> Condition:
    value = search_filter.value.value
    # Handle "has" queries
    if (
        search_filter.value.raw_value == ""
        or search_filter.is_in_filter
        and [v for v in value if not v]
    ):
        # The state of having no issues is represented differently on transactions vs
        # other events. On the transactions table, it is represented by 0 whereas it is
        # represented by NULL everywhere else. We use coalesce here so we can treat this
        # consistently
        lhs = Function("coalesce", [Column(name), 0])
        if search_filter.is_in_filter:
            value = [v if v else 0 for v in value]
        else:
            value = 0
    else:
        lhs = Column(name)

    # Skip isNull check on group_id value as we want to
    # allow snuba's prewhere optimizer to find this condition.
    return Condition(lhs, OPERATOR_MAP[search_filter.operator], value)


def _user_display_filter_converter(
    search_filter: SearchFilter,
    name: str,
    params: Optional[Mapping[str, Union[int, str, datetime]]],
) -> Condition:
    value = search_filter.value.value
    user_display_expr = FIELD_ALIASES[USER_DISPLAY_ALIAS].get_expression(params)

    # Handle 'has' condition
    if search_filter.value.raw_value == "":
        return Condition(
            Function("isNull", [user_display_expr]), OPERATOR_MAP[search_filter.operator], 1
        )
    if search_filter.value.is_wildcard():
        return Condition(
            Function("match", [user_display_expr, f"'(?i){value}'"]),
            OPERATOR_MAP[search_filter.operator],
            1,
        )
    return Condition(user_display_expr, OPERATOR_MAP[search_filter.operator], value)


def _error_unhandled_filter_converter(
    search_filter: SearchFilter,
    name: str,
    params: Optional[Mapping[str, Union[int, str, datetime]]],
) -> Condition:
    value = search_filter.value.value
    # This field is the inversion of error.handled, otherwise the logic is the same.
    if search_filter.value.raw_value == "":
        output = 0 if search_filter.operator == "!=" else 1
        return Condition(Function("isHandled"), Op.EQ, output)
    if value in ("1", 1):
        return Condition(Function("notHandled"), Op.EQ, 1)
    if value in ("0", 0):
        return Condition(Function("isHandled"), Op.EQ, 1)
    raise InvalidSearchQuery(
        "Invalid value for error.unhandled condition. Accepted values are 1, 0"
    )


def _error_handled_filter_converter(
    search_filter: SearchFilter,
    name: str,
    params: Optional[Mapping[str, Union[int, str, datetime]]],
) -> Condition:
    value = search_filter.value.value
    # Treat has filter as equivalent to handled
    if search_filter.value.raw_value == "":
        output = 1 if search_filter.operator == "!=" else 0
        return Condition(Function("isHandled"), Op.EQ, output)
    # Null values and 1 are the same, and both indicate a handled error.
    if value in ("1", 1):
        return Condition(Function("isHandled"), Op.EQ, 1)
    if value in ("0", 0):
        return Condition(Function("notHandled"), Op.EQ, 1)
    raise InvalidSearchQuery("Invalid value for error.handled condition. Accepted values are 1, 0")


def _key_transaction_filter_converter(
    search_filter: SearchFilter,
    name: str,
    params: Optional[Mapping[str, Union[int, str, datetime]]],
) -> Condition:
    value = search_filter.value.value
    key_transaction_expr = FIELD_ALIASES[KEY_TRANSACTION_ALIAS].get_expression(params)

    if search_filter.value.raw_value == "":
        operator = "!=" if search_filter.operator == "!=" else "="
        return Condition(key_transaction_expr, OPERATOR_MAP[operator], 0)
    if value in ("1", 1):
        return Condition(key_transaction_expr, Op.EQ, 1)
    if value in ("0", 0):
        return Condition(key_transaction_expr, Op.EQ, 0)
    raise InvalidSearchQuery(
        "Invalid value for key_transaction condition. Accepted values are 1, 0"
    )


key_conversion_map: Mapping[
    str,
    Callable[
        [SearchFilter, str, Optional[Mapping[str, Union[int, str, datetime]]]], Union[Condition, Or]
    ],
] = {
    "environment": _environment_filter_converter,
    "message": _message_filter_converter,
    "transaction.status": _transaction_status_filter_converter,
    "issue.id": _issue_id_filter_converter,
    USER_DISPLAY_ALIAS: _user_display_filter_converter,
    ERROR_UNHANDLED_ALIAS: _error_unhandled_filter_converter,
    "error.handled": _error_handled_filter_converter,
    KEY_TRANSACTION_ALIAS: _key_transaction_filter_converter,
}


def convert_search_filter_to_snql_conditions(
    search_filter: SearchFilter,
    key: Optional[str] = None,
    params: Optional[Mapping[str, Union[int, str, datetime]]] = None,
) -> Optional[Union[Condition, Or, And]]:
    name = search_filter.key.name if key is None else key
    value = search_filter.value.value

    # We want to use group_id elsewhere so shouldn't be removed from the dataset
    # but if a user has a tag with the same name we want to make sure that works
    if name in {"group_id"}:
        name = f"tags[{name}]"

    if name in NO_CONVERSION_FIELDS:
        return
    elif name in key_conversion_map:
        return key_conversion_map[name](search_filter, name, params)
    elif name in ARRAY_FIELDS and search_filter.value.is_wildcard():
        # Escape and convert meta characters for LIKE expressions.
        raw_value = search_filter.value.raw_value
        like_value = raw_value.replace("%", "\\%").replace("_", "\\_").replace("*", "%")
        return Condition(
            Column(name), Op.LIKE if search_filter.operator == "=" else Op.NOT_LIKE, like_value
        )
    elif name in ARRAY_FIELDS and search_filter.is_in_filter:
        return Condition(
            Function("hasAny", [name, ["array", [f"'{v}'" for v in value]]]),
            Op.EQ if search_filter.operator == "IN" else Op.NEQ,
            1,
        )
    elif name in ARRAY_FIELDS and search_filter.value.raw_value == "":
        return Condition(
            Function(
                "notEmpty",
                [Column(name)],
            ),
            Op.EQ,
            1 if search_filter.operator == "!=" else 0,
        )
    else:
        # timestamp{,.to_{hour,day}} need a datetime string
        # last_seen needs an integer
        if isinstance(value, datetime) and name not in {
            "timestamp",
            "timestamp.to_hour",
            "timestamp.to_day",
        }:
            value = int(to_timestamp(value)) * 1000

        # Validate event ids are uuids
        if name == "id":
            if search_filter.value.is_wildcard():
                raise InvalidSearchQuery("Wildcard conditions are not permitted on `id` field.")
            elif not search_filter.value.is_event_id():
                raise InvalidSearchQuery(INVALID_EVENT_DETAILS.format("Filter"))

        # most field aliases are handled above but timestamp.to_{hour,day} are
        # handled here
        if name in FIELD_ALIASES:
            lhs = FIELD_ALIASES[name].get_expression(params)

        # Tags are never null, but promoted tags are columns and so can be null.
        # To handle both cases, use `ifNull` to convert to an empty string and
        # compare so we need to check for empty values.
        if search_filter.key.is_tag:
            lhs = Function("ifNull", [Column(name), "''"])
        else:
            lhs = Column(name)

        # Handle checks for existence
        if search_filter.operator in ("=", "!=") and search_filter.value.value == "":
            if search_filter.key.is_tag:
                return Condition(lhs, OPERATOR_MAP[search_filter.operator], value)
            else:
                # If not a tag, we can just check that the column is null.
                return Condition(Function("ifNull", [lhs]), OPERATOR_MAP[search_filter.operator], 1)

        is_null_condition = None
        # TODO(wmak): Skip this for all non-nullable keys not just event.type
        if (
            search_filter.operator in ("!=", "NOT IN")
            and not search_filter.key.is_tag
            and name != "event.type"
        ):
            # Handle null columns on inequality comparisons. Any comparison
            # between a value and a null will result to null, so we need to
            # explicitly check for whether the condition is null, and OR it
            # together with the inequality check.
            # We don't need to apply this for tags, since if they don't exist
            # they'll always be an empty string.
            is_null_condition = Condition(Function("isNull", [lhs]), Op.EQ, 1)

        if search_filter.value.is_wildcard():
            condition = Condition(
                Function("match", [lhs, f"'(?i){value}'"]), OPERATOR_MAP[search_filter.operator], 1
            )
        else:
            condition = Condition(lhs, OPERATOR_MAP[search_filter.operator], value)

        # We only want to return as a list if we have the check for null
        # present. Returning as a list causes these conditions to be ORed
        # together. Otherwise just return the raw condition, so that it can be
        # used correctly in aggregates.
        if is_null_condition:
            return And(conditions=[is_null_condition, condition])
        else:
            return condition


def get_filter(query=None, params=None):
    # NOTE: this function assumes project permissions check already happened
    parsed_terms = []
    if query is not None:
        try:
            parsed_terms = parse_search_query(query, allow_boolean=True, params=params)
        except ParseError as e:
            raise InvalidSearchQuery(f"Parse error: {e.expr.name} (column {e.column():d})")

    conditions = []

    projects_to_filter = set()
    for term in parsed_terms:
        if isinstance(term, SearchFilter):
            new_conditions, found_projects_to_filter, group_ids = format_search_filter(term, params)
            if len(new_conditions) > 0:
                conditions.extend(new_conditions)
            if found_projects_to_filter:
                projects_to_filter.update(found_projects_to_filter)
    projects_to_filter = list(projects_to_filter)

    # Keys included as url params take precedent if same key is included in search
    # They are also considered safe and to have had access rules applied unlike conditions
    # from the query string.
    if params:
        if "start" in params:
            conditions.append(Condition(Column("timestamp"), Op.GTE, params["start"]))
        if "end" in params:
            conditions.append(Condition(Column("timestamp"), Op.LT, params["end"]))

        if "project_id" in params:
            conditions.append(
                Condition(
                    Column("project_id"),
                    Op.IN,
                    projects_to_filter if projects_to_filter else params["project_id"],
                )
            )

        if "environment" in params:
            term = SearchFilter(SearchKey("environment"), "=", SearchValue(params["environment"]))
            conditions.append(convert_search_filter_to_snql_conditions(term))

    return conditions


def format_search_filter(term, params):
    projects_to_filter = []  # Used to avoid doing multiple conditions on project ID
    conditions = []
    group_ids = None
    name = term.key.name
    value = term.value.value
    if name in (PROJECT_ALIAS, PROJECT_NAME_ALIAS):
        if term.operator == "=" and value == "":
            raise InvalidSearchQuery("Invalid query for 'has' search: 'project' cannot be empty.")
        slugs = to_list(value)
        projects = {
            p.slug: p.id
            for p in Project.objects.filter(id__in=params.get("project_id", []), slug__in=slugs)
        }
        missing = [slug for slug in slugs if slug not in projects]
        if missing and term.operator in EQUALITY_OPERATORS:
            raise InvalidSearchQuery(
                f"Invalid query. Project(s) {', '.join(missing)} do not exist or are not actively selected."
            )
        project_ids = list(sorted(projects.values()))
        if project_ids:
            # Create a new search filter with the correct values
            term = SearchFilter(
                SearchKey("project_id"),
                term.operator,
                SearchValue(project_ids if term.is_in_filter else project_ids[0]),
            )
            converted_filter = convert_search_filter_to_snql_conditions(term)
            if converted_filter:
                if term.operator in EQUALITY_OPERATORS:
                    projects_to_filter = project_ids
                conditions.append(converted_filter)
    elif name == ISSUE_ID_ALIAS and value != "":
        # A blank term value means that this is a has filter
        group_ids = to_list(value)
    elif name == ISSUE_ALIAS:
        operator = term.operator
        value = to_list(value)
        # `unknown` is a special value for when there is no issue associated with the event
        group_short_ids = [v for v in value if v and v != "unknown"]
        filter_values = ["" for v in value if not v or v == "unknown"]

        if group_short_ids and params and "organization_id" in params:
            try:
                groups = Group.objects.by_qualified_short_id_bulk(
                    params["organization_id"],
                    group_short_ids,
                )
            except Exception:
                raise InvalidSearchQuery(f"Invalid value '{group_short_ids}' for 'issue:' filter")
            else:
                filter_values.extend(sorted([g.id for g in groups]))

        term = SearchFilter(
            SearchKey("issue.id"),
            operator,
            SearchValue(filter_values if term.is_in_filter else filter_values[0]),
        )
        converted_filter = convert_search_filter_to_snql_conditions(term)
        conditions.append(converted_filter)
    elif (
        name == RELEASE_ALIAS
        and params
        and (value == "latest" or term.is_in_filter and any(v == "latest" for v in value))
    ):
        value = [
            parse_release(
                v,
                params["project_id"],
                params.get("environment_objects"),
                params.get("organization_id"),
            )
            for v in to_list(value)
        ]

        converted_filter = convert_search_filter_to_snql_conditions(
            SearchFilter(
                term.key,
                term.operator,
                SearchValue(value if term.is_in_filter else value[0]),
            )
        )
        if converted_filter:
            conditions.append(converted_filter)
    else:
        converted_filter = convert_search_filter_to_snql_conditions(term, params=params)
        if converted_filter:
            conditions.append(converted_filter)

    return conditions, projects_to_filter, group_ids
