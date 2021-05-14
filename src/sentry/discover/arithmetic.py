from parsimonious.exceptions import IncompleteParseError
from parsimonious.grammar import Grammar, NodeVisitor

arithmetic_grammar = Grammar(
    r"""
term                 = maybe_factor adds
adds                 = add_sub*
add_sub              = add_sub_operator maybe_factor
maybe_factor         = (factor / numeric_value)

factor               = numeric_value muls
muls                 = mul_div+
mul_div              = mul_div_operator numeric_value

add_sub_operator     = spaces (plus / minus) spaces
mul_div_operator     = spaces (multiply / divide) spaces
primary              = numeric_value

# Operator names should match what's in clickhouse
plus                 = "+"
minus                = "-"
multiply             = "*"
divide               = "/"

# TODO share these with api/event_search
numeric_value        = ~r"[0-9]"
spaces               = ~r"\ *"
"""
)


class ArithmeticVisitor(NodeVisitor):
    def flatten(self, terms):
        *remaining, term = terms
        print("flatten", remaining, term)
        if len(term[-1]) == 1:
            term[-1] = remaining + term[-1]
        return term

    def visit_term(self, node, children):
        lhs, remaining = children
        if isinstance(remaining, list):
            remaining[0][-1] = lhs + remaining[0][-1]
            print("term", remaining)
            return self.flatten(remaining)
        else:
            return lhs[0]

    def visit_factor(self, node, children):
        lhs, remaining = children
        print("factor", remaining, lhs)
        remaining[0][-1] = [lhs] + remaining[0][-1]
        return self.flatten(remaining)

    def visit_add_sub(self, _, children):
        operator, rhs = children
        result = [operator, rhs]
        print("add_sub", result)
        return result

    def visit_mul_div(self, _, children):
        operator, rhs = children
        result = [operator, [rhs]]
        print("mul_div", result)
        return result

    @staticmethod
    def parse_operator(children):
        # Remove the optional spaces
        _, operator, _ = children
        # operator is a list but we'll only ever want the first
        return operator[0].expr_name

    def visit_add_sub_operator(self, _, children):
        return self.parse_operator(children)

    def visit_mul_div_operator(self, _, children):
        return self.parse_operator(children)

    def visit_numeric_value(self, node, children):
        return float(node.text)

    def generic_visit(self, node, children):
        if children and isinstance(children, list):
            return children
        return node or children


def parse_arithmetic(equation):
    # TODO try/catch
    tree = arithmetic_grammar.parse(equation)
    result = ArithmeticVisitor().visit(tree)
    return result
