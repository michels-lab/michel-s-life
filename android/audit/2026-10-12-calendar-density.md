# Android mobile design audit — Calendar overview density

**Date:** 2026-10-12  
**Status:** Candidate in PR, no release

## Finding
Android 412×915 installed-browser screenshots from the approved mobile source showed `Calendar` with four large metric cards ('Month completed', 'Past missed', 'Scheduled one-offs', 'Month XP') stacked vertically. The actual month grid appeared well below the visible fold, forcing unnecessary scrolling and competing with the persistent mobile navigation and Focus mini-panel.

## Fix
The existing Android-only `mobile-sections.js` layout scopes the canonical `v30134/v30135-kpis` views to two compact, bounded columns for <=720px phone widths. Each metric remains its original live value; desktop frontend, Calendar events, data, recurrence, canonical models, theme assets, and scene animations remain unchanged. The mobile geometry owner reapplies two columns after a legacy shared renderer update to prevent stale desktop `!important` styling.

## Verification
The existing rendered Android section smoke suite now routes to real Calendar at 360×915 and 412×915, takes screenshots, and asserts exactly four computed cards, two equal rows, >110px card widths, >=85px card heights, no clipping, and row alignment. **Required:** exact-head UI source/browser validations, Android 16 candidate compile/install/launch, screenshots inspection, no desktop regressions, then merge. **Not verified:** actual Galaxy month swipe/soft-keyboard/provider consent or cross-device events. No release until full required gates.

## Additional screenshot finding (same design block)

The 360px real rendered screenshot of PR #79 also exposed clipped legacy *Completed / Missed / XP* text in each of the seven narrow month grid columns. Android-only month-cell styling now hides that **duplicate cell microcopy** while keeping each real day number and state dots, and preserving complete numeric details in the selected-day panel and agenda. Regression test asserts >=28 days with a visible date and dot container and hidden per-cell metadata at 360/412px. This change does not erase source data, alter date selection, or affect Windows.
