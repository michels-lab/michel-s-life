#!/usr/bin/env python3
"""GRANADA isolated Android16 native WebView restart diagnostic (read-only).

No raw logcat, JavaScript values, URLs, credentials, localStorage or screenshots
are ever included in evidence. Never a native acceptance/persistence pass.
"""
from __future__ import annotations
import argparse
import json
import re
import subprocess
from pathlib import Path
from urllib.request import urlopen

SERIAL="emulator-5554"
PKG="com.michelslab.michelslife"
CATEGORIES={
    "anr":re.compile(r"(?i)\bANR\b|not responding"),
    "renderer_exit":re.compile(r"(?i)RenderProcessGone|renderer process (?:crash|died|gone)|Render process exited|cr_ChildProcessService"),
    "fatal_signal":re.compile(r"(?i)Fatal signal \d+|FATAL EXCEPTION|chromium.*\bSIG(SEGV|ABRT|BUS)"),
    "webview_provider":re.compile(r"(?i)WebViewFactory|WebViewUpdateService|cr_WebView"),
    "oom_event":re.compile(r"(?i)OutOfMemoryError|low memory killer|lmkd.*kill|oom_kill"),
    "webview_error":re.compile(r"(?i)AwContents.*(error|fail)|chromium.*(error|fail)|WebView.*(error|fail)"),
}
EXPECTED_FIELDS=frozenset({"phase","boot_completed","app_pid_present",
                           "cdp_http_reachable","cdp_page_count",
                           "native_window_visible","adb_reachable",
                           "logcat_reachable","events"})
PHASES=frozenset({"pre_seed","after_force_stop_1","after_launch_1","webview_capture_failed_1",
                  "after_force_stop_2","after_launch_2","webview_capture_failed_2",
                  "pre_capture","native_frame_failed","webview_capture_failed",
                  "after_launch","after_force_stop"})

def categorize_logcat(text):
    if not isinstance(text,str):raise ValueError("bad_log_type")
    # Cap scan so a hostile log buffer cannot exhaust the diagnostic runner.
    segment=text[-650_000:]
    return {name:sum(1 for line in segment.splitlines()[-5000:]
                     if pattern.search(line)) for name,pattern in CATEGORIES.items()}

def safe_report(report):
    if not isinstance(report,dict) or set(report)!=EXPECTED_FIELDS:
        raise ValueError("wrong_report_schema")
    if report["phase"] not in PHASES:
        raise ValueError("unknown_native_phase")
    for key in ("boot_completed","app_pid_present","cdp_http_reachable",
                "native_window_visible","adb_reachable","logcat_reachable"):
        if report[key] is not None and type(report[key]) is not bool:
            raise ValueError("invalid_native_boolean")
    count=report["cdp_page_count"]
    if count is not None and (type(count)!=int or count<0 or count>200):
        raise ValueError("invalid_cdp_count")
    events=report["events"]
    if not isinstance(events,dict) or set(events)!=set(CATEGORIES):
        raise ValueError("invalid_event_categories")
    if any(type(v)!=int or v<0 or v>5000 for v in events.values()):
        raise ValueError("invalid_event_count")
    return report

def adb(*args,timeout=11):
    try:
        run=subprocess.run(["adb","-s",SERIAL,*args],
                           capture_output=True,text=True,timeout=timeout,check=False)
        if run.returncode: return None
        return run.stdout[:750_000]
    except (OSError,subprocess.TimeoutExpired,UnicodeError):
        return None

def collect(phase):
    if phase not in PHASES:raise ValueError("invalid_phase")
    state=adb("get-state",timeout=7)
    available=state is not None and state.strip()=="device"
    boot=adb("shell","getprop","sys.boot_completed",timeout=7) if available else None
    pid=adb("shell","pidof",PKG,timeout=7) if available else None
    focused=adb("shell","dumpsys","window","windows",timeout=9) if available else None
    logs=adb("logcat","-d","-t","1200",timeout=12) if available else None
    cdp_ok=None
    pages=None
    if available:
        try:
            with urlopen("http://127.0.0.1:9222/json/list",timeout=3) as res:
                value=json.load(res)
            if not isinstance(value,list):raise ValueError("invalid_cdp_response")
            cdp_ok=True
            pages=sum(1 for p in value if isinstance(p,dict) and p.get("type")=="page")
            pages=min(200,pages)
        except (OSError,ValueError,TimeoutError):
            cdp_ok=False
    data={
        "phase":phase,
        "boot_completed":boot.strip()=="1" if boot is not None else None,
        "app_pid_present":bool(re.fullmatch(r"\d+(?:\s+\d+)*",pid.strip()))
             if pid is not None else None,
        "cdp_http_reachable":cdp_ok,
        "cdp_page_count":pages,
        "native_window_visible":bool(PKG in focused and
            re.search(r"(?i)mCurrentFocus|mFocusedApp",focused))
             if focused is not None else None,
        "adb_reachable":available,
        "logcat_reachable":logs is not None,
        "events":categorize_logcat(logs or ""),
    }
    return safe_report(data)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--phase",required=True,choices=sorted(PHASES))
    parser.add_argument("--output",required=True)
    args=parser.parse_args()
    report=collect(args.phase)
    path=Path(args.output)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(report,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print("GRANADA_NATIVE_WEBVIEW_DIAGNOSTIC "+
          json.dumps({k:report[k] for k in ("phase","boot_completed",
                     "app_pid_present","cdp_http_reachable","cdp_page_count",
                     "native_window_visible","adb_reachable")},sort_keys=True))
    # Diagnostic intentionally never exits 0 as native app *acceptance*;
    # the separate two-force-stop and exact XP hash gate remains mandatory.

if __name__=="__main__":
    main()
