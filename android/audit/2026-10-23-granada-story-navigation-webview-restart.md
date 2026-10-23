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


## Closed exact-head CI accounting — same source `1ff246dffb8b40c380071d7d807242ba180ff767`

**Green:**
- Source validation #39912545816: success
- Android UI smoke #39912545686: success, including exact real touch target on returned Story Chapter form (previously blocked by bottom bar)
- General UI smoke #39912545795: success
- Exact-commit debug APK compiler in native XP #39912545638 and APK build #39912545653: success (APK built, **not an accepted installed app**)

**Red / release-blocking:**
- [Dedicated Story 6-case matrix #39912545657](https://github.com/michels-lab/michel-s-life/actions/runs/39912545657): **4/6**. 320 EN, 360 EN/ES, 412 ES passed. 320 ES and 412 EN produced intermittent genuine `SyntaxError` on page **relaunch** despite the Chapter CTA itself being usable in other cases. Redacted CDP fingerprints of the failed scripts were `8aa8f3f1e3fb67d692e0457b9ec0d86eb6b59f3a47ef4c678b3452d7c82791fa` (1,988 bytes, start line 17,358) and `f3248c86698be959d718a2358351d67642d276ecaa50326a780ae67fb36ae6b0` (16,165 bytes, start line 12,748). Script source and user data were NOT logged. Parser location is not yet a proven source line. Keep #168 open.
- [Native synthetic XP/two-force-stop #39912545638](https://github.com/michels-lab/michel-s-life/actions/runs/39912545638): exact-head APK compiler success, real initial Android 1080×2400 PNG passed; **before seeding the synthetic mission**, CDP timed out. The new categoric diagnostic recorded `adb_reachable=false` and `app_pid_present=null`, `boot_completed=null`, `cdp_http_reachable=null`. Two force-stop and saved XP evidence did NOT occur. The fail-closed job rejected the run. No claimed XP loss or retention.
- [Separate native APK install/launch #39912545653](https://github.com/michels-lab/michel-s-life/actions/runs/39912545653): APK compiler success, fresh MainActivity launch `LaunchState: COLD`; all five initial real-frame screenshots failed; then emulator port 5554 refused. No native application pixel acceptance. This confirms hosted emulator instability remains #139, not that the production Story fix failed or passed on a physical device.
- [Cross-platform Project/Story browser #39912545774](https://github.com/michels-lab/michel-s-life/actions/runs/39912545774): Windows browser runtime exception, FAIL. Must investigate without masking the runtime error; no evidence of a confirmed loss of missions or account data.

**Exact result of GRANADA:** production Story nav overlay fault fixed **in open PR #170**, browser mobile general smoke validates the scenario, standalone safe native diagnostic and source hashes implemented, **no merge** of PR #170 and **no release**. Open blockers #168 (intermittent JS), #139 (host native), #171 (signed Android Story acceptance), #108/#55 (real A/B account isolation and credentials). Latest public Android 0.2.9, Windows 3.0.221. Never treat 24/24 native liveness of the previous public APK #178 as native acceptance of the new Story source.


## GRANADA 2026-10-23 — generated inline script provenance and RED release gates

**Root investigation, not a source fix yet.** Dedicated [Story six-case run #39912545657](https://github.com/michels-lab/michel-s-life/actions/runs/39912545657) remained **FAIL 4/6**, with 320 ES and 412 EN reporting genuine JavaScript `SyntaxError` on browser reload. Cross-platform [Project/Story #39912545774](https://github.com/michels-lab/michel-s-life/actions/runs/39912545774) also **FAIL**, Windows browser `Unexpected end of input`. Neither proves state loss; both block stable merge/release.

New `tools/validate_granada_inline_scripts.mjs` compiles all enabled classic inline scripts of **the assembled actual Android HTML** (not only smaller separately checked JS files) using Node's syntax parser, and stores a synthetic-only **SHA256, source start-line, generated script ID and byte length** inventory without script text. [First inventory artifact #12484781799](https://github.com/michels-lab/michel-s-life/actions/runs/39915393613/artifacts/12484781799) was downloaded and inspected. Results: **184 script tags, 174 enabled classic scripts pass syntax parsing, 0 static syntax errors**. Yet the exact same run's interactive browser matrix still failed **2/6** on real script `SyntaxError` during reload (360 EN/ES), so static syntax passing does **not** waive the real error.

Generated-HTML line mapping proves the earlier Chromium CDP script-start offsets are:
- **line 12,748:** `v251-weekly-real-fix-script`, **18,792 bytes in generated canonical HTML**, versus **16,165 bytes** in one failed CDP script source record;
- **line 17,358:** `v3021-dashboard-real-category-filter`, **2,224 bytes in generated canonical HTML**, versus **1,988 bytes** in another failed CDP script source record.

The failed SHA fingerprints did not match complete static inline scripts. This supports **intermittent source mismatch, truncation or inspection discrepancy**, but **does not yet establish** whether browser/HTTP transport, runtime rewrite or Chrome inspector is responsible. Both source scripts compile as provided in canonical HTML. We therefore **did not edit unrelated canonical frontend scripts, hide `pageerror`, or close #168**.

PR #170 updated **only its test infrastructure**: fixed a diagnostic URL-basename regex that falsely reported every JavaScript source as `unlocated`, expanded the formerly first-six CDP error-source cap to capture later reload events, and compares failed CDP script-source hashes/lengths with actual generated HTML. Added post-failure hashed DOM `script.textContent` check for the two implicated script IDs (never logs actual JavaScript/source/user content). The latest exact-head [Story run #39916005593](https://github.com/michels-lab/michel-s-life/actions/runs/39916005593) must be checked before claiming its result.

Also the full exact-head source & UI gates, native debug **two force-stop + canonical XP**, signed Galaxy/proven A/B accounts remain independently required. #170 remains **DRAFT/UNMERGED** until relevant P0 failures are resolved. #168/#139/#171/#108 remain open. No RC/release/Windows native/cross-app changes.
