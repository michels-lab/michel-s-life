# Michel's Life — Play Console submission draft

Last reviewed: 2026-10-03

This is a prepared answer sheet for Play Console. It is intentionally conservative and should be checked against the exact wording shown by Play Console at submission time.

## App details

- App name: **Michel's Life**
- Package: `com.michelslab.michelslife`
- Current release candidate: Android `0.2.0`
- versionCode: `2`
- Target SDK: `36`
- Category recommendation: **Productivity**
- Monetization: no ads, no in-app purchases in the current Android build.

## App access

Recommended answer: **All core functionality is available without a developer-hosted account or login.**

Reviewer note:

> Michel's Life can be used locally without signing in. Google authorization is optional and is only needed to test Google Drive synchronization. The app does not require a Michel's Life account.

If Google Drive sync is tested, use a reviewer-controlled Google account; no developer-provided credentials are required.

## Ads declaration

Recommended answer: **No, the app does not contain ads.**

Evidence:
- No Google Mobile Ads or other advertising SDK is present in `android/app/build.gradle.kts`.
- Android manifest does not request advertising-ID permission.

Re-check before every release if dependencies change.

## Target audience

Recommendation: **18 and over** for the first Play release.

Reason:
- Michel's Life is a general personal productivity/life-management tool, not designed or marketed for children.
- Keeping the initial intended audience adult avoids implying child-directed design or data practices that the app was not built around.

This is a product/distribution choice, not a technical limitation; change it only deliberately.

## Content rating — draft questionnaire posture

Michel's Life is a private productivity tool, not a social/content-sharing platform.

Expected answers for the current build:
- Violence: No.
- Sexual content/nudity: No.
- Profanity as developer-provided content: No.
- Controlled substances: No.
- Gambling: No.
- Fear/horror: No.
- User-to-user communication: No.
- Public user-generated content: No.
- Location sharing: No.
- Purchases: No.
- Ads: No.

Private notes/journal text entered by the user are not exposed to other Michel's Life users and should not be treated as a public UGC platform.

Complete the IARC questionnaire using the exact questions shown by Play Console.

## Data safety — top-level answers

### Does the app collect or share any required user data types?

Recommended conservative answer: **Yes, data is collected when optional Google Drive sync is enabled.**

Why:
Google Play defines collection generally as transmitting data from the app off the user's device. Michel's Life optional sync transmits app state and metadata to Google Drive.

### Is all collected user data encrypted in transit?

Recommended answer: **Yes.**

Evidence:
- Google OAuth/user-info requests use HTTPS.
- Google Drive API and upload endpoints use HTTPS.

### Is data collection optional?

**Yes** for the categories below. Core Michel's Life functionality works locally without Google Drive sync.

### Does the app share user data with third parties?

Recommended answer for the current architecture: **No**, subject to confirming the exact Play Console wording.

Reason:
- Google Drive transfer is explicitly initiated/authorized by the user for sync.
- Data is stored under the user's Google account in private Drive application data.
- There is no advertising/data-broker transfer.
- Google Play's Data safety guidance excludes some user-initiated transfers and service-provider transfers from the definition of “sharing.”

Do not change this to “Yes” merely because Google infrastructure processes the sync; re-check the current form language and policy definitions at submission time.

## Data safety — recommended data types

### Personal info → Email address

**Collected:** Yes, when Google sync is connected.  
**Shared:** No (recommended).  
**Optional:** Yes.  
**Purpose:** App functionality.

Evidence:
- Android requests `email` scope.
- `fetchUserEmail()` reads the authorized Google account email to identify the connected sync account.

Do not select Account management as a purpose unless Play Console guidance makes it appropriate; Michel's Life does not create or manage a Michel's Life developer-hosted account.

### User generated content → Other user-generated content

**Collected:** Yes, when Google sync is enabled.  
**Shared:** No (recommended).  
**Optional:** Yes.  
**Purpose:** App functionality.

Examples present in the backup can include:
- mission names/descriptions;
- journal/reflection content;
- planning text;
- user-created goals and routines;
- settings or other user-entered Michel's Life content.

### App activity → Other actions

**Collected:** Yes, when Google sync is enabled.  
**Shared:** No (recommended).  
**Optional:** Yes.  
**Purpose:** App functionality.

Examples:
- mission completion/progress state;
- achievements/progress;
- planning/progress history contained in the restorable Michel's Life state.

### Device or other IDs → Device or other IDs

**Collected:** Yes, when Google sync is enabled.  
**Shared:** No (recommended).  
**Optional:** Yes.  
**Purpose:** App functionality.

Evidence:
- Michel's Life creates a random per-install/device sync identifier.
- Sync device records include that ID and manufacturer/model-derived device name for multi-device sync and conflict/history presentation.

### Data types not intentionally accessed by the Android client

Current source does **not** intentionally access:
- precise or approximate device location;
- contacts;
- SMS/MMS;
- call log;
- microphone;
- camera;
- user's photo/video library;
- user's audio library;
- external-storage files/documents;
- installed-app inventory;
- advertising ID;
- payment-card or financial-account data.

Do not mark “Files and docs” solely because Michel's Life serializes its own state to a JSON cloud backup; the app does not browse or collect the user's general file/document library.

Free-form private user text can contain many subjects. In the current product model, treat that text as Other user-generated content rather than claiming Michel's Life intentionally collects each possible sensitive category a user might type into a private note.

## Data retention / deletion disclosure

Current behavior to describe accurately:
- Local Michel's Life state can be reset/cleared in-app and is also removed through normal Android app-data clearing/uninstallation behavior as applicable.
- Optional cloud state is stored in the user's Google Drive application-data area.
- Michel's Life maintains up to 10 history backups and prunes older history backups.
- Disconnecting Google stops Michel's Life's current connected sync state but does **not** itself guarantee deletion of previously uploaded Drive app-data files.
- Users can revoke Google authorization through Google account controls.

Do not claim “cloud data is deleted on disconnect” unless that behavior is implemented and device-tested in a future build.

## Data security practices

Recommended:
- Data encrypted in transit: **Yes**.
- Independent security review: **No**, unless a qualifying review is actually completed.
- Uses Play App Signing: **Yes** once enrolled in Play Console.

## Privacy policy

Prepared source:
- `android/PRIVACY_POLICY_DRAFT.md`
- `docs/privacy/index.html`

Preferred final URL after GitHub Pages is enabled:
- `https://realmichelduarte.github.io/michel-s-life/`

Current blocker:
- GitHub Pages is not yet enabled/configured to build using GitHub Actions. Workflow run `37162745935` failed at `actions/configure-pages@v5` with GitHub's explicit “Get Pages site failed” message.

Required repository UI step:
1. GitHub repository → **Settings**
2. **Pages**
3. Under **Build and deployment → Source**, select **GitHub Actions**
4. Rerun the workflow **Publish privacy policy**

Once live, verify the exact deployed URL and then add it:
- to Play Console privacy policy;
- to an Android in-app Privacy Policy link.

## Google OAuth / Play App Signing

Before the Play-delivered build's Google authorization is considered valid:
1. Enroll the app in Play App Signing.
2. Copy Play Console app-signing SHA fingerprint(s).
3. Register the applicable Play signing fingerprint(s) for package `com.michelslab.michelslife` in the Google Cloud Android OAuth client.
4. Test Google authorization from the actual Play-installed internal-test build.

Do not substitute the local upload-key fingerprint for the Play app-signing fingerprint.

## Internal testing release notes — draft

> Android v0.2.0 introduces Michel's Life on Android with the same restorable life-system data used by the desktop app. This test build adds a phone-specific compact layout, off-canvas navigation, swipe navigation, aligned mission checklists, Google Drive sync support, restore history, and Google Play-ready update/version handling. This is an internal validation release; please report layout, navigation, sync, and lifecycle issues.

## Pre-upload blockers

- [x] Android v0.2.0 APK build green.
- [x] Android v0.2.0 AAB build green.
- [x] Dedicated Android 412×915 UI smoke green.
- [x] Permanent RSA 4096 upload key generated.
- [x] Manually signed v0.2.0 AAB verified.
- [ ] GitHub Actions signing secrets configured.
- [ ] Signed AAB reproduced/verified in CI.
- [ ] Privacy policy public URL live.
- [ ] Physical Android test APK approved.
- [ ] Google sync tested on a physical Android device.
- [ ] Play Console app created/configured.
- [ ] Play App Signing fingerprint registered for Android OAuth.
- [ ] Internal-test Play build installed and tested.
