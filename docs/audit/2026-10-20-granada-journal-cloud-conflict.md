# Operación GRANADA — Same-account Journal conflict recovery

Date: 2026-10-20 (America/Monterrey)
Repo: michels-lab/michel-s-life; issues #28 (live cross-device sync), #54 (Journal mobile parity), #55 (cloud/backup privacy).
Base main: acda7a400d71a508e16ed7122656f1627676080d
Branch: granada/journal-cross-device-conflict-20261020
Scope: tools/ui_supabase_cross_device_smoke.mjs and this dated independent audit. Current shared source, Android native and Windows installer files unchanged.

## Actual scenario implemented in existing real-browser mock-provider test

- After existing same-account Windows+Android mission/XP/offline tests finish, use the **canonical** `JournalV30189.save(date, title, body)` API to save a synthetic new day entry from Windows; publish with the real shared `SupabaseSyncV30216.push`, requiring exactly one cloud master revision and the actual saved Journal JSON in the snapshot allowlist.
- Android still holds an older cloud revision. Use the canonical Journal API to save a conflicting private body for the **same day** on Android, then trigger the real shared canonical save/sync entrypoints. It must detect a newer remote revision, retain the unsynced Android writing locally, and **not** overwrite the newer cloud Journal or increment the backend write count.
- Explicitly choose Use Cloud. Require a versioned `before_download_local` cloud-history backup containing the **conflicting Android Journal text** before replacing local data. Reload the Android browser/runtime with its existing localStorage and require the new Windows-authoritative Journal/date/revision to be restored.
- Ensure adopting cloud did not upload silently. This tests day text and revision, not merely mission count or XP.
- Two separate real Chromium contexts, one real shared app domain codebase, mock HTTP Supabase backend. No account credentials or real personal diary data are accessed.

## Ownership and boundaries

Developer Twin PR #134 owns Android Kotlin/bridge/native + shared logs and a test of cloud restore. Calendar/Journal accessibility PR #135 owns android/mobile-sections.js and its section design smoke. Native signed persistence PR #138 owns android/tools/native_webview_state_probe.py. None of those files touched. Windows packaging remains explicitly paused.

## Acceptance and evidence limits

Run the exact commit's existing `ui-smoke.yml` browser test and Android UI/source smoke. Source write alone is not a pass. If a real backend race or missing backup is detected, preserve the red result and diagnose; do not drop Journal assertions to obtain a green status. Even green mock-provider tests do not constitute signed Galaxy↔Windows real Supabase acceptance or close #28/#54/#55.
