#!/usr/bin/env python3
"""GRANADA — consent-only, OFFLINE legacy backup to safe portable snapshot.

A *new* file is created only when --output is explicitly supplied. The
original is NEVER modified, and any existing destination is NEVER replaced.
No user content/paths/tokens/names/IDs are printed. No network is used.
The allowed shareable storage keys are derived from the exact canonical app
source; do not maintain a divergent Python allowlist.

This is not an account merge or a guarantee a physical Galaxy will restore it.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import sys
import tempfile
from typing import Any

from granada_backup_preflight import MAX_BYTES, STORAGE_STATE_KEY, inspect, read_snapshot

SHARED_PATTERN = re.compile(
    r"const MLV_SHARED_STORAGE_KEYS=new Set\((\[[^\]]+\])\);", re.DOTALL)
PRIVATE_ERROR = "private_storage_key_in_backup"
ACCEPTED_PREFIX = frozenset({"state", "runtimeState", "localStorage", "missions"})
SAFE_COPY_META = ("app", "version")
SIZE_LIMIT = MAX_BYTES


class ConversionError(Exception):
    """An intentionally context-free, redacted stable error code."""


def source_allowlist(repo_root: Path) -> frozenset[str]:
    path = repo_root / "src/MichelsLife/frontend/index.html"
    try:
        source = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise ConversionError("missing_shared_storage_contract") from exc
    matches = SHARED_PATTERN.findall(source)
    if len(matches) != 1:
        raise ConversionError("missing_shared_storage_contract")
    try:
        raw = json.loads(matches[0])
    except (ValueError, TypeError) as exc:
        raise ConversionError("invalid_shared_storage_contract") from exc
    if not isinstance(raw, list) or len(raw) != len(set(raw)) or not all(
        isinstance(v, str) and v for v in raw
    ) or STORAGE_STATE_KEY not in raw:
        raise ConversionError("invalid_shared_storage_contract")
    if any(s in v.lower() for v in raw for s in (
        "supabase", "token", "auth", "session", "device", "secret",
        "credential", "password", "notification", "permission",
    )):
        raise ConversionError("unsafe_shared_storage_contract")
    return frozenset(raw)


def snapshot_to_safe(snapshot: Any, allowed: frozenset[str]) -> tuple[dict, dict]:
    if not isinstance(snapshot, dict):
        raise ConversionError("invalid_backup_root")

    raw_local = snapshot.get("localStorage", {})
    if not isinstance(raw_local, dict):
        raise ConversionError("invalid_local_storage")
    if not all(isinstance(key, str) for key in raw_local):
        raise ConversionError("invalid_local_storage")

    # An unknown source format or untrusted extra root keys must never be
    # passed through as arbitrary future provider/session metadata.
    if not any(k in snapshot for k in ACCEPTED_PREFIX):
        raise ConversionError("unsupported_backup_format")

    safe_local = {
        key: value for key, value in raw_local.items()
        if key in allowed and isinstance(value, str)
    }
    excluded = len(raw_local) - len(safe_local)

    primary = snapshot.get("state", snapshot.get("runtimeState"))
    if primary is None and isinstance(snapshot.get("missions"), list):
        primary = snapshot
    embedded = None
    if STORAGE_STATE_KEY in raw_local:
        raw = raw_local[STORAGE_STATE_KEY]
        if not isinstance(raw, str):
            raise ConversionError("invalid_embedded_state")
        try:
            embedded = json.loads(raw)
        except (ValueError, TypeError) as exc:
            raise ConversionError("invalid_embedded_state") from exc

    if primary is not None and (not isinstance(primary, dict) or not primary):
        raise ConversionError("invalid_primary_state")
    if embedded is not None and (not isinstance(embedded, dict) or not embedded):
        raise ConversionError("invalid_embedded_state")
    if primary is None:
        primary = embedded
    if not isinstance(primary, dict) or not primary:
        raise ConversionError("missing_restorable_progress")

    # Never choose between disagreeing state copies silently. A mismatched
    # embedded board can be evidence of partial/cross-device corruption.
    if embedded is not None and embedded != primary:
        raise ConversionError("conflicting_progress_copies")

    # Fail closed on nested tokens, duplicate IDs, non-finite/invalid XP and
    # unknown shape. Legacy credentials in storage keys alone are repairable.
    final_inspection = inspect({"state": primary, "localStorage": {
        k: v for k, v in safe_local.items() if k != STORAGE_STATE_KEY
    }})
    if final_inspection["status"] != "pass":
        raise ConversionError("unverified_progress_integrity")

    # Re-serialize the canonical board to ensure there cannot be stale/unsafe
    # serialized progress hidden in a second localStorage copy.
    safe_local[STORAGE_STATE_KEY] = json.dumps(
        primary, ensure_ascii=False, allow_nan=False, separators=(",", ":")
    )
    result = {
        "app": "Michel's Life",
        "type": "portable",
        "cloudPayloadVersion": 2,
        "state": primary,
        "localStorage": safe_local,
    }
    # The app allows only a few non-secret version hints. Never preserve any
    # other top-level fields, auth structures, source metadata or paths.
    if isinstance(snapshot.get("version"), (str, int)) and not isinstance(
        snapshot["version"], bool
    ):
        result["version"] = snapshot["version"]

    # Check exact candidate again, including duplicated storage state.
    proof = inspect(result)
    if proof["status"] != "pass":
        raise ConversionError("output_integrity_failed")
    # Output from this function contains no user content or real identifiers.
    report = {
        "schema": "mlv.granada.safe-backup-conversion.v1",
        "status": "safe_candidate",
        "storage_entries_excluded": excluded,
        "storage_entries_preserved": len(safe_local),
        "mission_count": proof["counts"].get("missions", 0),
        "project_count": proof["counts"].get("projects", 0),
        "xp": proof["xp"],
        "original_unchanged": True,
        "unknown_fields_discarded": True,
        "auto_restore": False,
        "real_provider_or_galaxy_verified": False,
        "credentials_imported": False,
    }
    return result, report


def atomic_new_file(destination: Path, payload: bytes) -> None:
    if not destination.parent.is_dir():
        raise ConversionError("output_parent_unavailable")
    if destination.exists() or destination.is_symlink():
        raise ConversionError("output_already_exists")
    if len(payload) > SIZE_LIMIT:
        raise ConversionError("output_too_large")
    temp_path = None
    try:
        # Create with owner-only permissions and a separate temporary name.
        with tempfile.NamedTemporaryFile(
            mode="wb", dir=destination.parent, prefix=".mlv-safe-", delete=False
        ) as handle:
            temp_path = Path(handle.name)
            os.chmod(temp_path, 0o600)
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        # Atomic create-only link: does not follow/replace an existing output,
        # even if another process raced to create it or it is a symlink.
        os.link(temp_path, destination)
    except FileExistsError as exc:
        raise ConversionError("output_already_exists") from exc
    except OSError as exc:
        raise ConversionError("cannot_save_safe_backup") from exc
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


def convert(source: Path, output: Path | None, repo_root: Path) -> dict:
    try:
        original = read_snapshot(str(source))
    except (OSError, ValueError, RecursionError) as exc:
        raise ConversionError("invalid_input_backup") from exc
    allowed = source_allowlist(repo_root)
    safe, report = snapshot_to_safe(original, allowed)
    if output is not None:
        try:
            if output.resolve() == source.resolve() or (
                output.exists() and os.path.samefile(output, source)
            ):
                raise ConversionError("cannot_overwrite_original")
        except OSError as exc:
            raise ConversionError("invalid_output_path") from exc
        payload = (json.dumps(safe, ensure_ascii=False, allow_nan=False,
                              separators=(",", ":")) + "\n").encode("utf-8")
        atomic_new_file(output, payload)
        report["status"] = "safe_file_created"
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", help="Existing legacy .michelslife / JSON backup")
    parser.add_argument("--output", help="New safe backup path; NEVER overwritten")
    parser.add_argument("--inspect-only", action="store_true",
                        help="Validate a safe candidate without writing any file")
    opts = parser.parse_args(argv)
    if bool(opts.output) == bool(opts.inspect_only):
        parser.error("Choose exactly one of --output or --inspect-only")
    repo_root = Path(__file__).resolve().parents[1]
    try:
        result = convert(Path(opts.source),
                         Path(opts.output) if opts.output else None, repo_root)
        code = 0
    except (ConversionError, TypeError, OverflowError, RecursionError) as exc:
        result = {
            "schema": "mlv.granada.safe-backup-conversion.v1",
            "status": "blocked",
            "reason": str(exc) if isinstance(exc, ConversionError) else
            "invalid_backup_structure",
            "original_unchanged": True,
            "auto_restore": False,
            "real_provider_or_galaxy_verified": False,
        }
        code = 2
    print(json.dumps(result, sort_keys=True, ensure_ascii=False))
    return code


if __name__ == "__main__":
    sys.exit(main())
