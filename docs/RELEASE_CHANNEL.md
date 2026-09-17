# Release channel

The source repository is private. Desktop clients must not contain a GitHub token just to read updates, so public binaries are published from a separate **public** repository:

`realmichelduarte/michel-s-life-releases`

The updater expects a GitHub Release containing:

- `MichelsLife-vX.Y.Z.exe`
- `MichelsLife-vX.Y.Z.exe.sha256`
- `MichelsLife-Setup-vX.Y.Z.exe`
- `AppBundle.zip`
- `michels_life_icon.ico`

`AppBundle.zip` is the visual/bootstrap asset for the next CI build. The source repo keeps the v3.0.202 frontend delta as a readable patch overlay rather than duplicating 204 JPG files in Git history.

## First release bootstrap

For the first release only, manually upload the validated v3.0.202 `AppBundle.zip` and `michels_life_icon.ico` to the public release repository. Subsequent releases can reuse the previous release assets automatically.

The in-app updater requires the portable EXE and its `.sha256` file. SHA-256 protects against accidental/corrupt downloads; Authenticode signing is the separate mechanism for publisher authenticity.
