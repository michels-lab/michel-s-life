# Operación GRANADA GRANDE — Android Google Calendar native foundation

Date: 2026-10-21 (America/Monterrey)  
Repository: michels-lab/michel-s-life  
Branch: granada/android-calendar-native-foundation-20261021  
Backlog: #110 (Calendar P1), #54 (Android feature parity), #28 (real-provider parity)

## Why this isolated work block exists

The published Android Direct v0.2.9 does **not** synchronize Google Calendar. The current AndroidBridge explicitly rejects "sync" and the Android UI explains the feature is unavailable, which is correct. Draft PR #134 already modifies AndroidBridge.kt, MainActivity.kt, app/build.gradle.kts and frontend Android update/Developer flows. The draft #135 owns mobile Calendar accessibility and #156 owns shared index.html. Touching their files would create competing changes.

This branch therefore owns only new, disjoint Calendar-native source files, a pure-Kotlin regression runner, one Python structural gate and a new dedicated GitHub workflow. It **does not wire** Google Calendar into the app, enable Calendar Sync, modify Settings buttons, request actual permissions, contact real accounts, change signing metadata or release binaries.

## Functional deliverables implemented on this branch

1. **Deterministic event ownership model** (CalendarSyncRules.kt): stable SHA-256-derived Google-compatible event IDs for canonical mission IDs; app+mission private-property ownership tags; rejection of duplicates, missing ownership, invalid IDs/titles, unreasonable read windows, unsupported inferred timezones and nonexclusive all-day end dates.
2. **Native read/write Calendar provider boundary** (AndroidCalendarGateway.kt): bounded real Google Calendar REST GET with paginated events, explicit UTC range, and no invented success timestamps; mission upsert through app-owned private properties; deterministic create, server-side 409 conflict recovery only after fetching/validating ownership; conditional PATCH/DELETE using eTag; never modify/delete foreign Calendar events; generic HTTP error text without copying raw provider response.
3. **Independent, explicitly consented OAuth** (AndroidCalendarConsent.kt): dedicated Calendar Events grant, separate from Drive app-folder access, with cancellation, unresolved permission, ungranted scope and token absence treated as errors; does not store bearer tokens. Future bridge must wire the actual Activity result and verify selected account identity.
4. **Executable pure Kotlin regression suite** (tools/kotlin/CalendarSyncRulesSpec.kt): deterministic IDs, duplicate/foreign-event refusal, safe titles/IDs, all-day exclusive ends, explicit timezone offsets, expired/invalid windows and length limits.
5. **CI truth gates** (.github/workflows/granada-android-calendar-foundation.yml; tools/test_granada_calendar_native_contract.py): pure-Kotlin suite plus static token/ownership/pagination/bridge-truth contract. The normal Android Build test APK workflow also triggers on new android/app Kotlin files on the open PR and must prove actual compilation. No Windows build is reenabled.

## Validation states

- Code committed to isolated branch: **yes**. 
- Source/contract and pure-Kotlin tests: **pending exact-PR-head workflow result** at initial documentation time; do not claim green based on assertions written.
- New Android classes compiled into an Android APK: **pending actual Android Build CI**.
- Bridge/UI wired to the provider: **no, intentionally deferred** until conflicting #134/#135 branches clear and consent UI is designed.
- Real Google OAuth consent / Calendar backend / Galaxy: **not tested**, requires owner account/device and revocation/permissions/zone handling.
- App release and public update: **no**.

## Safety and follow-up acceptance

Once #134 no longer owns AndroidBridge, MainActivity and the Android build config, integrate this API through an explicit user-triggered Calendar sign-in/sync path. The selected Google account must match the intended Calendar account; Drive and Calendar scopes must not silently piggyback. Define mission field mapping against the canonical shared state; calendar read must not mutate XP, missions, Supabase or notification timers. Maintain idempotent remote IDs; do not send all mission history unless the user selects publication. Add a visible opt-in and clear disconnect/revoke states. Verify real event create, update, remove, duplicate race, all-day and offset handling, offline 401/403/429/recovery, same-account Galaxy↔Windows parity, plus evidence of no foreign edits. Keep #110 OPEN until this is integrated and really validated.

Do not reinterpret "API classes exist" as an app feature or publicly released behavior. The project public baseline remains Windows v3.0.221 and Android Direct v0.2.9. Windows implementation/builds remain paused.
