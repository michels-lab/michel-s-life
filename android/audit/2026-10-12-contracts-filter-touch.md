# 2026-10-12 — Android Premium Contracts filter disclosure and touch sizing

**Scope:** Android-only visual parity, issue #54. No new contract domain model, desktop markup/style, Themes, Chapters, assets, version or release changes.

**Finding:** Existing Android design smoke measured category-chip height but not width, and never exercised the collapsed filter disclosure. Shared Contracts renders can reapply inline geometry, leaving short labels as narrow tap targets even after phone-specific CSS.

**Candidate:** Keep the canonical category controls in an accessible `details/summary` disclosure. Android-only style wraps chips and sets 44px minimum width; post-render Android enforcement sets min-width with the same priority as canonical geometry. This is a presentation adjustment, not a parallel filter implementation.

**Functional QA:** extend the existing Playwright Android section smoke at 360×915 and 412×915. Use real summary clicks to close/open/close the disclosure, verify chips are concealed when collapsed, measure actual visible chip width+height >=44 CSS px and horizontal viewport containment, and retain open-state screenshots.

**Acceptance required:** exact candidate Android UI smoke, source validation, shared/Windows UI smoke, and Android 16 APK build/install if triggered; verify logs before merge. A Chromium phone viewport is not physical Samsung interaction or a real Supabase Windows↔Android sync test. No release authorized.
