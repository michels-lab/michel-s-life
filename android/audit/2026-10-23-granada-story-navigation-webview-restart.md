# GRANADA — Android Story CTA / WebView restart fault isolation
**Local date:** 2026-10-23 · **Repository:** `michels-lab/michel-s-life` · **App:** Michel's Life ONLY.

## Prior acceptance and blocker
- PR #178 **already merged** as `3ce9efd08270a2c647213192bd7d87017725cb49`: official published Android 0.2.9 APK, one API36 emulator, real **24/24** native valid screenshots without app, installed-idle and running. Hosted QEMU intermittency remains (#139). This is not proof of force-stop persistence, user login/ownership, or a release.
- Product PR [#170](https://github.com/michels-lab/michel-s-life/pull/170) remains **DRAFT, unmerged**. Exact current patch under examination: `1ff246dffb8b40c380071d7d807242ba180ff767` (check fresh PR head before integration).
- Previous native XP test proved a fixed **synthetic** recurring mission executed `window.completeMission()` in real debug WebView, awarding exactly **50 XP once**; the first Android force-stop and cold relaunch happened, but WebView's `Runtime.evaluate` became unresponsive, so **neither post-restart XP retention nor two-relaunch acceptance was proved**. Repeat runs stalled on CDP despite valid screenshots of a branded splash (not verified dashboard). No evidence of progress loss or retention.
- [Issue #168](https://github.com/michels-lab/michel-s-life/issues/168): intermittent JavaScript `SyntaxError`, present in synthetic Story touch navigation; previous origin location alone did not establish faulty app source. [Issue #108](https://github.com/michels-lab/michel-s-life/issues/108): cross-account/Journal boundary also remains release P0 (#169 standalone code not yet wired into real login).

## Concrete production UI regression and source fix
[Prior exact-head Android UI run #39911996502](https://github.com/michels-lab/michel-s-life/actions/runs/39911996502) exposed a genuine user-facing touch blocker after Story→Today→Story with preserved Chapter draft:
- `Start Chapter` button bottom **914.53125 px** on 915px screen, Android bottom nav starts at **842 px**, actual center hit target is **not** the button.
- Cause: production dynamic safe-area in `android/mobile-sections.js` was only enabled when Focus mini-player was visible. **Fixed condition** to enable on either real Focus mini-player **OR** visible Android bottom navigation and let button scroll correction run for either.
- **[New exact-head Android UI run #39912545686](https://github.com/michels-lab/michel-s-life/actions/runs/39912545686) PASS** including the previously failing touch/navigation smoke. This demonstrates browser Android touch behavior, not signed Galaxy proof; no redesign/themes changed.

## Native restart and script forensics added to existing PR #170
- `tools/granada_native_webview_failure_diagnosis.py` with **13 privacy-safe negative tests** captures only ADB alive, app PID present, guest boot status, WebView CDP HTTP page count, window-focus status and bounded event category **counts** (ANR, renderer exit, fatal signal, OOM, provider and WebView errors) from memory-resident native logs. **No raw logcat, environment, Javascript payload, auth, account or journal content is exported.**
- Hooked read-only snapshots after force-stop, after relaunch and when real WebView CDP times out in `tools/granada_native_xp_relaunch.sh`. It is **diagnostics only**, not a replacement for 2 real cold boots and identical canonical mission IDs/completion IDs/XP.
- Story forensic Playwright script now hashes failed Javascript scripts in-browser (SHA256/bytes/line only, no source text, capped wait). Prior fail script digest `710851ad32a142f0aa3f605e35d81dca5fe85e636d0633f1cfce1e3a4d39f4e2` (15,739 bytes) did not match any near-length original untransformed static inline script in a source review; generated bundle could differ, and cause **still unknown**. Tests continue to fail closed on SyntaxError.
- This latest head's source validation **PASS**, exact Android UI smoke **PASS**, one SHA-pinned debug candidate build **PASS**. Dedicated Story matrix, native two-restart test, full general UI, extra native install and cross-platform Project/Story smoke are tracked separately. [Cross-platform run #39912545774](https://github.com/michels-lab/michel-s-life/actions/runs/39912545774) **FAIL** with Windows browser runtime exceptions — no claimed XP/state drift, but a blocker.

## Restrictions / next gates
PR #170 cannot be considered accepted just because the targeted Story touch smoke is green. Before merge/public Android APK, require no failing critical browser or Android UI gates, native WebView loaded after **two** real force-stop relaunches with identical saved/live mission+completion IDs and XP, and release security checks. Native signed Galaxy/actual provider A/B and #139/#168 must not be bypassed. No release candidate policy; no release/public APK, no Windows packaging restart, no other app modules touched.

**This checkpoint:** production Story/Focus safe-area correction committed in PR branch, provenance and native read-only diagnostics committed, no PR product merge, no release. Last published: Android Direct **v0.2.9**, Windows **v3.0.221**.


## Exact-head CI follow-up on `1ff246dffb8b40c380071d7d807242ba180ff767`

- [Android UI smoke #39912545686](https://github.com/michels-lab/michel-s-life/actions/runs/39912545686): **SUCCESS** including the previously failing Story→Today→Story chapter draft return and *Start Chapter* hit target. This is positive acceptance evidence for the **nav-only clearance correction** in browser Android UI.
- [UI smoke #39912545795](https://github.com/michels-lab/michel-s-life/actions/runs/39912545795): **SUCCESS**.
- [Source validation #39912545816](https://github.com/michels-lab/michel-s-life/actions/runs/39912545816): **SUCCESS**.
- [Project/Story cross-platform browser #39912545774](https://github.com/michels-lab/michel-s-life/actions/runs/39912545774): **FAIL**, Windows browser had runtime exceptions; CI did not prove any XP/state divergence. Preserve this blocker.
- [Native XP two-force-stop #39912545638](https://github.com/michels-lab/michel-s-life/actions/runs/39912545638): debuggable exact-head APK compiled and installed; **FAIL before the first synthetic mission was seeded**. The initial native Android framebuffer PNG passed (1080×2400). Then CDP returned timeout/unavailable. New privacy-safe `GRANADA_NATIVE_WEBVIEW_DIAGNOSTIC` classified `adb_reachable=false` and consequently `app_pid_present=null`, `boot_completed=null`, `cdp_http_reachable=null`, `native_window_visible=null`. This means the **guest/ADB connection was lost** when diagnosis ran; it does NOT show XP loss, app account failure or any completed force-stop/restart in this run. Do not count it as persistence acceptance.
- Dedicated Story 6-case Chromium and independent native APK install were still executing at this checkpoint; their outcomes must not be guessed or backfilled.

The single-feature Story nav touch fix is verified in actual browser mobile smoke, but the containing PR #170 **remains DRAFT and unmerged** due to independent unresolved native and script/runtime gates. Retain #139/#168/#171/#108. No release, no RC and no other project changes.
