# Android Projects editor — phone-first modal acceptance

Date: 2026-10-12
Status: Candidate only, no release

## Finding / risk
The approved Projects list already renders on 360px phones, but its canonical `v30106ProjectForm` has desktop-width editors, a potentially obstructed footer, and editable mission links in a modal shared with Windows. Design completeness requires testing **open → enter fields → link real mission → Save → persisted project card → restored navigation**, not merely rendering the empty-state screenshot.

## Bounded implementation
Only `android/mobile-sections.js` owns the Android `#modalRoot:has(#v30106ProjectForm)` presentation: independently scrolling full-width phone sheet, keyboard-ready 16px/48px fields, 44px+ close/action hit targets, single-column details, reachable linked missions and safe-area-aware sticky Save. Underlying canonical `saveProjectForm`, business state, Windows Themes/Chapters/fonts/assets and desktop renderer are unchanged.

## Validation plan
Real Android Playwright UI smoke at **412×915** and **360×915** clicks New project, edits name/description, checks mission linking, measures form/Save/viewport/elementFromPoint/nav exclusion, captures screenshots and saves through the shared app handler; asserts the resulting project card and navigation restoration. Required exact-head Source validation, UI smoke, Android UI smoke, Android 16 APK candidate build/install/launch before merge. A browser fixture does not prove the physical Galaxy IME or original user data sync.

No public release.
