# Operación Granada — Calendar keyboard/TalkBack & Journal status

**Date:** 2026-10-19 (America/Monterrey)  
**Repo:** `michels-lab/michel-s-life`  
**Issue:** #54 — Android first-class section parity  
**Work branch:** `granada/android-calendar-accessibility-20261019`  
**Parent:** `main` at `7fb51d1aa2f7da6da4812f50c18df1f60b200082`  
**Status:** **implemented in isolated PR candidate; exact-head CI and physical-device acceptance pending**

## Granada isolation / occupied work

- **PR #134** (Android Developer Twin, native updater, privacy/OAuth): **untouched**. It owns `android/mobile-experience.js`, `android/android-bridge.js`, Android native classes, frontend diagnostics, Android workflows and both shared audit logs. Do not cherry-pick/merge any of those unrelated changes from its feature branch.
- **PR #62** native Windows visual acceptance: postponed as Windows development/builds are paused by the owner. No Windows installer, MSIX, Desktop Developer Edition or release build is authorized.
- **#104** signed Android state drift, **#28** live account/provider sync, **#53** device alarms and **#110** real Calendar Google integration remain separate unverified blocks. This task does not attempt to solve them.
- Master `Michel-Software-Standards/.michelslab/task-claims.json` had an empty active `claims` object at task start; no cross-chat claim was taken for PR #134.

## Verified source defect

The canonical Calendar's `calendarGrid()` in `src/MichelsLife/frontend/index.html` emits `<div class="v30135-day" data-date="YYYY-MM-DD">` with pointer/click behavior and selected styling, but without native button semantics, keyboard focus, or a named button for Android screen readers. A visually tappable day is therefore not equivalent to TalkBack or keyboard access. The canonical Journal save indicator exists but its live announcement semantics were not guaranteed in the Android post-render ownership pass.

## Scope implemented (no second data engine)

1. `android/mobile-sections.js`: augment each existing Calendar day on Android with date-aware, localized accessible label, `role="button"`, `tabindex="0"`, `aria-pressed`, Enter/Space keyboard activation delegated through `element.click()` to the **existing** canonical selection listener. Preserve any source-authored aria label and avoid duplicate listeners across redraws.
2. Android-only `:focus-visible` outline for keyboard users; no changes to Themes, Current Chapter, logos or Windows layout.
3. Journal's existing `#mlv184JournalSaveState` now uses a polite, atomic status announcement where not already supplied by canonical markup.
4. `tools/ui_android_section_design_smoke.mjs`: new 360/412px real-browser interaction checks (focus, role, accessible name, Enter/Space canonical persisted date and selected `aria-pressed`), plus Journal status semantics. The existing Android UI workflow already executes this test; no workflow or Windows packaging triggers changed.

## Validation evidence and boundaries

- GitHub branch commits created through the GitHub connector: source `7ba977b4e9ca671cd3e6a427e25cfd79cb94295f`; test `1005d895c209a9ead83f79af02daa1d3147b0253`. Repository writes verified by the connector.
- Read-only source inspection confirmed the calendar cell markup and canonical shared click handler path. **This is source evidence, not proof of executed browser tests.**
- **Pending:** exact-PR-head `Android UI smoke` run; installed Android16 APK render; physical Galaxy TalkBack, optional external keyboard and owner visual approval. PR must not merge with failed/pending critical checks.
- **Release:** none. The existing public Android Direct 0.2.9 and paused public Windows 3.0.221 are not changed by this branch.

## Re-entry / handoff

If exact-head UI CI fails: inspect the new Calendar keyboard assertions and their saved date at 360/412 without touching PR #134; reproduce on the browser fixture from `android/tools/prepare_bundle.py`, repair only the current scope, rerun CI. If it passes, this block may be integrated without declaring physical TalkBack acceptance. Track hardware test separately and continue GRANADA on another non-overlapping block.

Handoff identity: `granada-michels-life-android-calendar-a11y-20261019`. Evidence status: `implemented_unverified`. Owner: isolated Android QA; role: application-maintainer. 

## 2026-10-19 — CI first-pass failure and targeted correction

The **first** exact-PR-head GitHub Actions run at `65ca2931fa90149b86512ee11c7b45402d854801` is **not green**. Source validation and general UI smoke passed, Windows-native icon job correctly skipped. Two failures must be kept separate:

1. Android UI smoke `39331900240`, `tools/ui_android_section_design_smoke.mjs:329`: timed out waiting for the new Enter-driven Calendar date-selection and `aria-pressed` contract. **This is a functional/accessibility CI gate failure**, not a passed test. No Android UX completion claim is allowed.
2. Native Android16 installed APK smoke `39331900267`: TEST APK built, installed and launched successfully, then hosted emulator repeatedly failed screenshot capture and lost ADB `emulator-5554`, ending `Missing real native Android pixels after five screenshot attempts`. This is a **CI device/infrastructure interruption**; it does not prove an app layout defect or successful native acceptance.

In isolated scope we updated the Calendar enhancement to reapply semantics and restore keyboard focus to the newly-rendered selected cell after the canonical source redraw. Source commit `7b7aab69889604e057cfff4a1ff139e1b2741b73`. New same-SHA Android UI, build, install and general smoke checks were running on the subsequent query. **Do not merge until the actual updated run is green or a specific failing assertion is diagnosed and repaired.** Do not modify PR #134 Android native scripts to hide flaky ADB; keep native acceptance pending if the emulator fails again.

Re-entry: obtain the new `android-ui-smoke` log, inspect whether selection, persisted `v30135CalendarSelected` or `aria-pressed` is missing, isolate the exact unmet contract, fix only this PR's accessible Calendar adapter/test. Report native Android16 evidence separately from browser tests, and then physical Galaxy/TalkBack separately.
