# Microsoft Store / MSIX channel

Michel's Life keeps two independent Windows distribution channels:

1. **GitHub/direct download** — the existing portable EXE and Inno Setup installer.
2. **Microsoft Store** — an MSIX package generated from the same application build.

The Store workflow does not replace or modify the current EXE release workflow.

## Why MSIX

For Microsoft Store submissions, Microsoft re-signs accepted MSIX/AppX packages. A CA-trusted code-signing certificate is therefore not required for the Store channel. The unsigned MSIX produced by this repository is a **submission artifact**, not a direct-download installer.

## One-time Partner Center setup

Before the first Store build:

1. Create or activate the Windows developer account in Partner Center.
2. Reserve **Michel's Life** (or the final Store product name).
3. Open the product's **Package/Identity** details.
4. Copy these values exactly:
   - Package/Identity/Name
   - Publisher
   - Publisher display name

Do not invent or normalize these values. Store identity values are case-sensitive and must match Partner Center.

## Build the Store package

In the private source repository:

**Actions → Build Microsoft Store MSIX → Run workflow**

Enter the three exact Partner Center identity values. The workflow then:

- materializes and validates the current host source;
- downloads the approved visual bundle and icon from the current public release;
- applies the Release Readiness frontend and the Store-only update-channel overlay;
- injects the existing Google OAuth build credential;
- publishes a self-contained x64 WinForms/WebView2 app;
- renders `AppxManifest.xml` using the Partner Center identity;
- generates Store tile/logo PNG assets from the existing app icon;
- packages and verifies an unsigned `.msix`;
- produces a SHA-256 checksum and uploads the files as a private GitHub Actions artifact.

## Store-specific behavior

The Store package hides the GitHub/local self-update controls and shows a Microsoft Store update notice instead. Microsoft Store is the trusted update mechanism for that edition.

Portable backup, local restore points, Google Drive sync, Google Calendar integration, diagnostics, themes, backgrounds, chapters, missions and the existing data model are unchanged.

## Submission

Download the `MichelsLife-Store-v<version>` artifact from GitHub Actions and upload the `.msix` file to the app submission in Partner Center.

The package is intentionally unsigned. Do not distribute that unsigned MSIX directly from GitHub. After certification, Microsoft Store signs and distributes the Store copy.

Before final submission, run the Windows App Certification Kit on the exact package and complete the Partner Center listing, screenshots, age rating, privacy/support information and pricing. The app can be listed as free.
