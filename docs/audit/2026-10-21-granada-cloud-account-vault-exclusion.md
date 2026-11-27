# GRANADA 2026-10-21 — local account vault must never cross cloud/device boundary

## Root issue and ownership
Related P0 [#55](https://github.com/michels-lab/michel-s-life/issues/55), [#108](https://github.com/michels-lab/michel-s-life/issues/108) and standalone [PR #169](https://github.com/michels-lab/michel-s-life/pull/169). Michel's Life only; no change to FoamLens/OpenFOAM/other apps.

An upcoming account isolation foundation uses seven new device-local `michelsLife.accountBoundary.v1.*` records: active account identity, guest/unclaimed rescue, per-account vault, recovery archive, one-time consent receipt and crash-consistent transaction journal. Some entries can hold private local board/Journal content. **These must never be included in cross-device Supabase and Google Drive captures, nor overwritten during restores**, even when another device sends a forged legacy payload.

## Functional QA change

Extends the **real canonical runtime** two-browser-device security smoke `tools/ui_cloud_device_boundary_granada_smoke.mjs`, which already runs through both `MLVCloudSharedStorageV30216.capture/restore` and `GoogleCloudV30192.capture` with synthetic local-only sentinel payloads.

- Seven additional synthetic account-boundary localStorage records are injected alongside existing provider auth/session/device identifiers.
- Both Windows-mode and Android-mode actual Playwright contexts must exclude all seven from actual captured maps, despite preserving legitimate missions/XP/Journal/theme.
- A fake incoming legacy cloud restore containing every forbidden key must leave the receiving platform's local owner/vault/journal transaction markers and device auth sentinel values **unchanged** in both directions.
- Every captured map must reject the complete `michelsLife.accountBoundary.v1.` key prefix, not only known records; no unsafe token-like value may escape in serialized cloud payload.
- The test recaptures after both reverse restores to ensure previously imported shareable data does not cause the receiver to leak its original private vault.

This is a **test gate** to catch cloud allowlist regressions. It does **not** wire PR #169's module into the public app or certify the production A/B authentication path, Supabase RLS with live identities, signed Galaxy, hosted emulator relaunch or backend ownership. No app UI, developer edition, updater, provider SDK, Google/OAuth, user records, release signing or desktop build behavior changed.

## Validation and release restrictions

Required before merging this isolated QA block: exact-head Source validation, UI smoke and Android UI smoke, with the full canonical cloud restore test passing. No standalone source-only success substitutes for a failing relevant UI capture/restore gate. The continuously failing hosted native emulator is tracked separately in #139/#166 and is not a live application release proof.

No new release, release candidate, Play store build, user data modification or cross-project dependency is authorized. Windows native packaging stays paused; the browser-mode Windows half is intentional cross-platform source QA only.
