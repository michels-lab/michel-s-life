# Android design audit — Weekly Review mobile readability

**Date:** 2026-10-12  
**Status:** Implementation candidate, unpublished.

The rendered `weekly-review-412.png` screenshot showed four full-width live review counters (completed, contracts completed, risk, mission health) below the introductory actions, occupying too much vertical space on a phone. The canonical desktop renderer already contains all data and action handlers; Android must only change geometry.

Android-only `mobile-sections.js` now uses two compact grid tracks for the four KPI cards, preserving the full-width introduction and original snapshot/undo/repair controls. The nested Premium Contract outlook grid becomes two columns on phones, buttons remain at least 44px tall, and no canonical data, business logic, Chapter art, desktop visuals or assets are altered.

Rendered `tools/ui_android_section_design_smoke.mjs` performs true 360px and 412px route interaction and screenshot, measures exactly four KPI cards and two track rows, ensures no overflow, 91px+ metric cards and action hit targets of 44px. Merge requires all exact-head Android and Windows/UI validations, a same-run native APK installation on Android 16 and inspection of screenshot artifacts. Real Galaxy gesture/keyboard and provider session acceptance remain pending.
