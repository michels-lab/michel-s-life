# Michel's Life — Infrastructure & Cloud Audit

Last reviewed: **2026-10-05**

This file is the app-level infrastructure audit for Michel's Life. It complements `GIT_AUDIT_LOG.md` and `android/ANDROID_AUDIT_LOG.md`. Update it whenever authentication, cloud storage, synchronization, backups, secrets, distribution, or external services change.

## 2026-10-11 — P0 credential isolation in shared cloud snapshots (PR #56)

- **Source evidence:** previous `captureCloudBackup()` enumerated nearly all `localStorage`, including `michelsLife.supabase.session.v30216` (Supabase access/refresh token), device namespace/identifier and metadata. Supabase `capture()` reused that same payload. Both restore paths could clear the caller's login/session and import cloud storage from another device. This is a **verified source-level boundary bug**, not evidence that personal tokens were accessed or leaked publicly.
- **Implemented in candidate:** explicit allowlist of 24 shared local preferences, canonical `state` preserved; both Supabase and Drive capture strip unknown auth/device entries and both restores update only shareable keys, leaving the local session and device identity intact. Legacy cloud snapshots containing disallowed keys are filtered on restore.
- **Tests added, result pending on current PR SHA:** mock Windows↔Android account test asserts theme setting follows cloud state, fake remote tokens/identifiers do not overwrite Android's own session/device, and subsequent upload does not reintroduce forbidden entries. Existing revision-conflict and history/restore checks stay mandatory.
- **Remaining:** validate on actual Windows installation + Galaxy with the same test account, first-device adoption, offline changes, conflicts, recovery history and Drive fallback; do not claim provider/physical testing from CI mocks alone (issue #28).
- **Release:** no version or release authorized; public Windows v3.0.216 + Android v0.2.3 unchanged.

## Current architecture

### Primary state sync — Supabase
- Dedicated project: **michels-life** (`lqnkcqredlxrykynacwr`).
- Supabase is the primary authority for Michel's Life account/state/device synchronization across Windows and Android.
- Canonical tables:
  - `public.ml_state` — one master state snapshot per authenticated user.
  - `public.ml_state_history` — revision history before overwrites/restores.
  - `public.ml_devices` — per-device identity and last activity.
- Every table has Row Level Security enabled.
- Every user-data policy is scoped to `auth.uid()`.
- Anonymous table access is not part of the product contract.
- Desktop and Android bundle only the modern Supabase publishable key; secret/service-role keys are prohibited from client source and validated in CI.
- Shared cloud snapshots contain the canonical Michel's Life domain state plus **allowlisted user preferences** (theme/background/typography/color/language/journal); unknown localStorage entries and device-specific sessions/identity are excluded. Both Supabase and Drive restore only allowlisted keys while preserving the current machine's account/device OAuth state.
- Sync uses monotonically increasing revisions plus a dirty flag; unchanged polling does not manufacture revisions.
- A newer remote revision is never silently overwritten by automatic sync.

### Windows
- Windows uses the shared canonical Supabase client.
- Windows device IDs use the `win_` namespace and report platform `windows`.
- Native tray Sync Now prefers Supabase when available.
- Local restore points remain independent of cloud provider.
- Windows automatic application updates continue to use the GitHub Releases updater and are not coupled to Supabase.

### Android
- Android uses the same canonical Supabase client embedded in the packaged frontend.
- Android device IDs use the `and_` namespace and report platform `android`.
- The Android build overlays the current canonical frontend into the AppBundle before APK/AAB packaging.
- Native Google Drive code remains temporarily available only as migration/recovery fallback.
- Production distribution/update path remains Google Play.

### Google
- **Google Calendar** remains an independent optional integration.
- **Google Drive** is no longer the primary Michel's Life state authority.
- Existing Drive state/history support is retained temporarily as a manual migration/recovery fallback while Supabase live-device validation completes.
- Google OAuth credentials/tokens remain outside source control.

## Verified strengths
- One shared state/sync implementation is used across Windows and Android.
- Supabase ownership is enforced at the database layer through RLS, not only in client code.
- Client builds contain no Supabase privileged key.
- Supabase Security Advisor reported zero findings after schema hardening.
- Automated UI coverage tests first upload, dirty-state upload, remote-newer conflict protection, explicit cloud download and Android platform/device attribution.
- Local restore/recovery remains available independently of the cloud authority.

## Remaining release gates
1. Sign into one real Supabase account on an actual Windows installation.
2. Sign into that same account on an actual Android installation.
3. Verify Windows → Android and Android → Windows state transfer with real network/auth sessions.
4. Exercise a real simultaneous-edit conflict and explicit cloud/local choice.
5. Verify restore behavior using a real Supabase history snapshot.
6. Complete Android production signing / Play internal-test workflow and physical-device UX approval.

## Secret inventory rule
Record **secret names and storage locations only**, never values.

Known categories:
- Supabase client access → publishable key may be bundled in public clients.
- Supabase privileged access → secret/service-role keys, if ever needed, remain server-side only and are forbidden from app bundles/source.
- Google OAuth configuration → Google Cloud + GitHub Actions/environment where applicable.
- Android signing material → secure keystore/password manager + GitHub Actions secrets.
- User sessions/refresh tokens → local application storage only; never Git.

## Michel's Lab governance
- Shared engineering/cloud/security standards live in `michels-lab/Michel-Software-Standards`.
- App-specific implementation truth stays in this repository.
- This Supabase migration is a cross-app architecture/auth/cloud decision and must be reported upstream without including credential values.

## Validation gate
Cloud work is not considered fully production-validated until the real provider is exercised end-to-end on the target platforms. Mock/CI validation is necessary but not sufficient for final release approval.
