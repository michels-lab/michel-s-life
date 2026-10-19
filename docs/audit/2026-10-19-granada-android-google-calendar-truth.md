# Operación GRANADA — Honest Android Google Calendar state

Date: 2026-10-19 (America/Monterrey)
Repository: michels-lab/michel-s-life
Issue: #110 (P1 Android native Calendar read/write bridge returns zero fake success); related #54.
Branch: granada/android-calendar-provider-truth-20261019.

## Executed task scope

New isolated browser regression test tools/ui_android_google_calendar_truth_smoke.mjs, wired into the existing browser UI workflow (.github/workflows/ui-smoke.yml). Runs the canonical frontend at an Android 412px viewport, with onboarding completed and a Google connection deliberately presented to the UI.

New contract: even with connected Google status and a nominal mock native webview bridge, Android Google Calendar sync must return an explicit unsupported null response; show a conspicuous error/notice; never mutate prior user calendar events, last-sync timestamp, XP or mission IDs; never invoke a fake native calendar synchronization; and render the Google Settings button disabled with visible unavailable explanation in a role=status element. The test captures no real Google access tokens.

## Separate from real provider parity

This is a **guard against false success** while live Android Google Calendar OAuth/Calendar provider integration remains unimplemented. It does not make Calendar synchronization work, does not authorize Google scopes or publish events, and **must not close #110**. Real Galaxy and Windows consent, event CRUD, timezone, permission revocation, offline retries and provider backend checks remain necessary.

No modifications to native Android source, Kotlin, AndroidBridge, Android UI workflow, Developer Twin (#134), Calendar keyboard (#135), native persistence (#138), Windows build or release artifacts. This is a new independent test and a dedicated UI workflow invocation. Audit exact-head browser CI before integration; no new signed APK from this branch.
