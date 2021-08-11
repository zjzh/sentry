#!/usr/bin/env python3

import os
import time

import click
import sentry_sdk

"""
Usage:
./payloader.py payload payloads.txt
./payloader.py payload hacking.txt
./payloader.py ip ips.txt
"""

SENTRY_DSN = os.getenv("SENTRY_DSN")


sentry_sdk.init(SENTRY_DSN, traces_sample_rate=1.0, send_default_pii=True)


@click.command()
@click.argument("kind")
@click.argument("payloads_file", type=click.File("r"))
@click.option("-n", default=1, help="Number of times to repeat payloads")
@click.option("-t", default=0, help="Milliseconds to wait between sending payloads")
def main(kind, payloads_file, n, t):
    while True:
        line = payloads_file.readline().strip()
        if not line:
            break

        for i in range(n):
            with sentry_sdk.push_scope() as scope:
                if kind == "ip":
                    sentry_sdk.set_user({"ip_address": line})
                elif kind == "payload":
                    scope.set_extra("payload", line)

                result = sentry_sdk.capture_message("Message with " + kind)
                print(result)  # NOQA
                time.sleep(t / 1000)


if __name__ == "__main__":
    main()
