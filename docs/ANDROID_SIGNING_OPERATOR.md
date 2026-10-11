# Michel's Life Android signing — operator checklist

This document contains **no passwords, private keys or encoded keystores**. Keep original `.jks` and credentials files offline; never commit them or upload them to GitHub Issues/PRs.

## Two independent identities

| Purpose | Actions name | Status |
| --- | --- | --- |
| Google Play AAB **upload** key | `ANDROID_UPLOAD_*` repository secrets | Owner created valid Play upload JKS on 2026-10-05; repository secrets must be configured |
| GitHub Direct APK **installation/update** key | `ANDROID_DIRECT_*` repository secrets | Owner-controlled independent, persistent keystore must be generated and backed up offline before configuration |
| Direct APK certificate pin | `ANDROID_DIRECT_CERT_SHA256` repository **variable** | Must match **the same Direct JKS**, never the Google Play upload certificate |

The historical public v0.2.2 TEST APK used per-run debug certificates, so a new permanently signed Direct APK may **not** install over it in place. Back up/export existing Michel's Life data before any uninstall; do not imply in-place signer compatibility.

## Set up locally (only on the repository owner's computer)

1. Install a recent Java JDK (for `keytool`) and GitHub CLI (for `gh`); run `gh auth login` if required.
2. Locate the original `MichelsLife-Play-upload-key*.jks` and `MichelsLife-Play-upload-key-credentials*.txt` locally. Never copy their contents into an Issue, chat, PR or code file.
3. Configure `ANDROID_UPLOAD_KEYSTORE_BASE64`, `ANDROID_UPLOAD_STORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD` as **Actions repository secrets**, checking the JKS fingerprint against the owner's saved certificate first.
4. Create a distinct, strong, long-lived **Direct** keystore on the owner's machine, store the original and password in at least two secure offline backups, and configure `ANDROID_DIRECT_KEYSTORE_BASE64`, `ANDROID_DIRECT_STORE_PASSWORD`, `ANDROID_DIRECT_KEY_ALIAS`, `ANDROID_DIRECT_KEY_PASSWORD` as repository secrets.
5. Save the Direct keystore certificate SHA-256 as the repository **variable** `ANDROID_DIRECT_CERT_SHA256`. The Direct staging workflow reads that very same variable and verifies the signed APK against it; it is not the Play upload fingerprint.
6. Confirm the repository has eight *names* under Actions secrets and the one public Direct certificate variable; do not ask anyone to paste secret values into CI logs.

## Stage/release discipline

- `.github/workflows/android-build.yml` builds Direct v0.2.3/code 5 only on `build_direct: true`; absent credentials must fail **closed**, not fall back to debug signing.
- `.github/workflows/stage-life-android-direct-v023.yml` verifies the Direct certificate, package, SHA-256, provenance, and same-source UI/validation gates before making an **internal** transfer prerelease.
- The existing **one** public release must contain Windows v3.0.216 and Android v0.2.3 together after the destination publisher's independent checks. Do not publish a separate Android customer release, and do not rename a TEST-signed APK to production.
- Real same-account Windows ↔ Android Supabase conflicts/restores and physical-device QA remain separately tracked; CI alone cannot certify them.

### Certificate pin policy

Do not rotate a Direct key by merely changing the repository variable. Before any future rotation, verify installed-app signer compatibility and archive the published certificate fingerprint in the signed release manifest. Missing variables, wrong signer or changed public assets must stop publication.
