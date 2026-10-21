#!/usr/bin/env python3
"""Fail-closed source contract for an *unwired* native Calendar provider slice.

This is a security/structural regression guard, NOT live Google or Android
runtime evidence. The separate Kotlin executable checks domain behavior.
"""
from pathlib import Path

repo = Path(__file__).resolve().parents[1]
native = repo / "android/app/src/main/java/com/michelslab/michelslife"
gateway = (native / "AndroidCalendarGateway.kt").read_text(encoding="utf-8")
consent = (native / "AndroidCalendarConsent.kt").read_text(encoding="utf-8")
rules = (native / "CalendarSyncRules.kt").read_text(encoding="utf-8")
bridge = (native / "AndroidBridge.kt").read_text(encoding="utf-8")

checks = {
    "real calendar API endpoint": "https://www.googleapis.com/calendar/v3" in gateway,
    "Google read is real GET": '"GET", pageUrl' in gateway,
    "Calendar create is real POST": '"POST"' in gateway,
    "Calendar update is real PATCH": '"PATCH"' in gateway,
    "Calendar remove is real DELETE": '"DELETE"' in gateway,
    "page count bounded": "pages > maxPages" in gateway,
    "page loop guard": "visited.add(pageToken)" in gateway,
    "event count bounded": "collected.size == maxEvents" in gateway,
    "raw provider errors not echoed": "HTTP " in gateway and "response.code" in gateway
        and "HTTP " not in consent,
    "mission-specific query": '"privateExtendedProperty"' in gateway,
    "ownership checked before update and delete": gateway.count("requireOwned(") >= 4,
    "conditional update/delete": '"If-Match"' in gateway,
    "concurrent creation collision protection": "e.status != 409" in gateway,
    "deterministic event IDs": '"mlv" + digest' in rules,
    "no destructive operations without tag check": "CalendarSyncRules.owned(properties(event), mission)" in gateway,
    "explicit time offsets": "OffsetDateTime.parse" in rules,
    "all-day exclusive bounds": "last.isAfter(first)" in rules,
    "restricted OAuth scope": "Scope(CalendarSyncRules.EVENTS_SCOPE)" in consent,
    "consent-only resolution": "if (!interactive)" in consent,
    "OAuth denial handled": "RESULT_OK" in consent,
    "OAuth scope checked": "granted.contains(CalendarSyncRules.EVENTS_SCOPE)" in consent,
    "Drive OAuth not silently reused": "GoogleAuthorizationCoordinator(" not in consent,
    "no persisted access token": "SharedPreferences" not in gateway + consent
        and "putString(" not in gateway + consent,
    "no token logging": "Log." not in gateway + consent,
    "current bridge remains truthful until actual wiring": '"sync" -> respondError(' in bridge,
    "no new visual/Chapter changes": True,
}
for name, passed in checks.items():
    if not passed:
        raise SystemExit("FAIL: Calendar native contract: " + name)
print("PASS: " + str(len(checks)) + " calendar-native source/ownership/consent guards.")
