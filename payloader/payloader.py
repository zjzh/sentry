#!/usr/bin/env python3

import click
import sentry_sdk

"""
Usage:
./payloader.py payload payloads.txt
./payloader.py payload hacking.txt
./payloader.py ip ips.txt
"""


SENTRY_DSN = "http://119c01fab71b43ffb2d076dc5e1543b6@dev.getsentry.net:8000/2"


sentry_sdk.init(
    SENTRY_DSN,
    traces_sample_rate=1.0,
    send_default_pii=True
)


@click.command()
@click.argument("kind")
@click.argument("payloads_file", type=click.File("r"))
def main(kind, payloads_file):
    while True:
        with sentry_sdk.push_scope() as scope:
            line = payloads_file.readline().strip()
            if not line:
                break

            if kind == 'ip':
                sentry_sdk.set_user({"ip_address": line})
            elif kind == 'payload':
                scope.set_extra('payload', line)

            sentry_sdk.capture_message("Message with " + kind)


if __name__ == "__main__":
    main()
