#!/usr/bin/env python3
"""GRANADA #139 CI host-only VM watcher; NEVER touches ADB, app, or user data.

Samples Linux /proc names and cgroup memory events to distinguish hosted VM
death / OOM from an Android application process crash. No argv/env/UID/PID,
network, logcat, tokens, user state, journal, or raw process names in reports.
The watcher never reboots an emulator or silently declares native acceptance.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import signal
import sys
import time

ALLOWED_EXE = frozenset(("emulator", "qemu-system-x86", "qemu-system-x86_64",
                          "qemu-system-aar", "qemu-system-aarch64", "adb"))
MAX_SAMPLES = 240


def read_text(path: Path, maxbytes=512):
    try:
        return path.read_text(encoding="utf-8", errors="replace")[:maxbytes]
    except (OSError, PermissionError):
        return ""


def safe_counter(raw: str, key: str):
    for line in raw.splitlines():
        fields = line.split()
        if len(fields) == 2 and fields[0] == key and fields[1].isdigit():
            return int(fields[1])
    return None


def cgroup_snapshot(root: Path):
    events = read_text(root / "sys/fs/cgroup/memory.events", 4096)
    mem_now = read_text(root / "sys/fs/cgroup/memory.current", 64).strip()
    mem_max = read_text(root / "sys/fs/cgroup/memory.max", 64).strip()
    return {
        "oom_count": safe_counter(events, "oom"),
        "oom_kill_count": safe_counter(events, "oom_kill"),
        "memory_bytes": int(mem_now) if mem_now.isdigit() else None,
        "memory_limit_bytes": int(mem_max) if mem_max.isdigit() else None,
    }


def host_sample(root: Path, sequence: int):
    proc = root / "proc"
    names = {"emulator": 0, "qemu": 0, "adb": 0}
    rss_kb = {"emulator": 0, "qemu": 0, "adb": 0}
    try:
        entries = list(proc.iterdir())
    except OSError:
        entries = []
    for p in entries:
        if not p.name.isdecimal() or not p.is_dir():
            continue
        name = read_text(p / "comm").strip()
        if name not in ALLOWED_EXE:
            continue
        group = ("qemu" if name.startswith("qemu-") else name)
        names[group] += 1
        stat = read_text(p / "status", 4096)
        amount = safe_counter(stat, "VmRSS:")
        # /proc/status has "VmRSS: 123 kB": parse a bounded integer only.
        if amount is None:
            for line in stat.splitlines():
                if line.startswith("VmRSS:"):
                    parts = line.split()
                    if len(parts) >= 2 and parts[1].isdigit():
                        amount = int(parts[1])
                    break
        rss_kb[group] += amount or 0
    vm = cgroup_snapshot(root)
    return {
        "sequence": sequence,
        "emulator_count": names["emulator"],
        "qemu_count": names["qemu"],
        "adb_count": names["adb"],
        "emulator_rss_kib": rss_kb["emulator"],
        "qemu_rss_kib": rss_kb["qemu"],
        "cgroup_oom": vm["oom_count"],
        "cgroup_oom_kill": vm["oom_kill_count"],
        "cgroup_memory_bytes": vm["memory_bytes"],
        "cgroup_memory_limit_bytes": vm["memory_limit_bytes"],
    }


def verdict(samples: list[dict]):
    if not samples:
        return {"classification": "no_host_samples", "native_app_state": "unknown"}
    def vm_count(row):
        return (row.get("emulator_count") or 0) + (row.get("qemu_count") or 0)
    live = [i for i, row in enumerate(samples) if vm_count(row) > 0]
    kill0 = samples[0].get("cgroup_oom_kill")
    killn = samples[-1].get("cgroup_oom_kill")
    if kill0 is not None and killn is not None and killn > kill0:
        classification = "host_cgroup_oom_kill_observed"
    elif live and vm_count(samples[-1]) == 0:
        classification = "emulator_process_disappeared"
    elif not live:
        classification = "no_emulator_process_seen"
    else:
        classification = "emulator_process_seen_at_end"
    return {
        "classification": classification,
        "native_app_state": "unknown",
        "native_persistence_verified": False,
        "physical_galaxy_verified": False,
        "sample_count": len(samples),
        "vm_observed_live": bool(live),
        "vm_observed_gone_at_end": bool(live) and vm_count(samples[-1]) == 0,
        "oom_kill_delta": (killn - kill0 if kill0 is not None and
                           killn is not None and killn >= kill0 else None),
    }


def watch(out: Path, root: Path, interval: float, limit: int):
    out.mkdir(parents=True, exist_ok=True)
    end = False
    def stop(_signal, _frame):
        nonlocal end
        end = True
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    samples = []
    try:
        while not end and len(samples) < limit:
            samples.append(host_sample(root, len(samples) + 1))
            if not end:
                time.sleep(interval)
    finally:
        report = {
            "schema": "mlv.granada.android16.host-only-vm-observation.v1",
            "data_collected": "host_process_counts_and_cgroup_memory_only",
            "adb_called": False, "app_storage_accessed": False,
            "accounts_or_tokens_collected": False,
            "result": verdict(samples),
            "samples": samples,
        }
        tmp = out / "host-watch.partial"
        tmp.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        os.replace(tmp, out / "host-watch.json")
        print("GRANADA_EMULATOR_HOST_WATCH " +
              json.dumps(report["result"], sort_keys=True), flush=True)


def main(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True)
    p.add_argument("--interval", type=float, default=4)
    p.add_argument("--samples", type=int, default=200)
    a = p.parse_args(argv)
    if not (0.5 <= a.interval <= 20 and 1 <= a.samples <= MAX_SAMPLES):
        p.error("bounded interval and samples required")
    watch(Path(a.out), Path("/"), a.interval, a.samples)


if __name__ == "__main__":
    main()
