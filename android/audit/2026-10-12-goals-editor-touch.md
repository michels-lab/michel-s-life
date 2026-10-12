# 2026-10-12 — Android Goals canonical editor phone-first parity candidate

**Gap in Android issue #54:** Goals board retained the original desktop modal with auto-fit columns and compact controls, but Android section smoke never entered Goals or demonstrated real create/save.

**Android-only change:** keep the canonical `goalEditForm` and `saveGoalEdit()` untouched. Scope a one-column, touch-sized, scrollable and keyboard-height-aware sheet to `html[data-mlv-platform="android"]` and the exact existing Goals modal. 48px controls; 44px day chips and dismiss button; sticky actions; no new user-state engine or changes to Windows, Themes, fonts, Chapter or assets.

**Functional visual QA:** open real Goals at 412×915 and 360×915; invoke actual New Goal, fill Name/Target/Description, inspect computed modal/form geometry (including 360×620 short keyboard-height viewport), capture screenshots, submit through the canonical button and verify local persisted `goals` record plus rendered card and modal dismissal.

**Status:** candidate awaiting exact-head Android UI, source and general UI, plus Android 16 candidate build/install if triggered. Browser viewport simulation is not physical Galaxy IME or cloud sync acceptance. Issue #54 stays open and no release is authorized.
