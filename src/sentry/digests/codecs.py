from typing import Any

from sentry.utils.codecs import Codec, PickleCodec, ZlibCodec


# Provided for compatibility with legacy configurations
def CompressedPickleCodec() -> Codec[Any, bytes]:
    return PickleCodec() | ZlibCodec()
