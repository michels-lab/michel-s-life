# Michel's Life — Google Play readiness

Last reviewed: 2026-10-03

This file is the release checklist for the Android/Google Play build. It complements `ANDROID_AUDIT_LOG.md`; the audit log records what happened, while this file records what Play Console still requires.

## Current Android identity

- App name: **Michel's Life**
- Package: `com.michelslab.michelslife`
- Android version: `0.2.0`
- `versionCode`: `2`
- `compileSdk`: `36`
- `targetSdk`: `36`
- `minSdk`: `26`
- Distribution format: Android App Bundle (`.aab`) for Google Play; debug APK only for direct device testing.
- Production updates: Google Play-managed for Play-installed builds.

Google Play requires new mobile apps and app updates submitted from 2026-08-31 onward to target Android 16 / API 36 or later. Michel's Life already targets API 36.

Official reference:
- https://support.google.com/googleplay/android-developer/answer/11926878

## Signing / Play App Signing

Status: **BLOCKED until permanent upload-key secrets are configured.**

Google Play App Signing uses two different keys:
1. **Upload key** — held by the developer and used to sign the AAB uploaded to Play Console.
2. **App signing key** — held by Google Play and used to sign APKs delivered to users.

For a new app, use Play App Signing and keep the upload key separate from the Google-held app signing key. The upload key must meet Google's current key requirements.

Repository secrets expected by CI:
- `ANDROID_UPLOAD_KEYSTORE_BASE64`
- `ANDROID_UPLOAD_STORE_PASSWORD`
- `ANDROID_UPLOAD_KEY_ALIAS`
- `ANDROID_UPLOAD_KEY_PASSWORD`

CI behavior:
- without the secrets → emits an explicitly named **UNSIGNED** Play-preparation AAB;
- with all secrets → emits a **SIGNED** AAB and verifies the bundle signature.

Official reference:
- https://support.google.com/googleplay/android-developer/answer/9842756

### OAuth fingerprint requirement after Play signing

Michel's Life uses Google Identity Services + Google Drive. A Play-installed build is signed by the **Google Play app signing key**, not by the local debug/upload key.

Before Play-delivered Google authorization is considered validated:
1. Open Play Console → Play App Signing.
2. Copy the Google Play app-signing SHA certificate fingerprint(s).
3. Register the applicable SHA fingerprint(s) for package `com.michelslab.michelslife` in the Google Cloud OAuth Android client.
4. Keep the debug/test certificate registered separately if direct test APKs also need Google authorization.

This is critical: a test APK can authorize correctly while the Play-delivered build fails OAuth if only the debug/upload certificate was registered.

## Testing tracks

Recommended release order:
1. Direct v0.2.0 test APK on a physical phone.
2. Play Console **Internal testing** with the signed AAB.
3. Closed testing if required for the developer account.
4. Production only after the Android validation checklist is green.

For personal developer accounts created after 2023-11-13, Google currently requires a closed test with at least **12 testers continuously opted in for 14 days** before production access. Internal testing is optional but recommended.

Official reference:
- https://support.google.com/googleplay/android-developer/answer/14151465

## Store listing

Google Play listing limits currently include:
- App name: 30 characters.
- Short description: 80 characters.
- Full description: 4,000 characters.

Official reference:
- https://support.google.com/googleplay/android-developer/answer/9859152

### Draft listing — English

**Name**

Michel's Life

**Short description**

Plan missions, focus, track progress, and sync your life system across devices.

**Full description**

Michel's Life is a personal productivity and progress system built around missions, routines, focus sessions, goals, statistics, achievements, planning, and reflection.

Use the app to organize daily missions, track long-term progress, review patterns, manage Premium Contracts, and keep your personal system moving from day to day.

Android is designed to work as the mobile companion to the Michel's Life desktop experience. Optional Google Drive sync can keep the same Michel's Life state available across supported devices using your own Google account.

Key features include:
- Daily missions and recurring routines
- Premium Contracts and long-term goals
- Progress statistics and achievements
- Focus and planning tools
- Journal and reflection features
- English and Spanish interface support
- Optional Google Drive synchronization
- Android-specific compact navigation and swipe gestures

Michel's Life is an independent productivity app by Michel's Lab.

### Draft listing — Spanish

**Nombre**

Michel's Life

**Descripción breve**

Misiones, enfoque, progreso y sincronización de tu sistema personal entre dispositivos.

**Descripción completa**

Michel's Life es un sistema personal de productividad y progreso basado en misiones, rutinas, sesiones de enfoque, metas, estadísticas, logros, planificación y reflexión.

La app permite organizar misiones diarias, seguir objetivos a largo plazo, revisar patrones de progreso, gestionar Premium Contracts y mantener un sistema personal de ejecución día a día.

La versión Android funciona como compañera móvil de Michel's Life en escritorio. La sincronización opcional con Google Drive permite mantener el mismo estado de Michel's Life entre dispositivos compatibles usando tu propia cuenta de Google.

Funciones principales:
- Misiones diarias y rutinas recurrentes
- Premium Contracts y metas de largo plazo
- Estadísticas de progreso y logros
- Herramientas de enfoque y planificación
- Diario y reflexión
- Interfaz en inglés y español
- Sincronización opcional con Google Drive
- Navegación compacta y gestos específicos para Android

Michel's Life es una app independiente de productividad desarrollada por Michel's Lab.

## Privacy policy

Status: **DRAFT PREPARED; PUBLIC URL STILL REQUIRED.**

Google Play currently requires every app to provide a comprehensive privacy policy in Play Console and make it accessible from inside the app. The policy must be available at a stable public URL and must match the Data safety declaration.

Draft:
- `android/PRIVACY_POLICY_DRAFT.md`

Official reference:
- https://support.google.com/googleplay/android-developer/answer/10144311

Before Play submission:
- publish the finalized policy at a stable public web URL;
- add that URL in Play Console;
- add an in-app Privacy Policy link;
- re-check the policy after any sync/auth/analytics/SDK changes.

## Data safety — technical inventory to use when filling the form

Do **not** submit a blanket “no data collected” answer without reviewing this inventory.

Observed Android behavior:
- Requests only `INTERNET` and `ACCESS_NETWORK_STATE` permissions in the manifest.
- No location, contacts, SMS, call log, camera, microphone, external-storage, or advertising-ID permission is declared.
- Uses Google Identity Services with `openid`, `email`, and Drive app-folder authorization.
- Reads the authorized Google account email from Google's user-info endpoint.
- Optional cloud sync uploads the user's Michel's Life backup JSON to the user's Google Drive `appDataFolder`.
- Sync also writes a generated device ID, manufacturer/model-derived device name, sync timestamps, app version, hashes, and last sync action into the user's Drive app-data area.
- Keeps up to 10 Michel's Life history backups in the app-data area.
- Current Android dependencies include AndroidX WebView, Google Play Services Auth, and OkHttp.
- No advertising SDK is configured in the Android Gradle dependencies.

Likely Play Data safety categories that require explicit review:
- Email address / account information.
- User-generated content or other app content contained in the Michel's Life backup.
- App activity/progress information contained in the backup.
- Device or other identifiers due to the generated device ID and device metadata.
- Whether each category is “collected,” “shared,” optional, and its purposes under Google's exact definitions.

Google requires the Data safety form to accurately describe the app and its SDKs, and the declaration must stay consistent with the privacy policy.

Official reference:
- https://support.google.com/googleplay/android-developer/answer/10787469

## Content rating / target audience

Status: **PENDING PLAY CONSOLE FORM.**

All Google Play apps require an IARC content rating. Complete the questionnaire accurately and redo it if app content changes in a way that affects the answers.

Official reference:
- https://support.google.com/googleplay/android-developer/answer/9898843

Play Console also requires the target-audience/content declaration. Before completing it, declare ads, app-access instructions, and the privacy policy.

Official reference:
- https://support.google.com/googleplay/android-developer/answer/9867159

Current Android build contains no ad SDK in its Gradle dependencies. Verify the complete packaged frontend does not introduce advertising before answering “No ads” in Play Console.

## App access for review

Michel's Life core functionality does not require a developer-hosted account. Google account authorization is optional and used for Drive sync.

For Play review:
- state clearly that reviewers can use core local functionality without signing in;
- explain that Google sign-in is only needed to test optional Drive synchronization;
- if Play Console requests review credentials or special access steps, provide only what is necessary for the review.

## Store graphics and screenshots

Pending final device validation:
- capture real Android screenshots from the Play-delivered/internal-test build after the mobile UI is approved;
- include Dashboard, Missions, Premium Contracts, Statistics/Progress, and the Android drawer/navigation;
- avoid using desktop screenshots for the phone listing;
- ensure screenshots reflect the final language/localization shown in that listing.

## Release checklist

- [x] Package identity fixed: `com.michelslab.michelslife`.
- [x] API 36 target.
- [x] Android v0.2.0 / versionCode 2.
- [x] CI version consistency check.
- [x] Debug APK builds.
- [x] Release AAB builds.
- [x] Unsigned-vs-signed AAB naming is explicit.
- [x] AAB integrity validation in CI.
- [x] Google Play install channel recognized by Android update status.
- [x] Android-specific mobile UX first pass.
- [x] Android mobile UX static validation.
- [ ] Automated 412×915 browser UX smoke is green.
- [ ] Physical-device v0.2.0 UX validation.
- [ ] Physical-device Google authorization and Drive sync validation.
- [ ] Permanent upload key created and secured.
- [ ] GitHub signing secrets configured.
- [ ] Signed AAB verified in CI.
- [ ] App created/configured in Play Console.
- [ ] Play App Signing enrolled.
- [ ] Play app-signing SHA fingerprint(s) registered with Google Cloud OAuth.
- [ ] Privacy policy finalized, published, linked in Play Console, and linked in-app.
- [ ] Data safety form completed.
- [ ] Ads declaration completed.
- [ ] App access declaration completed.
- [ ] Target audience/content declaration completed.
- [ ] IARC content rating completed.
- [ ] Main store listing completed.
- [ ] Phone screenshots captured from approved Android build.
- [ ] Internal-testing release uploaded.
- [ ] Play-delivered build installed and tested.
- [ ] Closed-testing requirement completed if the developer account is subject to it.
- [ ] Production access/release only after all applicable gates above are complete.
