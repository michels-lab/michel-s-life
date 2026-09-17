# Michel's Life

RPG-inspired productivity and life-management desktop app for Windows.

Michel's Life combines missions, Premium Contracts, chapters, journal/history, statistics, focus tools, achievements, dynamic visual worlds, Google Drive cloud sync, Google Calendar integration, safe backups, and restore points in a single WebView2 desktop application.

## Current release line

**v3.0.202 — Release Readiness**

This build focuses on making the app safer to distribute and maintain: app diagnostics, portable `.michelslife` backups, local crash/error reports, a verified GitHub update channel, installer/release automation, and removal of personal bootstrap data from the product bundle.

## Repository layout

```text
src/MichelsLife/        Windows host + current web source
installer/              Inno Setup definition
tools/                  bundle/release validation utilities
docs/                   release-channel documentation
.github/workflows/      CI and Windows release pipeline
```

The 204 visual JPG assets are **not duplicated in Git history**. The release pipeline bootstraps `AppBundle.zip` from the previous official release, replaces only the current `index.html`, validates the artwork count/integrity, then embeds the rebuilt bundle in the Windows executable. See `docs/RELEASE_CHANNEL.md`.

## Development

Requires .NET 8 SDK on Windows.

A local developer build can provide the Google OAuth build credential through the environment variable `MICHELSLIFE_GOOGLE_CLIENT_SECRET`. Official CI builds receive it from a GitHub Actions secret and never commit it to source.

```powershell
$env:MICHELSLIFE_GOOGLE_CLIENT_SECRET = "..."
dotnet publish src/MichelsLife/MichelsLife.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

`AppBundle.zip` must exist in `src/MichelsLife/` for a local build. Official CI obtains it from the release channel.

## Validation

```bash
python tools/release_smoke_test.py
```

The release smoke test checks fresh-install state, representative migration behavior for v3.0.196–v3.0.201-shaped state, inline JavaScript syntax, secret-like strings, and removal of the old personal Instagram bootstrap.

## Privacy / local data

User state lives in the app profile and optional Google Drive `appDataFolder`. OAuth tokens, personal backups, diagnostics, and user data are not stored in this repository.
