#!/usr/bin/env python3
"""Synthetic privacy-safe #139 emulator process / cgroup host-watch tests."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("granada_host_watch",
    ROOT / "android/tools/granada_emulator_host_watch.py")
watcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(watcher)


def make_proc(root: Path, comm: str, pid: str = "1234", rss: int = 50):
    folder = root / "proc" / pid
    folder.mkdir(parents=True)
    (folder / "comm").write_text(comm + "\n")
    (folder / "status").write_text("Name:\t" + comm +
        "\nVmRSS:\t" + str(rss) + " kB\n")


def make_cgroup(root: Path, kills: int = 0, memory: int = 122880):
    dir = root / "sys/fs/cgroup"
    dir.mkdir(parents=True, exist_ok=True)
    (dir / "memory.events").write_text("oom 0\noom_kill " + str(kills) + "\n")
    (dir / "memory.current").write_text(str(memory) + "\n")
    (dir / "memory.max").write_text("2000000000\n")


class HostOnlyTests(unittest.TestCase):
    def test_live_emulator_without_adb_or_private_data(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            make_cgroup(root)
            make_proc(root, "qemu-system-x86", rss=90000)
            make_proc(root, "adb", pid="777", rss=400)
            result = watcher.host_sample(root, 1)
            self.assertEqual(result["qemu_count"], 1)
            self.assertEqual(result["qemu_rss_kib"], 90000)
            self.assertEqual(result["adb_count"], 1)
            self.assertEqual(result["cgroup_memory_bytes"], 122880)
            self.assertNotIn("1234", json.dumps(result))
            self.assertNotIn("777", json.dumps(result))
            self.assertNotIn("qemu-system-x86", json.dumps(result))

    def test_process_died_after_initial_presence(self):
        samples = [{"qemu_count": 1, "emulator_count": 0,
                    "cgroup_oom_kill": 0},
                   {"qemu_count": 0, "emulator_count": 0,
                    "cgroup_oom_kill": 0}]
        report = watcher.verdict(samples)
        self.assertEqual(report["classification"], "emulator_process_disappeared")
        self.assertTrue(report["vm_observed_gone_at_end"])
        self.assertFalse(report["native_persistence_verified"])

    def test_host_memory_killed_emulator_is_specific(self):
        samples = [{"qemu_count": 1, "emulator_count": 0,
                    "cgroup_oom_kill": 2},
                   {"qemu_count": 0, "emulator_count": 0,
                    "cgroup_oom_kill": 3}]
        result = watcher.verdict(samples)
        self.assertEqual(result["classification"], "host_cgroup_oom_kill_observed")
        self.assertEqual(result["oom_kill_delta"], 1)

    def test_no_emulator_never_reported_as_app_failure(self):
        report = watcher.verdict([{"qemu_count": 0, "emulator_count": 0}])
        self.assertEqual(report["classification"], "no_emulator_process_seen")
        self.assertEqual(report["native_app_state"], "unknown")

    def test_live_emulator_does_not_mean_app_alive(self):
        report = watcher.verdict([{"qemu_count": 1, "emulator_count": 0}])
        self.assertEqual(report["classification"], "emulator_process_seen_at_end")
        self.assertEqual(report["native_app_state"], "unknown")
        self.assertFalse(report["native_persistence_verified"])

    def test_empty_or_inaccessible_proc_stays_unknown(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            v = watcher.host_sample(root, 1)
            self.assertEqual(v["qemu_count"], 0)
            self.assertIsNone(v["cgroup_oom_kill"])
        self.assertEqual(watcher.verdict([])["classification"], "no_host_samples")

    def test_ignores_other_host_processes_and_tokens(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            make_proc(root, "bash", pid="3456")
            p = root / "proc" / "3456"
            (p / "cmdline").write_text("SECRET_EMAIL PRIVATE_ACCESS_TOKEN")
            make_cgroup(root)
            serialized = json.dumps(watcher.host_sample(root, 2))
            self.assertNotIn("SECRET", serialized)
            self.assertNotIn("PRIVATE", serialized)
            self.assertNotIn("bash", serialized)

    def test_counter_parser_rejects_non_numeric_values(self):
        self.assertEqual(watcher.safe_counter("oom_kill 7\n", "oom_kill"), 7)
        self.assertIsNone(watcher.safe_counter("oom_kill SECRET", "oom_kill"))
        self.assertIsNone(watcher.safe_counter("oom_kill -4", "oom_kill"))

    def test_script_starts_host_watcher_and_stops_in_exit_trap(self):
        script = (ROOT / "android/tools/smoke_candidate_apk_install.sh").read_text()
        self.assertIn("granada_emulator_host_watch.py", script)
        self.assertIn("trap cleanup_granada_host_watch EXIT", script)
        self.assertIn('kill -TERM "$GRANADA_WATCH_PID"', script)
        self.assertIn('wait "$GRANADA_WATCH_PID"', script)
        self.assertIn('granada_emulator_host_watch.py', script)
        self.assertIn("native-state-after.json", script)


if __name__ == "__main__":
    unittest.main()
