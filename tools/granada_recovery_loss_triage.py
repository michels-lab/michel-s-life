#!/usr/bin/env python3
"""GRANADA: privacy-safe, OFFLINE loss triage between two Michel's Life backups.

Never restores or merges, guesses account ownership, contacts providers, edits
inputs, prints IDs, account text, Journal contents or file paths.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import sys
from typing import Any

from granada_backup_preflight import inspect, read_snapshot, STORAGE_STATE_KEY
from granada_safe_backup_converter import (
    ConversionError, atomic_new_file, parse_embedded_state,
    rejects_sensitive_state_keys, source_allowlist,
)

COLLECTIONS = ("missions", "premiumContracts", "contracts", "projects", "chapters", "goals")


class TriageError(Exception):
    """Fixed, privacy-safe diagnostic code."""


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(",", ":"), allow_nan=False)


def fingerprint(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def canonical_state(snapshot: Any, allowlist: frozenset[str]) -> tuple[dict, dict]:
    if not isinstance(snapshot, dict):
        raise TriageError("unsupported_backup")
    # A structured backup may carry unknown top-level credential/device data.
    # Inspect only recognized envelope shapes; old formats should be sanitized
    # by the separate opt-in safe converter before forensic comparison.
    if "state" in snapshot or "runtimeState" in snapshot:
        permitted = {"app", "type", "cloudPayloadVersion", "state",
                     "runtimeState", "localStorage", "version"}
        if set(snapshot) - permitted:
            raise TriageError("unverified_envelope_fields")
    local = snapshot.get("localStorage", {})
    if not isinstance(local, dict) or any(not isinstance(key, str) for key in local):
        raise TriageError("invalid_local_storage")
    for key in local:
        if key not in allowlist:
            raise TriageError("unverified_storage_field")

    possible = [snapshot[k] for k in ("state", "runtimeState") if k in snapshot]
    if not possible and isinstance(snapshot.get("missions"), list):
        possible = [snapshot]
    if STORAGE_STATE_KEY in local:
        if not isinstance(local[STORAGE_STATE_KEY], str):
            raise TriageError("invalid_embedded_progress")
        try:
            possible.append(parse_embedded_state(local[STORAGE_STATE_KEY]))
        except (ConversionError, TypeError, ValueError, RecursionError) as exc:
            raise TriageError("invalid_embedded_progress") from exc

    if not possible or any(not isinstance(s, dict) for s in possible):
        raise TriageError("missing_canonical_state")
    if any(s != possible[0] for s in possible[1:]):
        raise TriageError("divergent_state_copies")
    state = possible[0]
    if not isinstance(state.get("missions"), list):
        raise TriageError("missing_mission_ledger")
    try:
        if rejects_sensitive_state_keys(state):
            raise TriageError("private_fields_in_progress")
        # Reuse actual product preflight, but never print its state digests.
        check = inspect({"state": state, "localStorage": local})
        if check["status"] != "pass":
            raise TriageError("unverified_backup_integrity")
        canonical_json(state)
    except (OverflowError, RecursionError, TypeError, ValueError) as exc:
        raise TriageError("unverified_backup_integrity") from exc
    return state, local


def keyed(rows: Any, section: str) -> dict[str, dict]:
    if rows is None:
        return {}
    if not isinstance(rows, list) or len(rows) > 100000:
        raise TriageError("invalid_collection")
    found: dict[str, dict] = {}
    for item in rows:
        if not isinstance(item, dict) or isinstance(item.get("id"), bool):
            raise TriageError("ambiguous_identity")
        value = item.get("id")
        if not isinstance(value, (str, int)) or not str(value).strip():
            raise TriageError("ambiguous_identity")
        identifier = str(value)
        if identifier in found:
            raise TriageError("duplicate_identity")
        found[identifier] = item
    return found


def completion_events(mission: dict) -> Counter[str]:
    events = mission.get("completions", [])
    if not isinstance(events, list) or len(events) > 100000:
        raise TriageError("unverified_completion_format")
    return Counter(canonical_json(event) for event in events)


def evaluate(old: Any, new: Any, allowlist: frozenset[str]) -> dict:
    before, old_local = canonical_state(old, allowlist)
    after, new_local = canonical_state(new, allowlist)
    collections: dict[str, dict[str, int]] = {}
    danger: list[str] = []
    changed: list[str] = []

    for name in COLLECTIONS:
        a = keyed(before.get(name, []), name)
        b = keyed(after.get(name, []), name)
        deleted = set(a) - set(b)
        created = set(b) - set(a)
        retained = set(a) & set(b)
        modified = sum(fingerprint(a[k]) != fingerprint(b[k]) for k in retained)
        collections[name] = {
            "before": len(a), "after": len(b), "removed": len(deleted),
            "added": len(created), "modified_retained": modified,
        }
        if deleted:
            danger.append("mission_identity_removed" if name == "missions"
                          else "collection_identity_removed")
        if deleted or created or modified:
            changed.append("collection_change")

    a_missions = keyed(before["missions"], "missions")
    b_missions = keyed(after["missions"], "missions")
    # Newly added as well as retained missions must have auditable history.
    # Otherwise an invalid completion payload can slip past the comparison.
    for mission in list(a_missions.values()) + list(b_missions.values()):
        completion_events(mission)
    common = set(a_missions) & set(b_missions)
    completion_removed = completion_added = 0
    for identifier in common:
        a, b = completion_events(a_missions[identifier]), completion_events(b_missions[identifier])
        completion_removed += sum((a - b).values())
        completion_added += sum((b - a).values())
    removed_mission_events = sum(sum(completion_events(a_missions[k]).values())
                                 for k in (set(a_missions) - set(b_missions)))
    if completion_removed or removed_mission_events:
        danger.append("completion_history_removed")
    if completion_removed or completion_added or removed_mission_events:
        changed.append("completion_change")

    old_xp, new_xp = before.get("xp", 0), after.get("xp", 0)
    if type(old_xp) not in (int, float) or type(new_xp) not in (int, float):
        raise TriageError("unverified_xp")
    if new_xp < old_xp:
        danger.append("xp_decreased")
    if old_xp != new_xp:
        changed.append("xp_changed")

    a_history, b_history = before.get("history", []), after.get("history", [])
    if not isinstance(a_history, list) or not isinstance(b_history, list):
        raise TriageError("unverified_history")
    if len(b_history) < len(a_history):
        danger.append("history_count_decreased")
    if fingerprint(a_history) != fingerprint(b_history):
        changed.append("history_changed")

    journal_keys = {key for key in old_local.keys() | new_local.keys()
                    if key.startswith("michelsLife.journal.") and key in allowlist}
    journal_missing = sum(key in old_local and key not in new_local
                          for key in journal_keys)
    journal_modified = sum(
        key in old_local and key in new_local and old_local[key] != new_local[key]
        for key in journal_keys
    )
    journal_cleared = sum(
        key in old_local and key in new_local and bool(old_local[key])
        and not bool(new_local[key]) for key in journal_keys
    )
    if journal_missing:
        danger.append("journal_storage_removed")
    if journal_cleared:
        danger.append("journal_storage_cleared")
    if journal_missing or journal_modified or any(
        key not in old_local and key in new_local for key in journal_keys
    ):
        changed.append("journal_changed")

    all_changed = fingerprint(before) != fingerprint(after) or any(
        old_local.get(k) != new_local.get(k)
        for k in (old_local.keys() | new_local.keys()) & allowlist
    )
    if all_changed and not changed:
        changed.append("other_board_or_settings_change")
    return {
        "schema": "mlv.granada.recovery-triage.v1",
        "status": "review" if all_changed else "unchanged",
        "changes": sorted(set(changed)),
        "risk_signals": sorted(set(danger)),
        "collections": collections,
        "completion_events": {
            "removed_from_retained_missions": completion_removed,
            "added_to_retained_missions": completion_added,
            "in_removed_missions": removed_mission_events,
        },
        "xp": {"before": old_xp, "after": new_xp},
        "history_count": {"before": len(a_history), "after": len(b_history)},
        "journal_storage": {
            "removed_keys": journal_missing,
            "modified_keys": journal_modified,
            "cleared_keys": journal_cleared,
        },
        "originals_unchanged": True,
        "automatic_merge_or_restore": False,
        "account_owner_verified": False,
        "real_provider_or_galaxy_verified": False,
        "interpretation": "Signals may be intentional edits or undo, not proven data loss.",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("before", help="Earlier local .michelslife/JSON backup")
    parser.add_argument("after", help="Later local .michelslife/JSON backup")
    parser.add_argument("--report", help="Create new redacted report file; never overwrite")
    parser.add_argument("--fail-on-risk", action="store_true",
                        help="Return exit code 3 if potential loss signals exist")
    opts = parser.parse_args(argv)
    try:
        allowed = source_allowlist(Path(__file__).resolve().parents[1])
        result = evaluate(read_snapshot(opts.before), read_snapshot(opts.after), allowed)
        code = 3 if opts.fail_on_risk and result["risk_signals"] else 0
        if opts.report:
            content = (canonical_json(result) + "\n").encode("utf-8")
            atomic_new_file(Path(opts.report), content)
    except (TriageError, ConversionError, OSError, ValueError, TypeError,
            RecursionError, OverflowError) as exc:
        code = 2
        reason = str(exc) if isinstance(exc, TriageError) else "unverifiable_input_or_output"
        result = {
            "schema": "mlv.granada.recovery-triage.v1",
            "status": "blocked", "reason": reason,
            "originals_unchanged": True, "automatic_merge_or_restore": False,
            "account_owner_verified": False, "real_provider_or_galaxy_verified": False,
        }
    print(canonical_json(result))
    return code


if __name__ == "__main__":
    sys.exit(main())
