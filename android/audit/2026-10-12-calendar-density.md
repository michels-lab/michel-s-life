# Android mobile design audit — Calendar overview density

**Date:** 2026-10-12  
**Status:** Candidate in PR, no release

## Finding
Android 412×915 installed-browser screenshots from the approved mobile source showed `Calendar` with four large metric cards ('Month completed', 'Past missed', 'Scheduled one-offs', 'Month XP') stacked vertically. The actual month grid appeared well below the visible fold, forcing unnecessary scrolling and competing with the persistent mobile navigation and Focus mini-panel.

## Fix
The existing Android-only `mobile-sections.js` layout scopes the canonical `v30134/v30135-kpis` views to two compact, bounded columns for <=720px phone widths. Each metric remains its original live value; desktop frontend, Calendar events, data, recurrence, canonical models, theme assets, and scene animations remain unchanged. The mobile geometry owner reapplies two columns after a legacy shared renderer update to prevent stale desktop `!important` styling.

## Verification
The existing rendered Android section smoke suite now routes to real Calendar at 360×915 and 412×915, takes screenshots, and asserts exactly four computed cards, two equal rows, >110px card widths, >=85px card heights, no clipping, and row alignment. **Required:** exact-head UI source/browser validations, Android 16 candidate compile/install/launch, screenshots inspection, no desktop regressions, then merge. **Not verified:** actual Galaxy month swipe/soft-keyboard/provider consent or cross-device events. No release until full required gates.
