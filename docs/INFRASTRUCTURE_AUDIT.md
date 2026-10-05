# Michel's Life — Infrastructure & Cloud Audit

Last reviewed: **2026-10-05**

This file is the app-level infrastructure audit for Michel's Life. It complements `GIT_AUDIT_LOG.md` and `android/ANDROID_AUDIT_LOG.md`. Update it whenever authentication, cloud storage, synchronization, backups, secrets, distribution, or external services change.

## Current architecture

### Windows
- Cloud provider: **Google Drive**.
- Scope: Drive application data (`drive.appdata` / appDataFolder), not the user's normal visible Drive files.
- Canonical cloud state: `michels_life_cloud_state.json`.
- Cloud history prefix: `michels_life_backup_`.
- Device-presence prefix: `michels_life_device_`.
- State integrity uses SHA-256 metadata plus the existing Michel's Life conflict-resolution semantics.
- Local restore points exist before risky update/sync operations.
- Build-time Google credential values are injected through environment/GitHub Actions rather than committed to source.

### Android
- Uses the same Michel's Life cloud-state contract as Windows.
- Google Identity authorization coordinator exists.
- Drive appDataFolder sync primitives exist.
- No Android OAuth client secret is embedded in the APK.
- Production distribution/update path is Google Play.
- Release signing is supplied through environment/Actions secrets.

## Verified strengths
- Desktop and Android intentionally share one cloud-state contract instead of maintaining separate data models.
- Cloud data are separated from Git repository data.
- User OAuth tokens, personal data, diagnostics and backups are not committed.
- Android has explicit cloud status/connect/disconnect/sync/overview/restore bridge actions.
- CI contains build/version checks and Android cloud-contract validation.

## Gaps / required follow-up
1. **Android live OAuth and Drive sync still require physical-device end-to-end validation.**
2. Validate Windows → Android and Android → Windows state round trips with a real account.
3. Exercise an actual simultaneous-edit conflict and verify both platforms resolve it identically.
4. Validate cloud-history restore and local restore-point recovery on a real Android device.
5. Finish production signing + Play internal-testing workflow.
6. Root README still describes v3.0.207 as the current desktop baseline while current project metadata is v3.0.215; reconcile documentation.
7. The Windows desktop OAuth client is an installed/public client. Any embedded or build-injected OAuth client secret must **not** be treated as a confidential security boundary; migrate/verify the flow around PKCE/public-client assumptions.
8. Supabase is **not currently part of Michel's Life production architecture**. Do not duplicate the Google Drive state into Supabase unless a concrete product requirement justifies a backend migration.

## Supabase decision boundary
Supabase becomes appropriate if Michel's Life needs structured server-side features that Drive appDataFolder is poor at, for example:
- multi-user/shared data;
- server-side queries/analytics;
- cross-user collaboration;
- account-level relational data;
- server-triggered workflows.

If adopted, migration must be explicit:
1. define relational schema;
2. enable RLS on every exposed user-data table;
3. scope every row to authenticated user ownership;
4. use only a publishable client key in the app;
5. keep secret/service-role keys server-side only;
6. implement migration from existing Drive state;
7. preserve offline/local restore behavior;
8. regression-test conflict semantics before switching authority.

## Secret inventory rule
Record **secret names and storage locations only**, never values.

Known categories:
- Google OAuth configuration → Google Cloud + GitHub Actions/environment.
- Android signing material → secure keystore/password manager + GitHub Actions secrets.
- Supabase secret/service-role keys, if ever introduced → server/Edge Function secret store only.

## Validation gate
Cloud work is not DONE until the real provider is exercised end to end on the target platform. Mock/unit validation alone is insufficient for OAuth, sync, conflict handling, restore, or Play-delivered builds.
