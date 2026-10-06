# CURRENT HANDOFF — LIMON

Updated: 2026-10-05
Project: Michel's Life
Repository: `realmichelduarte/michel-s-life`
Branch: `desktop-v3.0.216`
Draft PR: #10 — `v3.0.216: Supabase sync, desktop shell and Android integration`
Current branch HEAD: `0f329a6e2700604e5cc5d96446a1d0dccaa6c84c`
PR state: open, draft, mergeable
Public release state: **v3.0.216 is NOT published**

## LIMON rule

`limon` means this file plus the permanent audit log are the exact continuation point.
On resume:
- continue from this branch/PR state;
- do not change the approved visual baseline unless explicitly requested;
- do not regress or recreate already-implemented systems;
- do not publish or merge until the remaining live/native gates pass;
- do not send APK/ZIP/build artifacts through chat; prepare/validate them in GitHub and publish through GitHub Release when release is approved.

## Current product architecture

### Supabase — primary sync authority
Project: `michels-life`
Project ref: `lqnkcqredlxrykynacwr`
Region: `us-east-2`
Status at checkpoint: `ACTIVE_HEALTHY`
Security Advisor: **0 findings**

Production tables:
- `public.ml_state`
- `public.ml_state_history`
- `public.ml_devices`

All three tables have RLS enabled and ownership policies based on `auth.uid()`.
Desktop/Android use only the publishable client key; privileged `sb_secret_` / `service_role` credentials are forbidden by source and package audits.

Current sync model:
- Supabase is the source of truth for Michel's Life state/account/device sync.
- Windows and Android share the canonical Supabase client.
- Dirty-state + monotonic revision logic prevents poll-driven revision spam.
- A newer remote revision is never overwritten automatically.
- First-device / divergent-state authority requires an explicit user choice.
- Previous remote state is preserved in history before overwrite.
- Device records expose platform, app version, last action and last seen.
- Google Drive remains **temporary manual migration/recovery fallback only**.
- Google Calendar remains independent and optional.

### Desktop v3.0.216
Implemented:
- Automatic release detection without automatic installation.
- Native System Tray.
- Close/minimize to tray.
- Start with Windows.
- Global Quick Capture hotkey `Ctrl + Shift + Space`.
- Quick Capture for Mission and Journal.
- Tray actions: Current Mission, Sync Now, Quick Capture.
- Tray localization and hotkey-conflict fallback.
- Current Mission integration with Windows taskbar.
- Global `Ctrl + K` Command Palette.
- Compact Sync Center.
- Progressive startup.
- Supabase-first Sync Now routing.
- Desktop release metadata aligned end-to-end at **3.0.216**.

### Android
Current Android target:
- app version: **0.2.2**
- versionCode: **4**

Implemented:
- same canonical Supabase sync client as Desktop;
- Android platform/device attribution;
- current branch canonical frontend overlaid during APK/AAB packaging;
- Android-specific Supabase smoke and contract validation;
- APK + AAB native build workflows on relevant PR changes.

Play packaging:
- APK/AAB compile successfully.
- Play AAB remains unsigned until Android upload-signing repository secrets are configured.

## Validation at this exact checkpoint

Current HEAD `0f329a6e2700604e5cc5d96446a1d0dccaa6c84c`:
- Source validation **#750 — SUCCESS**
- UI smoke **#636 — SUCCESS**
- Android UI smoke **#58 — SUCCESS**
- Build Android test APK **#81 — SUCCESS**
- Build Windows release **#27 — SUCCESS**
- Supabase project: **ACTIVE_HEALTHY**
- Supabase Security Advisor: **0 findings**

Earlier artifact audits already confirmed:
- Windows v3.0.216 package includes the Supabase client/project URL and no privileged Supabase credentials.
- Android package includes the canonical Supabase module + Android platform marker and no privileged Supabase credentials.

## Remaining release gates

1. **Real same-account Windows ↔ Android Supabase test**
   - first-device authority choice;
   - upload from one device;
   - download/restore on the other;
   - simulate a newer remote revision;
   - verify automatic sync refuses overwrite;
   - verify explicit local/cloud authority choice resolves correctly;
   - verify device list/last-seen/action updates correctly.

2. **Interactive Windows native test**
   - tray open/restore;
   - close/minimize resident behavior;
   - global Quick Capture hotkey;
   - Current Mission taskbar state/title;
   - Sync Center;
   - Start with Windows;
   - tray language switching.

3. **Android release signing**
   - configure the four upload-signing GitHub repository secrets;
   - rerun Android build;
   - obtain a `Play-SIGNED` AAB;
   - validate on physical device / Play testing delivery.

4. **Release only after live/native gates pass**
   - merge PR #10;
   - publish v3.0.216;
   - verify final GitHub Release assets;
   - then remove/disable Google Drive fallback only after Supabase cross-device behavior is proven live.

## Do not redo

Do not recreate:
- Supabase schema/RLS;
- Sync Center;
- Command Palette;
- progressive startup;
- tray/Quick Capture/taskbar integration;
- Android Supabase bridge;
- version alignment to 3.0.216;
- existing CI gates.

The next work starts from **live cross-device validation and signing/native release gates**, not from implementation.
