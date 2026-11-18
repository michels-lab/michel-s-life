#!/usr/bin/env python3
"""GRANADA #139: bounded fail-closed Android16 relaunch transport recovery.

Only restarts HOSTED CI ADB transport, never the Android app, emulator, user
storage, account, or backup. A PASS requires the exact relaunched package PID
and a live, booted, uniquely selected emulator serial.

Outputs contain whitelisted codes and counts, never ADB stdout/stderr, tokens,
user account content, OS command arguments, or Android private data.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
from typing import Callable

SERIAL_RE = re.compile(r"^emulator-[0-9]+$")
PACKAGE_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$")
PID_RE = re.compile(r"^[0-9]+(?:[ \t]+[0-9]+)*$")
ALLOWED = {"verified", "recovered", "transport_unavailable", "boot_unavailable",
           "app_process_missing", "invalid_input", "adb_unavailable"}
Runner = Callable[[tuple[str, ...]], tuple[int, str]]


def default_runner(argv: tuple[str, ...]) -> tuple[int, str]:
    try:
        result = subprocess.run(
            ["adb", *argv], capture_output=True, text=True,
            timeout=9, check=False, errors="replace",
        )
        # Only in-memory use; diagnostic disk never captures stdout/stderr.
        return result.returncode, result.stdout[:8192]
    except (OSError, subprocess.TimeoutExpired):
        return 127, ""


def device_state(stdout: str, serial: str) -> str:
    """Exact serial token, never substring matching."""
    if not isinstance(stdout, str):
        return "missing"
    matches = []
    for line in stdout.splitlines():
        fields = line.split()
        if len(fields) >= 2 and fields[0] == serial:
            matches.append(fields[1])
    return matches[0] if len(matches) == 1 else "missing"


def check_once(run: Runner, serial: str, package: str) -> str:
    rc, stdout = run(("devices", "-l"))
    if rc != 0 or device_state(stdout, serial) != "device":
        return "transport_unavailable"
    rc, boot = run(("-s", serial, "shell", "getprop", "sys.boot_completed"))
    if rc != 0 or boot.strip() != "1":
        return "boot_unavailable"
    rc, pid = run(("-s", serial, "shell", "pidof", package))
    if rc != 0 or not PID_RE.fullmatch(pid.strip()):
        return "app_process_missing"
    return "verified"


def recover(
    run: Runner,
    serial: str,
    package: str,
    max_attempts: int = 5,
    delay_seconds: float = 3,
    sleep: Callable[[float], None] = time.sleep,
) -> dict:
    if (not SERIAL_RE.fullmatch(serial) or not PACKAGE_RE.fullmatch(package)
            or not 1 <= max_attempts <= 8 or not 0 <= delay_seconds <= 8):
        return {"status": "fail", "code": "invalid_input",
                "attempts": 0, "adb_resets": 0}
    first_error = None
    resets = 0
    # A reconnect is not enough: every success still requires actual pidof
    # of the exact package and Android boot on the exact named emulator.
    for attempt in range(1, max_attempts + 1):
        code = check_once(run, serial, package)
        if code == "verified":
            return {"status": "pass",
                    "code": "verified" if attempt == 1 else "recovered",
                    "attempts": attempt, "adb_resets": resets}
        if first_error is None:
            first_error = code
        if code == "transport_unavailable" and resets < 2:
            # Restart ONLY adb server, never app, emulator, or its device data.
            run(("kill-server",))
            run(("start-server",))
            resets += 1
        if attempt < max_attempts:
            sleep(delay_seconds)
    return {"status": "fail", "code": code if code in ALLOWED else "adb_unavailable",
            "first_error": first_error or "adb_unavailable",
            "attempts": max_attempts, "adb_resets": resets}


def safe_write(path: Path, report: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    # Atomic JSON report avoids a false-positive partial state in evidence CI.
    with tempfile.NamedTemporaryFile("w", encoding="utf-8",
                                     dir=path.parent, delete=False) as f:
        temporary = Path(f.name)
        json.dump({
            "schema": "mlv.granada.android-native-relaunch-transport.v1",
            "environment": "hosted-emulator-api36-ci",
            "android_data_modified": False,
            "package_relaunched_by_guard": False,
            "browser_simulation": False,
            "native_persistence_verified": False,
            **report,
        }, f, sort_keys=True, indent=2)
        f.write("\n")
    os.replace(temporary, path)


def main(argv=None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--package", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--serial", default="emulator-5554")
    p.add_argument("--attempts", type=int, default=5)
    p.add_argument("--delay", type=float, default=3)
    args = p.parse_args(argv)
    result = recover(default_runner, args.serial, args.package,
                     args.attempts, args.delay)
    safe_write(Path(args.output), result)
    print("GRANADA_NATIVE_TRANSPORT " + json.dumps(
        {k: result[k] for k in ("status", "code", "attempts", "adb_resets")},
        sort_keys=True))
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
