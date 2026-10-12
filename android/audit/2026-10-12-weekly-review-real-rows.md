# 2026-10-12 — Android Weekly Review populated rows and real Open Contract interaction

**Design-first issue #54:** existing Android Weekly Review smoke only measured the four summary KPIs and header actions. Real contract/health rows retained compact desktop text and side-by-side actions, risking small tap targets and low readability on phones.

**Scope:** Android-only CSS under `html[data-mlv-platform="android"]` for canonical `.v30105-review-item` rows: stacked single-column information and actions, 14px headings, 12px details, >=44px action buttons, no horizontal escape. No change to the shared review engine, Premium state, XP, Windows UI, Themes, Chapter, or assets.

**Test:** at 412×915 and 360×915, existing source-bundle Android Playwright smoke navigates to the *real* Weekly Review with seeded weekly contract, measures actual row/content/action geometry, takes an inspectable screenshot, clicks `data-v30105-action="open-contract"` and asserts it opens the existing Premium Contracts board. This is stronger than a CSS declaration or a static empty-section screenshot.

**Acceptance:** require source validation, desktop/general UI smoke, Android UI smoke, Android16 native build/install if triggered. Physical Galaxy, Windows↔Android Supabase provider, visual owner approval and signed public APK remain distinct pending acceptance; do not close issue #54 or publish a release from this candidate.

**Exact CI finding:** Android UI run [38274728479](https://github.com/michels-lab/michel-s-life/actions/runs/38274728479) failed the *new* populated-row measurement at 412px: the actual canonical `h4` remained 12px and Open button 42.28px wide despite CSS-only Android intent. The rows themselves did fit horizontally. Added scoped post-render `enforceRendered()` ownership (14px title, 12px descriptions, 44px minimum buttons), leaving the shared click handlers intact. Do not merge without retesting exact new SHA.
