#!/usr/bin/env python3
"""Fail-closed native Calendar read contract: real bridge and least-privilege grant."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
native=root/"android/app/src/main/java/com/michelslab/michelslife"
sources={name:(native/name).read_text(encoding="utf-8") for name in (
    "AndroidCalendarConsent.kt","AndroidCalendarGateway.kt",
    "CalendarSyncRules.kt","AndroidBridge.kt","MainActivity.kt")}
consent=sources["AndroidCalendarConsent.kt"]
gateway=sources["AndroidCalendarGateway.kt"]
rules=sources["CalendarSyncRules.kt"]
bridge=sources["AndroidBridge.kt"]
activity=sources["MainActivity.kt"]
ui=(root/"src/MichelsLife/frontend/index.html").read_text(encoding="utf-8")
checks={
 "read-only OAuth scope":'Scope(CalendarSyncRules.READ_SCOPE)' in consent and
    'const val READ_SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly"' in rules,
 "never request write scope on read":'Scope(CalendarSyncRules.EVENTS_SCOPE)' not in consent,
 "consent is explicit":'calendarConsent.authorize(true)' in bridge and
    "if (!interactive)" in consent,
 "overlapping consent guarded":"if (busy || pending != null)" in consent,
 "OAuth result routed":"calendarConsent.onActivityResult(requestCode, resultCode, data)" in activity,
 "independent from Drive":"AndroidBridge(this, webView, auth, calendarConsent, cloud, meta, executor)" in activity,
 "real Calendar GET":"https://www.googleapis.com/calendar/v3" in gateway and
    '"GET", pageUrl' in gateway,
 "bounded provider read":"pages > maxPages" in gateway and
    "collected.size == maxEvents" in gateway,
 "safe event links":"https://calendar.google.com/" in gateway and "safeLink" in gateway,
 "real bridge action":'"calendarRead" -> activity.runOnUiThread' in bridge and
    "calendarGateway.readEvents(" in bridge,
 "account identity required":'if (email.isBlank()) throw SecurityException' in bridge,
 "no automatic provider writes":'"sync" -> respondError(' in bridge and
    'bridge(\'calendarRead\',syncRange())' in ui,
 "no auto OAuth": "if(opts.silent)return null;" in ui,
 "ephemeral Android event view":"calendarEvents:[]" in ui and
    "return runtime.calendarEvents" in ui and
    "runtime.calendarOwnerId!==current" in ui,
 "prevents account switch disclosure":"accountNow!==accountAtStart" in ui,
 "real read button":"Read Google Calendar" in ui,
 "does not store bearer credentials":"SharedPreferences" not in consent+gateway and
    "putString(" not in consent+gateway and "Log." not in consent+gateway
}
for name,value in checks.items():
    if not value: raise SystemExit("FAIL: native Calendar integration: "+name)
print("PASS: "+str(len(checks))+" native Calendar read-only consent/bridge/privacy contracts")
