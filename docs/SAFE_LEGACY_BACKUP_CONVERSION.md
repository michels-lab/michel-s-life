# Operación GRANADA — convert legacy backup safely (offline)

**Purpose:** Create a **new** and explicitly selected Michel's Life `.michelslife` backup from an older backup that may contain unrelated local authentication/session/device keys. This is a user-requested file conversion, NOT an in-app cloud restore, not an automatic migration, not a Supabase account merge, and not a signed APK/Galaxy certification. Intended for owner/developer use now, while PR #156 and Android Developer Twin #134 remain independent.

## How to run

Run locally with Python 3.12+ in a clone of the canonical Michel's Life repo:

```bash
# 1. Inspect without ever writing anything (prints only redacted counts/status)
python tools/granada_safe_backup_converter.py old-backup.michelslife --inspect-only

# 2. Explicitly create a SEPARATE never-before-existing file
python tools/granada_safe_backup_converter.py old-backup.michelslife --output safe-copy.michelslife

# 3. Optional read-only postflight; output is also checked automatically
python tools/granada_backup_preflight.py safe-copy.michelslife --strict --json
```

The original file is never overwritten or removed. The output path must be new and in an existing directory; collisions and symbolic/hard-link aliases fail closed. Output is constructed in a private (0600) temp file and published with atomic create-only hard linking, not replacing an existing file. No outbound network, Supabase login, Google Drive or OS credentials are accessed.

The storage-key allowlist is parsed **directly from the canonical app** (`MLV_SHARED_STORAGE_KEYS`) at conversion time. The converter does not invent or maintain a competing policy. It preserves intentional state/progress/missions/projects/XP, Journal, theme and explicitly shared personal preferences. It excludes old localStorage sessions, access/refresh tokens, device identifiers, revisions, Google auth, notifications and unrecognized entries. All other root metadata is discarded, except a harmless version marker. The serialized canonical progress key is regenerated from the accepted state.

**It will refuse to create output**, with only an error code, if the source is missing/oversized, has duplicate JSON keys, has conflicting stored and outer state, has bad XP/duplicate IDs or structural anomalies, contains credential-like nested state fields, or if the canonical allowlist is unavailable. Conflicts are **not** silently merged or resolved, because picking one copy could destroy meaningful user progress. Existing signed-in accounts are not touched.

Reports output only counts, numeric XP, error codes and status. No user names, mission titles, full IDs, journal, filenames, paths, token values, raw private keys, provider content or contents of the backup are printed. Even a success proves only structural compatibility with the existing portable restore contract; it does **not** prove achievements/recurrence semantics, remote Supabase CAS, actual Drive provider operations, restored Galaxy data, or physical UI behavior. Never upload the original backup or converted file as a GitHub PR artifact.

## Engineering validation

- Dedicated `GRANADA safe offline legacy backup converter` CI uses **22** synthetic real-file test cases covering safe content parity, device-token exclusion, original byte invariance, output collision/symlink/hardlink protection, duplicate JSON, ID/XP issues, embedded-only and runtimeState exports, dry-run behavior and conversion idempotence.
- Also runs the existing read-only backup preflight regression suite and the **actual in-app** Node restore-allowlist contract tests, to prevent a tool that creates a file the app cannot safely import.
- A passing synthetic job does not authorize a cloud upload or app production release. Developer Twin #134 and native Android build, Windows installers, existing `src/MichelsLife/frontend/index.html` in draft PR #156, and user-approved visual layouts are untouched.

Related open issues: #55 privacy of legacy cloud archives, #108 cross-account isolation, #139 native emulator reliability, #131 Developer Twin. Keep private backup files on a trusted local device and review the backup before importing it into any logged-in account.
