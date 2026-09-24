# Michel’s Life v3.0.207 baseline

**Approved baseline:** v3.0.207

This is the source-control baseline corresponding to the locally tested Windows build where Google authorization and persistent Google Drive Cloud Sync were verified successfully.

## Frozen accepted systems

Do not redesign or refactor these systems as collateral work:

- Typography architecture and era previews
- About the Developer presentation
- approved Themes/backgrounds/Current Chapter visual system
- general accepted layout and visual assets
- Google Settings inline status/confirmation UX

Future changes should be scoped to the requested feature and preserve these systems unless Michel explicitly asks to modify them.

## Google OAuth

The public Desktop OAuth client id is source-controlled. The client secret is not.

CI accepts the repository secret `GOOGLE_CLIENT_SECRET` as either the raw Desktop `client_secret` or the downloaded Desktop OAuth JSON, extracts only the secret value, and checks its SHA-256 fingerprint before compiling. This prevents accidental client-id/client-secret mismatches.

The Google Cloud project used by this baseline has Google Drive API enabled. Google Calendar remains optional.
