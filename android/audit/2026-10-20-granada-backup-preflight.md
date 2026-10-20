# 2026-10-20 — GRANADA GRANDE backup integrity preflight

Independent development block; Windows packaging and releases remain paused. No APK, desktop installer, public Release, account or actual user backup was touched.

## Deliverables (candidate, not a released feature)
1. Offline, read-only Michel's Life portable/cloud snapshot loader: 25 MiB cap, strict JSON and unique-key parsing, multiple current/legacy supported envelopes.
2. Privacy and integrity guard: known device/auth key leakage, nested credentials, missing/duplicate collection identifiers, canonical XP validation, stored/canonical divergence warnings; never prints personal names, raw IDs, Journal content or token values.
3. Independent old/new backup difference mode: collection counts, changed identity fingerprints, XP change and whole-state hash. **No restore or conflict auto-merge**.
4. Synthetic regression tests for valid formats, malformed input, duplicate IDs, credential privacy, divergent copies, strict warnings and CLI compare; dedicated lightweight Python CI workflow; usage + limitations.

## Test evidence before GitHub commit
- Local `python -m unittest discover -s tools -p test_granada_backup_preflight.py -v`: **9/9 PASS** on synthetic fixtures in a disposable working folder. Exact GitHub CI HEAD remains to be checked after opening the PR.
- No Galaxy/device/provider tests performed. This does not fix native Android startup drift, cloud CAS or Developer Twin launch and does not close #104/#28/#55/#108/#131.

## Interference guard / next gate
New `tools/granada_backup_preflight.py`, `tools/test_granada_backup_preflight.py`, `.github/workflows/granada-backup-preflight.yml`, `docs/BACKUP_PREFLIGHT.md`, and this dated audit only. No edits to #134 Developer Twin, #135 Calendar, #138 persistence probe, #150 Premium regression, #151/#152 Focus alarm, or #153 Projects/Chapters/Sync test. Review exact-head CI, check report privacy by hand, then decide if and how to integrate as Developer Twin backend in a future isolated change. No merge or release without explicit review and QA.
