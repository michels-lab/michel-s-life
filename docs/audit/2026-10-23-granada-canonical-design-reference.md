# Operación Granada — real canonical UI screenshot reference (2026-10-23)

**Goal:** prevent recurrence of the rejected generic Lovable UI Lab. Use **existing app screenshots** as the starting point for any Figma/Lovable prototype. The original Michel's Life design remains the accepted reference. This block does not modify the app's frontend, branded assets, Android Kotlin, Windows packaging, releases, user data or permissions.

## Before (root cause)

The first Lovable prototype was built from a generic description, not canonical screen evidence. Its appearance and workflows were not benchmarked against the real approved frontend. The previous [rejection and guard](2026-10-22-granada-lovable-ui-prototype-rejected.md) blocks adopting such a mock, but the real CI screenshots were still fragmented across desktop and Android artifacts and missing a small dedicated machine-readable layout reference.

## Implemented — existing real Chromium captures, NOT new renders

The additive utility `tools/build_canonical_design_reference.py` reads **already captured** PNG files and the exact UI AppBundle used by that GitHub Actions run. It never generates fake/reference screenshots. It fail-closes on missing images, malformed PNG chunks/CRC, mismatched viewport/DPR, unavailable bundle or invalid Git source SHA.

**Desktop browser** reference in the existing `UI smoke` artifact (`artifacts/ui-smoke/`):

- `08-home-1280x800.png` — current Dashboard, 1280×800 CSS pixels, DPR 1.
- `07-about-1280x800-initial.png` — current About, same viewport/DPR.

**Android-mode Chromium** reference in existing `Android UI smoke` artifact (`artifacts/android-ui-smoke/`):

- `sections/dashboard-412.png` — current mobile Dashboard.
- `sections/about-412.png` — current mobile About.
- `sections/contracts-412.png` — current Premium Contracts.
- `sections/stats-412.png` — current Statistics.
- All four 412×915 CSS pixels at DPR 2.625, captured from the existing Android-browser test route; **not a physically installed Android APK**.

For each passing screenshot suite, CI additionally emits:

- `design-baseline.html`: **offline, clickable side-by-side gallery of unchanged current UI captures** (same artifact folder, no remote dependencies).
- `design-baseline.json`: exact checked-out source SHA, generated UI bundle SHA-256, image SHA-256, viewport CSS dimensions, DPR, actual image pixel dimensions, product, platform and explicit `REFERENCE_ONLY_NOT_VISUAL_APPROVAL` status.

Both files are included automatically in **existing** 7-day GitHub Actions artifacts. This is a current-source artifact, **not** a static frozen approved design snapshot in a separate public deployment. Do not treat different CI runs, commit SHAs, app states or viewports as equal without checking. A baseline capture can be compared with a future candidate only after exact matching, a feature preservation checklist and explicit owner review.

## Tests and boundaries

- Execute `python tools/build_canonical_design_reference.py --self-test`: **10 synthetic fixtures**, covering normal desktop/mobile and missing, corrupted, truncated or wrong-size PNGs for each. These test the parser and missing-evidence rejection **without** approving any image style.
- `UI smoke` now invokes the utility using its already generated Chromium captures, after the existing release-bound visual manifest. `Android UI smoke` invokes it after actual section layout tests. Missing captures fail the relevant design-reference CI job instead of inventing replacements.
- Existing smoke workflows still run their normal behavioral checks. Neither smoke test nor this visual gallery proves a real Android device, installed Windows application, sign-in, cloud sync or subjectively better UX.
- No Lovable usage or new credits, Figma seat changes, hosting, secrets, GitHub cross-product data, native release, RC or user-state upload.

## Next external design proposal

Only choose a **specific UI defect** in the current interface. Use the captured baseline (same viewport and state), demonstrate feature-preserving candidate captures and show a genuine improvement. The separate opt-in candidate gate `tools/validate_external_ui_design.py` blocks fake/missing comparisons and owner approval. If rejected, preserve the original and do not spend more build credits.

**Source / evidence:** `.github/workflows/ui-smoke.yml`, `.github/workflows/android-ui-smoke.yml`, `tools/ui_smoke_v303.mjs`, `tools/ui_android_section_design_smoke.mjs`, `tools/build_canonical_design_reference.py`.
