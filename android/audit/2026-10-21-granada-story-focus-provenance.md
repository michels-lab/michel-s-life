# Operación Granada — Android Story / Pomodoro diagnostic isolation (2026-10-21)

## Product and ownership
- Target repository: \`michels-lab/michel-s-life\`; issue [#168](https://github.com/michels-lab/michel-s-life/issues/168).
- Last public release remains Windows 3.0.221 + Android Direct 0.2.9 (2026-10-19).
- This branch touches **only new files**: independent bounded diagnostics, synthetic runtime regression, dedicated CI and this handoff.
- Active #134 owns \`tools/ui_android_story_navigation_smoke.mjs\`, \`android/android-bridge.js\`, Developer Twin and native build; active #156 owns \`src/MichelsLife/frontend/index.html\`; active #157 owns Android emulator recovery scripts. Do not overwrite them.
- The previous intermittent browser JavaScript \`Unexpected token ':'\` observed in #168 was not established as File Steward's fault. Another PR's UI smoke later passed; the intermittent issue is not proven fixed.

## Functional package
1. \`tools/granada_story_diagnostic_core.mjs\` classifies runtime exceptions and emits only source **basename**, line, column and bounded categorical codes. Rejects arbitrary error fields that could smuggle private journal content, account tokens or complete URLs into artifacts.
2. \`tools/ui_granada_story_focus_matrix.mjs\` drives actual Playwright **touchscreen** buttons using synthetic profile only. Six cases (320px, 360px, 412px × English, Spanish), traversing Story → Settings → Pomodoro, starting timer, leaving and returning, reloading the browser WebView model, checking persistent deadline + mission IDs/XP, editing Story draft, navigating away/back and tapping Start Chapter.
3. Repro evidence: per-case redacted \`evidence.json\` pinned to **actual GitHub commit SHA**, plus screenshots of the synthetic Story/Focus UI on two widths and failure screenshots. Any failure or missing/duplicate case makes the matrix red, not success; no empty/soft green.
4. \`tools/test_granada_story_diagnostic_core.mjs\` has 19 deterministic local offline tests for syntax classification, private-data redaction, duplicate/missing case, false green, wrong native provenance, unsafe fields, source SHA and matrix failure handling.
5. Dedicated \`.github/workflows/granada-story-focus-provenance.yml\` reproduces the app's Android browser fixture from the **official source-controlled frontend** and current release AppBundle; it never signs/publishes an APK or invokes Windows packaging.

## Evidence / limitations
- Local \`node --check\` and **19/19** standalone diagnostic contract tests are validated for the developed core logic. GitHub workflow result and all six actual app-touch outcomes must be read from the **exact PR head**; do not declare the matrix passed before CI completes.
- The Android16 **native candidate** job failed in the previous PR #169 despite separate browser source/UI jobs passing; native Android reliability remains open under #139.
- Browser touch tests are **not** physical Galaxy, actual native WebView relaunch, installed APK, provider login, Supabase state, offline hardware or permission evidence.
- This is a **diagnostic and regression test block**, not a repair of the app JavaScript bug, nor a released patch.

## Next gates / release
1. Inspect exact-head six-case CI and retained redacted screenshots + error source basename/line. If script error reproduces, assign actual culprit to its owning app-source PR (not #167 File Steward) and fix there.
2. Add native signed Android install/relaunch smoke after emulator reliability #139 is resolved. Review Galaxy synthetic profile Story/Focus/keyboard and original owner experience.
3. Finish P0 account isolation #108/#55 and native persistence #104, then final-only release if ALL product gates pass; never release candidate/prerelease.
4. Leave #168 OPEN until a source fix and real Android acceptance can be distinguished from an intermittent green browser replay.

State: test harness implemented, integration/release NOT claimed. README and visual Themes/Current Chapter unchanged.

## Actual first CI observed after PR creation (run #39658884722)
- Source validation, Playwright installation and the new redacted diagnostic unit step all **PASS**.
- Actual six-case synthetic touch run **RED: 5/6 PASS**, only **412px English** failed during the Story chapter phase; 320 EN/ES, 360 EN/ES and 412 ES passed. Screenshot and redacted error manifest were preserved in [artifact #12373176343](https://github.com/michels-lab/michel-s-life/actions/runs/39658884722/artifacts/12373176343).
- Failed case reported generic `runtime_error` at assertion site, not evidence of a new JavaScript SyntaxError; source code source/line had insufficient detail to distinguish blocked button, lost text or race. Screenshot shows a running Focus mini panel above the bottom nav, overlapping the lower Story editor region at failure; **visual correlation only, not proven tap obstruction**.
- Original workflow wrote GitHub's synthetic PR merge SHA `57c29ff7b38330f79c83a7cfbf1947121d80a6de` in its report, not PR HEAD. Corrected the provenance to pass `github.event.pull_request.head.sha` (or `github.sha` outside PR), and hardened diagnostics to include only predefined non-private assertion codes. The exact subsequent run must be checked.
- **No fix to app UI was applied** because #156 owns frontend and #134 owns Android Story smoke/bridge. The red run remains a finding, not an approval or release.


## GRANADA 2026-10-22 — production Story/Focus native XP through 2 force-stops

After the original audit, the opt-in Story safe-area was integrated directly into real Android-owned `android/mobile-sections.js` (not #134-owned mobile-experience), and the test was changed to require normal production wiring (no injecting the candidate module). Exact production `d9dc5874f08d00d10bca025d401524cc2ac0c82e` passed **6/6** Android touch Story/Focus/Chapter tests, Source validation, Android UI smoke, UI smoke and Projects/Story cloud roundtrip. The main debug APK compiled; **Android16 hosted install test 39859382769 FAILED on ADB loss after initial app PNG**, twice on same SHA. **PR #170 therefore remains open/draft and unmerged.** Separate #168 random JS parse error unresolved, not concealed.

Separate diagnostic #178 **merged to main as `3ce9efd08270a2c647213192bd7d87017725cb49`**, following successful exact-head [run 39871451561](https://github.com/michels-lab/michel-s-life/actions/runs/39871451561) with **24/24 real installed official APK PNGs** across no-app, installed-idle and launched WebView; verified actual rendered Michel's Life Welcome interface, not just an open PID. This establishes intermittent hosted ADB stability, **not** persistence or real Galaxy acceptance.

### New independently required native mission/XP contract on THIS Story patch's exact source

Added all-new files (no changes to #134, #156 or #157-owned source):

- `tools/granada_native_xp_relaunch.py`: connects to an **actually installed, debuggable Android16 APK's WebView DevTools socket**, with a fixed synthetic mission ID in a fresh test-only emulator. Uses the app's **canonical `window.save()` and `window.completeMission()` APIs**. Expects actual 50 XP exactly once, second completion tap **cannot award XP again**, stable mission and completion IDs and exact same localStorage + live JS state; exports only aggregate counters and SHA256 fingerprints, no payload or provider values. Refuses any found account session.
- `tools/granada_native_xp_relaunch.sh`: installs the same-source debug APK on a fresh KVM API36 emulator, requires `run-as` debug authorization, real running process and 3 actual CRC-validated PNG frames; performs **two independent Android `am force-stop` and `am start -W` relaunches with verified new PIDs and WebView snapshots**, and compares all three saved XP and mission-state hashes. No WebView data clearing, app version rewrite or browser fixture.
- `tools/test_granada_native_xp_relaunch.py`: **14 synthetic fail-closed regression checks** for missing or conflicting ledgers, duplicate completions, XP drift, missing second boot, unsupported account/provider/physical signing claims.
- `.github/workflows/granada-android-native-xp-relaunch.yml`: creates one exact-commit candidate debug APK with the full **official app bundle and production Story/Focus assets**, SHA256 verifies the candidate between CI jobs, uses 3072 MiB Android16 native emulator to run the real 2-cold-relaunch contract; ensures signed/protected/public APK data is never inspected or published. This is **new test infrastructure only**, not a release nor proof until actual native CI is green.

**Acceptance limits:** Passing the new Android debuggable test would prove mission/XP local persistence and exact-once synthetic completion across actual Android process restarts, not a physical Galaxy, a signed Direct APK, native app login, account A/B Supabase, or actual notification/hardware Focus. Signing and real provider ownership remain release blockers. Run the new CI exact-head; if native fails, diagnose rather than reducing checks. #171 production Story fix remains unmerged until green appropriate gates; #168 remains OPEN.
