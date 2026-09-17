# Michel's Life

RPG-inspired productivity and life-management desktop app for Windows.

## Current line

**v3.0.202 — Release Readiness** adds app diagnostics, portable `.michelslife` backups, local error reports, a GitHub update channel, release automation, and product cleanup without redesigning the approved visual system.

## Repository layout

```text
src/MichelsLife/                 Windows host
src/MichelsLife/AppPatches/      readable frontend release deltas
installer/                       Inno Setup definition
tools/                           build/validation utilities
docs/                            release-channel documentation
.github/workflows/               CI and Windows release pipeline
```

The app currently has **204 JPG visual assets**. They live in the official `AppBundle.zip` release asset rather than being duplicated in Git history. CI downloads the previous bundle, applies the source-controlled frontend patch, validates the complete generated `index.html`, then embeds the rebuilt bundle in the Windows executable.

## Secrets

The Google OAuth build credential is **not committed**. Local builds can use `MICHELSLIFE_GOOGLE_CLIENT_SECRET`; official CI injects the GitHub Actions secret `GOOGLE_CLIENT_SECRET` at build time.

User OAuth tokens, backups, diagnostics, and personal app data are never stored in this repository.

## Validation

```bash
python tools/release_smoke_test.py
```

A full release build additionally reconstructs the frontend and runs `tools/validate_generated_index.py`, including migration checks and syntax validation for every inline script.
