# Operación GRANADA — native Android Google Drive privacy and non-destructive backup boundary

Date: 2026-10-20 (America/Monterrey). Separate, independent functionality block. User-owned Android device data is preserved, Windows packaging paused. Cloud provider login not used in tests.

## Verified production source problem (not only a test gap)

Prior native `CloudSync.kt` `validateBackup` required only a nonempty JSON object with `state` or `localStorage`. `DriveCloudEngine.sync` transmitted the original `backupJson` wholesale, with **no native enforcement** of the frontend's shared-storage allowlist. A malicious or obsolete bridge caller could submit `localStorage` containing Supabase refresh tokens, device IDs or notification identifiers for native upload to Google Drive. The shared WebView producer already sanitizes outgoing normal snapshots, but a single client-side filter is not defense in depth.

Also, **before-overwrite history creation was surrounded by `catch (_: Exception) { }`**. If downloading/uploading the recovery copy failed, the native engine silently ignored the failure and could proceed to replace the remote master, contradicting the advertised protection against data loss.

## Five actual source deliverables

1. Real Kotlin native `validateBackup(raw, forUpload)` checks UTF-8 byte length (max 10 MiB), JSON shape and Michel's Life marker for upload before Drive network operations. Unknown root/device-local keys and non-string local-storage values are rejected on upload (no silent transfer of credentials).
2. Explicit native `sharedStorageKeys` exact 24-key allowlist matching the canonical frontend `MLV_SHARED_STORAGE_KEYS`; **all new keys are private by default**. Local progression state is retained and can carry mission/journal/theme values without inventing a separate data model.
3. Legacy Drive downloads / restore points are **sanitized**, rather than wholly rejected. Non-shareable provider/session/device fields in their top-level and localStorage envelope are stripped before the JSON reaches the WebView; user-authored state and supported preferences remain.
4. Raw remote content hash remains the raw remote identity; sanitized backup-history content gets its OWN accurate SHA-256 hash, not the old raw (possibly credential-bearing) bytes.
5. Creation of the **before-overwrite recovery copy is mandatory**: the exception-swallowing wrapper was removed so history failures block a destructive upload. Existing 5-minute dedupe still prevents excessive churn; pruning keeps its independent best-effort semantics.

## Acceptance gates and limits

- New `tools/test_granada_android_drive_boundary.py`: 12 strict production-source contract tests for exact frontend/native allowlist parity, exclusion of credentials and device-local identifiers, rejected unknown uploads, restored legacy filtering, first-network-call ordering, raw vs sanitized hash behavior and no suppressed backup-history failure. Static contract tests are NOT equivalent to runtime Kotlin method unit tests; dedicated CI also assembles the actual production Android debug APK to compile Kotlin.
- Existing `tools/test_cloud_restore_storage.mjs` and `android/tools/validate_sync_contract.py` are run again in separate CI. They must retain original device login/session/revision keys, no accidental `localStorage.clear()`.
- No real Google Drive account, Galaxy phone, signed Direct package, production customer data or legacy real-backup file used in CI. The Kotlin native platform path is not a substitute for actual provider/live account end-to-end acceptance.
- Only `CloudSync.kt` plus *new* isolated unit/CI/audit files changed: no collision with Developer Twin PR #134's `AndroidBridge.kt`, Gradle, native manifests, no change to Cloud Auth, and no overlap with #156 frontend Data Health/PR #157 native emulator QA.
- Check exact-head dedicated CI before merging. If the Android runner cannot fetch SDK/dependencies, keep it red and classify as environment blocker. No early release, no Windows installer or signed APK creation.

Related issue [#55](https://github.com/michels-lab/michel-s-life/issues/55), [#108](https://github.com/michels-lab/michel-s-life/issues/108), [#139](https://github.com/michels-lab/michel-s-life/issues/139).
