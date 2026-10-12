# 2026-10-12 — Android Journal real editor / persistence acceptance

## Finding and scope
Android design acceptance had responsive Journal CSS and a Quick Capture → Journal smoke, but the **actual full Journal editor** lacked a direct smoke for title/body autosave, section re-entry and full WebView reload. Browser layouts and data wiring can regress independently of Quick Capture. This task is isolated from the in-flight mobile design PRs #81/#84 and from native CI transport PR #85.

## Implementation
- New Playwright `tools/ui_android_journal_save_smoke.mjs` under the Android-only fixture, linked from `.github/workflows/android-ui-smoke.yml`.
- Enter canonical Journal at 360/412px, check computed editor geometry/font/overflow, retain visual screenshots.
- Write a synthetic title and body through *real UI inputs*, wait for JournalV30189 entry and Saved indicator, reroute and reload; confirm the canonical entry still exists after reinitialization.
- Reopen at 360×640 short viewport, focus and scroll the textarea and verify useful dimensions. The test **does not claim to have opened a real Samsung software keyboard**.
- No duplicated Journal store, no modifications to desktop, original Themes/Chapters/assets, no real personal user records.

## Required evidence
Android browser UI run on exact PR HEAD + source/desktop checks are mandatory. This is a QA-only change; do not label full Android parity complete from passing just this check. Native installed-APK screenshot and physical Galaxy IME behavior remain separate issue #54 / #23 acceptance. No public release from this PR.
