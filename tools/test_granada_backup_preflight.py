"""Synthetic fixtures: no personal backups, credentials or provider access."""
import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from granada_backup_preflight import compare, inspect, main, read_snapshot


class PreflightTests(unittest.TestCase):
    def setUp(self):
        self.state = {'missions': [{'id': 'm1'}, {'id': 'm2'}], 'xp': 25,
                      'projects': [{'id': 'p1'}]}

    def test_portable_and_cloud_state(self):
        for data in [{'state': self.state, 'localStorage': {}},
                     {'localStorage': {'vida_rpg_personal_progress_v2': json.dumps(self.state)}},
                     self.state]:
            report = inspect(data)
            self.assertEqual(report['status'], 'pass')
            self.assertEqual(report['counts']['missions'], 2)

    def test_private_legacy_backup_fails_closed_without_exposing_value(self):
        report = inspect({'state': self.state, 'localStorage': {
            'michelsLife.supabase.session.v30216': 'TOP_SECRET_ACCESS_TOKEN'}})
        output = json.dumps(report)
        self.assertEqual(report['status'], 'blocked')
        self.assertNotIn('TOP_SECRET', output)
        self.assertIn('private_storage_key_in_backup', output)

    def test_private_nested_state(self):
        state = {**self.state, 'meta': {'refresh_token': 'TOP_SECRET_REFRESH'}}
        report = inspect({'state': state})
        self.assertEqual(report['status'], 'blocked')
        self.assertNotIn('TOP_SECRET', str(report))

    def test_missions_and_xp_integrity(self):
        data = {'state': {'missions': [{'id': 'm1'}, {'id': 'm1'}, {}], 'xp': -1}}
        report = inspect(data)
        self.assertEqual(report['status'], 'blocked')
        codes = [f['code'] for f in report['findings']]
        self.assertIn('duplicate_item_id', codes)
        self.assertIn('missing_item_id', codes)
        self.assertIn('invalid_xp', codes)

    def test_malformed_and_duplicate_json_keys(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'input.json'
            path.write_text('{"state":1,"state":2}', encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'duplicate_json_key'):
                read_snapshot(str(path))
            path.write_text('not JSON', encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'invalid_json'):
                read_snapshot(str(path))

    def test_comparison_redacts_ids_and_detects_drift(self):
        left = inspect({'state': self.state})
        right = inspect({'state': {'missions': [{'id': 'm3'}], 'xp': 12}})
        result = compare(left, right)
        self.assertTrue(result['changed'])
        self.assertTrue(result['collections']['missions']['identities_changed'])
        self.assertEqual(result['collections']['missions']['before'], 2)
        self.assertNotIn('m3', json.dumps(result))

    def test_embedded_state_conflict_and_strict_mode(self):
        content = {'state': self.state, 'localStorage': {
            'vida_rpg_personal_progress_v2': json.dumps({**self.state, 'xp': 9})}}
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'state.michelslife'
            path.write_text(json.dumps(content), encoding='utf-8')
            self.assertEqual(inspect(content)['status'], 'review')
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(main([str(path), '--strict', '--json']), 2)
                self.assertEqual(main([str(path), '--json']), 0)

    def test_non_mutating_comparison_and_unknown_shape(self):
        data = {'state': self.state}
        before = json.dumps(data)
        self.assertEqual(inspect(data)['status'], 'pass')
        self.assertEqual(data, json.loads(before))
        self.assertEqual(inspect({'foo': 2})['status'], 'blocked')
        self.assertEqual(inspect([])['status'], 'blocked')

    def test_cli_compare(self):
        with tempfile.TemporaryDirectory() as tmp:
            a, b = (Path(tmp) / name for name in ('a.json', 'b.json'))
            a.write_text(json.dumps({'state': self.state}), encoding='utf-8')
            b.write_text(json.dumps({'state': {**self.state, 'xp': 29}}), encoding='utf-8')
            capture = io.StringIO()
            with contextlib.redirect_stdout(capture):
                code = main([str(a), '--compare', str(b), '--json'])
            self.assertEqual(code, 0)
            self.assertEqual(json.loads(capture.getvalue())['delta']['xp_after'], 29)


if __name__ == '__main__':
    unittest.main()
