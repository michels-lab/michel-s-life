#!/usr/bin/env python3
"""Fail-closed native WebView persistence probe for a debuggable Android TEST APK.

Inspects the ACTUAL installed WebView via loopback-forwarded Chrome DevTools.
Only synthetic test fixtures are supported. Persist counts/digests, never raw
mission text, user data, provider tokens, or localStorage payloads.
"""
import argparse
import hashlib
import json
import time
from pathlib import Path
from urllib.request import urlopen

PAGE_SCRIPT = r"""(() => {
  const raw = localStorage.getItem('vida_rpg_personal_progress_v2');
  const done = localStorage.getItem('michelsLife.onboarding.v30200') === 'done';
  let saved;
  try { saved = JSON.parse(raw || 'null'); }
  catch (_) { return {ready:false, reason:'canonical JSON invalid'}; }
  if (!saved || !Array.isArray(saved.missions))
    return {ready:false, reason:'canonical missions not yet persisted'};
  const collections = {};
  for (const [key, items] of Object.entries(saved)) {
    if (!Array.isArray(items) || !/mission|goal|contract|premium/i.test(key)) continue;
    collections[key] = items.map((item, n) =>
      String(item?.id ?? item?.contractId ?? ('index:' + n))).sort();
  }
  const ids = saved.missions.map(m => String(m?.id ?? '')).sort();
  const kpis = [...document.querySelectorAll('#tab-dashboard .v131-kpi')]
    .map(el => String(el.textContent || '').replace(/\s+/g,' ').trim())
    .filter(v => /mission|contract/i.test(v));
  return {ready:true, done,
    generic: saved.settings?.v30200GenericProfile === true,
    missions: saved.missions.length,
    ids, duplicateMissionIds: new Set(ids).size !== ids.length,
    collections, kpis
  };
})()"""

def digest(data):
    return hashlib.sha256(json.dumps(data, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()

def sanitize(raw):
    if not isinstance(raw, dict) or not raw.get("ready"):
        raise RuntimeError("Canonical state unavailable: " + str(raw.get("reason") if isinstance(raw, dict) else raw))
    if not raw.get("done"):
        raise RuntimeError("Native onboarding Finish did not persist its completion flag")
    if not raw.get("generic"):
        raise RuntimeError("Native generic-profile onboarding flag is absent")
    ids = raw.get("ids")
    if not isinstance(ids, list) or not ids:
        raise RuntimeError("No persisted starter mission IDs after native Finish")
    if raw.get("duplicateMissionIds"):
        raise RuntimeError("Duplicate mission IDs in native persisted board")
    collections = raw.get("collections", {})
    if not isinstance(collections, dict) or "goals" not in collections:
        raise RuntimeError("Canonical persisted goals collection is unavailable")
    if len(collections["goals"]) != 0:
        raise RuntimeError("Premium contracts unexpectedly populated although native Finish fixture leaves them unchecked")
    return {
        "onboardingComplete": True,
        "genericProfile": True,
        "missionCount": len(ids),
        "missionIdsDigest": digest(ids),
        "collections": {key: {"count": len(values), "idsDigest": digest(values)}
                        for key, values in sorted(collections.items())},
        "dashboardKpiCount": len(raw.get("kpis", [])),
        "dashboardKpisDigest": digest(raw.get("kpis", []))
    }

def read_webview(port):
    # websocket-client is installed only in the isolated CI emulator job,
    # never in or packaged with the Android app.
    from websocket import create_connection
    with urlopen(f"http://127.0.0.1:{port}/json/list", timeout=8) as response:
        pages = json.load(response)
    candidates = [p for p in pages if p.get("type") == "page"
                  and p.get("url", "").startswith("https://appassets.androidplatform.net/assets/app/index.html")]
    if len(candidates) != 1:
        raise RuntimeError(f"Expected exactly one actual Michel's Life WebView page, got {len(candidates)}")
    ws_url = candidates[0].get("webSocketDebuggerUrl", "")
    if not ws_url:
        raise RuntimeError("Native WebView CDP endpoint unavailable")
    ws = create_connection(ws_url, timeout=15, suppress_origin=True)
    try:
        ws.send(json.dumps({"id": 1, "method": "Runtime.evaluate",
                            "params": {"expression": PAGE_SCRIPT, "returnByValue": True}}))
        until = time.monotonic() + 15
        while time.monotonic() < until:
            msg = json.loads(ws.recv())
            if msg.get("id") != 1:
                continue
            if msg.get("error") or msg.get("result", {}).get("exceptionDetails"):
                raise RuntimeError("Native CDP Runtime.evaluate failed")
            return msg.get("result", {}).get("result", {}).get("value")
        raise RuntimeError("Native WebView evaluation timed out")
    finally:
        ws.close()

def capture(port, outfile):
    last = None
    for _ in range(10):
        try:
            state = sanitize(read_webview(port))
            Path(outfile).write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
            print("PASS: real installed Android WebView canonical persistence snapshot:", outfile)
            return
        except (RuntimeError, OSError, ValueError) as error:
            last = str(error)
            time.sleep(2)
    raise RuntimeError("Native state capture failed closed: " + str(last))

def compare(before, after, outfile):
    first = json.loads(Path(before).read_text(encoding="utf-8"))
    second = json.loads(Path(after).read_text(encoding="utf-8"))
    checks = {
        "mission_ids_identical": first["missionIdsDigest"] == second["missionIdsDigest"],
        "collections_identical": first["collections"] == second["collections"],
        "dashboard_kpis_identical": first["dashboardKpisDigest"] == second["dashboardKpisDigest"],
        "mission_counts_identical": first["missionCount"] == second["missionCount"],
        "onboarding_completed_both": first["onboardingComplete"] and second["onboardingComplete"]
    }
    result = {"checks": checks, "pass": all(checks.values()), "before": first, "after": second,
              "scope": "real installed debuggable APK WebView, synthetic first-run; NOT signed Direct/Galaxy/live-provider acceptance"}
    Path(outfile).write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    if not result["pass"]:
        raise RuntimeError("Native canonical mission/contract persistence drift: " +
                           ", ".join(k for k,v in checks.items() if not v))
    print("PASS: installed Android APK retained exact canonical mission/contract IDs and dashboard KPIs across force-stop")

def self_test():
    fixture = {"ready": True, "done": True, "generic": True, "missions": 2,
               "ids": ["a","b"], "duplicateMissionIds": False,
               "collections": {"missions":["a","b"],"goals":[]},
               "kpis":["Today's missions 0/2","Contracts 0 active"]}
    cleaned = sanitize(fixture)
    assert cleaned["missionCount"] == 2 and cleaned["collections"]["goals"]["count"] == 0
    assert "a" not in json.dumps(cleaned) and "Today's" not in json.dumps(cleaned)
    try:
        sanitize({**fixture, "collections": {"missions":["a","b"],"goals":["contract1"]}})
    except RuntimeError:
        pass
    else:
        raise AssertionError("Nonempty unsolicited Premium contracts must be rejected")
    assert digest(["a","b"]) != digest(["a","c"])
    print("PASS: synthetic canonical snapshot sanitization and unexpected-seed gate")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["capture","compare","self-test"])
    parser.add_argument("--port", type=int, default=9222)
    parser.add_argument("--output")
    parser.add_argument("--before")
    parser.add_argument("--after")
    args = parser.parse_args()
    if args.action == "self-test":
        self_test()
    elif args.action == "capture":
        if not args.output:
            parser.error("capture requires --output")
        capture(args.port, args.output)
    else:
        if not args.before or not args.after or not args.output:
            parser.error("compare requires --before, --after and --output")
        compare(args.before, args.after, args.output)
