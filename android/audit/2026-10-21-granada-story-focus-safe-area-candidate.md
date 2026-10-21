# GRANADA — Android Story/Focus safe-area candidate · 2026-10-21

## Ground truth
- Issue #171 documents three independent 412px English failures of the actual chapter-submit touchscreen hit test with the Focus mini-player active. 320 EN/ES, 360 EN/ES and 412 ES passed.
- Existing Android mobile experience CSS fixes the mini-player above the bottom nav, but main reserves only ~92px. The Story CTA scroll-margin was 110px: a real overlapping safe-area, not a proven state or authentication defect.
- PR #134 owns android/mobile-experience.js and Developer runtime; PR #156 owns canonical frontend index.html. Neither occupied production file was edited. This is an independent candidate awaiting integration.

## Functional deliverables
1. New android/story-focus-safe-area.mjs computes bottom clearance from actually visible mini-player/navbar geometry, and applies scroll space to the active Story editor alone. It preserves app themes, typography, countdown state and unrelated tabs; it never reads progress/account content.
2. After chapter field blur, the module checks CTA and panel bounding rectangles and requests bounded scrolling to move the CTA outside the overlay. It never manufactures a click or bypasses the real app router. Observer-driven updates are idempotent to avoid layout loops.
3. New tools/test_granada_story_safe_area.mjs: 10/10 Node arithmetic regressions passed locally on 2026-10-21, covering mini visible/nav-only/no panels, oversized/minimum margins, covered/clear submit, malformed and impossible geometry.
4. Existing six-case Playwright Android browser-model Story→Settings→Focus→reload→Story draft→real tap test now supports an opt-in candidate flag. Default baseline is UNMODIFIED and remains red until the production app is fixed. Evidence goes to separate baseline/candidate folders with exact commit SHA.
5. Dedicated workflow still executes baseline first and records failure; an additional post-failure candidate run compares the proof-of-concept without making the original red gate green. CI results need exact-head review; signed Galaxy or live accounts are not tested.

## Exact evidence and release restrictions
- Prior verified baseline: 5/6 browser-touch pass, one blocked Story CTA at 412px English; 21/21 private-safe diagnostics pass. Run: https://github.com/michels-lab/michel-s-life/actions/runs/39659539872
- New comparison: https://github.com/michels-lab/michel-s-life/actions/runs/39661392736. Consult logs/artifacts before claiming a candidate pass.
- Future owner #134 integration: wire behavior into the real installed Android code after occupied-file changes are reconciled, then require original baseline test GREEN without opt-in, user-visible functional check, native cold-relaunch and signed APK/Galaxy acceptance.
- Other release blockers remain #139 emulator transport, #104 installed progress persistence, #108 cross-account data isolation and #55 cloud credential boundaries. No RC/beta or final release now.

**Current state:** independent source candidate committed and 10/10 local geometry checks pass. Production integration, real Android signed testing, and final release are NOT complete.