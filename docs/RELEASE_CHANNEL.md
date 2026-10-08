# Release channel

The Michel's Life source repository is public, but direct update clients must not embed private GitHub tokens. Windows binaries are published from this separate **public** distribution repository:

`michels-lab/michel-s-life-releases`

The updater expects a GitHub Release containing:

- `MichelsLife-Setup-vX.Y.Z.exe` — recommended normal-user installer
- `MichelsLife-Setup-vX.Y.Z.exe.sha256`
- `MichelsLife-Portable-vX.Y.Z.exe` — canonical portable binary
- `MichelsLife-Portable-vX.Y.Z.exe.sha256`
- `MichelsLife-vX.Y.Z.exe` — temporary legacy updater compatibility alias
- `MichelsLife-vX.Y.Z.exe.sha256` — checksum for the compatibility alias
- `AppBundle.zip`
- `michels_life_icon.ico`

`AppBundle.zip` is the visual/bootstrap asset for the next CI build. The source repo keeps the v3.0.202 frontend delta as a readable patch overlay rather than duplicating 204 JPG files in Git history.

## First release bootstrap

For the first release only, manually upload the validated v3.0.202 `AppBundle.zip` and `michels_life_icon.ico` to the public release repository. Subsequent releases can reuse the previous release assets automatically.

The v3.0.216 updater prefers the explicit `MichelsLife-Portable-vX.Y.Z.exe` asset and matching checksum. During the transition, releases also publish byte-identical legacy `MichelsLife-vX.Y.Z.exe` + checksum aliases so already-installed older builds can still discover and install v3.0.216. The Setup installer remains the recommended normal-user artifact and is published with its own SHA-256 checksum. The Windows release workflow must silently install, verify the installed executable/version, and uninstall the generated Setup before the artifact is considered validated. SHA-256 protects against accidental/corrupt downloads; Authenticode signing is the separate mechanism for publisher authenticity.

## Verified Windows v3.0.216 publication — 2026-10-08

Official stable page: https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.216.

- Windows Setup, explicit Portable, legacy updater alias, all three SHA-256 sidecars, AppBundle.zip and icon: **8 verified public assets**.
- Setup SHA-256: `4073906a62c5aeae00b98d51f69381c86cfba1350ffde589dcea568eac24ca8f`.
- Portable and byte-identical legacy alias SHA-256: `e7dfd5c2f66354395fb1b0bf067a6bcf9e190450c56eea402e003c28606aebb1`.
- The original cross-repository `RELEASES_REPO_TOKEN` had insufficient permission (HTTP 403). For this release, validated artifacts were staged by the source repository's own GitHub token and then published by the public distribution repository's own `GITHUB_TOKEN` with `contents: write`. This is the proven authorization boundary for a future generalized publisher; the legacy direct cross-repo publishing path must not be assumed healthy without correcting its permissions or implementing that generalized pipeline.
- Windows Authenticode publisher signing was not available; some users may see Unknown publisher warnings. Real Windows↔Android Supabase tests and Android Play signing are separately pending.
