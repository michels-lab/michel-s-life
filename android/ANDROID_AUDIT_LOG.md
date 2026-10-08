## 2026-10-06 — Canonical Michel's Life Android identity (implementation)

- Replaced the active legacy JPEG launcher reference with `@mipmap/ic_launcher` / `@mipmap/ic_launcher_round`.
- Added a flat Android vector derivative of the approved Michel's Life mountain/path/star geometry plus Android 8+ adaptive-icon resources.
- Added Android 12+ branded splash configuration using the same canonical foreground geometry and the Michel's Life navy base.
- Android packaging now injects the same canonical product/About assets as Desktop.
- Cross-platform identity validation is part of the Android build contract.
- **State:** IN PROGRESS — source implementation complete; Android CI/UI smoke must pass before this entry advances to VALIDATED. Physical-device branding review remains a separate device gate.

## 2026-10-06 — Shared Supabase authentication UX

- Android uses the same Michel's Life Supabase account surface as Desktop.
- Email + password is the required default login experience.
- Email OTP/code is available only as an explicit fallback for existing accounts and must never replace Password as the default after restart/reload.
- OTP requests do not auto-create accounts; account creation stays in the password flow.
- Android inherits the shared frontend smoke contract for this behavior.

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

### Open gates — source of truth

1. **VALIDATED** — dedicated Android phone-viewport smoke is green at 412×915 against the real v3.0.215 AppBundle.
2. **NEEDS DEVICE TEST** — install Android v0.2.0 on a physical phone and approve the actual feel/geometry of the top bar, compact status strip, checklists, drawer, swipes, Back behavior, animation continuity, background/resume, and process restart.
3. **NEEDS DEVICE TEST** — real Google authorization and bidirectional Windows ↔ Android Drive synchronization, including conflict and restore flows.
4. **PARTIALLY UNBLOCKED** — permanent upload keystore exists and a signed v0.2.0 AAB verifies locally; CI signing still requires the four GitHub Actions signing secrets.
5. **PENDING PLAY CONSOLE** — create/configure the Play app, enroll in Play App Signing, register Play signing SHA fingerprint(s) with Google Cloud OAuth, complete privacy/Data safety/content rating/target audience/app access/store listing, upload internal test, and complete any account-specific closed-testing requirement.
6. **PENDING PUBLICATION** — finalize and publish the privacy policy at a stable public URL and link it both in Play Console and in-app.

Everything else listed as validated below is already source/build validated and must not be reopened without new evidence.

### Product state

- **DONE** — Native Android host exists under `android/`.
- **DONE** — Android packages the current Michel's Life web AppBundle in a native WebView instead of maintaining a separate product implementation.
- **DONE** — Android JavaScript compatibility bridge exposes the desktop-style WebView message contract.
- **DONE** — Google Drive app-data sync primitives were ported to Android.
- **DONE** — Android local restore points and cloud history plumbing exist.
- **DONE** — Android build was stabilized on API / target SDK 36.
- **VALIDATED** — Android mobile UX build run `37110037392` completed successfully against the current v3.0.215 AppBundle, including debug APK, Play AAB build/validation, signing diagnostics, and artifact upload.
- **DONE** — APK signing-certificate fingerprints were extracted for Android OAuth setup.
- **DONE** — Play Store AAB generation was added to CI.
- **DONE** — Release signing configuration can be supplied through environment variables without committing secrets.
- **DONE** — Temporary one-off Android/Play publishing workflows were removed after use.
- **VALIDATED** — Android-only mobile UX redesign is source/build validated and passed the dedicated 412×915 phone-viewport smoke; physical-device approval remains.
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

- **VALIDATED** — Android update status now distinguishes direct/test installs from Google Play installs and reports Google Play as the production update manager.
- **VALIDATED** — Production update behavior is Play-managed, while sideloaded test builds explicitly identify themselves as test builds.

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
- **VALIDATED** — versionCode/versionName bump rule is documented and enforced by `android/tools/validate_android_version.py`; Android v0.2.0 uses versionCode 2.

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
- **VALIDATED** — subsequent Android CI runs completed successfully, including mobile UX static validation, APK build, AAB build/validation, signing diagnostics, and artifact upload.
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


## 2026-10-03 — Android v0.2.0 versioning and Play update channel

Build evidence before version bump:
- **VALIDATED** — GitHub Actions run `37110037392` completed with conclusion `success`.
- **VALIDATED** — Android mobile UX validator passed in CI.
- **VALIDATED** — current Michel's Life v3.0.215 AppBundle was downloaded and prepared successfully.
- **VALIDATED** — debug APK build succeeded.
- **VALIDATED** — Play AAB build and AAB validation succeeded.
- **VALIDATED** — signing-certificate diagnostics and artifact upload succeeded.

Versioning/update work in this atomic change:
- Android version moves from `0.1.0 / versionCode 1` to `0.2.0 / versionCode 2`.
- `DriveCloudEngine.ANDROID_VERSION` moves to `0.2.0`.
- CI artifact names use a shared `ANDROID_VERSION` environment value instead of hard-coded `v0.1.0` strings.
- Added `android/tools/validate_android_version.py` so Gradle, CloudSync, Android bridge, and workflow version labels cannot silently drift.
- Android `updateStatus` now distinguishes a Google Play install from a sideloaded/test install.
- Play installs report that updates are managed by Google Play.
- Test builds explicitly report that they are test builds and that production updates come through Google Play.
- The Android app no longer describes APK releases as the final production update mechanism.

Remaining:
- **VALIDATED** — Android v0.2.0 CI run `37110286283` completed successfully.
- **NEEDS DEVICE TEST** — install the v0.2.0 test APK on a physical phone and review the mobile UX.
- **BLOCKED** — signed production Play AAB still requires the permanent upload-keystore secrets.


### 2026-10-03 — Android v0.2.0 CI validation

Run: `37110286283` — **Build Android test APK #34**

Result:
- **VALIDATED** — workflow completed with `success`.
- **VALIDATED** — Windows-compatible cloud contract passed.
- **VALIDATED** — Android version metadata passed at `0.2.0 / versionCode 2`.
- **VALIDATED** — Android mobile UX contract passed.
- **VALIDATED** — current Michel's Life AppBundle prepared successfully.
- **VALIDATED** — debug APK built successfully.
- **VALIDATED** — Play AAB built and validated successfully.
- **VALIDATED** — signing-certificate diagnostics succeeded.
- **VALIDATED** — artifact upload succeeded.

Artifact:
- `MichelsLife-Android-TEST-v0.2.0`
- GitHub Actions artifact id: `11269871127`
- Artifact SHA-256: `139093b8f9dbc1472eba9e4e2c3d7b80decb90590cdaea56af1eb6e73a32c456`

CI maintenance:
- Android workflow trigger paths were narrowed so documentation-only changes under `android/ANDROID_AUDIT_LOG.md` and `android/README.md` no longer waste a full Android build.
- Build-relevant Android source/config/tooling changes still trigger CI.

Remaining gate:
- **NEEDS DEVICE TEST** — install v0.2.0 on a physical Android phone and verify initial viewport, checklist alignment, drawer, swipe navigation, Back behavior, animation continuity, and Google sync.


### 2026-10-03 — Build-trigger cleanup validation

Run: `37110414892` — **Build Android test APK #35**

Result:
- **VALIDATED** — workflow completed with `success` after narrowing Android CI trigger paths.
- **VALIDATED** — cloud contract, Android version metadata, Android mobile UX validation, debug APK, Play AAB, bundle validation, signing diagnostics, and artifact upload all passed again.
- **VALIDATED** — Android v0.2.0 artifact remained correctly named `MichelsLife-Android-TEST-v0.2.0`.
- Artifact id: `11269407443`.
- Artifact SHA-256: `54bdff6fc26de1e1f9c98d8ca644d70fd4d30da40b9d0b14e941b61fa4144582`.

CI behavior now:
- Documentation-only edits to `android/README.md` or `android/ANDROID_AUDIT_LOG.md` do not trigger a full Android build.
- Android source, Gradle config, bridge code, Android tools, and the Android workflow itself continue to trigger CI.

Current Android gate:
- **NEEDS DEVICE TEST** — v0.2.0 is build-validated; the remaining UX gate is physical-device testing.
- **BLOCKED** — production-signed Play AAB still depends on permanent upload-keystore secrets.


### 2026-10-03 — Android initial-scroll root cause found and fixed

Automated evidence:
- UI smoke run `37161658411` loaded the real Android-prepared v3.0.215 AppBundle at a 412×915 mobile viewport.
- The drawer was correctly off-canvas: `#v30171Sidebar` measured from x = -326 to -6.
- There was no horizontal page overflow.
- However, `#main` began at approximately **1914 px**, and the first Dashboard card at approximately **1923 px**.
- This reproduced the user's complaint that the primary screen required a large initial scroll.

Root cause:
- Android had compacted the obsolete `#fixedStatusBar`, but the current frontend's active status UI is `#v176StatusPanel`.
- Desktop responsive rules stack the active panel's Time, Command, and Affirmation cards vertically at phone widths.
- That panel remained in normal document flow above `.layout`, creating the huge vertical gap.

Correction:
- Commit `4902ac8b` — **Compact active status panel on Android**
  - `#fixedStatusBar/.status-strip` remain fully collapsed on Android.
  - `#v176StatusPanel` is constrained to a short Android-only strip.
  - Only the first Time/Greeting card remains in that strip on phone widths.
  - Command and Affirmation status cards no longer consume vertical Dashboard space on Android; their underlying features remain available elsewhere in the app.
  - No desktop/Windows frontend source was changed.
- Commit `584c93a8` — **Validate compact Android status panel**
  - Android static UX validation now requires the current `#v176StatusPanel` mobile rule.

State:
- **DONE** — root cause and source correction.
- **IN PROGRESS** — rerunning Android phone-viewport smoke to verify the Dashboard starts near the top and to continue through checklist/drawer/swipe assertions.
- **NEEDS DEVICE TEST** — physical-phone feel still required after automated validation is green.


### 2026-10-03 — Android phone-viewport smoke green

Workflow:
- `Android UI smoke` run `37162394170` — **SUCCESS**
- Final navigation fix: `57d09a74` — **Route Android swipes through canonical navigation API**

Validated against:
- Current Michel's Life desktop AppBundle v3.0.215 prepared through the same Android injection path.
- Chromium mobile viewport: **412×915**.

Measured geometry:
- Android top bar: y `0–56`, width `412`.
- Desktop top bar: hidden.
- Permanent drawer `#v30171Sidebar`: `position: fixed`, x `-336…-16` while closed; x `0…320` while open.
- Compact active status panel: y `62–126`, height `64`.
- Main content begins at **y = 148 px**.
- First Dashboard card begins at **y = 157 px**.
- Horizontal page overflow: **0 px**.
- Mission checkbox: **36×36 px**, aligned with mission title/content.
- Mission card overflow: **0 px**.
- Swipe-left from Dashboard: **Missions** became active and Android top-bar title became `Missions`.
- Seasonal animation continued during the mobile test: frame **77 → 85**.

Historical comparison:
- Before the Android flow fixes, the same automated viewport measured `#main` at approximately **1914 px** below the top.
- The primary-screen initial-scroll regression is therefore closed in automated validation.

State:
- **VALIDATED AUTOMATICALLY** — initial viewport, drawer geometry/open-close, checklist alignment, no horizontal overflow, swipe navigation, edge-drawer gesture, and animation continuity.
- **NEEDS DEVICE TEST** — actual touch feel, Android Back behavior, background/resume, process restart, and real-device rendering still require the physical phone.


### 2026-10-03 — Android v0.2.0 final automated-validation build

Source:
- Commit `57d09a74` — **Route Android swipes through canonical navigation API**

Native build:
- GitHub Actions run `37162394159` — **Build Android test APK #41**
- Result: **SUCCESS**
- **VALIDATED** — Windows-compatible cloud contract.
- **VALIDATED** — Android version metadata `0.2.0 / versionCode 2`.
- **VALIDATED** — Android mobile UX static contract.
- **VALIDATED** — current v3.0.215 AppBundle preparation.
- **VALIDATED** — debug APK compilation.
- **VALIDATED** — Play AAB compilation and bundle validation.
- **VALIDATED** — signing-certificate diagnostics.
- **VALIDATED** — artifact upload.

Build artifact:
- GitHub artifact id: `11287309798`
- Artifact name: `MichelsLife-Android-TEST-v0.2.0`
- Artifact ZIP digest: `sha256:9278c5af572c9ba392af4e2749c1d13653801ac40fa59638232f3efdd02cfad6`
- Test APK: `MichelsLife-Android-TEST-v0.2.0.apk`
- Test APK SHA-256: `a166f186cac115ddc30f5f062d507c498203d2514a7c8da28c3a7288e07b060c`
- Play-preparation AAB remains explicitly **UNSIGNED** because permanent upload-key secrets are not yet configured.

Android UI validation:
- Dedicated Android UI smoke run `37162394170` — **SUCCESS**
- Viewport: `412×915`.
- Dashboard `#main` begins at `y=148 px`; first card at `y=157 px`.
- Drawer is fixed and off-canvas while closed, then opens to `0…320 px`.
- Mission check target is `36×36 px` with no card/page horizontal overflow.
- Swipe-left routes from Dashboard to Missions using `LeftNavV30171.route`.
- Seasonal animation continued during navigation, frame `77 → 85`.

Conclusion:
- **VALIDATED AUTOMATICALLY** — current Android v0.2.0 source and final test APK build.
- **NEEDS DEVICE TEST** — real-phone visual/touch approval, Android Back, lifecycle/background-resume/process restart.
- **NEEDS DEVICE TEST** — Google authorization + Windows ↔ Android Drive synchronization/conflicts/restores.
- **PARTIALLY UNBLOCKED** — permanent upload key is generated and the v0.2.0 AAB is locally signed/verified; repository-secret configuration is still required for signed CI builds.
- **PENDING PLAY CONSOLE** — Play App Signing/OAuth signing fingerprint, policy/Data safety/rating/audience/listing/internal test and any account-specific production-access test.


### 2026-10-03 — Permanent Google Play upload key and signed AAB prepared

Google Play requirement:
- Upload keys must be stored in a Java keystore and use RSA 2048 bits or higher.
- Michel's Life upload key uses **RSA 4096 / SHA256withRSA**.

Private signing material:
- Permanent upload keystore created outside the repository.
- Alias: `michelslife-upload`.
- Upload certificate SHA-256: `38:90:F6:46:38:93:4D:3D:B2:0A:A3:DC:2D:A2:D0:EA:A7:17:DB:B5:78:B7:9D:9C:36:E9:0B:EA:ED:D0:48:35`.
- Upload certificate SHA-1: `08:5F:E1:FE:3E:92:65:60:60:9C:7B:5A:32:CC:67:BD:6D:31:1E:65`.
- `.gitignore` now excludes `*.jks` and `*.keystore` to reduce accidental private-key commits.

Signed Play bundle:
- Source bundle: v0.2.0 build #41 unsigned Play-preparation AAB.
- Local signed output: `MichelsLife-Android-Play-SIGNED-v0.2.0.aab`.
- Signed AAB SHA-256: `46ee8441a0bd858ebfed42f04be9b675b63a890561512a90afa95cfdbf2fe66a`.
- **VALIDATED** — `jarsigner -verify` reports `jar verified`.
- **VALIDATED** — compressed-data integrity test reports no errors.
- The self-signed certificate warning from `jarsigner` is expected for an Android upload key; Play App Signing uses Google-held app-signing key(s) for distributed APKs.

Remaining signing gate:
- **PENDING USER/REPOSITORY CONFIGURATION** — add the four existing workflow secrets:
  - `ANDROID_UPLOAD_KEYSTORE_BASE64`
  - `ANDROID_UPLOAD_STORE_PASSWORD`
  - `ANDROID_UPLOAD_KEY_ALIAS`
  - `ANDROID_UPLOAD_KEY_PASSWORD`
- Once configured, rerun Android CI and require the artifact name to become **SIGNED** with signature verification green.


### 2026-10-03 — Public privacy-policy site prepared; GitHub Pages enablement required

Prepared:
- Public static policy source: `docs/privacy/index.html`.
- Deployment workflow: `.github/workflows/privacy-pages.yml`.
- Play Console answer sheet: `android/PLAY_CONSOLE_SUBMISSION_DRAFT.md`.

Deployment attempt:
- Workflow `Publish privacy policy` run `37162745935`.
- Checkout succeeded.
- `actions/configure-pages@v5` failed with GitHub's explicit message: **Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions.**
- The workflow itself has the required `pages: write` and `id-token: write` permissions.
- GitHub's configure-pages action cannot self-enable Pages with the workflow's normal `GITHUB_TOKEN`; first-time enablement requires repository settings or a separate token with the required administration/pages permissions.

User action required once:
1. Repository → **Settings → Pages**.
2. **Build and deployment → Source → GitHub Actions**.
3. Rerun **Publish privacy policy**.

Expected site base once enabled:
- `https://realmichelduarte.github.io/michel-s-life/`

State:
- **DONE** — policy content and automated deployment workflow.
- **BLOCKED BY REPOSITORY SETTING** — first-time GitHub Pages enablement.
- **PENDING** — after publication, verify the live URL and add the Privacy Policy link inside Android and Play Console.


### 2026-10-05 — Canonical Android download/signing package rebuilt

Reason:
- Previous generated signing/download attachments were not reliably downloadable from the conversation surface.
- A new canonical private package was generated so all Android v0.2.0 delivery/signing files are available together in one archive.

Canonical private upload key:
- Alias: `michelslife-upload`.
- Algorithm: RSA 4096 / SHA256withRSA.
- Upload certificate SHA-1: `4E:4C:63:1D:EC:EF:24:35:8A:81:11:AD:2D:8D:A4:0C:9C:1C:05:55`.
- Upload certificate SHA-256: `BA:8C:AC:81:57:B4:E0:0B:69:8E:FA:D7:F2:90:90:05:E7:22:30:79:7A:C4:03:2F:7D:BD:CB:17:BC:73:C6:26`.
- This 2026-10-05 key **supersedes the temporary 2026-10-03 locally generated upload-key package**. Use only the 2026-10-05 package going forward unless Google Play App Signing has already been enrolled with another upload key.

Canonical deliverables:
- Test APK SHA-256: `a166f186cac115ddc30f5f062d507c498203d2514a7c8da28c3a7288e07b060c`.
- Signed AAB SHA-256: `ec2acce7617b4970b9083fc5ad3a1a7ca767f85c1353332c95ed836a118393cb`.
- Signed AAB verification: **VALIDATED** with `jarsigner -verify`.
- Complete private archive SHA-256: `055521688c71185619aa2f4d3f457124a2f26e46c4e88885853cec00bacd1de0`.

GitHub Pages:
- User confirmed repository Pages source is now set to **GitHub Actions**.
- Commit `739ce52a` updated the privacy-policy effective date and intentionally retriggered `Publish privacy policy`.
- Live public URL still requires post-deployment verification before being placed in Play Console/in-app.


### 2026-10-05 — Android launcher icon corrected to the approved Michel's Life celestial logo

User correction:
- The Android launcher icon must **not** be a generic star or a newly invented symbol.
- The approved Michel's Life icon is the exact previously selected **third celestial logo image**, stored in the repository as `branding/michels_life_logo.png`.

Previous Android issue:
- Android was still using `res/drawable/ic_launcher.xml`, a temporary vector made from cyan/gold circles plus a generic star.
- That vector did not match the approved Michel's Life identity.

Correction:
- Android now packages the exact `branding/michels_life_logo.png` bytes as `res/drawable-nodpi/michels_life_logo.png`.
- `AndroidManifest.xml` uses that exact asset for both `android:icon` and `android:roundIcon`.
- The temporary generic-star vector is no longer referenced by the launcher.

State:
- **DONE IN SOURCE** — exact approved celestial logo wired to Android launcher.
- **PENDING BUILD/DEVICE VALIDATION** — confirm the launcher icon appearance on the physical Android device after installing the next build.


### 2026-10-05 — Physical phone + emulator feedback incorporated into Android v0.2.1

Observed by user on real phone and PC emulator:
- Launcher still showed the obsolete generic star instead of the approved Michel's Life celestial logo.
- The pink first-run/onboarding overlay could reappear over an existing Michel's Life profile, especially around Settings.
- The onboarding focus checklist rendered as oversized crooked checkbox cards on Android.
- Drawer/backdrop layering made the navigation look heavily dimmed.
- Focus/Quick Capture floating controls collided with the lower Android UI and covered content on Journal/Settings.
- Section changes felt slow and the swipe gesture was not self-explanatory; accidental swipes could change sections.
- Emulator reproduced the same class of mobile bugs and lag.

v0.2.1 corrections:
- Uses the approved Michel's Life celestial branding for Android launcher; resource normalized to an Android-safe JPG after AAPT2 rejected the original PNG container.
- Existing-profile detection suppresses stale onboarding only when real Michel's Life data already exists; true fresh installs keep onboarding.
- Fresh Android onboarding is single-column with fixed 22 px native checkboxes instead of giant stretched controls.
- Drawer is reparented outside desktop stacking contexts and kept above its own backdrop.
- Added explicit previous/next section controls to the Android top bar in addition to hamburger + swipe.
- Swipe threshold increased so casual horizontal movement is less likely to switch sections accidentally.
- Added Android fast routing and removes the legacy multi-delay Settings navigation cascade.
- During Android section switches, CSS transition durations are temporarily suppressed to reduce perceived lag.
- Expensive mobile backdrop filters and sky filters are reduced/disabled in Android.
- WebView uses explicit hardware layer, bound renderer priority, no overscroll/zoom, and offscreen pre-raster.
- Action Dock/Focus controls are reduced and hidden on Journal/Settings where they interfered with writing/settings UI.
- Android version bumped to **0.2.1 / versionCode 3**.

Validation gates:
- **IN PROGRESS** — Android UI smoke must pass with onboarding/profile, drawer, safe-area, explicit arrows, swipe and section-switch budget.
- **IN PROGRESS** — native Android build must pass APK + AAB with the normalized launcher resource.
- **NEEDS DEVICE/EMULATOR RETEST** — final feel and visual behavior on the user's phone and emulator.


### 2026-10-05 — Android Action Dock removed from content + true active-surface navigation

Follow-up to phone/emulator feedback:
- The v0.2.1 Action Dock was smaller/safer but still a fixed overlay on Dashboard/Missions.
- The initial Android “fast route” still called `renderAll()`, so it still paid much of the desktop rendering cost.

Final structural correction:
- `#v30175ActionDock` is now physically reparented into `#v30171Sidebar` and styled as a sticky drawer footer.
- Focus/Quick controls therefore never float over Journal, Settings, or normal content.
- Drawer includes the visible hint: **Swipe ↔ or use ‹ › to change sections**.
- `#v30162FocusDock` launcher geometry is collapsed to zero on Android; its full Focus panel can still open when requested.
- Android section routing now uses `renderMain()` plus permanent nav refresh instead of `renderAll()`.
- Settings receives one explicit canonical Settings build pass on the next animation frame.
- Deferred persistence is retained.

Validation added:
- Android UI smoke requires Action Dock parent `#v30171Sidebar`, computed `position: sticky`, and the navigation hint.
- Smoke route label changed to `android-render-main`.

State:
- **IMPLEMENTED** — source/tests updated.
- **PENDING CI** — native build + Android UI smoke.
- **NEEDS PHONE/EMULATOR RETEST** — install the resulting v0.2.1 APK.


### 2026-10-05 — Physical-device + PC-emulator regression pass (Android v0.2.1)

User evidence:
- Physical Android screenshots still showed oversized/misaligned onboarding check controls, floating Focus/Quick Capture controls obscuring Journal/content, unclear section-changing gestures, and slow transitions.
- PC Android emulator independently reproduced stutter/bugs, proving this was not specific to the physical phone.

Root causes confirmed:
- Android UX rules were gated by a 760 px CSS breakpoint. A wide/landscape emulator therefore fell back to the desktop-heavy layout and legacy navigation/render pipeline.
- The desktop onboarding rule `.mlv200-field input{width:100%;min-height:44px}` also matched nested checkbox inputs, creating the huge pink/white check controls.
- Legacy Settings navigation performs repeated repair/rebuild passes for hundreds of milliseconds; Android now bypasses that cascade through an active-surface fast route.
- A whole-page Android observer from earlier iterations was replaced by narrow nav observation + low-frequency maintenance.
- Quick Capture/Focus actions are moved into the off-canvas drawer rather than floating over content.

Android-only corrections:
- Android app UX breakpoint expanded from 760 px to **4096 px**, so phone, landscape, tablet and desktop-hosted Android emulators all stay in Android mode rather than reverting to desktop.
- Wide Android WebViews center the active content/status surface at a maximum of 1180 px while retaining the Android top bar + drawer.
- Onboarding/focus checkboxes are hard-limited to 20–22 px controls and no longer inherit full-width text-input sizing.
- Existing-user stale onboarding state is suppressed before Michel's Life startup scripts can sanitize a real profile as a fresh install.
- Settings uses `android-render-main` fast routing with one active-surface render rather than the legacy repeated rebuild cascade.
- Section navigation now has explicit ‹/› controls in addition to deliberate horizontal swipe; the drawer explains both.
- The approved Michel's Life celestial launcher logo is enforced in the static Android UX contract.

Automated validation added:
- Existing 412×915 physical-phone-like viewport remains covered.
- New **1536×864 wide Android emulator** viewport must show Android top bar/drawer, no desktop top bar, no stale onboarding overlay, no horizontal overflow and Settings fast-route completion under the smoke threshold.
- Off-canvas actions are treated correctly by geometry (negative X is not a screen overlap).

State:
- **IN PROGRESS** — Android UI smoke and native build are rerunning against these v0.2.1 fixes.
- **NEEDS DEVICE/EMULATOR RETEST** — after CI is green, install the new APK on both the physical phone and PC emulator to confirm touch feel and perceived responsiveness.


## 2026-10-05 — Android v0.2.1 stabilization + Google Play parallel submission track

Version:
- Android `0.2.1`
- `versionCode = 3`
- `compileSdk = 36`
- `targetSdk = 36`
- Package: `com.michelslab.michelslife`

User-visible problems / requested changes:
- Android navigation/settings transitions felt slow on both phone and emulator.
- The onboarding/focus checklist rendered oversized controls on Android.
- Quick/focus actions could overlap app content.
- The Android launcher asset needed to remain the approved Michel's Life celestial logo.
- User requested that Google Play publication work proceed in parallel and that the Android project log remain continuously maintained.

Root causes / findings:
- Android WebView needed a lighter observer/maintenance path and hardware-rendering priority.
- The desktop onboarding stylesheet could override the Android checkbox dimensions after render. Automated focus-step measurement reproduced the issue at approximately `262.6 × 48.4 px` for a checkbox.
- Android resource packaging could not use the original repository PNG encoding reliably in AAPT2 release merge, so the Android launcher uses the approved normalized celestial-logo asset that had already compiled successfully.
- Google Play submission is technically ready for API-level policy: the app already targets API 36.

Implemented / relevant commits:
- `f9612202` — Use Android-compatible approved celestial launcher asset.
- `9b9d6d0b` — Force compact Android onboarding checkboxes at runtime.
- Android runtime now reapplies compact onboarding controls with inline `!important` logical and physical sizing, rather than relying only on stylesheet order.
- Android WebView path already includes hardware rendering, high renderer priority, reduced UI observation, compact drawer navigation, and Android-only layout behavior.

Validation evidence:
- GitHub Actions **Build Android test APK #68** completed successfully for `f9612202`, including the Android/Play build path.
- Automated smoke #37 reproduced the actual oversized focus-step checkbox, confirming the bug was real rather than a test-only artifact.
- Smoke #38 is the validation run for the runtime checkbox fix at the time of this log entry.
- Existing-user Android Settings navigation in smoke measured tens of milliseconds in the browser fixture and no longer reintroduced the onboarding overlay.

Google Play parallel work split:
- **USER / Play Console:** create/verify the developer account, create the app record, complete account/device verification, store listing fields, policy questionnaires, and recruit testers when the closed-test requirement applies.
- **ASSISTANT / repository:** keep the Android build release-ready, maintain API 36, signed-AAB workflow, versionCode/versionName discipline, Play App Signing/OAuth checklist, privacy/data-safety technical inventory, automated phone + wide-emulator validation, and this audit log.

Current Play publication dependencies:
- Play Console developer account must be created/verified if not already done.
- A personal developer account created after 2023-11-13 requires a closed test with at least 12 continuously opted-in testers for 14 days before production access.
- Play App Signing must be enabled; after enrollment, its app-signing SHA fingerprint must be registered in the Google Cloud Android OAuth client for `com.michelslab.michelslife`.
- Store listing, Data safety, Content rating, Target audience, App access, Ads declaration, and final privacy-policy URL still require Play Console completion.
- Physical-device and Play-delivered internal-test OAuth/sync validation remain mandatory before calling production release ready.

State:
- **BUILD / PLAY AAB PATH: VALIDATED**
- **CHECKLIST SIZE FIX: IN PROGRESS — automated revalidation running**
- **PLAY CONSOLE SUBMISSION: PENDING USER CONSOLE SETUP**
- **PRODUCTION: BLOCKED until Play Console requirements + required testing + Play-delivered device validation are complete**


## 2026-10-05 — Android v0.2.1 onboarding regression closed + Play parallel-work state

User-visible evidence:
- Physical Android and PC-emulator testing had shown malformed onboarding/focus checks, overlapping Android actions and sluggish section changes.
- Automated fresh-install reproduction confirmed the onboarding checkbox regression at **262.59 × 48.40 px** with a 349.27 × 74 px row.

Root cause / correction:
- Desktop onboarding input sizing could still win after the onboarding step rebuilt its DOM.
- Android now runs `stabilizeAndroidOnboardingControls()` and writes the checkbox/row geometry as Android-only inline `!important` values after onboarding step changes.
- Focus/options checks are constrained to 22 × 22 px; rows use a compact two-column grid.
- Android Settings continues to use the active-surface fast route instead of the desktop global rerender cascade.
- Android app mode remains active through wide emulator/landscape widths rather than reverting to the desktop-heavy shell.

Commits:
- `9b9d6d0b` — Force compact Android onboarding checkboxes at runtime.
- `f9612202` — Use Android-compatible approved celestial launcher asset.
- Prior v0.2.1 Android UX commits cover wide-emulator mode, Settings fast routing, in-drawer action controls and robust swipe validation.

Validation:
- **VALIDATED** — Android UI smoke run **#38** / run `37285236527`: SUCCESS.
- **VALIDATED** — Android build run **#69** / run `37285236594`: SUCCESS.
- **VALIDATED** — Source validation run `37285236498`: SUCCESS.
- Build artifact: `MichelsLife-Android-TEST-v0.2.1`, artifact id `11334113420`.
- Artifact contains test APK plus `MichelsLife-Android-Play-UNSIGNED-v0.2.1.aab`.

Google Play state:
- **DONE** — package `com.michelslab.michelslife`, targetSdk 36, versionName 0.2.1, versionCode 3.
- **DONE** — permanent upload key already exists and remains outside source control.
- **BLOCKED** — CI Play AAB is still unsigned until the four repository secrets are configured:
  - `ANDROID_UPLOAD_KEYSTORE_BASE64`
  - `ANDROID_UPLOAD_STORE_PASSWORD`
  - `ANDROID_UPLOAD_KEY_ALIAS`
  - `ANDROID_UPLOAD_KEY_PASSWORD`
- **PENDING USER / PLAY CONSOLE** — create/configure Play Console app, complete policy/listing forms, create testing track and testers.
- **NEEDS RETEST** — install build #69 on the physical phone and PC emulator to confirm perceived responsiveness and visual behavior after the final v0.2.1 fixes.
- **PENDING** — once signing secrets are present, rerun Android build, verify a `Play-SIGNED` AAB, upload it to Play testing, then register the Play app-signing SHA fingerprint in Google Cloud OAuth for Drive sign-in validation.

State:
- **VALIDATED AUTOMATICALLY / PLAY SUBMISSION IN PROGRESS**.


## 2026-10-05 — Android v0.2.2 Supabase primary sync migration

Architecture change:
- Supabase project `michels-life` is now the primary shared sync backend for Windows + Android.
- Android reuses the same canonical frontend Supabase client as Windows instead of duplicating sync logic in Kotlin.
- The shared client records Android device IDs with an `and_` prefix and writes `source_platform='android'`.
- Supabase tables: `ml_state`, `ml_state_history`, `ml_devices`.
- RLS is enabled on all three tables and every policy is scoped to `auth.uid()`.
- Anonymous table privileges were explicitly revoked; Supabase Security Advisor reports zero findings.
- Only the Supabase publishable key is bundled in the client. Secret/service-role keys are forbidden by validation.
- Existing Google Drive native code is retained as a temporary manual recovery/migration fallback. Automatic Drive sync is disabled whenever a Supabase session is active.
- Google Calendar remains independent and available.

Android build pipeline:
- Android build now overlays the branch's canonical Michel's Life frontend into the downloaded base AppBundle before WebView assets are prepared, preventing test APKs from silently packaging an older public-release frontend.
- Android sync contract validation now requires the shared Supabase module/platform markers and rejects secret/service-role markers.
- Android version bumped to **0.2.2 / versionCode 4**.

State:
- **IMPLEMENTED** — shared Supabase sync path + Android platform/device identity.
- **BACKEND VALIDATED** — RLS, authenticated grants, anonymous revoke and Security Advisor.
- **PENDING NATIVE APK/AAB CI** — current branch cannot dispatch the manual Android workflow through the connected GitHub tool; the workflow is prepared to build the canonical Supabase frontend when run/merged.
- **NEEDS DEVICE/EMULATOR RETEST** — sign in to the same Supabase account on Windows + Android, verify first-device choice, cross-device revision conflict behavior and explicit cloud restore.


### 2026-10-05 — Android Supabase platform smoke added

Change:
- Added `tools/ui_supabase_android_sync_smoke.mjs`.
- The test boots the shared canonical frontend with `window.__MICHELSLIFE_PLATFORM__='android'`.
- It verifies the shared Supabase client reports `platform() === 'android'`, creates an `and_*` device id, writes the initial master snapshot with `source_platform='android'`, registers the device as Android, and contains no `sb_secret_` / `service_role` marker.
- Added this Android-mode smoke to the main UI smoke workflow.
- Added `android/tools/validate_sync_contract.py` to the pull-request Source validation workflow so the Android/Supabase contract is no longer only checked by the manual Android build workflow.

State:
- **IMPLEMENTED** — Android-specific Supabase smoke + PR CI contract check.
- **PENDING CURRENT-HEAD CI** — GitHub had not yet surfaced new Source/UI runs for head `7af80e9427bc62740aeb11215decf6dda100b2e4` at the time of this log entry.
- **PREVIOUS SHARED RUNTIME VALIDATION GREEN** — Source validation #721 and UI smoke #611 passed on the immediately preceding Supabase runtime head.


## 2026-10-05 — Governance/infrastructure reconciliation after Supabase migration

- Inherited the repository-level Michel's Lab governance contract from `.michelslab/project.yml`.
- The pre-migration infrastructure audit that described Google Drive as the Android cloud authority is historical context only.
- Android v0.2.2 now uses the shared Supabase primary-sync client from the canonical frontend; native Google Drive support remains a temporary manual fallback.
- Android-specific implementation evidence remains in this log; reusable cloud/auth/security patterns are promoted to `Michel-Software-Standards`.


### 2026-10-05 — Android PR smoke now uses the exact canonical Supabase frontend

Problem found:
- The independent Android UI smoke originally downloaded the public AppBundle and injected only `android-bridge.js`.
- That meant an Android Supabase test could accidentally validate the public-release frontend instead of the branch being reviewed.
- First PR-gate run #40 then failed earlier at canonical validation because the workflow also omitted the frontend version-bump step.

Root-cause correction:
- Android UI smoke now overlays branch `index.html`, `i18n.js`, developer avatar and Michel's Life logo before `prepare_bundle.py`.
- Android UI smoke now runs on pull requests.
- Both Android UI smoke and Android build run `bump_frontend_version.py` before i18n/canonical validation, matching the Desktop packaging sequence.
- The Android UI workflow now executes `ui_supabase_android_sync_smoke.mjs` directly, so Android platform/device attribution is independently gated.

Validation:
- Source validation #734 — **SUCCESS**.
- Android UI smoke #42 — **SUCCESS**:
  - canonical branch frontend overlay — success;
  - Android fixture preparation — success;
  - mobile UX 412×915 — success;
  - Supabase Android sync smoke — success.
- This closes the previous “pending native Android PR validation” gap for the browser/WebView contract. Physical-device/account validation is still the final native behavioral gate.


## 2026-10-05 — `limon` Android handoff

- Shared Supabase/Android browser-WebView contract is green on current handoff HEAD `419de33c4038e371debd1a74fd8d13db0d9907e7`.
- Android UI smoke **#44 — SUCCESS**.
- Source validation **#736 — SUCCESS** and shared UI smoke **#622 — SUCCESS** on the same HEAD.
- Android remains **0.2.2 / versionCode 4**.
- Supabase is the primary sync authority; native Google Drive remains transitional fallback only.
- Still pending: native APK/AAB workflow/build, signing configuration if absent, physical-device/emulator retest, and real same-account Windows ↔ Android Supabase validation.
- `limon` is the project handoff keyword: update logs and preserve the exact continuation state before moving development to another chat.


## 2026-10-05 — Android v0.2.2 native PR build gate validated

Pipeline correction:
- The Android native build now runs on relevant pull requests, so APK/AAB compilation is tested before merge instead of waiting for main/manual dispatch.
- First PR run #71 correctly caught an obsolete validator marker: `validate_android_mobile_ux.py` expected bridge v0.2.1 while the app bridge/version metadata was v0.2.2.
- The validator was aligned to v0.2.2 without changing Android UX behavior.

Validation on candidate HEAD `25054d18`:
- Android UI smoke **#53 — SUCCESS**.
- Native Android build **#76 — SUCCESS**.
- Android version contract remains **0.2.2 / versionCode 4**.
- Windows-compatible Supabase cloud contract, Android UX validator, debug APK assembly and release AAB assembly all passed.
- Artifact: `MichelsLife-Android-TEST-v0.2.2` (artifact id `11379078581`).

Signing state:
- CI explicitly reports `PLAY_BUNDLE_SIGNING=UNSIGNED`.
- Generated Play preparation bundle: `MichelsLife-Android-Play-UNSIGNED-v0.2.2.aab`.
- The permanent upload-key credential file exists outside source control, but the four GitHub Actions repository secrets are still absent. The connected GitHub integration cannot write repository secrets.

Still required before Play submission:
1. Configure `ANDROID_UPLOAD_KEYSTORE_BASE64`, `ANDROID_UPLOAD_STORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`, and `ANDROID_UPLOAD_KEY_PASSWORD` as repository secrets.
2. Rerun the Android build and require a validated `Play-SIGNED` AAB.
3. Test same-account Supabase sync on real Windows + Android and perform physical-device / Play-delivered validation.
