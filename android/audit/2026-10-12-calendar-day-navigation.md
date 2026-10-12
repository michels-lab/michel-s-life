# 2026-10-12 — Android Calendar day select / month–agenda interaction

**Finding:** PR #80 validated two-column month KPIs and narrow month cells, but an attractive calendar grid does not establish that date selection persists or that switching to Agenda actually uses the same canonical planner state.

**Change:** extend the existing Android mobile Playwright smoke with real taps on a calendar date at 412×915 and 360×915. Verify selected-day state and .selected DOM marker, tap Agenda then Month and check renderer and canonical `state.settings.v30135CalendarView`; preserve selected date and no horizontal overflow. Keep existing Android bridge/shared calendar engine and all Windows source/themes/assets unchanged.

**Required:** current-head Android browser/UI smoke, source/Windows smoke and any triggered native build gates. Device calendar/provider consent, Android accessibility screen reader, physical Samsung gestures and sync remain separate unverified requirements. No release.
