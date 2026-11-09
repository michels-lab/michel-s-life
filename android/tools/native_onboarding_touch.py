#!/usr/bin/env python3
"""Native Android onboarding driver: real ADB touch, real WebView geometry.

Dismiss ONLY an Android system dialog explicitly naming Pixel Launcher. Never
dismiss Michel's Life / WebView ANRs and never use a synthetic JavaScript click.
Use a read-only Chrome DevTools query to locate the canonical HTML button, then
send the actual touch through adb and verify that native WebView state advanced.
No user content, credentials or raw page state is written to disk.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import time
import xml.etree.ElementTree as ET
from urllib.request import urlopen

PKG = "com.michelslab.michelslife"
SERIAL = "emulator-5554"
BOUNDS = re.compile(r"^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$")
PAGE_URL = "https://appassets.androidplatform.net/assets/app/index.html"
UI_XML = "/sdcard/mlv-native-onboarding-accessibility.xml"


def bounds(text):
    match = BOUNDS.fullmatch(str(text))
    if not match:
        raise RuntimeError("invalid_native_accessibility_bounds")
    x1, y1, x2, y2 = map(int, match.groups())
    if x2 <= x1 or y2 <= y1:
        raise RuntimeError("invalid_native_accessibility_rectangle")
    return x1, y1, x2, y2


def xml_nodes(xml):
    try:
        return list(ET.fromstring(xml).iter("node"))
    except ET.ParseError as error:
        raise RuntimeError("invalid_native_accessibility_xml") from error


def launcher_anr_button(xml):
    nodes = xml_nodes(xml)
    alert = next((n for n in nodes if n.get("resource-id") == "android:id/alertTitle"), None)
    if alert is None:
        return None
    title = str(alert.get("text") or "")
    if title != "Pixel Launcher isn't responding":
        if "isn't responding" in title or "not responding" in title:
            raise RuntimeError("other_app_anr_must_not_be_dismissed")
        return None
    button = next((n for n in nodes if n.get("resource-id") == "android:id/aerr_close"
                   and n.get("text") == "Close app" and n.get("package") == "android"), None)
    if button is None:
        raise RuntimeError("pixel_launcher_anr_has_no_system_close_button")
    return bounds(button.get("bounds"))


def webview_bounds(xml):
    nodes = xml_nodes(xml)
    candidates = [n for n in nodes if n.get("class") == "android.webkit.WebView"
                  and n.get("package") == PKG]
    if len(candidates) != 1:
        raise RuntimeError("expected_one_real_android_webview_accessibility_bounds")
    return bounds(candidates[0].get("bounds"))


def native_point(rect, fraction_x, fraction_y):
    if any(not isinstance(f, (float, int)) or isinstance(f, bool) or
           not 0 < f < 1 for f in (fraction_x, fraction_y)):
        raise RuntimeError("button_not_inside_visible_webview")
    l, t, r, b = rect
    return round(l + (r-l) * fraction_x), round(t + (b-t) * fraction_y)


def adb(serial, *arguments, timeout=35):
    result = subprocess.run(["adb", "-s", serial, *arguments],
                            capture_output=True, text=True, timeout=timeout)
    if result.returncode:
        raise RuntimeError("native_adb_command_failed")
    return result.stdout


def accessibility_xml(serial):
    adb(serial, "shell", "uiautomator", "dump", "--compressed", UI_XML, timeout=40)
    raw = adb(serial, "shell", "cat", UI_XML)
    pos = raw.find("<?xml")
    if pos < 0:
        raise RuntimeError("native_accessibility_hierarchy_unavailable")
    return raw[pos:]


def dismiss_launcher(serial):
    for attempt in range(3):
        xml = accessibility_xml(serial)
        rect = launcher_anr_button(xml)
        if rect is None:
            return
        x, y = native_point(rect, 0.5, 0.5)
        adb(serial, "shell", "input", "tap", str(x), str(y))
        print(f"Native Pixel Launcher SYSTEM ANR dismissed via real accessibility touch ({attempt+1})")
        time.sleep(2)
    if launcher_anr_button(accessibility_xml(serial)) is not None:
        raise RuntimeError("pixel_launcher_anr_reappeared_after_bounded_dismissals")


def cdp_expression(stage):
    # Read only: HTML button rectangle and stage; no synthetic JS click.
    action = "finish" if stage == 3 else "next"
    script = r"""(() => {
      const stage = Number((document.querySelector('#mlv200Onboarding .mlv200-step-pill')
        ?.textContent || '').match(/^\s*(\d+)\s*\//)?.[1] || 0);
      const done = localStorage.getItem('michelsLife.onboarding.v30200') === 'done';
      const target = document.querySelector('#mlv200Onboarding [data-mlv200-onboard="__ACTION__"]');
      if (!target || !target.getClientRects().length)
        return {stage, done, visible: false};
      const box = target.getBoundingClientRect();
      const x = box.left + box.width / 2, y = box.top + box.height / 2;
      const topmost = document.elementFromPoint(x, y);
      return {stage, done, visible: box.width >= 35 && box.height >= 35
        && !!topmost && (target === topmost || target.contains(topmost)),
        x: x / window.innerWidth, y: y / window.innerHeight};
    })()"""
    return script.replace("__ACTION__", action)


def read_native_webview(port, expression):
    from websocket import create_connection
    with urlopen(f"http://127.0.0.1:{port}/json/list", timeout=8) as response:
        pages = json.load(response)
    matches = [p for p in pages if p.get("type") == "page" and
               str(p.get("url", "")).startswith(PAGE_URL)]
    if len(matches) != 1:
        raise RuntimeError("expected_one_installed_native_webview_page")
    ws = create_connection(matches[0]["webSocketDebuggerUrl"],
                           timeout=15, suppress_origin=True)
    try:
        ws.send(json.dumps({"id": 1, "method": "Runtime.evaluate",
                            "params": {"expression": expression, "returnByValue": True}}))
        until = time.monotonic() + 15
        while time.monotonic() < until:
            msg = json.loads(ws.recv())
            if msg.get("id") != 1:
                continue
            if msg.get("error") or msg.get("result", {}).get("exceptionDetails"):
                raise RuntimeError("native_read_only_dom_query_failed")
            return msg.get("result", {}).get("result", {}).get("value") or {}
        raise RuntimeError("native_cdp_query_timed_out")
    finally:
        ws.close()


def actual_tap(serial, stage):
    # Stage 0/1/2 maps to visible 1/3, 2/3, 3/3.
    dismiss_launcher(serial)
    pid = adb(serial, "shell", "pidof", PKG).strip()
    if not re.fullmatch(r"\d+", pid):
        raise RuntimeError("native_app_process_missing")
    port = 9223
    adb(serial, "forward", f"tcp:{port}", f"localabstract:webview_devtools_remote_{pid}")
    try:
        current = read_native_webview(port, cdp_expression(stage+1))
        if current.get("stage") != stage+1 or not current.get("visible"):
            raise RuntimeError(f"native_onboarding_step_{stage+1}_not_ready_or_occluded")
        rect = webview_bounds(accessibility_xml(serial))
        x, y = native_point(rect, current.get("x"), current.get("y"))
        adb(serial, "shell", "input", "tap", str(x), str(y))
        # Check the actual installed WebView after a native touchscreen event.
        for _ in range(12):
            time.sleep(1)
            after = read_native_webview(port, cdp_expression(min(stage+2, 3)))
            if stage < 2 and after.get("stage") == stage+2:
                print(f"Native ADB touch advanced actual onboarding to {stage+2}/3")
                return
            if stage == 2 and after.get("done"):
                print("Native ADB touch completed and persisted onboarding")
                return
        raise RuntimeError(f"native_onboarding_touch_did_not_advance_stage_{stage+1}")
    finally:
        adb(serial, "forward", "--remove", f"tcp:{port}", timeout=12)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("dismiss", "tap"))
    parser.add_argument("--serial", default=SERIAL)
    parser.add_argument("--stage", type=int, choices=(0,1,2))
    args = parser.parse_args()
    if not re.fullmatch(r"emulator-\d+", args.serial):
        raise RuntimeError("unsafe_android_serial")
    if args.action == "tap":
        if args.stage is None:
            parser.error("--stage required for tap")
        actual_tap(args.serial, args.stage)
    else:
        dismiss_launcher(args.serial)


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, ValueError, TimeoutError, subprocess.TimeoutExpired) as error:
        raise SystemExit("NATIVE_ONBOARDING_FAIL: " + str(error))
