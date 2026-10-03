# Michel's Life Android

Android client for the same Michel's Life state used by Windows.

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
- versionCode: `1`
- versionName: `0.1.0`
- targetSdk: `36`

The Gradle release build supports an upload keystore through environment variables:
- `ANDROID_UPLOAD_KEYSTORE_PATH`
- `ANDROID_UPLOAD_STORE_PASSWORD`
- `ANDROID_UPLOAD_KEY_ALIAS`
- `ANDROID_UPLOAD_KEY_PASSWORD`

Never commit the upload keystore or its passwords to this repository.

Without signing variables the CI workflow deliberately emits an unsigned Play AAB so it can be signed outside the public repository. Future CI Play releases should use GitHub Actions secrets.
