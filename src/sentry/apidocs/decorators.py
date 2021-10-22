from .preprocessor import PUBLIC_ENDPOINTS


def declare_public(methods):
    def decorate(view_cls):
        PUBLIC_ENDPOINTS[view_cls.__name__] = {
            "callback": view_cls,
            "methods": methods,
        }

        return view_cls

    return decorate


# __import__("pdb").set_trace()
# print(view_cls)
# # print(view_cls.__qualname__)
# print(view_cls.__name__)


# return func
