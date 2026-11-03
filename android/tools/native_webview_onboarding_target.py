#!/usr/bin/env python3
"""Locate the real installed Android WebView onboarding CTA. Never click via CDP.

Read-only CDP obtains live geometry; the calling Bash script performs a REAL
adb shell input tap. Missing/hidden/blocked controls fail closed. Never log
localStorage contents, user data, CDP messages, tokens or arbitrary DOM text.
"""
import argparse
import json
import math
import sys
import time
from urllib.request import urlopen


def resolve_touch(geometry, stage, width, height):
    """Convert a verified WebView CSS hit target to calibrated screen pixels."""
    if not isinstance(geometry, dict) or geometry.get("phase") != stage:
        raise ValueError("onboarding_stage_not_reached")
    if not geometry.get("rootVisible") or not geometry.get("buttonVisible"):
        raise ValueError("native_button_not_visible")
    if geometry.get("disabled") or not geometry.get("hit"):
        raise ValueError("native_button_disabled_or_obstructed")
    if geometry.get("kind") != ("finish" if stage == 3 else "next"):
        raise ValueError("wrong_onboarding_action")
    keys = ("innerWidth", "innerHeight", "x", "y", "buttonHeight")
    if any(isinstance(geometry.get(k), bool) or
           not isinstance(geometry.get(k), (int, float)) or
           not math.isfinite(geometry[k]) for k in keys):
        raise ValueError("invalid_native_viewport_geometry")
    iw, ih = geometry["innerWidth"], geometry["innerHeight"]
    x, y = geometry["x"], geometry["y"]
    if iw <= 0 or ih <= 0 or geometry["buttonHeight"] < 44:
        raise ValueError("native_button_below_44px_touch_minimum")
    if width != 1080 or height != 2400:
        raise ValueError("uncalibrated_android_pixel6_screen")
    if x <= 0 or x >= iw or y <= 0 or y >= ih:
        raise ValueError("button_outside_visible_webview")
    scale = width / iw
    bottom_bar_total = height - ih * scale
    if bottom_bar_total < -5 or bottom_bar_total > 360:
        raise ValueError("unexpected_android_system_insets")
    # Pixel 6 has an Android system status bar and gesture navigation bar.
    # Center the WebView in the remaining vertical range; this represents a
    # genuine native ADB tap and does not modify/reach into the DOM.
    top_inset = max(0, bottom_bar_total / 2)
    px, py = round(x * scale), round(top_inset + y * scale)
    if px < 18 or px > width - 18 or py < 55 or py > height - 55:
        raise ValueError("unsafe_native_touch_pixel")
    return px, py


def expression(stage):
    return """(() => {
      const stage = %d;
      const root = document.getElementById('mlv200Onboarding');
      const visible = el => !!(el && el.getClientRects().length &&
        getComputedStyle(el).visibility !== 'hidden');
      const completed = !visible(root) &&
        localStorage.getItem('michelsLife.onboarding.v30200') === 'done';
      if (stage === 4) return {phase: completed ? 4 : 0,
        rootVisible: visible(root), done: completed};
      if (!visible(root)) return {phase:0, rootVisible:false};
      const focus = visible(root.querySelector('.mlv200-focus input[type="checkbox"]'));
      const schedule = visible(root.querySelector('#mlv200Schedule'));
      const phase = schedule ? 3 : focus ? 2 : 1;
      const kind = stage === 3 ? 'finish' : 'next';
      const button = root.querySelector('.mlv200-onboard-actions [data-mlv200-onboard="' + kind + '"]');
      const rect = button?.getBoundingClientRect();
      const hit = rect ? document.elementFromPoint(rect.left + rect.width / 2,
        rect.top + rect.height / 2) : null;
      return {phase,kind,rootVisible:true,buttonVisible:visible(button),
        disabled:!!button?.disabled,hit:!!(hit && (hit === button || button.contains(hit))),
        innerWidth:innerWidth,innerHeight:innerHeight,
        buttonHeight:rect?.height || 0,
        x:rect ? rect.left + rect.width/2 : 0,
        y:rect ? rect.top + rect.height/2 : 0};
    })()""" % stage


def read_installed_page(port, stage):
    # Import only in the debug APK CI job with pinned websocket-client.
    from websocket import create_connection
    with urlopen("http://127.0.0.1:%d/json/list" % port, timeout=8) as resp:
        pages = json.load(resp)
    pages = [p for p in pages if p.get("type") == "page" and
             p.get("url", "").startswith(
                 "https://appassets.androidplatform.net/assets/app/index.html")]
    if len(pages) != 1:
        raise ValueError("installed_webview_page_unavailable")
    endpoint = pages[0].get("webSocketDebuggerUrl")
    if not endpoint:
        raise ValueError("installed_webview_debug_socket_unavailable")
    socket = create_connection(endpoint, timeout=12, suppress_origin=True)
    try:
        socket.send(json.dumps({"id": 1, "method": "Runtime.evaluate",
                                "params": {"expression": expression(stage),
                                           "returnByValue": True}}))
        deadline = time.monotonic() + 12
        while time.monotonic() < deadline:
            result = json.loads(socket.recv())
            if result.get("id") != 1:
                continue
            body = result.get("result", {})
            if result.get("error") or body.get("exceptionDetails"):
                raise ValueError("onboarding_geometry_evaluation_failed")
            value = body.get("result", {}).get("value")
            if not isinstance(value, dict):
                raise ValueError("onboarding_geometry_response_invalid")
            return value
        raise ValueError("onboarding_geometry_deadline")
    finally:
        socket.close()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--port", type=int, default=9222)
    p.add_argument("--stage", type=int, choices=(1,2,3,4), required=True)
    p.add_argument("--mode", choices=("tap-target", "assert"), required=True)
    p.add_argument("--width", type=int, default=1080)
    p.add_argument("--height", type=int, default=2400)
    a = p.parse_args()
    if a.mode == "tap-target" and a.stage == 4:
        p.error("Completed onboarding has no tap target")
    last = "native_webview_unavailable"
    for _ in range(8):
        try:
            data = read_installed_page(a.port,a.stage)
            if a.stage == 4:
                if data.get("phase") == 4 and data.get("done") is True:
                    print("PASS: real Android onboarding completion flag verified", file=sys.stderr)
                    return
                last = "native_finish_not_persisted"
            elif a.mode == "assert":
                if data.get("phase") == a.stage and data.get("rootVisible"):
                    print("PASS: native onboarding stage %d verified" % a.stage,file=sys.stderr)
                    return
                last = "native_onboarding_stage_mismatch"
            else:
                px, py = resolve_touch(data,a.stage,a.width,a.height)
                print("PASS: located real native stage %d %s tap at %d,%d" %
                      (a.stage,data["kind"],px,py),file=sys.stderr)
                print("%d %d" % (px,py))
                return
        except (ValueError,OSError,TimeoutError,ConnectionError) as exc:
            # Never print the raw exception, which may contain URLs or app data.
            last = str(exc) if isinstance(exc,ValueError) else "native_cdp_unavailable"
        time.sleep(1)
    raise SystemExit("FAIL: real installed Android onboarding stage %d: %s" %
                     (a.stage,last))


if __name__ == "__main__":
    main()
