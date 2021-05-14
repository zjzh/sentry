from unittest import TestCase

from sentry.discover.arithmetic import parse_arithmetic


class TestParseArithmetic(TestCase):
    def setUp(self):
        pass

    def test_simple(self):
        result = parse_arithmetic("1+2")
        assert result == ["plus", [1.0, 2.0]]

        result = parse_arithmetic("1-2")
        assert result == ["minus", [1.0, 2.0]]

        result = parse_arithmetic("1*2")
        assert result == ["multiply", [1.0, 2.0]]

        result = parse_arithmetic("1/2")
        assert result == ["divide", [1.0, 2.0]]

    def test_simple_spaces(self):
        result = parse_arithmetic("1 * 1")
        assert result == ["multiply", [1.0, 1.0]]

        result = parse_arithmetic("1 / 1")
        assert result == ["divide", [1.0, 1.0]]

        result = parse_arithmetic("1 + 1")
        assert result == ["plus", [1.0, 1.0]]

        result = parse_arithmetic("1 - 1")
        assert result == ["minus", [1.0, 1.0]]

    def test_chained_addition(self):
        result = parse_arithmetic("1 + 2 - 3")
        assert result == ["minus", [["plus", [1.0, 2.0]], 3.0]]

        result = parse_arithmetic("1 + 2 + 3")
        assert result == [
            "plus",
            [
                ["plus", [1.0, 2.0]],
                3.0,
            ],
        ]

    def test_chained_multiplication(self):
        result = parse_arithmetic("1 * 2 / 3")
        assert result == ["divide", [["multiply", [1.0, 2.0]], 3.0]]

        result = parse_arithmetic("1 / 2 * 3")
        assert result == ["multiply", [["divide", [1.0, 2.0]], 3.0]]

    def test_order_of_operations(self):
        result = parse_arithmetic("1 + 2 * 3")
        assert result == ["plus", [1.0, ["multiply", [2.0, 3.0]]]]

        result = parse_arithmetic("1 * 2 + 3")
        assert result == ["plus", [["multiply", [1.0, 2.0]], 3.0]]

    def test_four_terms(self):
        result = parse_arithmetic("1 + 2 * 3 * 4")
        assert result == ["plus", [1.0, ["multiply", [["multiply", [2.0, 3.0]], 4.0]]]]
