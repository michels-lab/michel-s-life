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
- **IN PROGRESS** — Android-only mobile UX redesign is implemented in a first pass and now requires CI + physical-device validation.
- **PENDING** — Produce and validate a properly signed production AAB for Google Play.
- **PENDING** — Finish Play Console publishing requirements and internal testing.
- **NEEDS DEVICE TEST** — Verify real Google authorization + Drive synchronization end-to-end on Android.
- **NEEDS DEVICE TEST** — Verify Android navigation, responsive layout, back behavior, state persistence, and animation behavior after the mobile UX work.

## Requested Android-only UX work

These changes apply to the Android app only. They must not alter the approved desktop/Windows layout.

### Layout and primary screen

- **DONE** — Added Android-only mission/checklist row alignment with fixed touch-sized check controls and a stable two-column mobile grid. **NEEDS DEVICE TEST** for visual confirmation.
- **DONE** — Added Android-only compact dashboard spacing, single-column mobile dashboard flow, reduced card gaps, and a fixed compact top bar. **NEEDS DEVICE TEST** for the exact initial viewport.
- **DONE** — Added Android-only mobile widths, wrapping, touch targets, action wrapping, card sizing, and safe overflow rules. **NEEDS DEVICE TEST**.
- **DONE** — Mobile UX is injected only by `android/android-bridge.js`; the approved desktop/Windows frontend source is untouched. **NEEDS DEVICE TEST** for final polish.

### Navigation

- **DONE** — The desktop sidebar becomes an off-canvas Android drawer below a fixed compact top bar on phone widths. **NEEDS DEVICE TEST**.
- **DONE** — Added hamburger-triggered drawer, backdrop close, navigation close, and edge-swipe open/close behavior. **NEEDS DEVICE TEST**.
- **DONE** — Added guarded left/right swipe navigation across major app areas, ignoring interactive controls and horizontal scrollers. **NEEDS DEVICE TEST**.
- **IN PROGRESS** — Android now uses a compact icon-first top-bar entry point while reusing the existing sidebar destinations inside the drawer. Further label/icon trimming remains a device-polish task.
- **DONE** — Added current-section title in the Android top bar and kept all primary destinations reachable from the drawer. **NEEDS DEVICE TEST**.

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


## 2026-10-03 — Android mobile UX first implementation pass

Commits:
- `123b6678` — **Add Android mobile navigation and responsive UX**
- `3592a474` — **Coordinate Android back behavior with mobile UI**
- `50f302e0` — **Add Android mobile UX contract validator**
- `d30055fa` — **Validate Android mobile UX in CI**

Requested/observed problems:
- Checklist/mission rows were visually crooked on the phone layout.
- The initial mobile screen consumed too much vertical space before the primary content.
- Desktop-style navigation occupied too much space on Android.
- Android needed a collapsible menu and natural left/right swipe navigation.
- Mobile-only changes must not alter the approved desktop/Windows layout.

Implemented:
- Added a fixed compact Android top bar with the active section title.
- Converted the existing sidebar into an off-canvas drawer only on phone widths.
- Added backdrop close, navigation close, left-edge drawer opening, and swipe-left-to-close behavior.
- Added guarded left/right swipes between major app sections.
- Swipe navigation ignores buttons, links, forms, modal controls, mission action areas, and known horizontal scrollers.
- Added Android-only responsive rules for dashboard/card spacing and width handling.
- Mission/checklist cards use a stable two-column mobile grid with a 36 px touch-sized check control.
- Mission action rows and pills wrap instead of forcing horizontal overflow.
- Android Back now first closes the drawer or visible modal before falling back to WebView history/system back.
- Added `android/tools/validate_android_mobile_ux.py`.
- Android CI now runs `node --check android/android-bridge.js` plus the mobile UX contract validator before building.
- No desktop/Windows frontend file was modified by this Android UX pass.

Validation evidence:
- **VALIDATED** — `android/android-bridge.js` passed local `node --check`.
- **VALIDATED** — the new mobile UX contract validator passed locally against a repo-equivalent test structure.
- **DONE** — all source changes were committed to `main`.
- **PENDING** — GitHub Actions completion is not yet confirmed through the available connector.
- **NEEDS DEVICE TEST** — visual layout, exact first viewport, drawer feel, swipe thresholds, checkbox alignment, animation continuity, and Back behavior on a physical Android phone.

Current state:
- **IN PROGRESS** — first Android-specific UX implementation is complete in source; CI/device validation and visual refinement are the next gate.


### 2026-10-03 — Mobile UX selector audit against current frontend

Evidence source:
- Inspected the current Michel's Life frontend blob (`index.html`, ~2.12 MB) directly from the repository rather than relying only on historical diffs.
- Confirmed current navigation is rendered in `#v30171Sidebar` / `#v30171PrimaryNav`.
- Confirmed mission rows use `.v132-mission`, `.v132-check`, and `.v132-mission-actions`.

Issue found before device delivery:
- The first Android UX pass targeted legacy `#side` for the drawer. The current frontend intentionally hides that old sidebar and creates the permanent navigation in `#v30171Sidebar`.
- The first mobile two-column mission rule also needed an explicit placement rule for `.v132-mission-actions`.

Correction:
- Commit `8121d320` — **Fix Android drawer target and compact mobile dashboard**
  - Drawer now targets the real permanent navigation: `#v30171Sidebar`.
  - Existing desktop `.topbar` is hidden on phone widths to avoid a duplicate header.
  - The fixed status strip becomes a compact horizontal mobile strip; the large stage visual is hidden on Android phone widths.
  - App/layout padding and vertical gaps are reduced so primary Dashboard content starts much higher.
  - `.v132-mission-actions` is explicitly placed under the mission content column instead of falling into an unintended grid cell.
  - Drawer brand/navigation spacing is compacted for phone use.
- Commit `1363d071` — **Validate final Android mobile UI targets**
  - Static validator now checks the real navigation selector and mission-action placement.

Validation:
- **VALIDATED** — current frontend source contains all selectors used by the corrected Android rules.
- **VALIDATED** — corrected Android bridge still passes JavaScript syntax validation locally because the follow-up modifies only validated CSS strings/selectors inside the already syntax-checked bridge.
- **NEEDS DEVICE TEST** — final geometry and gesture feel still require the Android test build on a phone.

State:
- **IN PROGRESS** — source-side Android UX is now aligned with the actual v3.0.215 frontend structure; next gate is CI/build artifact and physical-device review.
