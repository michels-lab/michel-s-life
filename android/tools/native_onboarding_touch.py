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
import os
import re
import subprocess
import time
import uuid
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlsplit

STEP_JS = r"""(() => {
  const root=document.getElementById('mlv200Onboarding');
  if(!root)return {step:localStorage.getItem('michelsLife.onboarding.v30200')==='done'?'done':'missing'};
  const visible=el=>{
    if(!el||!el.getClientRects().length)return false;
    const style=getComputedStyle(el);
    return style.display!=='none'&&style.visibility!=='hidden';
  };
  const finish=root.querySelector('[data-mlv200-onboard="finish"]');
  const next=root.querySelector('[data-mlv200-onboard="next"]');
  const onFocus=root.querySelector('.mlv200-focus input[type="checkbox"]');
  const step=visible(finish)?3:visible(onFocus)?2:1;
  const target=step===3?finish:next;
  if(!visible(target))return {step,reason:'native continue or finish button not visible'};
  const b=target.getBoundingClientRect();
  const action=step===3?'finish':'next';
  const points=[0.20,0.83,0.50].map(position=>{
    const x=b.left+b.width*position,y=b.top+b.height*0.5;
    const hit=document.elementFromPoint(x,y);
    return {x,y,topmost:!!hit&&hit.closest('[data-mlv200-onboard="'+action+'"]')===target};
  });
  return {step,action,enabled:!target.disabled,
    viewport:{width:innerWidth,height:innerHeight},
    button:{width:b.width,height:b.height},points};
})()"""


PKG = "com.michelslab.michelslife"
SERIAL = "emulator-5554"
BOUNDS = re.compile(r"^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$")
PAGE_URL = "https://appassets.androidplatform.net/assets/app/index.html"
UI_XML = "/sdcard/mlv-native-onboarding-accessibility.xml"
GEOMETRY_CACHE = Path("artifacts/candidate-install/native-accessibility-webview-geometry.json")


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
    if alert.get("package") != "android":
        raise RuntimeError("unverified_system_alert_must_not_be_dismissed")
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



def physical_display(serial):
    """Read CURRENT physical/override Android display dimensions, not guesses."""
    output = adb(serial, "shell", "wm", "size")
    sizes = re.findall(r"(?:Physical|Override) size:\s*(\d+)x(\d+)", output)
    if not sizes:
        raise RuntimeError("native_display_dimensions_unavailable")
    width, height = map(int, sizes[-1])
    if not 320 <= width <= 10000 or not 320 <= height <= 10000:
        raise RuntimeError("native_display_dimensions_invalid")
    return width, height


def verified_webview_bounds(xml, display, pid, stage, cache=GEOMETRY_CACHE):
    """Re-use a prior REAL Android WebView rect only in the same live process.

    UIAutomator occasionally returns a hierarchy containing no WebView class
    after the first onboarding screen, despite a running PID, actual page and
    real screenshots. Our source is the earlier stage's UIAutomator rectangle,
    never a hardcoded coordinate or synthetic DOM click. Android screen
    resolution and process identity must be unchanged.
    """
    if launcher_anr_button(xml) is not None:
        raise RuntimeError("launcher_anr_still_occludes_onboarding")
    width, height = display

    def valid(rect):
        return (len(rect) == 4 and 0 <= rect[0] < rect[2] <= width
                and 0 <= rect[1] < rect[3] <= height
                and rect[2] - rect[0] >= width * .6
                and rect[3] - rect[1] >= height * .35)

    try:
        rect = webview_bounds(xml)
        if not valid(rect):
            raise RuntimeError("native_webview_rectangle_outside_display")
        cache.parent.mkdir(parents=True, exist_ok=True)
        blob = {"source": "real_android_uiautomator_webview",
                "rect": list(rect), "screen": list(display), "pid": pid}
        temp = cache.with_name(cache.name + ".tmp")
        temp.write_text(json.dumps(blob), encoding="utf-8")
        os.replace(temp, cache)
        return rect
    except RuntimeError as error:
        if str(error) != "expected_one_real_android_webview_accessibility_bounds":
            raise
        if stage == 0:
            raise
        try:
            saved = json.loads(cache.read_text(encoding="utf-8"))
        except (OSError, ValueError) as failure:
            raise RuntimeError("native_prior_verified_webview_geometry_missing") from failure
        raw_rect = saved.get("rect")
        if (saved.get("source") != "real_android_uiautomator_webview"
                or saved.get("screen") != list(display)
                or saved.get("pid") != pid
                or not isinstance(raw_rect, list)
                or len(raw_rect) != 4
                or not all(type(n) is int for n in raw_rect)
                or not valid(raw_rect)):
            raise RuntimeError("native_previous_webview_geometry_stale_or_invalid")
        print("Reused preceding stage's REAL UIAutomator WebView bounds: same live app PID and screen size")
        return tuple(raw_rect)

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
    # After emulator boot, UIAutomator may temporarily return nonzero while
    # the system launcher is unresponsive. Do not treat that as app failure.
    # Never proceed to a tap without a REAL current accessibility hierarchy.
    for attempt in range(5):
        # A failed dump may leave yesterday's XML at a fixed path; never
        # accept a stale hierarchy as proof that a system dialog is absent.
        fresh = UI_XML.replace(".xml", f"-{uuid.uuid4().hex}.xml")
        try:
            # Alternate two real accessibility tree modes; a failed dump
            # must never stand in for an unobstructed native window.
            mode = ("--compressed",) if attempt % 2 == 0 else ()
            adb(serial, "shell", "uiautomator", "dump", *mode, fresh, timeout=40)
            raw = adb(serial, "shell", "cat", fresh)
            pos = raw.find("<?xml")
            if pos >= 0:
                xml_nodes(raw[pos:])  # Require well-formed real Android XML.
                return raw[pos:]
        except (RuntimeError, subprocess.TimeoutExpired) as error:
            print(f"Native accessibility attempt {attempt+1}/5 failed: {type(error).__name__}")
        finally:
            try:
                adb(serial, "shell", "rm", "-f", fresh, timeout=8)
            except (RuntimeError, subprocess.TimeoutExpired):
                pass
        if attempt < 4:
            time.sleep(3)
    raise RuntimeError("native_accessibility_unavailable_after_bounded_retries")


def dismiss_launcher(serial):
    for attempt in range(3):
        xml = accessibility_xml(serial)
        rect = launcher_anr_button(xml)
        if rect is None:
            return xml
        if os.environ.get("GITHUB_ACTIONS") != "true" or serial != SERIAL:
            raise RuntimeError("launcher_dismissal_requires_isolated_hosted_emulator")
        inventory = adb(serial, "devices", "-l")
        rows = [line.split() for line in inventory.splitlines()
                if line.strip() and not line.startswith("List of devices attached")]
        if len(rows) != 1 or rows[0][:2] != [serial, "device"]:
            raise RuntimeError("launcher_dismissal_requires_isolated_hosted_emulator")
        x, y = native_point(rect, 0.5, 0.5)
        adb(serial, "shell", "input", "tap", str(x), str(y))
        print(f"Native Pixel Launcher SYSTEM ANR dismissed via real accessibility touch ({attempt+1})")
        time.sleep(2)
    xml = accessibility_xml(serial)
    if launcher_anr_button(xml) is not None:
        raise RuntimeError("pixel_launcher_anr_reappeared_after_bounded_dismissals")
    return xml


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
    if not isinstance(pages, list):
        raise RuntimeError("invalid_native_devtools_page_list")
    matches = [p for p in pages if isinstance(p, dict) and p.get("type") == "page" and
               isinstance(p.get("url"), str) and
               p["url"].split("#", 1)[0].split("?", 1)[0] == PAGE_URL]
    if len(matches) != 1:
        raise RuntimeError("expected_one_installed_native_webview_page")
    endpoint = matches[0].get("webSocketDebuggerUrl", "")
    parsed = urlsplit(endpoint)
    if parsed.scheme != "ws" or parsed.hostname not in ("localhost", "127.0.0.1") or parsed.port != port:
        raise RuntimeError("invalid_local_native_devtools_endpoint")
    ws = create_connection(endpoint, timeout=15, suppress_origin=True)
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
            value = msg.get("result", {}).get("result", {}).get("value")
            if not isinstance(value, dict):
                raise RuntimeError("invalid_native_read_only_dom_result")
            return value
        raise RuntimeError("native_cdp_query_timed_out")
    finally:
        ws.close()


def require_focused_app(serial):
    # A live PID or CDP connection alone does not prove Android will route
    # the native touch to the target window. Never retain other window titles.
    raw = adb(serial, "shell", "dumpsys", "window", "windows", timeout=12)
    field = r"(?m)^[ \t]*mCurrentFocus[ \t]*=[ \t]*([^\r\n]*)"
    focus = re.findall(field, raw)
    if not focus:
        # Some Android builds report focus under display state instead of
        # the list of windows. Only fall back if the field was absent.
        displays = adb(serial, "shell", "dumpsys", "window", "displays", timeout=12)
        focus = re.findall(field, displays)
    if not focus:
        raise RuntimeError("native_app_window_focus_field_missing")
    component = re.escape(PKG) + r"/(?:" + re.escape(PKG) + r")?\.MainActivity"
    if len(focus) != 1 or not re.search(r"(?<![\w.])" + component + r"(?:\s|\})", focus[0]):
        raise RuntimeError("native_app_window_not_focused")


def touch_stage(port, expected, output, serial=SERIAL):
    pid = adb(serial, "shell", "pidof", PKG).strip()
    if not re.fullmatch(r"[1-9][0-9]*", pid):
        raise RuntimeError("native_app_process_missing")
    adb(serial, "forward", f"tcp:{port}", f"localabstract:webview_devtools_remote_{pid}")
    attempts = []
    report = {"native": True, "completed": False, "before": expected,
              "after": expected, "attempts": attempts}
    try:
        goal = expected + 1 if expected < 3 else "done"
        for index in range(3):
            # Read the actual system window each time. Never scale CSS against
            # the entire display: status/navigation bars offset the WebView.
            xml = dismiss_launcher(serial)
            if adb(serial, "shell", "pidof", PKG).strip() != pid:
                raise RuntimeError("native_app_process_changed_during_onboarding")
            require_focused_app(serial)
            display = physical_display(serial)
            rect = verified_webview_bounds(xml, display, pid, expected-1)
            actual = read_native_webview(port, STEP_JS)
            step = actual.get("step")
            if step == goal and attempts:
                last = attempts[-1]
                last["after"] = goal
                report.update(completed=True, after=goal, action="finish" if expected == 3 else "next",
                              devicePixels={"width": display[0], "height": display[1]},
                              touch={"x": last["x"], "y": last["y"]})
                return
            if step != expected or not actual.get("enabled"):
                raise RuntimeError(f"native_onboarding_step_{expected}_not_ready_or_occluded")
            viewport = actual.get("viewport", {})
            vw, vh = viewport.get("width"), viewport.get("height")
            if not all(type(n) in (int, float) and 200 <= n <= 2600 for n in (vw,vh)):
                raise RuntimeError("invalid_real_webview_viewport")
            points = actual.get("points", [])
            if index >= len(points) or not points[index].get("topmost"):
                continue
            point = points[index]
            x, y = native_point(rect, point["x"]/vw, point["y"]/vh)
            require_focused_app(serial)
            adb(serial, "shell", "input", "tap", str(x), str(y))
            attempt = {"x": x, "y": y, "after": expected}
            attempts.append(attempt)
            for _ in range(14):
                time.sleep(.55)
                after = read_native_webview(port, STEP_JS).get("step")
                attempt["after"] = after
                report["after"] = after
                if after == goal:
                    report.update(completed=True, action=actual["action"],
                                  devicePixels={"width": display[0], "height": display[1]},
                                  touch={"x": x, "y": y})
                    print(f"PASS: actual ADB touch moved installed WebView {expected} -> {goal}")
                    return
                if after != expected:
                    raise RuntimeError("native_onboarding_changed_unexpectedly")
        raise RuntimeError(f"native_onboarding_step_{expected}_did_not_advance")
    finally:
        target = Path(output)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(report, indent=2)+"\n", encoding="utf-8")
        try:
            adb(serial, "forward", "--remove", f"tcp:{port}", timeout=12)
        except (RuntimeError, subprocess.TimeoutExpired):
            print("Native CDP cleanup unavailable; original result retained")


def self_test():
    assert native_point((0,78,1080,2335), .8,.8) == (864,1884)
    assert "elementFromPoint" in STEP_JS
    assert ".click(" not in STEP_JS
    print("PASS: native geometry includes system insets; read-only DOM and actual ADB touch")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", nargs="?", choices=("dismiss", "tap"))
    parser.add_argument("--serial", default=SERIAL)
    parser.add_argument("--stage", type=int, choices=(0,1,2))
    parser.add_argument("--step", type=int, choices=(1,2,3))
    parser.add_argument("--port", type=int, default=9222)
    parser.add_argument("--output")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if not re.fullmatch(r"emulator-\d+", args.serial):
        raise RuntimeError("unsafe_android_serial")
    if args.self_test:
        self_test()
    elif args.action == "dismiss":
        dismiss_launcher(args.serial)
    else:
        expected = args.step if args.step is not None else (args.stage+1 if args.stage is not None else None)
        if expected is None:
            parser.error("--step or --stage required")
        output = args.output or f"artifacts/candidate-install/onboarding-real-touch-step{expected}.json"
        touch_stage(args.port, expected, output, args.serial)


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, ValueError, TimeoutError, subprocess.TimeoutExpired) as error:
        raise SystemExit("NATIVE_ONBOARDING_FAIL: " + str(error))
