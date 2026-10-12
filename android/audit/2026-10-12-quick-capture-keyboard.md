# 2026-10-12 — Android Quick Capture short-viewport keyboard acceptance

**Focus:** Android first-class parity issue #54, separate from Contracts and Settings parallel PRs.

**Gap:** Existing 412×915 Quick Capture smoke validates the sheet and saves missions/Journal, but not an editing viewport reduced to the height commonly left by a mobile keyboard. A save button can be present in DOM and still be obscured by the keyboard.

**New independent QA:** Playwright at 360×620 and 412×620 opens actual Android header Quick Capture, selects the canonical mission path, focuses/fills the real input and measures input font, card bounds and Save bounds inside a short viewport; captures the focused sheet, taps real Save, checks a mission persisted in shared `vida_rpg_personal_progress_v2`, and retains a saved/closed screenshot. Integrate as a separate Android UI workflow step. No shadow user-state model, product CSS/desktop changes, or release.

**Evidence status:** candidate awaiting exact-head GitHub Actions; browser viewport height reduction only simulates layout and cannot certify physical Galaxy IME insets, Samsung gestures, soft keyboard or real account sync. Failed checks must be repaired before merge. No release.
