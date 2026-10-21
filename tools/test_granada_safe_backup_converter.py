"""Synthetic-only true file I/O tests for GRANADA safe legacy backup conversion."""
from __future__ import annotations

import contextlib
import io
import json
import os
from pathlib import Path
import stat
import tempfile
import unittest

from granada_safe_backup_converter import (
    ConversionError, atomic_new_file, convert, main, source_allowlist,
    snapshot_to_safe,
)
from granada_backup_preflight import inspect, read_snapshot

ROOT = Path(__file__).resolve().parents[1]


class SafeBackupConversionTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.folder = Path(self.directory.name)
        self.state = {
            "xp": 123,
            "missions": [
                {"id": "private-mission-1", "name": "SECRET mission title",
                 "xp": 20, "completions": ["2026-10-19"]},
            ],
            "projects": [{"id": "project-1", "name": "PRIVATE project"}],
            "goals": [{"id": "goal-1", "name": "User goal"}],
        }
        self.safe = {
            "michelsLife.journal.v30184": "VERY PRIVATE JOURNAL",
            "michelsLife.theme.v342": "my-theme",
        }
        self.foreign = {
            "michelsLife.supabase.session.v30216": "DO_NOT_SHARE_ACCESS_TOKEN",
            "michelsLife.supabase.meta.v30216": "FOREIGN_REVISION",
            "michelsLife.supabase.device.v30216": "FOREIGN_DEVICE",
            "michelsLife.google.auth": "GOOGLE_CREDENTIAL",
            "michelsLife.local.notification.id": "OLD_DEVICE_ALARM",
            "myUnknownKey": "UNKNOWN_PRIVATE_PROFILE",
        }

    def write_input(self, payload):
        f = self.folder / "input.michelslife"
        f.write_text(json.dumps(payload, ensure_ascii=False))
        return f

    def legacy(self):
        return {"state": self.state, "localStorage": {
            **self.safe, **self.foreign,
            "vida_rpg_personal_progress_v2": json.dumps(self.state),
        }, "authorization": "SHOULD_BE_DISCARDED",
            "sourceDeviceId": "ANOTHER_DEVICE"}

    def test_canonical_source_policy_excludes_all_auth_and_device_keys(self):
        allow = source_allowlist(ROOT)
        self.assertIn("vida_rpg_personal_progress_v2", allow)
        self.assertIn("michelsLife.journal.v30184", allow)
        self.assertIn("michelsLife.theme.v342", allow)
        self.assertFalse(any("supabase" in x.lower() or "device" in x.lower()
                             for x in allow))
        self.assertGreater(len(allow), 15)

    def test_convert_legacy_to_actual_restorable_new_file(self):
        incoming = self.legacy()
        original = self.write_input(incoming)
        before = original.read_bytes()
        dest = self.folder / "converted.michelslife"
        result = convert(original, dest, ROOT)
        self.assertEqual(result["status"], "safe_file_created")
        self.assertEqual(result["mission_count"], 1)
        self.assertEqual(result["project_count"], 1)
        self.assertEqual(result["xp"], 123)
        self.assertEqual(original.read_bytes(), before)
        doc = read_snapshot(str(dest))
        self.assertEqual(inspect(doc)["status"], "pass")
        self.assertEqual(doc["localStorage"]["michelsLife.journal.v30184"],
                         "VERY PRIVATE JOURNAL")
        self.assertEqual(doc["localStorage"]["michelsLife.theme.v342"], "my-theme")
        self.assertEqual(doc["state"]["missions"][0]["name"], "SECRET mission title")
        self.assertEqual(json.loads(doc["localStorage"]["vida_rpg_personal_progress_v2"]),
                         doc["state"])
        for key, value in self.foreign.items():
            self.assertNotIn(key, doc["localStorage"])
            self.assertNotIn(value, dest.read_text())
        self.assertNotIn("SHOULD_BE_DISCARDED", dest.read_text())
        self.assertNotIn("ANOTHER_DEVICE", dest.read_text())
        self.assertTrue(bool(os.stat(dest).st_mode & stat.S_IRUSR))

    def test_stdout_report_has_no_journal_ids_tokens_or_paths(self):
        f = self.write_input(self.legacy())
        report = convert(f, None, ROOT)
        shown = json.dumps(report)
        for forbidden in ["SECRET", "PRIVATE", "DO_NOT_SHARE", "GOOGLE_CREDENTIAL",
                          "FOREIGN_DEVICE", str(self.folder), "private-mission-1"]:
            self.assertNotIn(forbidden, shown)
        self.assertTrue(report["original_unchanged"])
        self.assertFalse(report["auto_restore"])

    def test_never_overwrite_existing_output(self):
        src = self.write_input(self.legacy())
        out = self.folder / "safe.json"
        out.write_text("DO_NOT_OVERWRITE")
        with self.assertRaisesRegex(ConversionError, "output_already_exists"):
            convert(src, out, ROOT)
        self.assertEqual(out.read_text(), "DO_NOT_OVERWRITE")

    def test_never_overwrite_original_or_its_hardlink(self):
        src = self.write_input(self.legacy())
        with self.assertRaisesRegex(ConversionError, "cannot_overwrite_original"):
            convert(src, src, ROOT)
        hardlink = self.folder / "same-file-hardlink.json"
        os.link(src, hardlink)
        with self.assertRaisesRegex(ConversionError, "cannot_overwrite_original"):
            convert(src, hardlink, ROOT)
        self.assertEqual(json.loads(src.read_text())["state"], self.state)

    def test_refuses_output_symlink_and_no_new_file(self):
        src = self.write_input(self.legacy())
        victim = self.folder / "victim.txt"
        victim.write_text("DO_NOT_TOUCH")
        dest = self.folder / "alias"
        dest.symlink_to(victim)
        with self.assertRaises(ConversionError):
            convert(src, dest, ROOT)
        self.assertEqual(victim.read_text(), "DO_NOT_TOUCH")
        self.assertEqual(dest.resolve(), victim)

    def test_unavailable_output_directory_fails_without_modifying_original(self):
        src = self.write_input(self.legacy())
        before = src.read_bytes()
        with self.assertRaisesRegex(ConversionError, "output_parent_unavailable"):
            convert(src, self.folder / "not-a-dir" / "safe.json", ROOT)
        self.assertEqual(src.read_bytes(), before)

    def test_nested_credentials_in_board_fail_without_writing(self):
        src = self.write_input({"state": {**self.state,
            "auth": {"refresh_token": "PRIVATE_ACCESS_KEY"}}})
        out = self.folder / "blocked.json"
        with self.assertRaisesRegex(ConversionError, "unverified_progress_integrity"):
            convert(src, out, ROOT)
        self.assertFalse(out.exists())

    def test_conflicting_primary_embedded_progress_rejected(self):
        foreign = self.legacy()
        foreign["localStorage"]["vida_rpg_personal_progress_v2"] = json.dumps(
            {**self.state, "xp": 1234})
        src = self.write_input(foreign)
        dest = self.folder / "sanitized.json"
        with self.assertRaisesRegex(ConversionError, "conflicting_progress_copies"):
            convert(src, dest, ROOT)
        self.assertFalse(dest.exists())

    def test_embedded_only_legacy_progress_preserved(self):
        src = self.write_input({"localStorage": {
            "vida_rpg_personal_progress_v2": json.dumps(self.state),
            **self.safe, **self.foreign,
        }})
        out = self.folder / "safe.json"
        convert(src, out, ROOT)
        result = read_snapshot(str(out))
        self.assertEqual(result["state"], self.state)
        self.assertEqual(result["localStorage"]["michelsLife.journal.v30184"],
                         "VERY PRIVATE JOURNAL")

    def test_canonical_state_only_legacy_export(self):
        src = self.write_input(self.state)
        safe, report = snapshot_to_safe(read_snapshot(str(src)), source_allowlist(ROOT))
        self.assertEqual(safe["state"]["xp"], 123)
        self.assertEqual(report["storage_entries_excluded"], 0)
        self.assertEqual(safe["state"]["projects"][0]["id"], "project-1")

    def test_runtime_state_only_portable_export(self):
        src = self.write_input({"runtimeState": self.state})
        result = convert(src, self.folder / "safe.json", ROOT)
        self.assertEqual(result["mission_count"], 1)
        self.assertEqual(read_snapshot(str(self.folder / "safe.json"))["state"]["xp"], 123)

    def test_duplicate_json_keys_are_blocked_without_an_output(self):
        src = self.folder / "dup.json"
        src.write_text('{"state":{"xp":4,"xp":999,"missions":[]}}')
        out = self.folder / "safe.json"
        with self.assertRaisesRegex(ConversionError, "invalid_input_backup"):
            convert(src, out, ROOT)
        self.assertFalse(out.exists())

    def test_oversized_backup_is_rejected_without_output(self):
        src = self.folder / "huge.json"
        with src.open("wb") as handle:
            handle.truncate(25 * 1024 * 1024 + 1)
        with self.assertRaisesRegex(ConversionError, "invalid_input_backup"):
            convert(src, self.folder / "safe.json", ROOT)

    def test_duplicate_mission_ids_and_bad_xp_fail_closed(self):
        for state in [
            {**self.state, "missions": [
                {"id": "same"}, {"id": "same"}]},
            {**self.state, "xp": -42},
        ]:
            src = self.write_input({"state": state})
            with self.assertRaisesRegex(ConversionError, "unverified_progress_integrity"):
                convert(src, self.folder / "safe.json", ROOT)

    def test_unrecognized_envelope_is_not_trusted(self):
        src = self.write_input({"supabaseSession": "PRIVATE",
                                "unknownData": {"missions": []}})
        with self.assertRaisesRegex(ConversionError, "unsupported_backup_format"):
            convert(src, self.folder / "safe.json", ROOT)

    def test_atomic_create_existing_race_is_safe(self):
        dest = self.folder / "raced.json"
        dest.write_text("NO_REPLACE")
        with self.assertRaisesRegex(ConversionError, "output_already_exists"):
            atomic_new_file(dest, b'{"ok":true}')
        self.assertEqual(dest.read_text(), "NO_REPLACE")

    def test_cli_inspect_only_generates_no_file(self):
        src = self.write_input(self.legacy())
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            rc = main([str(src), "--inspect-only"])
        self.assertEqual(rc, 0)
        self.assertEqual(json.loads(stdout.getvalue())["status"], "safe_candidate")
        self.assertEqual(list(self.folder.iterdir()), [src])

    def test_cli_error_code_redacted_and_safe(self):
        src = self.write_input({"state": {**self.state, "password":
                                              "TOP_SECRET_PASSWORD"}})
        dst = self.folder / "safe.michelslife"
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            rc = main([str(src), "--output", str(dst)])
        self.assertEqual(rc, 2)
        self.assertEqual(json.loads(stdout.getvalue())["status"], "blocked")
        self.assertFalse(dst.exists())
        self.assertNotIn("TOP_SECRET", stdout.getvalue())
        self.assertNotIn(str(self.folder), stdout.getvalue())

    def test_idempotence_preserves_safe_content(self):
        src = self.write_input(self.legacy())
        a = self.folder / "clean1.json"
        b = self.folder / "clean2.json"
        convert(src, a, ROOT)
        convert(a, b, ROOT)
        self.assertEqual(a.read_bytes(), b.read_bytes())

    def test_unavailable_canonical_policy_fails_closed(self):
        with self.assertRaisesRegex(ConversionError, "missing_shared_storage_contract"):
            source_allowlist(self.folder)
        src = self.write_input(self.legacy())
        out = self.folder / "never.json"
        with self.assertRaisesRegex(ConversionError, "missing_shared_storage_contract"):
            convert(src, out, self.folder)
        self.assertFalse(out.exists())

    def test_duplicate_embedded_json_keys_are_blocked(self):
        src = self.write_input({"state": self.state, "localStorage": {
            "vida_rpg_personal_progress_v2":
                '{"xp":123,"xp":999,"missions":[]}'}})
        out = self.folder / "safe.json"
        with self.assertRaisesRegex(ConversionError, "duplicate_embedded_state_key"):
            convert(src, out, ROOT)
        self.assertFalse(out.exists())

    def test_nested_camelcase_provider_tokens_are_not_exported(self):
        for key in ("sessionToken", "apiKey", "clientSecret", "refreshToken",
                    "privateKey"):
            src = self.write_input({"state": {**self.state, "nested": {
                key: "SENSITIVE_ACCESS_TOKEN_NOT_FOR_ARCHIVE"}}})
            out = self.folder / "safe.json"
            with self.assertRaisesRegex(ConversionError, "sensitive_field_in_progress"):
                convert(src, out, ROOT)
            self.assertFalse(out.exists())

    def test_nonfinite_embedded_state_is_blocked(self):
        src = self.write_input({"localStorage": {
            "vida_rpg_personal_progress_v2":
                '{"missions":[],"xp":NaN}'}})
        out = self.folder / "safe.json"
        with self.assertRaisesRegex(ConversionError, "nonfinite_embedded_state_number"):
            convert(src, out, ROOT)
        self.assertFalse(out.exists())

    def test_preflight_clean_report_no_new_provider_claim(self):
        src = self.write_input(self.legacy())
        out = self.folder / "safe.json"
        report = convert(src, out, ROOT)
        self.assertFalse(report["real_provider_or_galaxy_verified"])
        self.assertFalse(report["credentials_imported"])
        self.assertTrue(report["unknown_fields_discarded"])
        self.assertGreater(report["storage_entries_excluded"], 0)


if __name__ == "__main__":
    unittest.main()
