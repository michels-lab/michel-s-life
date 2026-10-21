# Michel's Life — Operación Granada: safe legacy backup converter

Date: 2026-10-21 (America/Monterrey). Branch: `granada/legacy-backup-safe-converter-20261021`. Pull request: [#159](https://github.com/michels-lab/michel-s-life/pull/159).

## Product function delivered

1. Converts an old `.michelslife` / JSON backup into a **new** safe portable backup without modifying the original or opening connections to Supabase, Google, GitHub, or a real device.
2. Reads the exact **current frontend** `MLV_SHARED_STORAGE_KEYS` policy and excludes all unknown, auth/session/device/credential/notification localStorage keys from the converted artifact. Keeps actual canonical progress, missions, projects, XP, Journal, theme and shareable preferences.
3. Detects and **rejects** two inconsistent copies of canonical progress, duplicated JSON keys (including embedded serialized JSON), nonfinite values, invalid XP, duplicate mission IDs, nested provider credentials including camelCase variants, unsupported roots and suspicious structure. Does not choose between conflicting device states, invent merges or restore into a live user session.
4. Writes with private owner-only permissions to an entirely new file using an atomic **create-only hard link** from a private temporary file. Existing destination, symbolic links and aliases are never replaced; the original backup remains byte-for-byte unchanged.
5. Emits only short, privacy-safe status/error codes, numeric counts, and a clear warning that native/provider restoration is not verified. Real user content, IDs, account names, tokens and original file paths never print.

## QA and results

- Dedicated [GRANADA safe converter CI](https://github.com/michels-lab/michel-s-life/actions/runs/39596268664) **SUCCESS** at tested commit `f4e8ef4611efba88a856bc8e108dd0e26a6591fd`: **35 Python tests** (25 converter synthetic real-file regressions + 10 existing read-only backup preflight cases), along with the real production frontend's Node cloud/portable restore allowlist contract, syntax checks, and no-network/no-destructive-write gate.
- Early 32-case version was green; a later pass added fail-closed detection for `sessionToken`, `apiKey`, camelCase secrets and duplicate embedded JSON keys. Initial assertion expected the old generic error code and was corrected; no user files were ever involved.
- Other generic Source / UI / Android browser smoke workflow results at the exact PR head must be reviewed before integrating. No hosted native emulator or signed Galaxy verification is claimed; those remain independent issue #139 / PR #157.
- Do not upload real backup contents to PR artifacts or GitHub. Only synthetic fixtures were used. An output suitable for structural import is not evidence that an account switch, remote CAS revision or Galaxy package passed; unresolved #55 / #108 boundaries must stay open pending provider/device acceptance.

## Disjoint PR ownership

New files only: `tools/granada_safe_backup_converter.py`, `tools/test_granada_safe_backup_converter.py`, `.github/workflows/granada-safe-backup-converter.yml`, `docs/SAFE_LEGACY_BACKUP_CONVERSION.md`, this audit. No modifications to the huge frontend index owned by Data Health #156, Android Developer Twin #134, native Kotlin, Focus/Journal/Calendar PRs, or the RAM/GPU emulator trial #157.

No native Windows build (paused), release candidate, APK signing or automatic public release. Do not call this a live in-app Data panel until it is actually integrated into the shipped app with its own user acceptance.
