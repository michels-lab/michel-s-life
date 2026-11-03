#!/usr/bin/env python3
"""Offline checks for REAL Android ADB touch geometry; no emulator required."""
import pathlib
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

    def test_second_continue_retry_is_bounded_and_requires_still_on_step2(self):
        shell=(ROOT/"android/tools/smoke_candidate_apk_install.sh").read_text()
        block=shell.split("  native_onboard 2 tap-target",1)[1].split(
            "  native_onboard 3 tap-target",1)[0]
        self.assertIn("if ! native_onboard 3 assert; then",block)
        self.assertIn('capture_png "$OUT/step3-after-first-continue-attempt.png"',block)
        self.assertIn("native_onboard 2 assert",block)
        self.assertIn("native_onboard 2 tap-target",block)
        self.assertIn('capture_png "$OUT/step3-after-native-continue.png"',block)
        self.assertIn("native_onboard 3 assert",block)
        self.assertEqual(shell.count("native_onboard 2 tap-target"),2)
        self.assertNotIn("localStorage.setItem",block)
        self.assertNotIn(".click()",block)

    def test_finish_retry_is_bounded_and_requires_real_step3(self):
        shell=(ROOT/"android/tools/smoke_candidate_apk_install.sh").read_text()
        block=shell.split("  native_onboard 3 tap-target",1)[1].split(
            '  capture_png "$OUT/step4-after-native-finish.png"',1)[0]
        self.assertIn("if ! native_onboard 4 assert; then",block)
        self.assertIn('capture_png "$OUT/step4-after-first-finish-attempt.png"',block)
        self.assertIn("native_onboard 3 assert",block)
        self.assertIn("native_onboard 3 tap-target",block)
        self.assertIn("sleep 12",block)
        self.assertIn("native_onboard 4 assert",block)
        self.assertNotIn("localStorage.setItem",block)
        self.assertNotIn("window.eval",block)
        self.assertEqual(shell.count("native_onboard 3 tap-target"),2)
        self.assertEqual(shell.count("native_onboard 3 assert"),2)

    def test_native_harness_uses_adb_and_real_step_transition_assertions(self):
        shell=(ROOT/"android/tools/smoke_candidate_apk_install.sh").read_text()
        self.assertIn('timeout 15s adb shell input tap "$tap_x" "$tap_y"',shell)
        for stage in (1,2,3):
            self.assertIn(f"native_onboard {stage} tap-target",shell)
        for stage in (2,3,4):
            self.assertIn(f"native_onboard {stage} assert",shell)
        self.assertNotIn('NEXT_Y="$((H * 84 / 100))"',shell)
        self.assertNotIn('FINISH_Y="$((H * 62 / 100))"',shell)
        self.assertNotIn('localStorage.setItem(',shell)


if __name__ == "__main__":
    unittest.main()
