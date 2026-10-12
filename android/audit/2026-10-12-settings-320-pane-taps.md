# 2026-10-12 — Android Settings canonical pane tap regression at 320/360px

**Context:** Android first-class section parity issue #54. Existing browser smoke checked Settings geometry at 412px and routed Sync/Google, plus reduced-motion About at 360px. Neither established all three real category switches remained visible and selected on a 320px compact phone.

**Candidate:** independent test-only update to `tools/ui_android_compact_accessibility_smoke.mjs`. At 320px and 360px open canonical Settings, tap the existing Sync, Google and About category buttons, confirm the corresponding real pane is active, measure the button/pane boxes and document overflow, and retain per-section screenshots. No new settings state, UI reimplementation, desktop modification, or version bump.

**Gate:** exact-head Android UI browser smoke, source/desktop UI checks where triggered. The test is not evidence of physical Galaxy touch or Supabase/Google provider authentication; do not close #54 or claim release readiness. No release authorized.
