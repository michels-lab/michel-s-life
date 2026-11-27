#!/usr/bin/env python3
"""Fail-closed and privacy-safe same-APK native Android16 RAM/GPU three-arm summary.

A native PASS requires SUCCESS of its real emulator job and complete
PNG-CRC/size plus 3 canonical post-relaunch comparisons. Single-arm success
is NOT evidence that RAM or the graphics backend was the root cause. Never reads raw mission or account
state files; outputs only whitelisted machine-readable result codes/counts.
"""
from __future__ import annotations
import argparse
import json
import re
from pathlib import Path
import sys
from android_emulator_evidence_manifest import png_shape

FRAMES = (
    "step0.png", "step0-after-30s.png", "step0-after-55s.png",
    "step2-after-native-continue.png",
    "step3-after-native-continue.png", "step4-after-native-finish.png",
    "step4-after-native-finish-30s.png",
    "step5-after-relaunch.png", "step5-after-relaunch-30s.png",
    "step5-after-relaunch-60s.png",
)
COMPARISONS = (
    "native-canonical-persistence-comparison.json",
    "native-canonical-second-relaunch-comparison.json",
    "native-canonical-consecutive-relaunch-comparison.json",
)
# Mirror the current native probe, including XP and completion identity.
CHECK_FIELDS = {
    "mission_ids_identical": "missionIdsDigest",
    "collections_identical": "collections",
    "dashboard_kpis_identical": "dashboardKpisDigest",
    "mission_counts_identical": "missionCount",
    "mission_completion_counts_identical": "missionCompletionCount",
    "mission_completion_ids_and_values_identical": "missionCompletionsDigest",
    "xp_total_identical": "totalXpDigest",
}
CHECKS = frozenset(CHECK_FIELDS) | {"onboarding_completed_both"}
SNAPSHOT_KEYS = frozenset(CHECK_FIELDS.values()) | {
    "onboardingComplete", "genericProfile", "dashboardKpiCount",
}

def valid_digest(value):
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{64}", value) is not None

def valid_count(value, minimum=0):
    return type(value) is int and minimum <= value

def valid_snapshot(value):
    if not isinstance(value, dict) or set(value) != SNAPSHOT_KEYS:
        return False
    if value["onboardingComplete"] is not True or value["genericProfile"] is not True:
        return False
    if not all(valid_digest(value[key]) for key in
               ("missionIdsDigest", "dashboardKpisDigest", "missionCompletionsDigest", "totalXpDigest")):
        return False
    if not (valid_count(value["missionCount"], 1) and
            valid_count(value["missionCompletionCount"]) and valid_count(value["dashboardKpiCount"], 2)):
        return False
    collections = value["collections"]
    if not isinstance(collections, dict) or not {"missions", "goals"} <= set(collections):
        return False
    for row in collections.values():
        if not isinstance(row, dict) or set(row) != {"count", "idsDigest"}:
            return False
        if not valid_count(row["count"]) or not valid_digest(row["idsDigest"]):
            return False
    return (collections["goals"]["count"] == 0 and
            collections["missions"]["count"] == value["missionCount"] and
            collections["missions"]["idsDigest"] == value["missionIdsDigest"])

def verified_pair(report):
    if not isinstance(report, dict) or set(report) != {"pass", "checks", "before", "after", "scope"}:
        return None
    checks = report["checks"]
    first, second = report["before"], report["after"]
    if report["pass"] is not True or not isinstance(checks, dict) or set(checks) != CHECKS:
        return None
    if not all(v is True for v in checks.values()) or not valid_snapshot(first) or not valid_snapshot(second):
        return None
    if any(first[field] != second[field] for field in CHECK_FIELDS.values()):
        return None
    return first, second

HOST_CODES = frozenset((
    "host_cgroup_oom_kill_observed", "emulator_process_disappeared",
    "no_emulator_process_seen", "emulator_process_seen_at_end",
    "no_host_samples", "unavailable",
))
STATUS = frozenset(("success", "failure", "cancelled", "skipped"))


def arm_report(path: Path, name: str, ci_status: str) -> dict:
    if ci_status not in STATUS:
        raise ValueError("invalid_ci_job_status")
    missing_frames = []
    dimensions = set()
    for filename in FRAMES:
        frame = path / filename
        try:
            if not frame.is_file() or frame.stat().st_size < 30000:
                raise ValueError("missing_or_tiny")
            dimensions.add(png_shape(frame))  # Whole file CRC and dimensions.
        except (OSError, ValueError):
            missing_frames.append(filename)
    pairs = []
    for filename in COMPARISONS:
        try:
            report_file = path / filename
            if report_file.stat().st_size > 1024 * 1024:
                continue
            pair = verified_pair(json.loads(report_file.read_text()))
            if pair is not None:
                pairs.append(pair)
        except (OSError, ValueError, AttributeError, TypeError):
            pass
    comparisons = len(pairs)
    coherent = False
    if comparisons == len(COMPARISONS):
        first, second, consecutive = pairs
        coherent = (first[0] == second[0] and first[1] == consecutive[0] and
                    second[1] == consecutive[1])
    geometry_matches = len(dimensions) == 1
    host_class = "unavailable"
    try:
        host = json.loads((path / "host-watch.json").read_text())
        candidate = host.get("result", {}).get("classification")
        if candidate in HOST_CODES:
            host_class = candidate
    except (OSError, ValueError, AttributeError, TypeError):
        pass
    accepted = (ci_status == "success" and not missing_frames and
                geometry_matches and coherent)
    return {
        "arm": name,
        "ci_job_status": ci_status,
        "native_gate_accepted": accepted,
        "real_png_count": len(FRAMES) - len(missing_frames),
        "required_real_png_count": len(FRAMES),
        "canonical_comparisons_passed": comparisons,
        "required_canonical_comparisons": len(COMPARISONS),
        "canonical_comparisons_coherent": coherent,
        "native_dimensions_consistent": geometry_matches,
        "host_vm_classification": host_class,
        "failure_codes": (["native_job_not_success"] if ci_status != "success" else []) +
            (["missing_or_invalid_native_png"] if missing_frames else []) +
            (["native_state_comparison_incomplete"] if comparisons != len(COMPARISONS) else []) +
            (["native_state_comparisons_contradictory"] if comparisons == len(COMPARISONS) and not coherent else []) +
            (["native_frame_dimensions_inconsistent"] if not missing_frames and not geometry_matches else []),
        "galaxy_tested": False,
    }


def summarize(base: Path, default_job: str, ram3_job: str, source_sha: str,
              software_job: str = "failure") -> dict:
    default = arm_report(base / "granada-native-candidate-default", "default", default_job)
    memory = arm_report(base / "granada-native-candidate-3gib", "3gib", ram3_job)
    software = arm_report(base / "granada-native-candidate-3gib-software",
                          "3gib-software", software_job)
    both_pass = default["native_gate_accepted"] and memory["native_gate_accepted"]
    all_pass = both_pass and software["native_gate_accepted"]
    return {
        "schema": "mlv.granada.single-apk-native-ram-gpu-matrix-report.v2",
        "source_checkout_sha": source_sha,
        "both_native_gates_pass": both_pass,
        "all_three_native_gates_pass": all_pass,
        "graphics_backend_causality_proven": False,
        "guest_ram_causality_proven": False,
        "same_apk_provenance_verified_in_each_arm": "by_each_job_before_emulator",
        "signed_public_release": False,
        "physical_galaxy_verified": False,
        "arms": [default, memory, software],
        "interpretation": (
            "all_three_native_gates_pass" if all_pass else
            "swiftshader_both_pass_software_unverified" if both_pass else
            "3gib_software_only_not_causal_proof" if software["native_gate_accepted"]
                 and not memory["native_gate_accepted"] else
            "3gib_software_and_swiftshader_pass_default_unverified" if
                 software["native_gate_accepted"] and memory["native_gate_accepted"] else
            "3gib_pass_only_not_causal_proof" if memory["native_gate_accepted"] else
            "default_pass_only" if default["native_gate_accepted"] else
            "all_three_native_gates_unverified"
        ),
    }


def main(argv=None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--root", required=True)
    p.add_argument("--default-job", required=True)
    p.add_argument("--three-gib-job", required=True)
    p.add_argument("--three-gib-software-job", required=True)
    p.add_argument("--sha", required=True)
    p.add_argument("--output", required=True)
    a = p.parse_args(argv)
    result = summarize(Path(a.root), a.default_job, a.three_gib_job, a.sha,
                       a.three_gib_software_job)
    out = Path(a.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2) + "\n")
    print("GRANADA_SAME_APK_NATIVE_RAM_AB " + json.dumps({
        "all_three_native_gates_pass": result["all_three_native_gates_pass"],
        "interpretation": result["interpretation"],
        "arms": [{"arm": x["arm"], "pass": x["native_gate_accepted"],
                  "host": x["host_vm_classification"]}
                 for x in result["arms"]],
    }, sort_keys=True))
    return 0 if result["all_three_native_gates_pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
