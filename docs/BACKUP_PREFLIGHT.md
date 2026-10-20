# GRANADA — Backup preflight (read-only developer tooling)

Before comparing or manually restoring a Michel's Life backup, run the offline verifier. It **does not restore, repair, upload, delete, or alter** any backup or live app state; it is an engineering aid, **not** a substitute for checking restoration on a signed physical Galaxy and the actual account.

```bash
python tools/granada_backup_preflight.py /path/to/backup.michelslife --json
python tools/granada_backup_preflight.py old.michelslife --compare new.michelslife --json
python tools/granada_backup_preflight.py backup.michelslife --strict
```

Accepted sources: JSON with `state` and optional `localStorage`, state-only canonical JSON containing `missions`, or `localStorage` with `vida_rpg_personal_progress_v2` JSON text. A known older cloud backup may contain both `state` and the saved-storage state; if both disagree the verifier warns about divergence instead of guessing the authoritative copy. Raw personal Journal text, account emails, titles, mission identifiers and credentials never print in the report. Reports contain only health codes, counts, truncated content hashes and numerical XP. **Do not attach original backups to public PRs/issues.**

Exit codes: `0` = shape/data preflight passes (possibly review warnings unless `--strict`); `2` = blocked/error (or strict warning). `blocked` is not a claim that the app cannot restore it; it means do not proceed *based solely on this preflight*. Review alerts about legacy auth/device-local keys separately: current restore allowlists protect supported import flows, but old archives may still store sensitive tokens that should not be shared. Compare does not silently pick a winning device or create merges.

Checks include size/UTF-8/JSON duplicate-key/nonfinite-number rejection; canonical state presence; leaked credentials and device-local storage fields; repeated IDs in collections; invalid XP; localStorage/state disagreements; and count/identity/XP differences between backups. Results do not prove that achievements, chapter/mission relationships, Recurrence rules, cloud CAS/version history, notifications, or persisted signed APK data are semantically correct. These retain their independent app tests and physical/provider acceptance gates. The standalone synthetic `unittest` workflow does **not** run Windows installers or Android APK builds.

Related unresolved issues: #104 (signed Android persistence), #28 (live same-account recovery), #55 (backup privacy), #108 (cross-account isolation), #131 (Developer Twin). This utility is **not** the Developer Twin UI and must not be presented as the owner-facing in-app audit/export feature.
