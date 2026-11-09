#!/usr/bin/env python3
"""Offline checks for REAL Android ADB touch geometry; no emulator required."""
import pathlib
import subprocess
import tempfile
import sys
import unittest

sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
from native_webview_onboarding_target import resolve_touch, expression

ROOT=pathlib.Path(__file__).resolve().parents[2]


def geometry(phase=2,kind="next",y=817,button_height=48):
    # Pixel6: physical 1080x2400; WebView 432x896 CSS + system insets.
    return dict(phase=phase,kind=kind,rootVisible=True,buttonVisible=True,
        disabled=False,hit=True,innerWidth=432,innerHeight=896,
        x=378,y=y,buttonHeight=button_height)


class RealNativeOnboardTargetTests(unittest.TestCase):
    def test_real_step2_bottom_continue_maps_to_adb_pixel(self):
        x,y=resolve_touch(geometry(),2,1080,2400)
        self.assertEqual((x,y),(945,2122))
        self.assertGreater(y,2000)  # old blind 84% tap was too high
        self.assertLess(y,2400-55)

    def test_real_step3_finish_uses_actual_button_location(self):
        x,y=resolve_touch(geometry(phase=3,kind="finish",y=620),3,1080,2400)
        self.assertEqual((x,y),(945,1630))
        self.assertNotEqual(y,1488)  # old blind 62% of screen

    def test_wrong_stage_fails_before_touching_phone(self):
        with self.assertRaisesRegex(ValueError,"stage_not_reached"):
            resolve_touch(geometry(phase=2),3,1080,2400)

    def test_wrong_action_or_disabled_button_fails(self):
        with self.assertRaises(ValueError):
            resolve_touch(geometry(kind="finish"),2,1080,2400)
        d=geometry();d["disabled"]=True
        with self.assertRaises(ValueError):
            resolve_touch(d,2,1080,2400)

    def test_hidden_or_obstructed_button_fails(self):
        for key in ("rootVisible","buttonVisible","hit"):
            with self.subTest(key=key):
                d=geometry();d[key]=False
                with self.assertRaises(ValueError):
                    resolve_touch(d,2,1080,2400)

    def test_37_pixel_control_is_not_a_valid_touch_target(self):
        with self.assertRaisesRegex(ValueError,"44px"):
            resolve_touch(geometry(button_height=37),2,1080,2400)

    def test_wrong_screen_and_unknown_webview_insets_fail(self):
        with self.assertRaises(ValueError):
            resolve_touch(geometry(),2,1080,1920)
        with self.assertRaises(ValueError):
            resolve_touch(geometry(),2,1200,2400)
        with self.assertRaisesRegex(ValueError,"system_insets"):
            resolve_touch(dict(geometry(y=400),innerHeight=600),2,1080,2400)

    def test_target_must_be_inside_actual_live_webview(self):
        with self.assertRaises(ValueError):
            resolve_touch(geometry(y=910),2,1080,2400)
        with self.assertRaises(ValueError):
            resolve_touch(dict(geometry(),x=-1),2,1080,2400)

    def test_real_cdp_is_readonly_and_step4_checks_canonical_done(self):
        js=expression(4)
        self.assertIn("michelsLife.onboarding.v30200",js)
        self.assertIn("=== 'done'",js)
        self.assertNotIn("localStorage.setItem",js)
        self.assertNotIn(".click()",js)

    def test_every_step_uses_the_same_bounded_verified_native_advance(self):
        shell=(ROOT/"android/tools/smoke_candidate_apk_install.sh").read_text()
        block=shell.split("  native_transition(){",1)[1].split(
            '  native_transition 1 2 "step2-after-native-continue.png" 8',1)[0]
        for phrase in (
            "for attempt in 1 2; do",
            'native_onboard "$from" assert',
            'native_onboard "$from" tap-target',
            'if native_onboard "$to" assert; then',
            'capture_png "$OUT/$frame"',
            'cp "$OUT/$frame" "$OUT/${frame%.png}-first-attempt.png"',
            'return 0', 'return 1'
        ):
            self.assertIn(phrase,block)
        self.assertEqual(shell.count('  native_transition 1 2 "step2-after-native-continue.png" 8'),1)
        self.assertEqual(shell.count('  native_transition 2 3 "step3-after-native-continue.png" 8'),1)
        self.assertEqual(shell.count('  native_transition 3 4 "step4-after-native-finish.png" 12'),1)
        self.assertNotIn("localStorage.setItem",block)
        self.assertNotIn(".click()",block)
        self.assertNotIn("continue-on-error",block)

    def simulate_real_native_transition(self,success_after):
        shell=(ROOT/"android/tools/smoke_candidate_apk_install.sh").read_text()
        body=shell.split("  native_transition(){",1)[1].split(
            '  native_transition 1 2 "step2-after-native-continue.png" 8',1)[0]
        source="native_transition(){"+body
        # Only mock the ADB transport and screenshot calls. The real Bash
        # transition policy is executed unmodified, including its two-tap cap.
        harness="""set -euo pipefail
OUT="$1"
threshold="$2"
actual_stage=1
taps=0
native_onboard(){
  local target="$1" mode="$2"
  if [[ "$mode" == assert ]]; then
    [[ "$target" == "$actual_stage" ]]
  else
    [[ "$target" == "$actual_stage" ]] || return 1
    taps=$((taps+1))
    if [[ "$taps" -ge "$threshold" ]]; then actual_stage=2; fi
  fi
}
capture_png(){ : > "$1"; }
sleep(){ :; }
"""
        harness+=source+"""
if native_transition 1 2 "step2-after-native-continue.png" 8; then
  echo "VERDICT=PASS"
else
  echo "VERDICT=FAIL"
fi
echo "TAPS=$taps"
echo "STAGE=$actual_stage"
"""
        with tempfile.TemporaryDirectory() as d:
            proc=subprocess.run(
                ["bash","-c",harness,"native-transition",d,str(success_after)],
                capture_output=True,text=True,timeout=10
            )
        self.assertEqual(proc.returncode,0,proc.stderr)
        return proc.stdout

    def test_live_native_advance_successful_first_touch(self):
        output=self.simulate_real_native_transition(1)
        self.assertIn("VERDICT=PASS",output)
        self.assertIn("TAPS=1",output)
        self.assertIn("STAGE=2",output)

    def test_live_native_advance_recovers_one_lost_touch(self):
        output=self.simulate_real_native_transition(2)
        self.assertIn("VERDICT=PASS",output)
        self.assertIn("TAPS=2",output)
        self.assertIn("STAGE=2",output)

    def test_live_native_advance_fails_red_when_two_touches_are_lost(self):
        output=self.simulate_real_native_transition(3)
        self.assertIn("VERDICT=FAIL",output)
        self.assertIn("TAPS=2",output)
        self.assertIn("STAGE=1",output)

    def test_native_harness_preserves_real_adb_touch_and_three_gate_chain(self):
        shell=(ROOT/"android/tools/smoke_candidate_apk_install.sh").read_text()
        self.assertIn('timeout 15s adb shell input tap "$tap_x" "$tap_y"',shell)
        self.assertIn('native_onboard "$from" assert',shell)
        self.assertIn('native_onboard "$to" assert',shell)
        self.assertIn('native_onboard "$from" tap-target',shell)
        self.assertNotIn('NEXT_Y="$((H * 84 / 100))"',shell)
        self.assertNotIn('FINISH_Y="$((H * 62 / 100))"',shell)
        self.assertNotIn('localStorage.setItem(',shell)


if __name__ == "__main__":
    unittest.main()
