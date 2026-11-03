#!/usr/bin/env python3
"""Safe hosted Android16 QEMU/oom diagnostic summary. Never native acceptance."""
from __future__ import annotations
import argparse
import json
import re
from pathlib import Path

ENUMS = {
    "phase": frozenset(("preflight", "baseline", "installed-idle", "launched",
                        "verified-three-phases", "probe-self-test")),
    "operation": frozenset(("initialize", "host_status", "boot_property",
                            "adb_transport", "app_process", "framebuffer",
                            "verify_pixels", "sample_complete", "package_install",
                            "activity_launch", "completed")),
}
NUMBERS = frozenset(("sample", "cgroup_oom", "cgroup_oom_kill",
                    "cgroup_memory_bytes", "qemu_process_count",
                    "emulator_process_count"))
SAFE_KEYS = set(ENUMS) | set(NUMBERS)
SHA = re.compile(r"^[0-9a-f]{40}$")

def parse_snapshot(path: Path) -> dict:
    if path.is_symlink() or not path.is_file() or path.stat().st_size > 1500:
        raise ValueError("missing_or_oversized_host_snapshot")
    rows = path.read_text(encoding="ascii").splitlines()
    if not rows or rows[0] != "schema=mlv-granada-host-failure-v1":
        raise ValueError("unsupported_host_snapshot")
    data = {}
    for row in rows[1:]:
        if not re.fullmatch(r"[a-z_]+=[A-Za-z0-9_-]+", row):
            raise ValueError("unsafe_host_data")
        k, v = row.split("=", 1)
        if k not in SAFE_KEYS or k in data:
            raise ValueError("unsupported_or_duplicate_host_field")
        if k in NUMBERS:
            if not v.isdecimal() or len(v) > 16:
                raise ValueError("invalid_numeric_host_field")
            data[k] = int(v)
        else:
            if v not in ENUMS[k]:
                raise ValueError("unsafe_host_enum")
            data[k] = v
    if not {"phase", "operation", "sample", "qemu_process_count",
            "emulator_process_count"}.issubset(data):
        raise ValueError("incomplete_host_snapshot")
    return data

def evaluate(before: dict, after: dict) -> dict:
    delta = None
    if ("cgroup_oom_kill" in before and "cgroup_oom_kill" in after):
        delta = after["cgroup_oom_kill"] - before["cgroup_oom_kill"]
        if delta < 0:
            raise ValueError("incompatible_host_oom_counters")
    prior = before["qemu_process_count"] + before["emulator_process_count"]
    final = after["qemu_process_count"] + after["emulator_process_count"]
    if delta and delta > 0:
        kind = "host_cgroup_oom_kill_observed"
    elif prior > 0 and final == 0:
        kind = "qemu_emulator_process_disappeared"
    elif final > 0:
        kind = "host_emulator_process_still_observed"
    else:
        kind = "host_process_state_unknown"
    return {
        "classification": kind,
        "failure_phase": after["phase"],
        "failed_operation": after["operation"],
        "failed_sample": after["sample"],
        "host_process_alive_before": prior > 0,
        "host_process_alive_after": final > 0,
        "host_oom_kill_delta": delta,
        "native_app_state": "not_verified",
        "canonical_persistence_verified": False,
        "physical_galaxy_verified": False,
    }

def report(root: Path, source_sha: str) -> dict:
    if not SHA.fullmatch(source_sha):
        raise ValueError("invalid_source_sha")
    before = parse_snapshot(root / "host-before.txt")
    failure = root / "host-after-failure.txt"
    success = root / "host-after-success.txt"
    if failure.exists() and success.exists():
        raise ValueError("ambiguous_host_outcome")
    if success.is_file():
        # A completed native experiment is NOT a failed host diagnosis;
        # a distinct image/persistence validator must still approve 24/24.
        marker = root / "phases-complete.txt"
        if ((root / "failed-stage.txt").exists() or marker.is_symlink() or
                not marker.is_file() or marker.read_text().strip() != "complete"):
            raise ValueError("phase_not_verified")
        after = parse_snapshot(success)
        if after["phase"] != "verified-three-phases" or after["operation"] != "completed":
            raise ValueError("invalid_complete_host_snapshot")
        summary = evaluate(before, after)
        return {
            "schema": "mlv.granada.android16.host_failure_verdict.v1",
            "source_sha": source_sha,
            "status": "NO_FAILURE_OBSERVED",
            "classification": "host_experiment_finished_without_failure",
            "failure_phase": None,
            "failed_operation": None,
            "failed_sample": None,
            "host_process_alive_before": summary["host_process_alive_before"],
            "host_process_alive_after": summary["host_process_alive_after"],
            "host_oom_kill_delta": summary["host_oom_kill_delta"],
            "native_app_state": "not_verified",
            "canonical_persistence_verified": False,
            "physical_galaxy_verified": False,
        }
    after = parse_snapshot(failure)
    result = evaluate(before, after)
    return {"schema": "mlv.granada.android16.host_failure_verdict.v1",
            "source_sha": source_sha, "status": "DIAGNOSTIC_ONLY", **result}

def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--root", required=True)
    p.add_argument("--source-sha", required=True)
    p.add_argument("--output", required=True)
    args = p.parse_args()
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        obj = report(Path(args.root), args.source_sha)
    except (OSError, UnicodeError, ValueError):
        obj = {"schema": "mlv.granada.android16.host_failure_verdict.v1",
               "source_sha": args.source_sha if SHA.fullmatch(args.source_sha) else None,
               "status": "INSUFFICIENT_EVIDENCE",
               "classification": "host_diagnosis_unavailable",
               "canonical_persistence_verified": False,
               "physical_galaxy_verified": False}
    out.write_text(json.dumps(obj, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    # Only categories and counters; never raw host/proc contents.
    print("GRANADA_HOST_VERDICT " + json.dumps({
        k: obj[k] for k in ("status", "classification")
        if k in obj} | {"failure_phase": obj.get("failure_phase"),
                       "failed_operation": obj.get("failed_operation"),
                       "failed_sample": obj.get("failed_sample"),
                       "host_oom_kill_delta": obj.get("host_oom_kill_delta")}, sort_keys=True))

if __name__ == "__main__":
    main()
