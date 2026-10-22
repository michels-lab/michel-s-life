import tempfile
import unittest
from pathlib import Path
from tools.granada_android16_host_verdict import parse_snapshot, evaluate, report

SHA = "a"*40
def snapshot(phase="launched", operation="framebuffer", sample=2,
             qemu=1, emulator=1, kills=0, mem=1073741824):
    return ("schema=mlv-granada-host-failure-v1\n"
            + f"phase={phase}\noperation={operation}\nsample={sample}\n"
            + f"cgroup_oom_kill={kills}\ncgroup_oom=0\n"
            + f"cgroup_memory_bytes={mem}\n"
            + f"qemu_process_count={qemu}\nemulator_process_count={emulator}\n")

class HostVerdictTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.d=Path(self.tmp.name)
        (self.d/"host-before.txt").write_text(snapshot(phase="preflight",
            operation="initialize",sample=0))
        (self.d/"host-after-failure.txt").write_text(snapshot())
    def test_qemu_process_survives_failed_adb(self):
        result=report(self.d,SHA)
        self.assertEqual(result["classification"],"host_emulator_process_still_observed")
        self.assertFalse(result["canonical_persistence_verified"])
        self.assertFalse(result["physical_galaxy_verified"])
    def test_observed_qemu_process_disappearance(self):
        (self.d/"host-after-failure.txt").write_text(snapshot(qemu=0,emulator=0))
        self.assertEqual(report(self.d,SHA)["classification"],
                         "qemu_emulator_process_disappeared")
    def test_observed_oom_wins_over_qemu_process_disappearance(self):
        (self.d/"host-after-failure.txt").write_text(snapshot(qemu=0,emulator=0,kills=1))
        x=report(self.d,SHA)
        self.assertEqual(x["classification"],"host_cgroup_oom_kill_observed")
        self.assertEqual(x["host_oom_kill_delta"],1)
    def test_no_host_process_at_start_fails_to_assert_vm_disappeared(self):
        (self.d/"host-before.txt").write_text(snapshot(phase="preflight",
            operation="initialize",sample=0,qemu=0,emulator=0))
        (self.d/"host-after-failure.txt").write_text(snapshot(qemu=0,emulator=0))
        self.assertEqual(report(self.d,SHA)["classification"],
                         "host_process_state_unknown")
    def test_reject_regressed_oom_counter(self):
        (self.d/"host-before.txt").write_text(snapshot(phase="preflight",
            operation="initialize",sample=0,kills=4))
        with self.assertRaisesRegex(ValueError,"incompatible_host_oom_counters"):
            report(self.d,SHA)
    def test_reject_bad_snapshot_schema(self):
        (self.d/"host-before.txt").write_text("schema=v0\n")
        with self.assertRaisesRegex(ValueError,"unsupported_host_snapshot"):
            report(self.d,SHA)
    def test_reject_credential_field_injected_by_untrusted_log(self):
        p=self.d/"host-after-failure.txt"
        p.write_text(p.read_text()+"account_token=mytoken\n")
        with self.assertRaisesRegex(ValueError,"unsupported_or_duplicate_host_field"):
            report(self.d,SHA)
    def test_reject_invalid_phase_path_and_usernames(self):
        for injected in ["phase=/home/private\n", "operation=evil\n", "user=michel\n"]:
            with self.subTest(injected=injected):
                p=self.d/"host-after-failure.txt"
                p.write_text(snapshot()+injected)
                with self.assertRaises(ValueError):
                    report(self.d,SHA)
    def test_reject_symlink_to_external_file(self):
        p=self.d/"host-after-failure.txt"
        p.unlink()
        p.symlink_to(self.d/"host-before.txt")
        with self.assertRaisesRegex(ValueError,"missing_or_oversized_host_snapshot"):
            report(self.d,SHA)
    def test_reject_negative_and_gigantic_count(self):
        for bad in ("-1","99999999999999999999"):
            with self.subTest(bad=bad):
                p=self.d/"host-after-failure.txt"
                p.write_text(snapshot().replace("qemu_process_count=1",f"qemu_process_count={bad}"))
                with self.assertRaises(ValueError):
                    report(self.d,SHA)
    def test_missing_after_is_incomplete_not_green(self):
        (self.d/"host-after-failure.txt").unlink()
        with self.assertRaises(ValueError):
            report(self.d,SHA)
    def test_completed_host_lifecycle_is_not_misreported_as_missing_crash_data(self):
        (self.d/"host-after-failure.txt").unlink()
        (self.d/"host-after-success.txt").write_text(snapshot(
            phase="verified-three-phases",operation="completed",sample=8))
        (self.d/"phases-complete.txt").write_text("complete\\n")
        x=report(self.d,SHA)
        self.assertEqual(x["status"],"NO_FAILURE_OBSERVED")
        self.assertEqual(x["classification"],"host_experiment_finished_without_failure")
        self.assertIsNone(x["failed_operation"])
        self.assertIsNone(x["failed_sample"])
        self.assertFalse(x["physical_galaxy_verified"])
        self.assertFalse(x["canonical_persistence_verified"])
    def test_success_metadata_without_all_phase_markers_is_never_accepted(self):
        (self.d/"host-after-failure.txt").unlink()
        (self.d/"host-after-success.txt").write_text(snapshot(
            phase="verified-three-phases",operation="completed",sample=8))
        with self.assertRaisesRegex(ValueError,"phase_not_verified"):
            report(self.d,SHA)
    def test_simultaneous_host_success_and_failure_is_rejected(self):
        (self.d/"host-after-success.txt").write_text(snapshot(
            phase="verified-three-phases",operation="completed",sample=8))
        with self.assertRaisesRegex(ValueError,"ambiguous_host_outcome"):
            report(self.d,SHA)
    def test_source_sha_required(self):
        with self.assertRaisesRegex(ValueError,"invalid_source_sha"):
            report(self.d,"short")
    def test_exact_failure_stage_and_sample(self):
        (self.d/"host-after-failure.txt").write_text(snapshot(
            phase="launched",operation="boot_property",sample=2))
        x=report(self.d,SHA)
        self.assertEqual((x["failure_phase"],x["failed_operation"],x["failed_sample"]),
                         ("launched","boot_property",2))

if __name__ == "__main__":
    unittest.main()
