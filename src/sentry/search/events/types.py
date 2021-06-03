from collections import namedtuple
from typing import Union

from snuba_sdk.column import Column
from snuba_sdk.conditions import BooleanCondition, Condition
from snuba_sdk.function import CurriedFunction, Function

WhereType = Union[Condition, BooleanCondition]
SelectType = Union[Column, Function, CurriedFunction]

# converter is to convert the aggregate filter to snuba query
Alias = namedtuple("Alias", "converter aggregate")
