# Michel's Life — Operación GRANADA: Android real-touch route resilience

Date: 2026-10-20 (America/Monterrey). Independent QA and developer-diagnostics package for issues #54 and #104; **not a customer-facing feature release**. Android stays active; native Windows packaging is paused.

## Five substantial deliverables

1. **Real touchscreen navigation:** open actual app drawer and tap nine canonical sections (dashboard, missions, contracts, calendar, journal, projects, stats, story, settings) at 320, 360 and 412 px, **27 required combinations**. Internal fast-route is checked only for boot readiness, not used to navigate. Missing/untappable entries fail.
2. **No-clipping/touch resilience:** measure visible section and document dimensions, Android bottom nav size, target-center hit testing, covered controls, horizontal overflow and duplicate native bars.
3. **Relaunch invariants:** reload the actual browser shell twice per width **without reseeding state**. Canonical XP, mission/completion identifiers and goals must remain stable from navigation and boot alone.
4. **Privacy-safe findings:** machine report with bounded error codes, section and viewport metrics, plus screenshots using synthetic data only; no DOM text, account information, mission names, journal entries, tokens or secrets in JSON.
5. **Standalone test/CI:** eleven pure Node coverage/geometry/privacy regressions, independent Playwright source overlay, browser fixture and redacted artifacts; no Android installer, Windows MSIX, Google Play, live Supabase or customer data touched.

## Ownership / re-entry

No code changes to the Android UI sources currently occupied by #134 Developer Twin, #135 Calendar, #138 native persistence, #150 Premium, #151/#152 Focus, #153 large cross-device sync, or #154 backup preflight. No changes to shared log files claimed by #134. This dated audit records this isolated branch.

**Current acceptance level:** candidate implementation + CI verification required. Green Chromium testing does NOT certify a signed installed Galaxy APK, native keyboard/TalkBack, battery/Doze, real account sync, physical relaunch, or customer release. If any real route fails, preserve an exact repro and coordinate with its owner rather than overlapping their branch. Native Windows builds remain paused; release needs explicit owner authorization.
