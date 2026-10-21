# GRANADA — Android native evidence contract (2026-10-21)

## Scope and ownership
Independent QA-only branch `granada/android-evidence-gate-20261021`. Does not edit `src/MichelsLife/frontend/index.html`, Android bridge/Gradle, or the active #156 Data Health and #157 native transport PR areas. Windows implementation and packaging remain paused.

## Fail-closed release evidence
A native Android validation run must pin ONE exact source commit and ONE SHA-256 of the actual candidate APK; verify the installed package/app PID and real PNG screenshots for initial launch, first cold relaunch and second cold relaunch; compare XP, missions and completions across all three stages. Missing screenshots, corrupt evidence, PID loss, QEMU disappearance, or changed progress means **FAIL**, never soft PASS. Save redacted diagnostics even on infrastructure failure.

Signed production APK, Direct signing certificate continuity, versionCode monotonicity, updater check and end-user in-place upgrade form additional separate release gates. Synthetic/browser/emulator evidence is NOT proof of physical Galaxy behavior, live Supabase same-account synchronization, account switching safety or Google Play publication.

## Current blockers
- #104: physical signed-state and native persistent data acceptance.
- #139 and draft #157: emulator instability / real cold relaunch evidence.
- #55 and #108: authentication exclusion and cross-account contamination.
- Draft #156: Data Health frontend and native Android verification.
- #110/#109: Calendar no-op and updater behavior; do not infer fixes from other QA.

## Isolated offline QA implementation
A stand-alone offline verifier and seven synthetic unit tests were executed locally 2026-10-21: **7/7 PASS** for baseline evidence, XP drift, missing restart, corrupt PNG CRC, missing PID, wrong APK SHA256 and screenshot traversal path. This is **local synthetic QA only**, not CI validation, PR integration or proof of an installed APK. The verifier uses `evidence.json`, `candidate.apk` and three actual PNG files; no credentials or personal states.

## Exit criteria
1. Move offline verifier/tests into source-controlled tooling with CI tied to exact head, after confirming no collision with #157's native evidence analyzer.
2. Demonstrate candidate APK evidence from two actual cold relaunches, with 3 progress comparisons.
3. Perform signed in-place upgrade on the owner's Galaxy without data deletion and capture explicit owner acceptance.
4. Confirm real-account two-device recovery/switching is safe before release.
5. Only after ALL required product gates pass, GRANADA may publish a **final stable release**, never RC/beta, and record its exact tag/assets/SHA.

Status: **QA experiment validated locally; native release gate NOT passed.** No release authorized by the gate itself, no merge claimed.