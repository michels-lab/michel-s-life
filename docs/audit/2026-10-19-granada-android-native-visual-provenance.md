# Operación GRANADA — native Android16 screenshot evidence and provenance

Date: 2026-10-19 (America/Monterrey)
Repository: michels-lab/michel-s-life
Base HEAD: de56458ef9a568667fc556b2c4b8334f5109ffcf
Branch: granada/android-native-frame-provenance-20261019
Issue: #23, related #139 Android emulator instability.
Scope: new tools/android_emulator_evidence_manifest.py; existing dedicated .github/workflows/android-emulator-transport-diagnostic.yml; this dated independent audit. No Android or shared app source changed.

## Implemented contract
- From the **same real hosted Android 16 A/B trial**, enumerate eight expected native screencap PNGs before app installation and eight after installing the **official SHA-256-verified public Direct 0.2.9 APK**.
- Verify each PNG's signature, complete chunk lengths, CRC32 checksums, IHDR dimensions (at least 300x400), IEND and meaningful byte size. Compute each actual PNG SHA-256, byte length, viewport dimensions, phase and sample number.
- Recalculate the signed APK's SHA-256 and compare with its independently downloaded published .sha256 manifest. Record Git checkout SHA, official release tag, Android Direct version, emulator provenance, and explicitly separate owner-review/physical-device state.
- Require result.env from the actual emulator probe to say PASS, exit_code 0, last_phase installed and last_sample 8. The manifest reports FAIL on missing/invalid emulator evidence, CRC failures, missing SHA sidecars, tampered APKs, missing frames or incomplete phases. Never synthesize or substitute screenshot pixels for missing native frames.
- Add a repeatable dependency-free Python self-test (positive 16-frame fixture, missing/truncated frame, corrupted CRC, tampered APK and failed probe result); run it **before emulator setup**. Always run provenance validation after the real emulator step and upload the red or green manifest in existing diagnostic artifacts, even if the emulator step fails.
- The diagnostic workflow continues in a standalone Android-only job. Windows installer, Desktop and MSIX remain paused.

## Evidence boundaries
- This is a **reproducible visual evidence gate**, not a change to the APK or new official release. Success proves the exact A/B experiment captured real frames and a published APK; it does NOT mean the current candidate Android app/Developer Twin or signed Galaxy data persistence passed.
- The existing #140 A/B experiment passed once (16 native PNGs), while candidate debug APK jobs under #134/#135/#138 repeatedly lost ADB. This new provenance gate does not identify their root cause and does not weaken their native failure.
- Issue #23 still requires installed candidate Android Home/About navigation, owner post-release visual review, and eventually actual installed Windows screenshot checks after the owner's Windows pause is lifted.
- Files of active Developer Twin #134, Calendar #135, native state #138 and Focus #146 drafts are not modified by this work.

## Required validation
- On the new branch: source syntax, Python --self-test and the exact-head **real Android 16 A/B emulator workflow**, with uploaded immutable screenshot hashes. Re-run or fix in this independent branch until green. A generated manifest without 16 real frames is a FAIL, not installation evidence.
- Keep #23 and #139 open until their distinct installed candidate/hardware acceptance has evidence.
