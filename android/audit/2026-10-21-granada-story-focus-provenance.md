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
