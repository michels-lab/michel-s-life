#!/usr/bin/env python3
"""Negative controls for isolated Android16 host evidence, never app-data QA."""
import unittest
from tools.granada_candidate_host_probe import classify, SCHEMA

SHA="f"*40
def frame(phase, qemu=1, emulator=1, oom=0, adb="device"):
    return {"schema":SCHEMA,"phase":phase,"qemu_count":qemu,
            "emulator_count":emulator,"oom_kill":oom,"adb":adb}

class HostVerdictTests(unittest.TestCase):
    def setUp(self):
        self.before=frame("before")
        self.after=frame("after")

    def test_qemu_gone(self):
        out=classify(self.before,frame("after",0,0,0,"unavailable"),1,SHA)
        self.assertEqual(out["classification"],"emulator_process_disappeared")
        self.assertFalse(out["actual_native_acceptance_verified"])

    def test_cgroup_oom_precedence(self):
        out=classify(self.before,frame("after",0,0,1,"unavailable"),1,SHA)
        self.assertEqual(out["classification"],"runner_oom_kill_observed")

    def test_adb_loss_with_process_alive(self):
        out=classify(self.before,frame("after",1,1,0,"unavailable"),1,SHA)
        self.assertEqual(out["classification"],"adb_transport_lost")

    def test_no_claim_of_app_failure_cause(self):
        out=classify(self.before,self.after,1,SHA)
        self.assertEqual(out["classification"],"native_smoke_failed_cause_unconfirmed")

    def test_zero_does_not_claim_device_pass(self):
        out=classify(self.before,self.after,0,SHA)
        self.assertEqual(out["status"],"DIAGNOSTIC_ONLY")
        self.assertFalse(out["signed_or_galaxy_verified"])

    def test_missing_oom_evidence_is_not_invented(self):
        out=classify(frame("before",oom=None),frame("after",oom=None),1,SHA)
        self.assertIsNone(out["host_oom_kill_delta"])

    def test_negative_oom_delta_rejected(self):
        with self.assertRaises(ValueError):
            classify(frame("before",oom=4),frame("after",oom=3),1,SHA)

    def test_extra_field_cannot_exfiltrate_journal(self):
        with self.assertRaises(ValueError):
            classify({**self.before,"journal_text":"secret"},self.after,1,SHA)

    def test_malformed_sha_rejected(self):
        with self.assertRaises(ValueError):
            classify(self.before,self.after,1,"bad",)

    def test_invalid_exit_rejected(self):
        with self.assertRaises(ValueError):
            classify(self.before,self.after,256,SHA)

    def test_wrong_phase_rejected(self):
        with self.assertRaises(ValueError):
            classify(frame("after"),self.after,1,SHA)

    def test_boolean_count_rejected(self):
        with self.assertRaises(ValueError):
            classify({**self.before,"qemu_count":True},self.after,1,SHA)

if __name__=="__main__":
    unittest.main()
