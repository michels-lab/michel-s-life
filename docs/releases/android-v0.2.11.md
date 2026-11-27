# Michel's Life — Android Direct 0.2.11

**Android application version:** 0.2.11 (code 13)  
**Windows application version:** 3.0.221 (unchanged binary and installer)  
**Distribution:** existing permanent Android Direct signing certificate.

## What changes
- Full-app immersive Pomodoro during Work and Break with existing Missions/Story images or theme scenes instead of a generic dark blue panel.
- Intentional minimize with compact timer. Missions, Today and Story remain navigable; minimizing persists through session reloads without stopping the canonical timer.
- Fix duplicate legacy Pomodoro panel/sidebar and drawer overlay interception on Android.
- Shared immersive desktop implementation is in source, but the distributed Windows binaries remain **3.0.221 unchanged** in this release.
- Existing language options, Story account isolation, cloud state and mission/XP preservation are retained.

## Verification gates
- Exact source commit passes Source validation, Android UI smoke and general UI smoke.
- Production Direct APK must be signed by the **same permanently managed certificate** as 0.2.10, package `com.michelslab.michelslife`, version code 13, and verified SHA-256.
- Install/relaunch the **signed** candidate on Android 15 with real screenshots; fail closed on missing pixels, process or ADB.
- Build the same source package as the candidate before release and compare the downloaded assets.
- Keep desktop 3.0.221 binaries byte-for-byte identical to the previously published files.
- Never replace existing public release files; create an immutable new tag and publish only if every publishing gate passes.

## Limits
The Android 15 native **debug candidate** for the immersive build previously passed real onboarding touch and two consecutive force-stop persistence checks. The Android 14/16 emulator runs were unreliable because ADB disconnected, and a physical Samsung Galaxy update has not been verified. A successful signed-emulator test does not imply physical-device certification.

## Installing
Download the Android Direct APK from the official unified release only after GitHub marks it published. Updates require installing over the existing Direct-signed application (do not uninstall first). Preserve a backup of Michel's Life progress before replacing applications; do not install the debug APK over an official release.
