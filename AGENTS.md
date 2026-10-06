# Michel's Life — Agent Contract

This repository contains Michel's Life Desktop and Android. Before editing, read `.michelslab/project.yml`, `MICHELS_LAB_PROJECT.md`, the relevant project log, and the files/workflows that own the behavior being changed.

## Source-of-truth logs

- Desktop/general: `GIT_AUDIT_LOG.md`
- Android: `android/ANDROID_AUDIT_LOG.md`
- Infrastructure/cloud: `docs/INFRASTRUCTURE_AUDIT.md`

Shared Michel's Lab rules live in `realmichelduarte/Michel-Software-Standards`.

## Product constraints

- Preserve the current accepted visual base unless the task explicitly requests a visual change.
- Do not refactor Themes, backgrounds, Current Chapter, general layout, typography systems or assets as collateral work.
- Frontend source/release deltas and the generated `AppBundle.zip` pipeline are deliberate; inspect the release tooling before changing generated frontend behavior.
- Desktop and Android are separate platform surfaces. Do not force desktop UX onto Android for code reuse.
- Google Drive/OAuth changes require explicit auth, secret-boundary, conflict/recovery and real-provider validation reasoning.
- Never commit OAuth secrets, tokens, signing material or personal app data.

## Official product identity — mandatory

Michel's Life uses the approved Michel's Lab canonical logo geometry from `realmichelduarte/Michel-Software-Standards`.

**Do not implement branding by simply pasting the source SVG into screens.** The logo is a design language, not a sticker.

Protected identity:
- preserve the defining mountain/path/star silhouette, proportions and spatial relationships;
- do not stretch, skew, redraw into another symbol, or alter the geometry until it stops reading as the approved Michel's Life mark.

Adaptive expression is expected:
- color may adapt to theme/context;
- monochrome, inverted, glow, glass, outline, translucent and animated treatments are allowed;
- mark-only and mark + product-name compositions are allowed where appropriate;
- the mountain/path/star visual DNA should inform relevant progress paths, missions, achievements, chapter transitions and completion states.

A screen can be correctly branded without displaying the full logo. Prefer integrated visual language over repeated logo placement.

The approved mark is the **foundation of the product-wide design system**, not just a branding asset. Its visual DNA should influence layout rhythm, cards/containers, hierarchy, progress/status states, controls, transitions, loaders, background motifs, highlights and premium moments where appropriate.

**About is a primary brand showcase.** It should give the canonical mark/lockup prominent visual presence and may use richer scale, motion, material, background motifs and composition derived from the mountain/path/star identity. Do not reduce About to a metadata page with a small logo.

Follow `standards/PRODUCT_IDENTITY_STANDARD.md` in the master standards repository as the authority.

## Validation

For Desktop changes, inspect the owning workflow/tooling and run the relevant current-commit checks. The documented baseline includes:

```bash
python tools/release_smoke_test.py
```

Generated frontend/release changes may also require `tools/validate_generated_index.py` and the reconstruction/build path used by CI.

For Android changes, use the Android workflow/Gradle tasks that cover the changed surface. Device-only behavior must remain explicitly unvalidated until tested on a real target device.

For any changed animation, verify a real state/position/transform difference at two moments; an animation declaration alone is not evidence.

## Completion

Update the appropriate audit log with meaningful bugs, decisions, tests, failures and validation. Do not bump versions or publish releases unless the assigned task explicitly authorizes it.
