import unittest
from tools.granada_native_xp_relaunch import ID, REWARD, compact, compare, sha

def sample(xp=317):
    return {"ready":True,"xp":xp,"missionCount":2,
        "ids":["starter-id",ID],
        "goals":[],
        "completions":[{"id":"synthetic-completion-id","xp":REWARD}]}

class NativeXpRelaunchContract(unittest.TestCase):
    def test_valid_native_synthetic_ledger_digest(self):
        x=compact(sample())
        self.assertEqual(x["xp"],317)
        self.assertEqual(x["missionCount"],2)
        self.assertEqual(x["syntheticCompletionCount"],1)
        self.assertNotIn("synthetic-completion-id",str(x))
        self.assertEqual(len(x["missionIdsSha256"]),64)
    def test_two_actual_relaunch_snapshots_are_identical(self):
        a=compact(sample())
        z=compare(a,a,a)
        self.assertTrue(z["pass"])
        self.assertEqual(z["forcedRelaunches"],2)
        self.assertFalse(z["signedDeviceVerified"])
    def test_xp_gain_cannot_drift(self):
        a=compact(sample());b=compact(sample(xp=367))
        with self.assertRaisesRegex(ValueError,"xp_or_mission_changed"):
            compare(a,b,a)
    def test_second_relaunch_mission_id_change_is_rejected(self):
        a=compact(sample());b={**a,"missionIdsSha256":"c"*64}
        with self.assertRaisesRegex(ValueError,"xp_or_mission_changed"):
            compare(a,a,b)
    def test_completion_id_change_fails(self):
        a=compact(sample());b=compact({**sample(),
            "completions":[{"id":"new-synthetic-id","xp":REWARD}]})
        with self.assertRaisesRegex(ValueError,"xp_or_mission_changed"):
            compare(a,b,a)
    def test_nonzero_exact_award_required(self):
        with self.assertRaisesRegex(ValueError,"synthetic_native_ledger_invalid"):
            compact({**sample(),"completions":[{"id":"one","xp":0}]})
    def test_double_completion_rejected(self):
        with self.assertRaisesRegex(ValueError,"synthetic_native_ledger_invalid"):
            compact({**sample(),"completions":[{"id":"one","xp":50},
                                                 {"id":"two","xp":50}]})
    def test_mission_duplicate_rejected(self):
        with self.assertRaisesRegex(ValueError,"synthetic_native_ledger_invalid"):
            compact({**sample(),"ids":[ID,ID]})
    def test_synthetic_fixture_not_found_is_rejected(self):
        with self.assertRaisesRegex(ValueError,"synthetic_native_ledger_invalid"):
            compact({**sample(),"ids":["starter-id","second-id"]})
    def test_noncanonical_xp_and_missing_ledger_rejected(self):
        for wrong in (-1,True,None,"317",10_000_001):
            with self.subTest(xp=wrong):
                with self.assertRaises(ValueError):
                    compact(sample(xp=wrong))
        with self.assertRaises(ValueError):
            compact({"ready":False,"reason":"not_ready"})
    def test_no_provider_claim_or_physical_device_claim(self):
        a=compact(sample())
        for marker in ("providerUsed","physicalDeviceVerified"):
            b={**a,marker:True}
            with self.assertRaisesRegex(ValueError,"unsupported_native_scope_claim"):
                compare(a,b,a)
    def test_missing_second_evidence_fails(self):
        a=compact(sample());b=dict(a);b.pop("completionSha256")
        with self.assertRaisesRegex(ValueError,"missing_native_ledger_evidence"):
            compare(a,a,b)
    def test_wrong_schema_refused(self):
        a=compact(sample());b={**a,"schema":"other"}
        with self.assertRaisesRegex(ValueError,"wrong_native_snapshot_schema"):
            compare(a,a,b)
    def test_digest_is_stable_without_exposing_raw_values(self):
        self.assertEqual(sha(["a","b"]),sha(["a","b"]))
        self.assertNotEqual(sha(["a","b"]),sha(["b","a"]))
        self.assertNotIn("starter-id",str(compact(sample())))

if __name__=="__main__":
    unittest.main()
