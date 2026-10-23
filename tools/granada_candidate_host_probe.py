#!/usr/bin/env python3
"""GRANADA candidate smoke HOST evidence only; never real Android acceptance.

Read ONLY process command *names*, cgroup oom_kill count and bounded adb state.
Never read command arguments, logcat, app data, account/session, or environment
values other than an explicitly provided non-secret source commit SHA.
"""
from __future__ import annotations
import argparse
import json
import re
import subprocess
from pathlib import Path

SCHEMA = "mlv.granada.android16.candidate_host.v1"
SHA = re.compile(r"^[a-f0-9]{40}$")
KEYS = {"schema", "phase", "qemu_count", "emulator_count", "oom_kill", "adb"}
ADBS = {"device", "offline", "unavailable"}
PHASES = {"before", "after"}

def _cmd(args, timeout=4):
    try:
        p = subprocess.run(args, capture_output=True, text=True, timeout=timeout, check=False)
        return p.stdout if p.returncode == 0 else ""
    except (OSError, subprocess.TimeoutExpired):
        return ""

def snapshot(phase):
    if phase not in PHASES:
        raise ValueError("unsafe_phase")
    names = _cmd(["ps", "-e", "-o", "comm="]).splitlines()
    qemu = sum(n.strip().startswith("qemu-system") for n in names)
    emulator = sum(n.strip() == "emulator" for n in names)
    oom = None
    try:
        events = Path("/sys/fs/cgroup/memory.events").read_text(encoding="ascii")
        for line in events.splitlines():
            parts = line.split()
            if len(parts) == 2 and parts[0] == "oom_kill" and parts[1].isdigit():
                oom = int(parts[1])
    except (OSError, UnicodeError):
        pass
    adb = _cmd(["adb", "-s", "emulator-5554", "get-state"]).strip()
    return {"schema": SCHEMA, "phase": phase, "qemu_count": qemu,
            "emulator_count": emulator, "oom_kill": oom,
            "adb": adb if adb == "device" else "unavailable"}

def validate(data, phase):
    if not isinstance(data, dict) or set(data) != KEYS or data["schema"] != SCHEMA or data["phase"] != phase:
        raise ValueError("unsafe_or_incomplete_snapshot")
    if data["adb"] not in ADBS or data["oom_kill"] is not None and (
        not isinstance(data["oom_kill"], int) or isinstance(data["oom_kill"], bool) or data["oom_kill"] < 0
    ):
        raise ValueError("invalid_host_status")
    for key in ("qemu_count", "emulator_count"):
        value = data[key]
        if type(value) is not int or not 0 <= value <= 100:
            raise ValueError("invalid_host_process_counter")

def classify(before, after, exit_code, sha):
    validate(before, "before")
    validate(after, "after")
    if type(exit_code) is not int or not 0 <= exit_code <= 255 or not SHA.fullmatch(sha):
        raise ValueError("invalid_provenance_or_exit")
    prior = before["qemu_count"] + before["emulator_count"]
    final = after["qemu_count"] + after["emulator_count"]
    if before["oom_kill"] is not None and after["oom_kill"] is not None:
        delta = after["oom_kill"] - before["oom_kill"]
        if delta < 0:
            raise ValueError("reversed_oom_counter")
    else:
        delta = None
    if exit_code == 0:
        kind = "native_smoke_returned_zero_host_only"
    elif delta is not None and delta > 0:
        kind = "runner_oom_kill_observed"
    elif prior > 0 and final == 0:
        kind = "emulator_process_disappeared"
    elif before["adb"] == "device" and after["adb"] != "device":
        kind = "adb_transport_lost"
    else:
        kind = "native_smoke_failed_cause_unconfirmed"
    return {"schema": SCHEMA, "status": "DIAGNOSTIC_ONLY", "classification": kind,
            "source_sha": sha, "native_smoke_exit": exit_code,
            "host_emulator_seen_before": prior > 0, "host_emulator_seen_after": final > 0,
            "host_oom_kill_delta": delta, "adb_connected_before": before["adb"] == "device",
            "adb_connected_after": after["adb"] == "device",
            "actual_native_acceptance_verified": False, "signed_or_galaxy_verified": False,
            "provider_or_user_account_touched": False}

def write(path, obj):
    p=Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.is_symlink():
        raise ValueError("unsafe_diagnostic_destination")
    temp=p.with_name(p.name+".tmp")
    temp.write_text(json.dumps(obj, indent=2, sort_keys=True)+"\n", encoding="utf-8")
    temp.replace(p)

def main():
    p=argparse.ArgumentParser()
    sub=p.add_subparsers(dest="action", required=True)
    s=sub.add_parser("snapshot"); s.add_argument("--phase", choices=sorted(PHASES), required=True); s.add_argument("--output", required=True)
    c=sub.add_parser("classify"); c.add_argument("--before", required=True); c.add_argument("--after", required=True)
    c.add_argument("--exit-code", required=True, type=int); c.add_argument("--source-sha", required=True); c.add_argument("--output", required=True)
    a=p.parse_args()
    if a.action=="snapshot":
        result=snapshot(a.phase)
        validate(result,a.phase)
        write(a.output,result)
        print("GRANADA_CANDIDATE_HOST_SNAPSHOT "+a.phase)
    else:
        first=json.loads(Path(a.before).read_text(encoding="utf-8"))
        second=json.loads(Path(a.after).read_text(encoding="utf-8"))
        result=classify(first,second,a.exit_code,a.source_sha)
        write(a.output,result)
        print("GRANADA_CANDIDATE_HOST_VERDICT "+result["classification"]+" (diagnostic only)")

if __name__=="__main__":
    main()
