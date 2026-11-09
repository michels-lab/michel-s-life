"""Fail-closed native Android touch targeting and system ANR regressions."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "onboarding_touch", ROOT / "android/tools/native_onboarding_touch.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def hierarchy(title="Pixel Launcher isn't responding", close_id="android:id/aerr_close"):
    return f"""<?xml version="1.0" encoding="utf-8"?>
<hierarchy>
  <node package="android" class="android.widget.FrameLayout" bounds="[0,0][1080,2400]">
    <node package="android" resource-id="android:id/alertTitle" text="{title}"
       bounds="[133,1068][947,1131]" />
    <node package="android" resource-id="{close_id}" text="Close app"
       bounds="[70,1170][1010,1296]" />
  </node>
</hierarchy>"""


class NativeOnboardingTouchTests(unittest.TestCase):
    def test_exact_pixel_launcher_anr_closed_at_real_accessibility_button(self):
        button = mod.launcher_anr_button(hierarchy())
        self.assertEqual(button, (70, 1170, 1010, 1296))
        self.assertEqual(mod.native_point(button, 0.5, 0.5), (540, 1233))

    def test_real_app_anr_fails_closed(self):
        with self.assertRaisesRegex(RuntimeError, "other_app_anr"):
            mod.launcher_anr_button(hierarchy("Michel's Life isn't responding"))

    def test_other_launcher_dialog_not_silently_touched(self):
        self.assertIsNone(mod.launcher_anr_button(hierarchy("Camera needs permission")))

    def test_pixel_launcher_anr_without_system_close_button_fails(self):
        with self.assertRaisesRegex(RuntimeError, "no_system_close_button"):
            mod.launcher_anr_button(hierarchy(close_id="android:id/not_close"))

    def test_bad_geometry_fails_closed(self):
        for bad in ("", "[10,10][10,100]", "something", "[-1,2][4,8]"):
            with self.subTest(bounds=bad), self.assertRaises(RuntimeError):
                mod.bounds(bad)
        with self.assertRaisesRegex(RuntimeError, "button_not_inside"):
            mod.native_point((0,0,1080,2400), 1.2, 0.5)

    def test_real_webview_accessibility_bounds_not_guessed(self):
        xml = """<?xml version="1.0" ?><hierarchy>
          <node class="android.webkit.WebView" package="com.michelslab.michelslife"
          bounds="[0,78][1080,2335]" /></hierarchy>"""
        self.assertEqual(mod.webview_bounds(xml), (0,78,1080,2335))
        self.assertEqual(mod.native_point((0,78,1080,2335), .8,.8),(864,1884))
        with self.assertRaisesRegex(RuntimeError, "expected_one_real_android_webview"):
            mod.webview_bounds("<hierarchy />")

    def test_transient_accessibility_boot_error_retries_before_real_xml(self):
        xml = '<?xml version="1.0"?><hierarchy />'
        with patch.object(mod, "adb", side_effect=[
            RuntimeError("native_adb_command_failed"), "UIA dump", xml
        ]) as command, patch.object(mod.time, "sleep") as sleep:
            self.assertEqual(mod.accessibility_xml(mod.SERIAL), xml)
            self.assertEqual(command.call_count, 3)
            sleep.assert_called_once_with(3)

    def test_permanent_accessibility_failure_never_authorizes_touch(self):
        with patch.object(mod, "adb", side_effect=RuntimeError("ADB offline")) as command, \
                patch.object(mod.time, "sleep") as sleep:
            with self.assertRaisesRegex(RuntimeError, "native_accessibility_unavailable"):
                mod.accessibility_xml(mod.SERIAL)
            self.assertEqual(command.call_count, 5)
            self.assertEqual(sleep.call_count, 4)

    def test_cdp_only_reads_dom_and_adb_delivers_real_touch(self):
        for step in (1, 2):
            script = mod.cdp_expression(step)
            self.assertIn('data-mlv200-onboard="next"', script)
            self.assertNotIn(".click(", script)
            self.assertIn("getBoundingClientRect", script)
        script = mod.cdp_expression(3)
        self.assertIn('data-mlv200-onboard="finish"', script)
        self.assertIn("onboarding.v30200", script)
        self.assertNotIn("setItem(", script)


if __name__ == "__main__":
    unittest.main()
