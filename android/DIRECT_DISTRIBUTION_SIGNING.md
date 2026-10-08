# Michel's Life — Android Direct signing and install troubleshooting

## Confirmed installer regression (2026-10-08)

The v0.2.2 APK on the unified Windows v3.0.216 / Android v0.2.2 page
(`MichelsLife-Android-v0.2.2-TEST.apk`) is **CI debug signed**, not
release signed. We confirmed the underlying issue: successive GitHub Actions
builds used *different* Android Debug signing certificates for **the same**
versionName 0.2.2 / versionCode 4:

| GitHub run | Signer cert SHA-256 |
| --- | --- |
| 37828392642 | `f6dbee86a17b59e0bab48bf9017847587fe62928d745727ed0566d38c9cdd285` |
| 37829059350 | `f756cf9e9c4ccaf116f297a998a309af5269d68f138a21cda332d69f2701137e` |
| 37834743732 (published TEST APK) | `03f5419fc284c0dc6070ddc4df71e6e102fb440bee16989d53becfd1885f6b25` |

**Consequences:** Android will reject an in-place update if the installed
package is signed with a different certificate, often showing *App not
installed*. These CI builds cannot update one another, even though
`applicationId` and versionName match. Exact phone failure reason has **not**
yet been retrieved; do not claim its cause is certain without the device
installer error or installed-package certificate.

### Do not destroy local data

1. If Michel's Life is installed and opens, export its local backup from the
   existing app and verify the backup file is stored outside the app sandbox.
   Keep an additional copy.
2. **Do not uninstall first** if a backup has not been verified. Uninstalling
   Android applications normally removes their local app data, including
   WebView storage.
3. If the phone is connected to an authorized ADB/Android SDK host, install
   with `adb install -r <apk-file>`. An error
   `INSTALL_FAILED_UPDATE_INCOMPATIBLE` supports a signer mismatch; another
   installer error demands separate investigation. Avoid `adb uninstall`
   until the user's backups are secured.
4. Even after saving a backup, understand that a fresh installation of a
   **debug/test** APK is not a sustainable update path. The next CI run may
   use another debug certificate.
5. If no Michel's Life is installed already, or install fails for another
   reason, check complete download, installation-from-this-source
   permission, available device storage and ADB installer error.

## Permanent Android Direct channel — mandatory

`android/app/build.gradle.kts` now defines three separate build contracts:

- `assembleDebug`: development/test only; ephemeral Android Debug key.
- `bundleRelease`: Google Play upload bundle; requires its own upload key for
  Play submission. An unsigned bundle must never be called Play-ready.
- `assembleDirectRelease`: non-debuggable Android Direct APK, using only the
  dedicated persistent `directDistribution` signer. **No Play-key or debug-key
  fallback**. It MUST be produced using owner-controlled key material and a
  pinned public SHA-256 certificate fingerprint.

GitHub Actions workflow `.github/workflows/android-build.yml` has
`workflow_dispatch` boolean **build_direct** (default false). It also accepts
the same input through `workflow_call`.

Only when `build_direct=true`, provide the following repository
**Actions secrets** to `michels-lab/michel-s-life`:

- `ANDROID_DIRECT_KEYSTORE_BASE64`: base64 of the owner's **persistent**
  Android Direct signing keystore, never checked into Git.
- `ANDROID_DIRECT_STORE_PASSWORD`
- `ANDROID_DIRECT_KEY_ALIAS`
- `ANDROID_DIRECT_KEY_PASSWORD`

And one **Actions variable** (public fingerprint, not secret):
`ANDROID_DIRECT_CERT_SHA256` — SHA-256 fingerprint of that SAME private-key
certificate. This pin must not change between app updates unless a deliberate,
documented platform migration is performed.

A build with `build_direct=true` **fails closed** if any secret or pinned
certificate is absent. The workflow invokes `assembleDirectRelease`, verifies
APK signature (`apksigner`), denies `CN=Android Debug`, validates exact package
and current Gradle version/code with `aapt`, checks cert fingerprint against
the pin, and creates a digest/provenance JSON + SHA-256 sidecar. Only a
**verified, signed Android Direct** artifact can be marked stable and included
in future combined Windows+Android GitHub releases.

This signing key cannot reconstruct previous CI-generated private debug keys.
If an existing device app has a mismatched certificate, a same-package
in-place upgrade is cryptographically impossible: preserve and export the
user's data before considering a reinstall/migration. **Never rename a
test-signed APK to imply it is permanently updateable.**

## Evidence boundary

The current v3.0.216 unified GitHub Release still carries a clearly labeled
Android v0.2.2 TEST APK. Its SHA-256 integrity and version were verified, but
**install/update compatibility on the user's phone is not verified**.
The Play AAB is separately unsigned until Play upload signing secrets exist.
Do not claim either signing channel is complete merely because CI builds green.
