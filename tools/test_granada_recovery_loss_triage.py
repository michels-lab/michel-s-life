"""Synthetic-only regression suite for offline Michel's Life backup loss triage."""
import contextlib
import io
import json
import os
from pathlib import Path
import stat
import tempfile
import unittest

from granada_recovery_loss_triage import (
    TriageError, canonical_state, evaluate, main
)
from granada_backup_preflight import STORAGE_STATE_KEY

ROOT = Path(__file__).resolve().parents[1]


class RecoveryTriageTests(unittest.TestCase):
    def setUp(self):
        from granada_safe_backup_converter import source_allowlist
        self.allowed = source_allowlist(ROOT)
        self.state = {
            "missions": [
                {"id": "SECRET_A", "name": "PRIVATE A",
                 "completions": ["2026-10-18", "2026-10-19"], "days": [1, 2]},
                {"id": "SECRET_B", "name": "PRIVATE B", "completions": []},
            ],
            "projects": [{"id": "P_SECRET", "name": "PRIVATE PROJECT"}],
            "goals": [{"id": "G_SECRET", "name": "PRIVATE GOAL"}],
            "chapters": [{"id": "CH_SECRET", "title": "PRIVATE CHAPTER"}],
            "history": [{"type": "complete", "id": "SECRET_A"}],
            "xp": 120,
        }

    def snap(self, state=None, local=None):
        return {"state": json.loads(json.dumps(self.state if state is None else state)),
                "localStorage": {} if local is None else local}

    def compare(self, a, b):
        return evaluate(a, b, self.allowed)

    def edit(self):
        return json.loads(json.dumps(self.state))

    def test_identical_is_unchanged_and_safe(self):
        r = self.compare(self.snap(), self.snap())
        self.assertEqual(r["status"], "unchanged")
        self.assertEqual(r["changes"], [])
        self.assertEqual(r["risk_signals"], [])
        self.assertFalse(r["account_owner_verified"])
        self.assertFalse(r["real_provider_or_galaxy_verified"])

    def test_same_count_changed_identity_exposes_actual_removal_count(self):
        newer = self.edit()
        newer["missions"][0]["id"] = "SECRET_NEW"
        r = self.compare(self.snap(), self.snap(newer))
        self.assertEqual(r["collections"]["missions"]["removed"], 1)
        self.assertEqual(r["collections"]["missions"]["added"], 1)
        self.assertIn("mission_identity_removed", r["risk_signals"])
        self.assertEqual(r["completion_events"]["in_removed_missions"], 2)

    def test_new_missions_are_additions_not_missing(self):
        newer = self.edit()
        newer["missions"].append({"id": "NEW", "completions": []})
        r = self.compare(self.snap(), self.snap(newer))
        self.assertEqual(r["collections"]["missions"]["added"], 1)
        self.assertEqual(r["risk_signals"], [])

    def test_deleted_project_and_goal_are_separately_counted(self):
        newer = self.edit()
        newer["projects"] = []
        newer["goals"] = []
        r = self.compare(self.snap(), self.snap(newer))
        self.assertEqual(r["collections"]["projects"]["removed"], 1)
        self.assertEqual(r["collections"]["goals"]["removed"], 1)
        self.assertIn("collection_identity_removed", r["risk_signals"])

    def test_retained_mission_edit_not_mistaken_for_removed_id(self):
        newer = self.edit()
        newer["missions"][0]["name"] = "UPDATED PRIVATE NAME"
        r = self.compare(self.snap(), self.snap(newer))
        self.assertEqual(r["collections"]["missions"]["modified_retained"], 1)
        self.assertEqual(r["collections"]["missions"]["removed"], 0)
        self.assertEqual(r["risk_signals"], [])

    def test_completion_date_removed_from_retained_mission(self):
        newer = self.edit()
        newer["missions"][0]["completions"].pop()
        r = self.compare(self.snap(), self.snap(newer))
        self.assertEqual(r["completion_events"]["removed_from_retained_missions"], 1)
        self.assertIn("completion_history_removed", r["risk_signals"])

    def test_new_completion_not_reported_as_loss(self):
        newer = self.edit()
        newer["missions"][0]["completions"].append("2026-10-20")
        r = self.compare(self.snap(), self.snap(newer))
        self.assertEqual(r["completion_events"]["added_to_retained_missions"], 1)
        self.assertNotIn("completion_history_removed", r["risk_signals"])

    def test_duplicate_completion_counts_exactly_one_lost_occurrence(self):
        old = self.edit()
        old["missions"][0]["completions"] = ["day", "day", "other"]
        newer = json.loads(json.dumps(old))
        newer["missions"][0]["completions"] = ["day", "other"]
        self.assertEqual(self.compare(self.snap(old), self.snap(newer))
                         ["completion_events"]["removed_from_retained_missions"], 1)

    def test_completion_reorder_does_not_mistakenly_mark_loss(self):
        newer = self.edit()
        newer["missions"][0]["completions"].reverse()
        r = self.compare(self.snap(), self.snap(newer))
        self.assertEqual(r["completion_events"]["removed_from_retained_missions"], 0)
        self.assertNotIn("completion_history_removed", r["risk_signals"])

    def test_xp_decrease_may_be_undo_not_certain_loss(self):
        newer = self.edit()
        newer["xp"] = 95
        r = self.compare(self.snap(), self.snap(newer))
        self.assertIn("xp_decreased", r["risk_signals"])
        self.assertIn("not proven data loss", r["interpretation"])
        self.assertEqual(r["xp"], {"before": 120, "after": 95})

    def test_xp_increase_has_no_loss_flag(self):
        newer = self.edit()
        newer["xp"] = 145
        r = self.compare(self.snap(), self.snap(newer))
        self.assertNotIn("xp_decreased", r["risk_signals"])

    def test_history_shrink_and_reorder(self):
        newer = self.edit()
        newer["history"] = []
        self.assertIn("history_count_decreased",
                      self.compare(self.snap(), self.snap(newer))["risk_signals"])

    def test_journal_removed_with_no_text_leak(self):
        journal = "michelsLife.journal.v30184"
        self.assertIn(journal, self.allowed)
        old = self.snap(local={journal: "MY PRIVATE JOURNAL BODY"})
        r = self.compare(old, self.snap())
        self.assertEqual(r["journal_storage"]["removed_keys"], 1)
        self.assertIn("journal_storage_removed", r["risk_signals"])
        self.assertNotIn("MY PRIVATE", json.dumps(r))

    def test_journal_modified_not_automatically_loss(self):
        journal = "michelsLife.journal.v30184"
        r = self.compare(self.snap(local={journal: "PRIVATE_A"}),
                         self.snap(local={journal: "PRIVATE_B"}))
        self.assertEqual(r["journal_storage"]["modified_keys"], 1)
        self.assertEqual(r["risk_signals"], [])

    def test_unclassified_setting_change_still_visible(self):
        key = "michelsLife.theme.v342"
        self.assertIn(key, self.allowed)
        r = self.compare(self.snap(local={key: "v1"}),
                         self.snap(local={key: "v2"}))
        self.assertIn("other_board_or_settings_change", r["changes"])

    def test_strict_embedded_conflict_rejected(self):
        local = {STORAGE_STATE_KEY: json.dumps({**self.state, "xp": 999})}
        with self.assertRaisesRegex(TriageError, "divergent_state_copies"):
            self.compare(self.snap(local=local), self.snap())

    def test_duplicate_key_inside_embedded_json_rejected(self):
        local = {STORAGE_STATE_KEY: '{"missions":[],"xp":1,"xp":2}'}
        with self.assertRaisesRegex(TriageError, "invalid_embedded_progress"):
            canonical_state({"localStorage": local}, self.allowed)

    def test_unknown_top_level_auth_metadata_rejected(self):
        old = self.snap()
        old["authorization"] = "VERY_PRIVATE_AUTH_VALUE"
        with self.assertRaisesRegex(TriageError, "unverified_envelope_fields"):
            self.compare(old, self.snap())

    def test_storage_unknown_key_rejected(self):
        with self.assertRaisesRegex(TriageError, "unverified_storage_field"):
            self.compare(self.snap(local={"anotherApp.token": "UNSAFE_SECRET"}),
                         self.snap())

    def test_nested_camel_case_credentials_rejected(self):
        old = self.edit()
        old["meta"] = {"sessionToken": "VERY_PRIVATE_CREDENTIAL"}
        with self.assertRaisesRegex(TriageError, "private_fields_in_progress"):
            self.compare(self.snap(old), self.snap())

    def test_duplicate_ids_do_not_inflate_false_success(self):
        old = self.edit()
        old["missions"].append(old["missions"][0])
        with self.assertRaisesRegex(TriageError, "unverified_backup_integrity"):
            self.compare(self.snap(old), self.snap())

    def test_malformed_completion_shape_is_blocked(self):
        old = self.edit()
        old["missions"][0]["completions"] = {"date": "today"}
        with self.assertRaisesRegex(TriageError, "unverified_completion_format"):
            self.compare(self.snap(old), self.snap())

    def test_xp_nan_and_negative_rejected(self):
        for xp in (-1, float("nan")):
            old = self.edit()
            old["xp"] = xp
            with self.assertRaises(TriageError):
                self.compare(self.snap(old), self.snap())

    def test_no_personal_ids_names_or_raw_content_in_report(self):
        newer = self.edit()
        newer["missions"][0]["id"] = "PRIVATE_NEW"
        newer["projects"][0]["name"] = "UNSHAREABLE_TITLE"
        r = json.dumps(self.compare(self.snap(), self.snap(newer)))
        for private in ("SECRET_A", "PRIVATE_NEW", "PRIVATE PROJECT",
                        "UNSHAREABLE_TITLE", "P_SECRET", "CH_SECRET"):
            self.assertNotIn(private, r)

    def test_offline_cli_never_rewrites_inputs(self):
        with tempfile.TemporaryDirectory() as folder:
            a = Path(folder) / "before.json"
            b = Path(folder) / "after.json"
            a.write_text(json.dumps(self.snap()))
            newer = self.edit()
            newer["missions"].pop()
            b.write_text(json.dumps(self.snap(newer)))
            before = (a.read_bytes(), b.read_bytes())
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                rc = main([str(a), str(b), "--fail-on-risk"])
            self.assertEqual(rc, 3)
            self.assertEqual((a.read_bytes(), b.read_bytes()), before)
            self.assertEqual(json.loads(out.getvalue())["status"], "review")
            self.assertEqual(set(Path(folder).iterdir()), {a, b})

    def test_cli_creates_owner_only_new_report(self):
        with tempfile.TemporaryDirectory() as folder:
            a, b, report = [Path(folder) / x for x in ("a.json", "b.json", "report.json")]
            a.write_text(json.dumps(self.snap()))
            b.write_text(json.dumps(self.snap()))
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(main([str(a), str(b), "--report", str(report)]), 0)
            self.assertEqual(json.loads(report.read_text())["status"], "unchanged")
            if os.name == "posix":
                self.assertEqual(stat.S_IMODE(report.stat().st_mode), 0o600)

    def test_report_never_overwrites_existing_file_or_symlink(self):
        with tempfile.TemporaryDirectory() as folder:
            a, b, report = [Path(folder) / x for x in ("a.json", "b.json", "out.json")]
            a.write_text(json.dumps(self.snap()))
            b.write_text(json.dumps(self.snap()))
            report.write_text("KEEP_ME")
            with contextlib.redirect_stdout(io.StringIO()) as capture:
                self.assertEqual(main([str(a), str(b), "--report", str(report)]), 2)
            self.assertEqual(report.read_text(), "KEEP_ME")
            report.unlink()
            report.symlink_to(a)
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(main([str(a), str(b), "--report", str(report)]), 2)
            self.assertEqual(json.loads(a.read_text()), self.snap())

    def test_outer_duplicate_json_and_bad_content_do_not_escape(self):
        with tempfile.TemporaryDirectory() as folder:
            a, b = Path(folder) / "a.json", Path(folder) / "b.json"
            a.write_text('{"state":0,"state":1}', encoding="utf-8")
            b.write_text(json.dumps(self.snap()))
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                self.assertEqual(main([str(a), str(b)]), 2)
            self.assertEqual(json.loads(out.getvalue())["status"], "blocked")
            self.assertNotIn(folder, out.getvalue())
            self.assertNotIn('{"state":0', out.getvalue())

    def test_source_side_safe_candidate_with_embedded_progress(self):
        data = self.snap()
        data["localStorage"][STORAGE_STATE_KEY] = json.dumps(data["state"])
        r = self.compare(data, data)
        self.assertEqual(r["status"], "unchanged")


if __name__ == "__main__":
    unittest.main()
