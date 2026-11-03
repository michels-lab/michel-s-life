# Operación Granada — Lovable UI Lab rejection and existing-design baseline (2026-10-22)

**Owner verdict:** **REJECTED**. The first Lovable prototype **is not a visual improvement** over the already accepted Michel's Life design. Treat this as a product/process failure and do NOT present the Lovable preview as a replacement, redesign, upgrade, release candidate, or evidence of UI parity. GitHub app/frontend and public releases are unchanged.

## Evidence and root cause

- Canonical source: [existing Michel's Life frontend](../src/MichelsLife/frontend/index.html); [product visual contract](../AGENTS.md); [real mobile UI inspection](../tools/ui_android_section_design_smoke.mjs); [capture gallery notes](../android/audit/2026-10-12-ui-screenshot-gallery.md).
- Rejected external candidate: [Michel's Life UI Lab](https://lovable.dev/projects/f5b4aa12-cf79-4a95-8036-9e730f72aac1), Lovable project `f5b4aa12-cf79-4a95-8036-9e730f72aac1`, generated 2026-10-22, snapshot commit `6a885a492f05261881f32ae8f7795b3f14953659`. It is a **standalone demo**; Lovable reports `is_published=false`. A Lovable preview URL is not a privacy guarantee and must never host personal datasets.
- Inspected the actual generated `src/routes/index.tsx`: one new simplistic six-item navigation, demo missions and hardcoded Premium progress/chart values; own generic `Mountain` icon, generic gradient palette, no canonical design asset imports or product-state parity. Merely clicking locally controlled checkboxes is not equivalent to the existing advanced mission contract model, themes, settings, cross-device state and dedicated mobile screens.
- Current existing app already has specific accepted layout, branded mountain/path/star system, current chapter, Premium Contracts, mission recurrence/XP integrity, themes, density/atmosphere controls and numerous distinct Android screens. There is a real 9-section screenshot audit covering 412px and further 360/320px checks; the prototype was never benchmarked at matching widths against these images. **No validated side-by-side screenshot comparison was carried out** before recommending it.
- **Root cause:** fabricated a new look solely from an abstract prompt, skipped reading and capturing the actual UI before ideating, skipped a feature/parity inventory, skipped side-by-side artifacts, and confused a completed Lovable build with an approved improvement. A green demo build says nothing about superiority, parity, or canonical functionality.

## Granada disposition

| Item | Evidence / resolution |
| --- | --- |
| Original app's approved look and functionality | **PRESERVE.** No canonical frontend, Android, theme, signed app, build, release, secrets or user data changed by Lovable |
| Lovable first-generation candidate | **REJECTED**, parked for historical audit only; no extra design-build credits spent correcting it blindly |
| External project agent | Project knowledge updated to mark **REJECTED** and demand actual baseline/same-size comparisons, feature preservation, and owner acceptance before any future work |
| New preventive test | `tools/validate_external_ui_design.py --self-test` with explicit negative cases: missing baseline, same reference frame, lost feature, absent owner decision, and one positive synthetic fixture |
| Future design changes | **Targeted modifications only**, grounded in canonical screenshots and measured improvement on a specific surface, not a generic replacement UI |
| Native Android / physical Galaxy tests | Unaffected, still separate acceptance gates |
| Windows native packaging | Remains **owner-paused**; test-only browser captures are not installer builds |

## Mandatory new acceptance flow for ANY external prototyper, including Lovable/Figma

1. Capture the **current app** (same real code SHA, synthetic seeded data), at minimum one desktop and one mobile viewport for dashboard changes. Use the existing screenshot tools/artifacts where available. Record screen, viewport, exact commit and immutable screenshots; if unavailable, **BLOCK** the proposal.
2. Inventory elements of the approved interface, not just labels. Preserve navigation, logo/identity composition, chapter, progress, real missions/completion ordering, Premium, statistics, themes, density, atmosphere and About. Identify elements exclusive to Android vs desktop.
3. State one concrete deficiency being solved and the expected change. No proposal based on 'modern', 'premium', 'cleaner', or subjective mock-up adjectives alone.
4. Make a **small, isolated candidate**; capture at the **same exact viewports and state**. Record lost functionality explicitly instead of replacing mature workflows with three mock cards.
5. Produce side-by-side owner-review evidence, functional comparison and quantitative/testable acceptance criteria. Save `docs/ux/<candidate>.json` with matching original/candidate PNG fixtures; validate with `python tools/validate_external_ui_design.py --manifest ...`. This is an **optional candidate acceptance gate**, not a normal-app-release blocker.
6. Owner decision is separate from CI: **no user acceptance = NOT APPROVED**. Do not invent a review, accept a screenshot automatically, connect personal data, or consume more Lovable credits merely to get a build.
7. If specifically approved: implement separately in canonical repo by a scoped PR and functional UI tests; reuse existing UI architecture and assets. Do not import the whole Lovable application or force web scaffolding into Android/Windows source.

**Important evidence limits:** This report inspects repository code and existing screenshot test infrastructure; it does not assert that physical-device UI was re-reviewed side-by-side in this turn. The user's rejection itself is the deciding acceptance signal. We do not delete the Lovable project or its previews without explicit instruction.
