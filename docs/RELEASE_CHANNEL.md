# Release channel

The source repository is private. Desktop clients must not contain a GitHub token just to read updates, so public binaries are published from a separate **public** repository:

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
