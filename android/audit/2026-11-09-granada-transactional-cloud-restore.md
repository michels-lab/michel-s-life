# Michel's Life — P0 GRANADA transactional cloud restore (2026-11-09)

## Reproduced source failure path
The production shared-storage restoration previously removed **every allowed shared key first** and then wrote incoming values. A quota/storage exception after the removal could leave Journal, board and theme incompletely restored. A legacy/partial backup could erase keys it never contained. This is a source-level risk, not a verified leak/loss on a real user device.

## Implementation candidate
- Keep the canonical shared-storage allowlist; never copy account tokens, Supabase revision/device IDs, Google credentials, notification identifiers or unknown future localStorage keys.
- Stage and validate all allowlisted string entries, and verify the canonical board JSON is a non-array object before any writes.
- Apply board and shareable preferences in **one synchronously rolled-back transaction**: first record originals; if any remove/write fails, restore the entire touched allowlisted subset or fail closed with an explicit rollback-failure message. No `localStorage.clear()`.
- Legacy/partial archives merge ONLY fields present, preserving omitted Journal, themes and mission board. Only explicitly version-2 **full** cloud backups replace absent shareable fields; stored OS/device context remains untouched.
- Supabase `applySnapshot`, Drive `applyCloudRestore`, Backup Timeline `applyBackupJson` and portable import all call the same atomic board+preferences restore instead of separately overwriting the board afterward.
- Google Drive cloud acceptance now retries local rollback to its previous allowlisted snapshot if metadata acknowledgment throws, rather than keeping an unconfirmed partial restore. No background auto-upload or new provider permissions.

## Regression gates
- `tools/test_granada_transactional_cloud_restore.mjs`: execute the extracted **production** policy in Node VM, covering malicious/foreign keys, partial legacy merge, version-2 replace, invalid JSON, quota rollback, persistent-storage failure reporting, empty rollback and canonical entrypoint wiring.
- `tools/ui_granada_transactional_restore_smoke.mjs`: real mobile Chromium runtime running canonical Michel's Life, exercise partial archive with an adversarial synthetic token/device ID, inject a one-shot Storage write failure, assert exact recovery of the original shared board/Journal plus identity.
- Required GitHub Actions: `granada-transactional-cloud-restore.yml`, existing Android UI smoke, source validation, Supabase account-boundary, Data Health, Project/Story roundtrip. Do not weaken them.

## Explicit boundary
Exact-head CI results and native installed Android16/Galaxy tests are NOT proven at authoring time. No true Supabase A/B or Google Drive provider traffic was sent; account switching and RLS still need live consented acceptance (#108/#55). Windows packaging and signed APK release remain paused. Do not close #55 merely because this partial restoration fix merges.
