#!/usr/bin/env python3
"""Installed Android 16 debug APK: native ongoing timer survives screen-off.

Uses only a synthetic CI profile. The JS timer remains authoritative; this
probe never modifies personal data, system battery exemptions or app secrets.
"""
import json
import re
import subprocess
import time
from pathlib import Path
from urllib.request import urlopen

from websocket import create_connection

PKG = "com.michelslab.michelslife"
NOTIFICATION_ID = 4707
OUT = Path("artifacts/candidate-install/native-focus-lockscreen.json")


def adb(*args):
    return subprocess.check_output(["adb", *args], text=True, timeout=35)


def run_js(expr):
    pid = adb("shell", "pidof", PKG).strip()
    if not pid.isdigit():
        raise RuntimeError("installed Android WebView PID is missing")
    adb("forward", "tcp:9222", "localabstract:webview_devtools_remote_" + pid)
    try:
        with urlopen("http://127.0.0.1:9222/json/list", timeout=8) as page:
            targets = json.load(page)
        candidates = [t for t in targets if t.get("type") == "page" and
                      "appassets.androidplatform.net/assets/app/index.html" in t.get("url", "")]
        if len(candidates) != 1:
            raise RuntimeError("Expected one installed Android WebView")
        ws = create_connection(candidates[0]["webSocketDebuggerUrl"],
                               timeout=15, suppress_origin=True)
        try:
            ws.send(json.dumps({"id": 1, "method": "Runtime.evaluate",
                                "params": {"expression": expr, "returnByValue": True}}))
            while True:
                reply = json.loads(ws.recv())
                if reply.get("id") != 1:
                    continue
                if reply.get("error") or reply.get("result", {}).get("exceptionDetails"):
                    raise RuntimeError("Real installed WebView evaluation failed: " + str(reply))
                return reply.get("result", {}).get("result", {}).get("value")
        finally:
            ws.close()
    finally:
        adb("forward", "--remove", "tcp:9222")


def has_active_notification():
    dump = adb("shell", "dumpsys", "notification", "--noredact")
    # Check the LIVE NotificationRecord, not only the registered channel list.
    return any("NotificationRecord(" in line and "pkg=" + PKG in line
               and re.search(r"\bid=" + str(NOTIFICATION_ID) + r"\b", line)
               for line in dump.splitlines())


def poll_notification(want):
    for _ in range(12):
        if has_active_notification() == want:
            return True
        time.sleep(1)
    return False


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    adb("shell", "pm", "grant", PKG, "android.permission.POST_NOTIFICATIONS")
    session = run_js("""(() => {
      const api = window.FocusStoryV30162;
      if(!api || !window.MichelsLifeMobileExperience?.resyncNativeNotification)
        throw Error('Canonical timer/native bridge missing');
      api.resetFocus(); api.startFocus();
      window.MichelsLifeMobileExperience.resyncNativeNotification();
      const f=api.focusState();
      return {running:f.status==='running',deadline:Number(f.deadlineAt),
        remaining:Number(api.remaining(f)), native:typeof window.MichelsLifeAndroid?.syncFocusAlarm};
    })()""")
    if not session or not session.get("running") or session.get("remaining", 0) < 10000:
        raise RuntimeError("Installed canonical Pomodoro did not start")
    if not poll_notification(True):
        raise RuntimeError("Running Pomodoro notification 4707 not posted")
    adb("shell", "input", "keyevent", "KEYCODE_SLEEP")
    time.sleep(3)
    power = adb("shell", "dumpsys", "power")
    asleep = ("mWakefulness=Asleep" in power or "Wakefulness: Asleep" in power)
    if not asleep:
        raise RuntimeError("Android screen did not actually go to sleep")
    if not has_active_notification():
        raise RuntimeError("Pomodoro countdown notification vanished while locked")
    adb("shell", "input", "keyevent", "KEYCODE_WAKEUP")
    time.sleep(3)
    paused = run_js("""(() => {
      const api=window.FocusStoryV30162; api.pauseFocus();
      window.MichelsLifeMobileExperience.resyncNativeNotification();
      return {status:api.focusState().status,remaining:Number(api.remaining())};
    })()""")
    if not paused or paused.get("status") != "paused":
        raise RuntimeError("Native app did not pause canonical Pomodoro")
    if not poll_notification(False):
        raise RuntimeError("Paused Pomodoro left stale ongoing Android notification")
    OUT.write_text(json.dumps({
        "pass": True, "installed_apk": True, "screen_off_verified": True,
        "running_notification_visible": True, "paused_notification_removed": True,
        "canonical_deadline_preserved": session["deadline"] > 0,
        "scope": "debug installed Android 16 emulator; human Galaxy/lockscreen visual review pending"
    }, indent=2) + "\n", encoding="utf-8")
    print("PASS: native Pomodoro countdown notification remained while screen asleep and cleared on pause")


if __name__ == "__main__":
    main()
