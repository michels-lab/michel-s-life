# Release channel

The source repository is private. Desktop clients must not contain a GitHub token just to read updates, so public binaries are published from a separate **public** repository:

`realmichelduarte/michel-s-life-releases`

The updater expects a GitHub Release containing:

- `MichelsLife-vX.Y.Z.exe`
- `MichelsLife-vX.Y.Z.exe.sha256`
- `MichelsLife-Setup-vX.Y.Z.exe`
- `MichelsLife-Setup-vX.Y.Z.exe.sha256`
- `AppBundle.zip`
- `michels_life_icon.ico`

`AppBundle.zip` is the visual/bootstrap asset for the next CI build. The source repo keeps the v3.0.202 frontend delta as a readable patch overlay rather than duplicating 204 JPG files in Git history.

## First release bootstrap

For the first release only, manually upload the validated v3.0.202 `AppBundle.zip` and `michels_life_icon.ico` to the public release repository. Subsequent releases can reuse the previous release assets automatically.

The in-app updater currently requires the portable EXE and its `.sha256` file. The Setup installer is the recommended normal-user artifact and is also published with its own SHA-256 checksum. The Windows release workflow must silently install, verify the installed executable/version, and uninstall the generated Setup before the artifact is considered validated. SHA-256 protects against accidental/corrupt downloads; Authenticode signing is the separate mechanism for publisher authenticity.
