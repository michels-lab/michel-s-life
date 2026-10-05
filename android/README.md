# Michel's Life Android

Android client for the same Michel's Life state used by Windows.

## Development audit log

The permanent Android development record is [`ANDROID_AUDIT_LOG.md`](ANDROID_AUDIT_LOG.md). It tracks completed work, pending work, validation evidence, Play Store preparation, device-test requirements, and follow-up items. Update it during every meaningful Android development cycle.\n\nGoogle Play preparation is tracked in [`PLAY_STORE_READINESS.md`](PLAY_STORE_READINESS.md), with the current privacy-policy source draft in [`PRIVACY_POLICY_DRAFT.md`](PRIVACY_POLICY_DRAFT.md) and a prepared Play Console answer sheet in [`PLAY_CONSOLE_SUBMISSION_DRAFT.md`](PLAY_CONSOLE_SUBMISSION_DRAFT.md).

## Architecture

- The APK packages the current Michel's Life AppBundle inside a native Android WebView.
- A small JavaScript compatibility layer exposes the same message shape used by the Windows WebView2 host.
- Native Kotlin code implements Google Drive app-data sync against the same cloud contract as Windows:
  - scope: `https://www.googleapis.com/auth/drive.appdata`
  - master file: `michels_life_cloud_state.json`
  - history: `michels_life_backup_*`
  - devices: `michels_life_device_*`
  - SHA-256 conflict tracking and the same 3-second tie window.

## Google authorization requirement

Google Drive authorization on Android uses Google Identity Services. Before Cloud Sync can be tested on a device, create an **Android OAuth client** in the same Google Cloud project as Michel's Life using:

- package name: `com.michelslab.michelslife`
- the SHA certificate fingerprint of the APK signing key.

Do not embed a client secret in the Android app.

## Local build

Prepare the web bundle first:

```
python android/tools/prepare_bundle.py --bundle /path/to/AppBundle.zip --assets android/app/src/main/assets/app
```

Then build with Android Studio or Gradle 9.6+ / JDK 17.

The GitHub workflow produces a debug test APK automatically.


## Google Play distribution

The Play Store track uses an Android App Bundle (AAB).

Current Play identity:
- package: `com.michelslab.michelslife`
- versionCode: `3`
- versionName: `0.2.1`
- targetSdk: `36`

The Gradle release build supports an upload keystore through environment variables:
- `ANDROID_UPLOAD_KEYSTORE_PATH`
- `ANDROID_UPLOAD_STORE_PASSWORD`
- `ANDROID_UPLOAD_KEY_ALIAS`
- `ANDROID_UPLOAD_KEY_PASSWORD`

For GitHub Actions, store the keystore itself as Base64 plus the three credential values as repository secrets:
- `ANDROID_UPLOAD_KEYSTORE_BASE64`
- `ANDROID_UPLOAD_STORE_PASSWORD`
- `ANDROID_UPLOAD_KEY_ALIAS`
- `ANDROID_UPLOAD_KEY_PASSWORD`

The workflow decodes the keystore only into the temporary runner filesystem and sets `ANDROID_UPLOAD_KEYSTORE_PATH` there. Never commit the upload keystore or its passwords to this repository.

Without the keystore secret, CI deliberately emits an explicitly named unsigned Play preparation AAB. With all signing secrets present, CI emits a signed AAB and verifies its JAR signature before uploading the artifact.


## Android versioning rule

Every Google Play upload must use a higher `versionCode` than the previous Play upload. Keep the user-facing Android version aligned across:
- `android/app/build.gradle.kts` → `versionName`
- `DriveCloudEngine.ANDROID_VERSION`
- `.github/workflows/android-build.yml` → `ANDROID_VERSION`
- `android/android-bridge.js` bridge version

CI runs `android/tools/validate_android_version.py` and fails if those Android version labels drift apart. Test APKs identify themselves as the test channel; Play-installed builds report that updates are managed externally by Google Play.
