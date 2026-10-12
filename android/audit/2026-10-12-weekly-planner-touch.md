# Android design audit — canonical Weekly Planner touch parity

Date: 2026-10-12
Status: candidate, not published

## Finding
The canonical Weekly Planner embedded in Missions still uses desktop-style four-column template creation and seven 34px-high weekday controls (from the shared v169 renderer), even on compact Android phones. Calendar and Weekly Review are being validated in separate PRs; waiting for those runs is not a reason to leave this independent mobile design defect untouched.

## Implementation
Android-scoped CSS in `android/mobile-experience.js` presents the real v251/v169 planner as a single-column creation form with 48px fields/buttons, full-width template cards, seven weekday choices in a thumb-reachable four-column/two-row grid and 48px Edit/Clear/Archive actions. Original shared planner data, scheduling, recurrence, XP, storage, colors and desktop visuals are unchanged.

## Acceptance gate
The existing Playwright Android mobile smoke creates a synthetic weekly template via the real form, verifies computed 360×915 and 412×915 target dimensions and overflow, taps a weekday and observes the canonical active state. Require exact-HEAD Android UI/source/desktop validation, Android APK build and native Android 16 install/launch before merge. Android browser interaction is not physical Galaxy keyboard acceptance. No release, permission or version change.
