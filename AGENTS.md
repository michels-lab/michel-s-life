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
