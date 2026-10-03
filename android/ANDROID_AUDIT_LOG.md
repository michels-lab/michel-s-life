# Michel's Life Android — Development Audit Log

> Permanent Android-specific record of what has been done, what is pending, what was validated, and what still needs verification.
>
> This log is separate from the repository-wide `GIT_AUDIT_LOG.md`. Every meaningful Android change must update this file in the same development cycle.

## Status convention

- **DONE** — implemented and committed.
- **VALIDATED** — tested with concrete evidence.
- **IN PROGRESS** — implementation has started but is not complete.
- **PENDING** — requested/required but not yet implemented.
- **NEEDS DEVICE TEST** — code exists, but behavior still needs verification on a real Android device.
- **BLOCKED** — cannot be completed until an external prerequisite is available.

## Current snapshot — 2026-10-03

### Product state

- **DONE** — Native Android host exists under `android/`.
- **DONE** — Android packages the current Michel's Life web AppBundle in a native WebView instead of maintaining a separate product implementation.
- **DONE** — Android JavaScript compatibility bridge exposes the desktop-style WebView message contract.
- **DONE** — Google Drive app-data sync primitives were ported to Android.
- **DONE** — Android local restore points and cloud history plumbing exist.
- **DONE** — Android build was stabilized on API / target SDK 36.
- **DONE** — Debug test APK v0.1.0 has been produced.
- **DONE** — APK signing-certificate fingerprints were extracted for Android OAuth setup.
- **DONE** — Play Store AAB generation was added to CI.
- **DONE** — Release signing configuration can be supplied through environment variables without committing secrets.
- **DONE** — Temporary one-off Android/Play publishing workflows were removed after use.
- **PENDING** — Complete the Android-only mobile UX redesign requested after testing.
- **PENDING** — Produce and validate a properly signed production AAB for Google Play.
- **PENDING** — Finish Play Console publishing requirements and internal testing.
- **NEEDS DEVICE TEST** — Verify real Google authorization + Drive synchronization end-to-end on Android.
- **NEEDS DEVICE TEST** — Verify Android navigation, responsive layout, back behavior, state persistence, and animation behavior after the mobile UX work.

## Requested Android-only UX work

These changes apply to the Android app only. They must not alter the approved desktop/Windows layout.

### Layout and primary screen

- **PENDING** — Fix checklist rows/cards that appear misaligned or visually crooked on the phone layout.
- **PENDING** — Reduce unnecessary vertical space so the primary/current-day screen is visible immediately instead of requiring an initial scroll.
- **PENDING** — Rework mobile spacing, touch targets, card widths, and wrapping so the interface feels designed for a phone rather than a desktop page squeezed into a WebView.
- **PENDING** — Preserve the approved Michel's Life visual identity while making the Android layout compact and native-feeling.

### Navigation

- **PENDING** — Replace the always-consuming desktop-style navigation area with a compact Android navigation model.
- **PENDING** — Support a collapsible/expandable menu.
- **PENDING** — Support moving between the major app areas with left/right swipe gestures where that does not conflict with controls.
- **PENDING** — Use icon-first navigation with short/small labels where useful, rather than large desktop navigation text.
- **PENDING** — Keep the active section obvious and make all primary destinations reachable without excessive scrolling.

### Android update behavior

- **PENDING** — Replace the current placeholder Android update-status behavior with the final distribution behavior.
- **PENDING** — Once Play distribution is active, rely on Google Play versioning/update delivery for production installs; keep test-build behavior explicit so test APKs are not confused with Play releases.

## Sync / Google account

### Implemented

- **DONE** — Google Identity authorization coordinator exists.
- **DONE** — Drive `appDataFolder` scope is used.
- **DONE** — Master state file contract: `michels_life_cloud_state.json`.
- **DONE** — Cloud backup/history prefix: `michels_life_backup_`.
- **DONE** — Device record prefix: `michels_life_device_`.
- **DONE** — SHA-256 state tracking and the Michel's Life conflict window are represented in Android.
- **DONE** — Android exposes cloud status/connect/disconnect/sync/overview/restore bridge actions.
- **DONE** — Local restore points are kept on-device and pruned.

### Still to verify

- **NEEDS DEVICE TEST** — Confirm Android OAuth client is correctly configured in the Michel's Life Google Cloud project for the production/test signing certificate in use.
- **NEEDS DEVICE TEST** — Connect a real Google account from the Android app and confirm authorization survives normal app reopen/resume flows.
- **NEEDS DEVICE TEST** — Modify state on Windows, sync, open Android, and verify the same state is restored correctly.
- **NEEDS DEVICE TEST** — Modify state on Android, sync, open Windows, and verify bidirectional state integrity.
- **NEEDS DEVICE TEST** — Exercise a real conflict and confirm Android follows the same conflict decision semantics as Windows.
- **NEEDS DEVICE TEST** — Verify cloud backup restore and local restore-point recovery on a physical device.

## Build and Google Play

### Completed build work

#### 2026-10-01 — Android client created
Commit: `7cba3cd` — **Add Michel's Life Android sync client**

- Added native Android application structure.
- Added WebView host.
- Added Android bridge.
- Added Google authorization coordinator.
- Added Drive sync engine and metadata handling.
- Added restore-point support.
- Added the Android build workflow.
- Added Android documentation.
- Added cloud-contract validation tooling.

#### 2026-10-01 — Build stabilization
Commits include:
- `ccc9f6c9` — Fix Android SDK setup for APK build.
- `adf18088` / `161938b9` — Use AGP built-in Kotlin for Android.
- `dd6bfa33` — Fix Android Gradle Kotlin DSL braces.
- `a4906e79` / `dc4f76bd` / `8ce0c2a0` — API-level build experiments.
- `790ff0e7` — Use stable Android-compatible OkHttp.
- `d223351b` — Settle the Android build on stable API 36.

Result:
- **VALIDATED** — CI reached a buildable Android test APK configuration.

#### 2026-10-01 — Signing diagnostics
Commits:
- `54103cf8` — Report Android test signing fingerprints.
- `7438b6c8` — Read Android signing certificate from built APK.
- `3463e5fe` — Document Michel's Life Android v0.1.0 prototype.

Result:
- **DONE** — Signing fingerprint information became available for Android OAuth configuration.

#### 2026-10-03 — Test APK publication
Commits:
- `f0e101e4` — Publish Android test v0.1.0 download.
- `52cd8669` — Remove temporary Android test publisher.

Result:
- **DONE** — A test Android build was published through the release flow, then the one-off publisher was cleaned up.

#### 2026-10-03 — Google Play preparation
Commit:
- `f540d5b1` — Prepare Android App Bundle for Google Play.

Implemented:
- CI builds `:app:bundleRelease`.
- Package identity: `com.michelslab.michelslife`.
- `versionCode = 1`.
- `versionName = 0.1.0`.
- `targetSdk = 36`.
- Upload signing can be injected through:
  - `ANDROID_UPLOAD_KEYSTORE_PATH`
  - `ANDROID_UPLOAD_STORE_PASSWORD`
  - `ANDROID_UPLOAD_KEY_ALIAS`
  - `ANDROID_UPLOAD_KEY_PASSWORD`
- CI can emit an unsigned AAB when production signing secrets are absent.
- SHA-256 is generated for the Play AAB artifact.

Follow-up commits:
- `091b7c03` — Publish Play preparation bundle v0.1.0.
- `2ce0c707` — Remove temporary Play prep publisher.

Result:
- **DONE** — Play-compatible AAB build path exists.
- **PENDING** — Production upload signing and Play Console submission are not yet considered complete.

### Google Play remaining work

- **PENDING** — Create/secure the permanent upload keystore if not already finalized.
- **PENDING** — Store signing values as repository/Actions secrets, never in source.
- **PENDING** — Generate a signed release AAB and verify its certificate/package/version.
- **PENDING** — Upload the build to Play Console internal testing.
- **PENDING** — Complete required store listing/app details, screenshots/assets, privacy/data disclosures, content rating, and testing requirements applicable to the account/app.
- **PENDING** — Install the Play-delivered build on a physical Android device and run the Android validation checklist.
- **PENDING** — Establish the versionCode/versionName bump rule for every future Play release.

## Android validation checklist

Before calling an Android version release-ready:

- [ ] Launch succeeds from a clean install.
- [ ] No blank/white WebView state.
- [ ] Primary dashboard fits the phone layout without unnecessary initial scrolling.
- [ ] Checklists align correctly.
- [ ] Android navigation is compact, usable, and touch-friendly.
- [ ] Menu open/close behavior works.
- [ ] Left/right section swipe behavior works where enabled.
- [ ] Android-only CSS/behavior does not change desktop/Windows.
- [ ] App state survives background/resume.
- [ ] App state survives normal process restart.
- [ ] Back navigation behaves predictably.
- [ ] Google account connect works.
- [ ] Cloud sync Windows → Android works.
- [ ] Cloud sync Android → Windows works.
- [ ] Conflict handling works.
- [ ] Restore points work.
- [ ] Animations remain fluid while changing app sections.
- [ ] Spanish and English both render correctly.
- [ ] No desktop-only installer/update controls are exposed on Android.
- [ ] Production AAB is signed and its package/version are correct.
- [ ] Play internal-test install/update path is verified.


## 2026-10-03 — Harden Google Play signing workflow

Commit: `cbb2bff7` — **Harden Android Play signing workflow**

Requested/observed need:
- The Play build path existed, but CI did not yet turn a securely stored GitHub keystore secret into a signing file.
- The workflow also needed to distinguish signed production bundles from unsigned preparation bundles and validate the resulting package.

Implemented:
- Added support for `ANDROID_UPLOAD_KEYSTORE_BASE64` as the GitHub Actions keystore secret.
- The workflow decodes the secret only into the temporary runner filesystem.
- If a keystore is supplied, store password, key alias, and key password are mandatory; partial signing configuration fails the build instead of silently falling back.
- Signed builds are named `MichelsLife-Android-Play-SIGNED-v0.1.0.aab`.
- Unsigned preparation builds remain explicitly named `MichelsLife-Android-Play-UNSIGNED-v0.1.0.aab`.
- The AAB ZIP structure is tested.
- Signed AABs are checked with `jarsigner -verify -strict`.
- The upload certificate is exported into the build artifacts for verification.
- SHA-256 output remains generated for the AAB.

Validation state:
- **DONE** — source/workflow implementation committed.
- **PENDING** — GitHub had not yet reported a completed workflow execution for this commit at the time this entry was written.
- **PENDING** — a real signed build still requires the GitHub Actions signing secrets.
- **PENDING** — Play Console upload/internal-track verification remains required.

## Rules for this log going forward

For every meaningful Android development action, add an entry containing:

1. date and Android version/build;
2. user-visible problem or requested change;
3. root cause when known;
4. files/components changed;
5. commit(s);
6. test/validation evidence;
7. remaining follow-up;
8. final state: DONE / VALIDATED / IN PROGRESS / PENDING / NEEDS DEVICE TEST / BLOCKED.

Do not mark an item **VALIDATED** only because code exists. Validation requires a concrete build, automated test, or physical-device observation.

Do not silently remove unfinished work. When a pending item is completed, move its status forward and record the completion chronologically.
