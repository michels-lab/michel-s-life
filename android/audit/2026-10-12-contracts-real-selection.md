# 2026-10-12 — Premium category chip must filter real data on Android

**Context:** follow-up to merged #89. Touch dimensions and compact disclosure alone are insufficient proof of a working category selection.

**New acceptance:** in the actual 412px and 360px Android browser fixture, open the compact category picker, tap the first non-All category, wait for active selection, confirm the on-screen card count matches its canonical count pill and the selected ID is saved to `settings.v216ContractFilter`; verify no horizontal overflow, capture the filtered board, then reset to All with a real tap. Use the original shared v216 chip handler and save; no duplicate Android filter domain model.

**Scope:** test-only; no production CSS, Windows, Android bridge, Themes, Chapter or release changes. Require current-head Android UI, shared UI, source QA; this is not physical Galaxy or Supabase acceptance. Keep issue #54 open.
