"""Fail-closed native Android touch targeting and system ANR regressions."""
import importlib.util
from pathlib import Path
import unittest
import tempfile
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
            RuntimeError("native_adb_command_failed"), "", "UIA dump", xml, ""
        ]) as command, patch.object(mod.time, "sleep") as sleep:
            self.assertEqual(mod.accessibility_xml(mod.SERIAL), xml)
            self.assertEqual(command.call_count, 5)
            sleep.assert_called_once_with(3)

    def test_permanent_accessibility_failure_never_authorizes_touch(self):
        with patch.object(mod, "adb", side_effect=RuntimeError("ADB offline")) as command, \
                patch.object(mod.time, "sleep") as sleep:
            with self.assertRaisesRegex(RuntimeError, "native_accessibility_unavailable"):
                mod.accessibility_xml(mod.SERIAL)
            self.assertEqual(command.call_count, 10)
            self.assertEqual(sleep.call_count, 4)

    def test_verified_webview_geometry_survives_missing_stage_two_class(self):
        xml = """<?xml version="1.0" ?><hierarchy>
          <node class="android.webkit.WebView" package="com.michelslab.michelslife"
          bounds="[0,78][1080,2335]" /></hierarchy>"""
        with tempfile.TemporaryDirectory() as tmp:
            cache = Path(tmp) / "bounds.json"
            first = mod.verified_webview_bounds(xml, (1080,2400), "1234", 0, cache)
            self.assertEqual(first,(0,78,1080,2335))
            saved = cache.read_text()
            self.assertIn("real_android_uiautomator_webview",saved)
            second = mod.verified_webview_bounds("<hierarchy/>", (1080,2400), "1234", 1, cache)
            self.assertEqual(second, first)

    def test_cached_webview_geometry_rejects_pid_and_screen_changes(self):
        xml = """<?xml version="1.0" ?><hierarchy>
          <node class="android.webkit.WebView" package="com.michelslab.michelslife"
          bounds="[0,78][1080,2335]" /></hierarchy>"""
        with tempfile.TemporaryDirectory() as tmp:
            cache = Path(tmp)/"bounds.json"
            mod.verified_webview_bounds(xml,(1080,2400),"1234",0,cache)
            for screen,pid in (((1080,2400),"5678"),((1200,2400),"1234"),((1080,2200),"1234")):
                with self.subTest(screen=screen,pid=pid):
                    with self.assertRaisesRegex(RuntimeError,"stale_or_invalid"):
                        mod.verified_webview_bounds("<hierarchy/>",screen,pid,1,cache)

    def test_never_use_geometry_cache_without_first_real_android_bounds(self):
        with tempfile.TemporaryDirectory() as tmp:
            cache = Path(tmp)/"bounds.json"
            with self.assertRaisesRegex(RuntimeError,"expected_one_real_android_webview"):
                mod.verified_webview_bounds("<hierarchy/>",(1080,2400),"1234",0,cache)
            with self.assertRaisesRegex(RuntimeError,"native_prior_verified"):
                mod.verified_webview_bounds("<hierarchy/>",(1080,2400),"1234",1,cache)

    def test_reappearing_system_anr_blocks_cached_touch(self):
        xml = """<?xml version="1.0" ?><hierarchy>
          <node class="android.webkit.WebView" package="com.michelslab.michelslife"
          bounds="[0,78][1080,2335]" /></hierarchy>"""
        with tempfile.TemporaryDirectory() as tmp:
            cache = Path(tmp)/"bounds.json"
            mod.verified_webview_bounds(xml,(1080,2400),"1234",0,cache)
            with self.assertRaisesRegex(RuntimeError,"launcher_anr_still"):
                mod.verified_webview_bounds(hierarchy(),(1080,2400),"1234",1,cache)

    def test_corrupted_geometry_cache_is_not_reused(self):
        with tempfile.TemporaryDirectory() as tmp:
            cache = Path(tmp)/"bounds.json"
            cache.write_text('{"source":"real_android_uiautomator_webview","screen":[1080,2400],"pid":"1234","rect":[-40,78,1080,2400]}')
            with self.assertRaisesRegex(RuntimeError,"stale_or_invalid"):
                mod.verified_webview_bounds("<hierarchy/>",(1080,2400),"1234",1,cache)

    @patch.object(mod,"adb",return_value="Physical size: 1080x2400\nOverride size: 1080x2300")
    def test_native_display_detected_with_override(self, fake_adb):
        self.assertEqual(mod.physical_display("emulator-5554"),(1080,2300))
        fake_adb.assert_called_once_with("emulator-5554","shell","wm","size")

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



    def test_current_cli_touches_webview_insets_not_full_display(self):
        actual = {"step": 1, "enabled": True, "action": "next",
                  "viewport": {"width": 360, "height": 800},
                  "points": [{"x": 288, "y": 640, "topmost": True}]}
        with tempfile.TemporaryDirectory() as d:
            output = Path(d)/"report.json"
            with patch.object(mod, "dismiss_launcher"), \
                    patch.object(mod, "require_focused_app"), \
                    patch.object(mod, "adb", return_value="1234") as command, \
                    patch.object(mod, "physical_display", return_value=(1080,2400)), \
                    patch.object(mod, "accessibility_xml", return_value="<hierarchy/>"), \
                    patch.object(mod, "verified_webview_bounds", return_value=(0,78,1080,2335)), \
                    patch.object(mod, "read_native_webview", side_effect=[actual, {"step":2}]), \
                    patch.object(mod.time, "sleep"):
                mod.touch_stage(9222, 1, output)
            command.assert_any_call(mod.SERIAL,"shell","input","tap","864","1884")
            import json
            self.assertTrue(json.loads(output.read_text())["completed"])

    def test_current_driver_never_taps_occluded_dom(self):
        actual = {"step": 1, "enabled": True, "action": "next",
                  "viewport": {"width":360,"height":800},
                  "points": [{"x":288,"y":640,"topmost":False}]*3}
        with tempfile.TemporaryDirectory() as d:
            with patch.object(mod, "dismiss_launcher"), \
                    patch.object(mod, "require_focused_app"), \
                    patch.object(mod, "adb", return_value="1234") as command, \
                    patch.object(mod, "physical_display", return_value=(1080,2400)), \
                    patch.object(mod, "accessibility_xml", return_value="<hierarchy/>"), \
                    patch.object(mod, "verified_webview_bounds", return_value=(0,78,1080,2335)), \
                    patch.object(mod, "read_native_webview", return_value=actual):
                with self.assertRaisesRegex(RuntimeError,"did_not_advance"):
                    mod.touch_stage(9222,1,Path(d)/"report.json")
            self.assertFalse(any("tap" in c.args for c in command.call_args_list))

    def test_unique_dump_path_and_cleanup_prevent_stale_xml(self):
        xml = '<?xml version="1.0"?><hierarchy />'
        with patch.object(mod, "adb", side_effect=["dump", xml, "", "dump", xml, ""]) as command:
            mod.accessibility_xml(mod.SERIAL)
            mod.accessibility_xml(mod.SERIAL)
        calls = [c.args for c in command.call_args_list]
        first, second = calls[0][-1], calls[3][-1]
        self.assertNotEqual(first, second)
        self.assertEqual(calls[1][-1], first)
        self.assertEqual(calls[2][-1], first)
        self.assertEqual(calls[4][-1], second)
        self.assertEqual(calls[5][-1], second)

    def test_dismiss_returns_same_fresh_nonobstructed_hierarchy(self):
        xml = "<hierarchy/>"
        with patch.object(mod, "accessibility_xml", return_value=xml) as read:
            self.assertEqual(mod.dismiss_launcher(mod.SERIAL), xml)
        read.assert_called_once_with(mod.SERIAL)

    def test_unverified_alert_package_is_never_dismissed(self):
        xml = hierarchy().replace('package="android" resource-id="android:id/alertTitle"',
                                  'package="com.example" resource-id="android:id/alertTitle"')
        with self.assertRaisesRegex(RuntimeError, "unverified_system_alert"):
            mod.launcher_anr_button(xml)

    def test_focus_requires_exact_app_activity(self):
        for raw in ("  mCurrentFocus=Window{abc u0 "+mod.PKG+"/.MainActivity}",
                    "  mCurrentFocus=Window{abc u0 "+mod.PKG+"/"+mod.PKG+".MainActivity}"):
            with patch.object(mod,"adb",return_value=raw):
                mod.require_focused_app(mod.SERIAL)
        for raw in ("mCurrentFocus=null","mCurrentFocus=Window{abc u0 android/com.android.Alert}",
                    "mCurrentFocus=Window{abc u0 "+mod.PKG+".other/.MainActivity}",
                    "mCurrentFocus=Window{abc u0 "+mod.PKG+"/.OtherActivity}"):
            with patch.object(mod,"adb",return_value=raw), self.assertRaisesRegex(RuntimeError,"not_focused"):
                mod.require_focused_app(mod.SERIAL)

    def test_missing_window_field_uses_display_focus(self):
        app = "mCurrentFocus=Window{abc u0 " + mod.PKG + "/.MainActivity}"
        with patch.object(mod, "adb", side_effect=["Window list", app]) as cmd:
            mod.require_focused_app(mod.SERIAL)
            cmd.assert_called_with(mod.SERIAL, "shell", "dumpsys", "window", "displays", timeout=12)
        for value in ("mCurrentFocus=null", "mCurrentFocus=", app + "\n" + app):
            with self.subTest(value=value), patch.object(mod, "adb", side_effect=[value]) as cmd:
                with self.assertRaisesRegex(RuntimeError, "not_focused"):
                    mod.require_focused_app(mod.SERIAL)
                self.assertEqual(cmd.call_count, 1)
        with patch.object(mod, "adb", side_effect=["windows", "displays"]):
            with self.assertRaisesRegex(RuntimeError, "focus_field_missing"):
                mod.require_focused_app(mod.SERIAL)

    def test_launcher_never_closed_on_manual_or_shared_host(self):
        with patch.object(mod,"accessibility_xml",return_value=hierarchy()), \
             patch.object(mod.os,"environ",{}), patch.object(mod,"adb") as cmd:
            with self.assertRaisesRegex(RuntimeError,"isolated_hosted"):
                mod.dismiss_launcher(mod.SERIAL)
            cmd.assert_not_called()
        with patch.object(mod,"accessibility_xml",return_value=hierarchy()), \
             patch.object(mod.os,"environ",{"GITHUB_ACTIONS":"true"}), \
             patch.object(mod,"adb",return_value=mod.SERIAL+" device\nphysical device") as cmd:
            with self.assertRaisesRegex(RuntimeError,"isolated_hosted"):
                mod.dismiss_launcher(mod.SERIAL)
            self.assertFalse(any("tap" in call.args for call in cmd.call_args_list))

    def test_full_tree_fallback_retries_real_native_dump(self):
        xml='<?xml version="1.0"?><hierarchy />'
        with patch.object(mod,"adb",side_effect=[RuntimeError("idle"),"", "dump",xml,""]) as cmd, \
             patch.object(mod.time,"sleep"):
            self.assertEqual(mod.accessibility_xml(mod.SERIAL),xml)
        self.assertIn("--compressed",cmd.call_args_list[0].args)
        self.assertNotIn("--compressed",cmd.call_args_list[2].args)

    def test_current_probe_is_read_only(self):
        self.assertIn("elementFromPoint", mod.STEP_JS)
        self.assertNotIn(".click(", mod.STEP_JS)
        self.assertNotIn("setItem(", mod.STEP_JS)

if __name__ == "__main__":
    unittest.main()
