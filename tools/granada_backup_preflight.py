#!/usr/bin/env python3
"""Read-only preflight for Michel's Life .michelslife / cloud JSON snapshots.

No network, credentials, repair, import, or mutation. Human content and raw IDs are
never printed; only counts, health codes, and salted-in-process-free digests.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path
from typing import Any

MAX_BYTES = 25 * 1024 * 1024
COLLECTIONS = ('missions', 'premiumContracts', 'contracts', 'projects', 'chapters', 'goals')
STORAGE_STATE_KEY = 'vida_rpg_personal_progress_v2'
PRIVATE_STORAGE_WORDS = ('supabase.', 'google.auth', 'oauth', 'access_token',
                         'refresh_token', 'session', 'device', 'notification',
                         'credential', 'secret', 'password', 'cookie')
PRIVATE_JSON_WORDS = ('access_token', 'refresh_token', 'id_token',
                      'client_secret', 'private_key', 'password', 'authorization')


def digest(value: Any) -> str:
    blob = json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':'), allow_nan=False).encode('utf-8')
    return hashlib.sha256(blob).hexdigest()[:16]


def read_snapshot(path: str) -> Any:
    source = Path(path)
    if not source.is_file():
        raise ValueError('not_a_file')
    if source.stat().st_size > MAX_BYTES:
        raise ValueError('snapshot_too_large')
    try:
        with source.open('rb') as handle:
            raw = handle.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise ValueError('snapshot_too_large')
        def unique_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
            out = {}
            for key, value in pairs:
                if key in out:
                    raise ValueError('duplicate_json_key')
                out[key] = value
            return out
        return json.loads(raw.decode('utf-8-sig'),
                          object_pairs_hook=unique_keys,
                          parse_constant=lambda _: (_ for _ in ()).throw(ValueError('nonfinite_json_number')))
    except UnicodeError as exc:
        raise ValueError('invalid_utf8') from exc
    except json.JSONDecodeError as exc:
        raise ValueError('invalid_json') from exc


def inspect(snapshot: Any) -> dict[str, Any]:
    findings: list[dict[str, str]] = []
    def note(severity: str, code: str, section: str) -> None:
        findings.append({'severity': severity, 'code': code, 'section': section})

    if not isinstance(snapshot, dict):
        return {'status': 'blocked', 'counts': {}, 'findings': [
            {'severity': 'error', 'code': 'root_not_object', 'section': 'root'}]}

    local = snapshot.get('localStorage', {})
    if not isinstance(local, dict):
        note('error', 'localstorage_not_object', 'localStorage')
        local = {}

    state = snapshot.get('state')
    if state is None and isinstance(snapshot.get('missions'), list):
        state = snapshot  # explicitly allows canonical state-only exports
    stored_state = None
    if STORAGE_STATE_KEY in local:
        raw = local[STORAGE_STATE_KEY]
        if not isinstance(raw, str):
            note('error', 'stored_state_not_json_text', 'localStorage')
        else:
            try:
                stored_state = json.loads(raw)
            except (ValueError, TypeError):
                note('error', 'stored_state_invalid_json', 'localStorage')
    if state is None:
        state = stored_state
    if not isinstance(state, dict):
        note('error', 'missing_canonical_state', 'state')
        state = {}

    for key in local:
        if not isinstance(key, str):
            note('error', 'storage_key_not_string', 'localStorage')
        elif any(part in key.lower() for part in PRIVATE_STORAGE_WORDS):
            note('error', 'private_storage_key_in_backup', 'localStorage')
            # Avoid exposing the actual key, which might be user-generated.

    def scan_secrets(node: Any, section: str = 'state', depth: int = 0) -> None:
        if depth > 35:
            note('error', 'excessive_nesting', section)
            return
        if isinstance(node, dict):
            for key, value in node.items():
                if any(secret in str(key).lower() for secret in PRIVATE_JSON_WORDS):
                    note('error', 'credential_field_in_state', section)
                if isinstance(value, (dict, list)):
                    scan_secrets(value, section, depth + 1)
        elif isinstance(node, list):
            for item in node:
                if isinstance(item, (dict, list)):
                    scan_secrets(item, section, depth + 1)
    scan_secrets(state)
    if isinstance(stored_state, dict) and stored_state is not state:
        scan_secrets(stored_state, 'localStorage')

    counts: dict[str, int] = {}
    fingerprints: dict[str, str] = {}
    for name in COLLECTIONS:
        values = state.get(name)
        if values is None:
            continue
        if not isinstance(values, list):
            note('error', 'collection_not_array', name)
            continue
        counts[name] = len(values)
        seen: set[str] = set()
        identifiers: list[str] = []
        for item in values:
            if not isinstance(item, dict):
                note('error', 'item_not_object', name)
                continue
            raw_id = item.get('id')
            if not isinstance(raw_id, (str, int)) or not str(raw_id).strip():
                note('warning', 'missing_item_id', name)
                continue
            normalized = str(raw_id)
            if normalized in seen:
                note('error', 'duplicate_item_id', name)
            seen.add(normalized)
            identifiers.append(normalized)
        fingerprints[name] = digest(sorted(identifiers))

    xp = state.get('xp')
    if xp is not None and (isinstance(xp, bool) or not isinstance(xp, (float, int))
                           or not math.isfinite(xp) or xp < 0):
        note('error', 'invalid_xp', 'state')
    if isinstance(stored_state, dict) and stored_state is not state:
        for field in ('missions', 'premiumContracts', 'projects', 'chapters', 'xp'):
            if field in state and field in stored_state and digest(state[field]) != digest(stored_state[field]):
                note('warning', 'embedded_state_divergence', field)

    if not any(k in snapshot for k in ('state', 'localStorage')) and not isinstance(snapshot.get('missions'), list):
        note('error', 'unrecognized_backup_envelope', 'root')
    severities = {f['severity'] for f in findings}
    return {
        'status': 'blocked' if 'error' in severities else ('review' if findings else 'pass'),
        'counts': counts,
        'state_fingerprint': digest(state),
        'identity_fingerprints': fingerprints,
        'xp': xp if isinstance(xp, (int, float)) and not isinstance(xp, bool) and math.isfinite(xp) else None,
        'findings': sorted(findings, key=lambda f: (f['severity'], f['code'], f['section'])),
    }


def compare(left: dict[str, Any], right: dict[str, Any]) -> dict[str, Any]:
    keys = sorted(set(left['counts']) | set(right['counts']))
    # Counts and change flags only. Raw identifiers, private body text and
    # unhashed Journal entries never appear in CLI output.
    return {
        'changed': left.get('state_fingerprint') != right.get('state_fingerprint'),
        'collections': {
            key: {'before': left['counts'].get(key, 0), 'after': right['counts'].get(key, 0),
                  'identities_changed': left['identity_fingerprints'].get(key) != right['identity_fingerprints'].get(key)}
            for key in keys},
        'xp_before': left['xp'], 'xp_after': right['xp'],
        'left_status': left['status'], 'right_status': right['status'],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot', help='Local JSON backup to inspect; never modified')
    parser.add_argument('--compare', metavar='OTHER_JSON', help='Compare a second backup safely')
    parser.add_argument('--json', action='store_true', help='Machine-readable redacted report')
    parser.add_argument('--strict', action='store_true', help='Treat review warnings as blocking')
    args = parser.parse_args(argv)
    try:
        report = inspect(read_snapshot(args.snapshot))
        result: dict[str, Any] = {'preflight': report}
        if args.compare:
            second = inspect(read_snapshot(args.compare))
            result['compared_preflight'] = second
            result['delta'] = compare(report, second)
        blocked = any(r['status'] == 'blocked' or
                      (args.strict and r['status'] == 'review')
                      for r in [report] + ([second] if args.compare else []))
    except (OSError, ValueError, RecursionError) as exc:
        # Never report exception details containing file paths or snapshot data.
        result = {'preflight': {'status': 'blocked', 'findings': [
            {'severity': 'error', 'code': str(exc) if isinstance(exc, ValueError) and str(exc) in {
                'not_a_file', 'snapshot_too_large', 'duplicate_json_key', 'nonfinite_json_number',
                'invalid_utf8', 'invalid_json'} else 'unreadable_snapshot', 'section': 'input'}]}}
        blocked = True
    if args.json:
        print(json.dumps(result, sort_keys=True, ensure_ascii=False))
    else:
        print(json.dumps(result, sort_keys=True, indent=2, ensure_ascii=False))
    return 2 if blocked else 0


if __name__ == '__main__':
    sys.exit(main())
