#!/usr/bin/env python3
"""Fail-closed Android Calendar mission write: per-action OAuth and provider ownership."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
native=root/'android/app/src/main/java/com/michelslab/michelslife'
read=lambda f:(native/f).read_text(encoding='utf-8')
calendar_read=read('AndroidCalendarConsent.kt')
calendar_write=read('AndroidCalendarWriteConsent.kt')
bridge=read('AndroidBridge.kt')
activity=read('MainActivity.kt')
gateway=read('AndroidCalendarGateway.kt')
rules=read('CalendarSyncRules.kt')
frontend=(root/'src/MichelsLife/frontend/index.html').read_text(encoding='utf-8')
start=frontend.index('function androidMissionSelection(){')
end=frontend.index('function googlePaneHTML(){',start)
ui=frontend[start:end]
checks={
 'read remains read-only':'Scope(CalendarSyncRules.READ_SCOPE)' in calendar_read and
    'Scope(CalendarSyncRules.EVENTS_SCOPE)' not in calendar_read,
 'write uses separate minimum OAuth scope':'Scope(CalendarSyncRules.EVENTS_SCOPE)' in calendar_write and
    'Scope(CalendarSyncRules.READ_SCOPE)' not in calendar_write and
    'Scope(Scopes.DRIVE_APPFOLDER)' not in calendar_write,
 'write uses independent request code':'REQUEST_CALENDAR_WRITE_CONSENT = 4193' in calendar_write and
    'REQUEST_CALENDAR_CONSENT = 4192' in calendar_read,
 'permissions only per explicit action':'fun authorize(interactive: Boolean' in calendar_write and
    'if (!interactive)' in calendar_write and
    'if (busy || pending != null)' in calendar_write,
 'user can deny consent':'Google Calendar permission was declined or cancelled.' in calendar_write and
    'Google Calendar write permission was not granted' in calendar_write,
 'no provider credential persistence':'SharedPreferences' not in calendar_write+gateway and
    'putString(' not in calendar_write+gateway and
    'Log.' not in calendar_write+gateway,
 'write coordinator initialized separately':'calendarWriteConsent = AndroidCalendarWriteConsent(this)' in activity and
    'calendarWriteConsent.onActivityResult(requestCode, resultCode, data)' in activity,
 'native bridge exposes separate write actions':'"calendarMissionUpsert", "calendarMissionRemove" -> {' in bridge and
    'calendarWriteConsent.authorize(true)' in bridge and
    'fun calendarMissionWriteAvailable(): Boolean = true' in bridge,
 'action requires explicit review payload':'if (!payload.optBoolean("confirmed", false))' in bridge and
    'CalendarSyncRules.missionId(mission)' in bridge and
    'CalendarSyncRules.validateTiming(start, end, allDay)' in bridge,
 'no silent bulk Google writes':'"sync" -> respondError(' in bridge,
 'native enforces exact write scope':'authorized.grantedScopes.contains(CalendarSyncRules.EVENTS_SCOPE)' in bridge,
 'native uses real provider': 'calendarGateway.upsertMission(' in bridge and
    'calendarGateway.removeMission(' in bridge and
    'cloud.fetchUserEmail(authorized.accessToken)' in bridge,
 'scoped event IDs and ownership checks':'fun requireOwned(event: JSONObject, mission: String)' in gateway and
    'CalendarSyncRules.owned(properties(event), mission)' in gateway,
 'does not replace foreign event on conflict': 'if (e.status != 409) throw e' in gateway and
    'requireOwned(existing, mission)' in gateway,
 'uses ETags on provider updates':'managedEvent.optString("etag")' in gateway and
    'remote.optString("etag")' in gateway,
 'only one selected mission in UI':'function androidMissionSelection(){' in ui and
    'function androidMissionWriterHtml(){' in ui and
    'async function androidMissionWriteFromReview(){' in ui,
}
# Explicitly inspect actual production code for two-tap and A/B safeguards.
checks.update({
 'client uses explicit two-tap review':'data-mlv190-google="calendar-review-publish"' in ui and
    'data-mlv190-google="calendar-confirm-mission"' in ui,
 'owner and mission rechecked before provider action':'p.ownerId!==now.ownerId' in ui and
    'p.missionId!==now.missionId' in ui and
    'p.summary!==now.summary' in ui,
 'cross-account late result is rejected':'if(now.ownerId!==String(window.SupabaseSyncV30216?.session?.()?.user?.id||\'\'))' in ui,
 'write and deletion have different native actions':"'calendarMissionRemove':'calendarMissionUpsert'" in ui,
 'no shared data write in mission helper': 'localStorage.setItem' not in ui and
    'settings().events=' not in ui and
    'saveSafe()' not in ui,
 'official app does not auto publish on Android':"if(opts.silent)return null;" in frontend and
    "if(window.__MICHELSLIFE_PLATFORM__!=='android'&&runtime.connected&&settings().autoSync)" in frontend
})
for k,passed in checks.items():
    if not passed:raise SystemExit("FAIL Android Calendar mission write: "+k)
print(f'PASS: {len(checks)}/{len(checks)} native write-scope, provider ownership and explicit UI contracts')
