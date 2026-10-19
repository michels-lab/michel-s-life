# Operación Granada — Source-of-truth docs and release alignment

**Date:** 2026-10-19 (America/Monterrey)  
**Repository:** `michels-lab/michel-s-life`  
**Scope:** documentation / no production runtime change  
**Branch:** `granada/docs-current-release-truth-20261019`  
**Base snapshot:** `main@7fb51d1aa2f7da6da4812f50c18df1f60b200082`  
**Status:** documentation candidate; CI/merge review pending; **no new release**

## Directly verified from authoritative upstream

- GitHub official distribution repository `michels-lab/michel-s-life-releases`: latest stable tag `v3.0.221`, public 2026-10-19 14:18:28 UTC, 13 assets, including Windows Setup/Portable, official `MichelsLife-Android-Direct-v0.2.9.apk`, hashes and manifest; not a Google Play Store delivery.
- Current `android/app/build.gradle.kts`: Android `versionName=0.2.9`, `versionCode=11`, target SDK 36, package `com.michelslab.michelslife`.
- Current source `main` at task start: `7fb51d1...`. Its README, Android README, handoff and Play/Parity matrix still referenced v3.0.217/v3.0.218 and 0.2.5/0.2.6 as the current release.
- Owner-directed Windows implementation/installer/MSIX build pause recorded in `AGENTS.md`. This documentation change does **not** cancel already shipped Windows binaries or imply Windows builds resumed.

## Changes isolated to this documentation branch

1. `README.md`: latest official customer release and current Android Direct semantics, release/version boundaries, Windows pause, Granada protocol.
2. `android/README.md`: corrected Direct 0.2.9, code 11, truthful Google Calendar unsupported status and separated Play/public channel; removed literal escaped newlines.
3. `docs/CURRENT_HANDOFF.md`: exact head and release snapshot, file ownership and draft work `#134` Developer Twin and `#135` Android calendar/Journal accessibility, plus blockers #28, #53, #54, #55, #104, #108, #109, #110, #131. Marked Windows `#62` deferred. Explicit next GRANADA entrypoint.
4. `android/PLAY_STORE_READINESS.md`: source code 11/current Direct release 0.2.9 and separate unverified Play signing/upload/install; historical 0.2.0/0.2.1 signing info preserved, no unsupported provider success claimed.
5. `docs/ANDROID_PLATFORM_PARITY.md`: actual Oct19 release, exact-version hardware/provider limitations, #135 candidate as **unmerged**, #134 Developer Twin as **unmerged**, and no Windows build triggers during Android QA.

## Non-interference and acceptance

- The unrelated Android Developer edition in **draft PR #134** owns Android native/update code, workflows, `android/ANDROID_AUDIT_LOG.md` and `GIT_AUDIT_LOG.md`. This branch changes **none** of those files.
- The feature accessibility **draft PR #135** owns `android/mobile-sections.js`, its UI smoke and its Android audit. This branch changes **none** of those files.
- The existing Windows CI/installed screenshot work **PR #62** is deferred under the pause.
- Master task claims were empty at start. No rebase/cherry-pick, no release, merge, cloud/account changes, keystores or user data edits.
- Tests: structured external GitHub release/Gradle metadata inspected; documentation file writes verified by GitHub connector. **No Android native/device/provider test is claimed**. New documentation PR CI must be checked before integration.

## Next GRANADA re-entry

Check source `main`, official release, latest #134/#135 exact-head checks and source docs branch first. Do not regenerate Android Twin or Calendar code from this documentation branch. If documentation PR is blocked, leave it tracked and choose disjoint work; do not change Windows build policy or launch installers.
