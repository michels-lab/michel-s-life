# Michel's Life — Granada: weekday text colors + floating Settings preview (2026-11-23)

## Root cause — exact source, not a cosmetic workaround

The existing v3.0.65 weekday controller in `src/MichelsLife/frontend/index.html` implements `readDayText()` and paints real mission weekday chips. It reads **active day** from the canonical `v133TextColor` / Main text, and **inactive day** from `v133MutedTextColor` / Secondary text at alpha **0.66**. However its `input` and `change` handlers matched only retired IDs containing `DayText`; users are editing current inputs `v133TextColor`, `v133MutedTextColor` and their newer v30168 aliases. An old widget could thus leave weekday labels stale while the rest of the palette updated.

## Changes

1. **Owner source fixed:** the existing weekday engine now recognizes current input IDs as well as historical `DayText`. Its existing `applyDayTextForever()` remains the only owner of real weekday chip styling.
2. **Canonical bridge event:** `settings-color-floating-preview.js` synchronizes same-token color-picker aliases and sends one `mlv:theme-text-changed` event only after text colors have been stored and updated; the owner listens to this event and repaints the active/inactive chips. No new weekday preference keys or duplicate DOM renderer.
3. **Visible floating preview:** the existing contextual Settings panel shows a Sunday-first seven-day *example* (not a second calendar), with Monday active in the example, active foreground = Main text, inactive = Secondary text at 66%, localized ES/EN explanation and actual hex colors. The example changes while dragging and honors Undo/reload.
4. **Regression:** `tools/test_settings_color_preview_granada.mjs` now catches the retired-selector defect, tests both v133/v30168 token synchronization, live preview and 66% alpha, event propagation and owner-only repaint logic. Existing Theme, Story, Focus, Alarm and private stores untouched.

## Validation and release gates

- Candidate branch and PR only, not a public release. Run exact-head Node + Chromium Settings tests, UI smoke and Android UI, then examine actual Windows/Android screenshots and owner visual feedback.
- Browser/CI evidence is not physical Galaxy acceptance. Separate issue #168 intermittent generated inline JS SyntaxError and hosted emulator QEMU/ADB failures remain open; do not suppress/redesign around those failures.
- Current official stable remains Windows 3.0.231 / Android Direct 0.2.20 with 13 signed/verified assets. Measured product acceptance unchanged **7/15 (47%)**.
