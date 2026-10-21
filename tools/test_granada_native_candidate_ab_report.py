import importlib.util
import binascii
import json
from pathlib import Path
import struct
import tempfile
import unittest
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
spec=importlib.util.spec_from_file_location("native_report",
    ROOT/"tools/granada_native_candidate_ab_report.py")
native=importlib.util.module_from_spec(spec)
spec.loader.exec_module(native)


def valid_png():
    from android_emulator_evidence_manifest import create_test_png
    src=create_test_png()
    def chunk(tag,data):
        return struct.pack(">I",len(data))+tag+data+struct.pack(">I",binascii.crc32(tag+data)&0xffffffff)
    return src[:-12]+chunk(b"tEXt",b"ci-safe-test-padding="+b"x"*32500)+src[-12:]


def populate(root,arm):
    path=Path(root)/("granada-native-candidate-"+arm)
    path.mkdir(parents=True)
    blob=valid_png()
    for name in native.FRAMES:
        (path/name).write_bytes(blob)
    for name in native.COMPARISONS:
        (path/name).write_text(json.dumps({"pass":True,"private_journal":"DO_NOT_EXPORT"}))
    (path/"host-watch.json").write_text(json.dumps({
        "result":{"classification":"emulator_process_seen_at_end"},
        "secret":"NEVER_REPORT_THIS"
    }))
    return path


class EvidenceSummaryTests(unittest.TestCase):
    def test_missing_native_frames_and_comparisons_fail_closed(self):
        with tempfile.TemporaryDirectory() as d:
            r=native.summarize(Path(d),"failure","failure","a"*40)
            self.assertFalse(r["both_native_gates_pass"])
            self.assertEqual(r["interpretation"],"both_native_gates_unverified")

    def test_both_real_native_proofs_required(self):
        with tempfile.TemporaryDirectory() as d:
            populate(d,"default")
            populate(d,"3gib")
            populate(d,"3gib-software")
            r=native.summarize(Path(d),"success","success","b"*40,"success")
            self.assertTrue(r["both_native_gates_pass"])
            self.assertTrue(r["all_three_native_gates_pass"])
            self.assertFalse(r["graphics_backend_causality_proven"])
            self.assertFalse(r["guest_ram_causality_proven"])
            self.assertEqual([x["canonical_comparisons_passed"] for x in r["arms"]],[3,3,3])
            self.assertNotIn("NEVER_REPORT_THIS",json.dumps(r))
            self.assertNotIn("DO_NOT_EXPORT",json.dumps(r))

    def test_truncated_screenshot_fails_even_when_job_claims_success(self):
        with tempfile.TemporaryDirectory() as d:
            populate(d,"default")
            path=populate(d,"3gib")
            frame=path/native.FRAMES[0]
            frame.write_bytes(frame.read_bytes()[:-15])
            r=native.summarize(Path(d),"success","success","c"*40)
            self.assertFalse(r["both_native_gates_pass"])
            self.assertIn("missing_or_invalid_native_png",r["arms"][1]["failure_codes"])

    def test_incomplete_relaunch_comparison_never_passes(self):
        with tempfile.TemporaryDirectory() as d:
            populate(d,"default")
            path=populate(d,"3gib")
            (path/native.COMPARISONS[-1]).write_text('{"pass":false}')
            r=native.summarize(Path(d),"success","success","d"*40)
            self.assertEqual(r["arms"][1]["canonical_comparisons_passed"],2)
            self.assertEqual(r["interpretation"],"default_pass_only")

    def test_3gib_only_is_not_memory_causality(self):
        with tempfile.TemporaryDirectory() as d:
            populate(d,"default")
            populate(d,"3gib")
            r=native.summarize(Path(d),"failure","success","e"*40)
            self.assertFalse(r["both_native_gates_pass"])
            self.assertEqual(r["interpretation"],"3gib_pass_only_not_causal_proof")
            self.assertFalse(r["guest_ram_causality_proven"])

    def test_host_vm_classification_whitelisted(self):
        with tempfile.TemporaryDirectory() as d:
            a=populate(d,"default")
            (a/"host-watch.json").write_text(json.dumps({"result":{
                "classification":"PRIVATE_EMAIL_example_com"}}))
            r=native.arm_report(a,"default","success")
            self.assertEqual(r["host_vm_classification"],"unavailable")

    def test_software_gpu_only_is_not_a_causal_verdict(self):
        with tempfile.TemporaryDirectory() as d:
            populate(d,"3gib-software")
            r=native.summarize(Path(d),"failure","failure","f"*40,"success")
            self.assertFalse(r["all_three_native_gates_pass"])
            self.assertEqual(r["interpretation"],"3gib_software_only_not_causal_proof")
            self.assertFalse(r["graphics_backend_causality_proven"])

    def test_swiftshader_success_and_software_gpu_failure_is_red(self):
        with tempfile.TemporaryDirectory() as d:
            populate(d,"default")
            populate(d,"3gib")
            r=native.summarize(Path(d),"success","success","a"*40,"failure")
            self.assertTrue(r["both_native_gates_pass"])
            self.assertFalse(r["all_three_native_gates_pass"])
            self.assertEqual(r["interpretation"],"swiftshader_both_pass_software_unverified")

    def test_software_gpu_partial_evidence_cannot_pass(self):
        with tempfile.TemporaryDirectory() as d:
            path=populate(d,"3gib-software")
            (path/native.COMPARISONS[0]).unlink()
            r=native.summarize(Path(d),"failure","failure","a"*40,"success")
            self.assertFalse(r["arms"][2]["native_gate_accepted"])
            self.assertEqual(r["arms"][2]["canonical_comparisons_passed"],2)

    def test_workflow_still_fails_if_evidence_incomplete(self):
        wf=(ROOT/".github/workflows/granada-native-candidate-ram-matrix.yml").read_text()
        self.assertIn("native-evidence-summary:",wf)
        self.assertIn("native-3gib-software:",wf)
        self.assertIn("-gpu software",wf)
        self.assertIn("needs: [compile, native-default, native-3gib, native-3gib-software]",wf)
        self.assertIn("--three-gib-software-job",wf)
        self.assertIn("if: always()",wf)
        self.assertIn("granada_native_candidate_ab_report.py",wf)
        self.assertNotIn("continue-on-error",wf)


if __name__=="__main__":
    unittest.main()
