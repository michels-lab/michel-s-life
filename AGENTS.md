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


## Fundamental visual identity and About — mandatory

This is a **core Michel's Life product contract**, not optional branding polish.

### Product-wide visual system

The approved mountain/path/star logo geometry is the foundation of the app's visual system. Preserve the defining silhouette, proportions and spatial relationships. Color, monochrome/inverted treatment, glow, glass, outline, translucency, material and motion may adapt to theme/context.

Do not satisfy branding by pasting the source SVG into unrelated screens. Translate the mark's visual DNA into layout rhythm, progress paths, missions, achievements, chapter transitions, status/completion states, cards, highlights and motion where appropriate. The goal is coherent visual ancestry, not repetitive logo placement.

### About hierarchy

About MUST be intentionally designed in this order:

1. **Product identity first** — approved Michel's Life mark/lockup, product name, real current version and product-facing composition derived from the app identity.
2. **About the author** — current canonical Michel Duarte portrait, **Michel Duarte**, and appropriate developer copy.
3. **Michel's Lab parent brand** — official Michel's Lab mark/lockup shown as the studio/ecosystem identity without overpowering Michel's Life.
4. **Social profiles** — each visible network link shows the recognizable network icon **and** the visible network name together, using canonical URLs from the master `brand/developer-profile.json`.

Do not finish About with text-only social links or icon-only social buttons. Accessibility labels/tooltips supplement the visible network name; they do not replace it.

Treat this hierarchy and the product-wide logo-derived design language as part of product completeness. Visual work must not regress it.

Follow `standards/PRODUCT_IDENTITY_STANDARD.md` and `standards/ABOUT_STANDARD.md` in `realmichelduarte/Michel-Software-Standards`.

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
