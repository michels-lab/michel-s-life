# Michel's Life — Offline backup recovery triage (GRANADA)

**Use case:** a user has two historical Michel's Life JSON or \`.michelslife\` backups and wants to know what changed before attempting a risky restore or account migration. This tool reads **two local files** but never changes either one, uploads anything, selects a winning backup, restores, merges accounts, edits app storage, or touches a running app. It works independently of Android APK installation, the Google/Supabase providers and paused Windows builds.

## Use

Run from the cloned source repository:

\`\`\`bash
python tools/granada_recovery_loss_triage.py old.michelslife new.michelslife
python tools/granada_recovery_loss_triage.py old.michelslife new.michelslife --fail-on-risk
python tools/granada_recovery_loss_triage.py old.michelslife new.michelslife --report private-summary.json
\`\`\`

- Exit **0**: both backups passed *offline* input validation (differences may still merit review).
- Exit **2**: an input/report is untrusted or invalid; **no result was guessed**.
- Exit **3**, only with \`--fail-on-risk\`: signals of potential loss (not proof of actual data corruption or wrongdoing).
- Optional \`--report\` is an atomic, owner-only (0600 on POSIX) **create-new** report; never replaces an existing file or symbolic link.
- Ordinary output is a compact JSON report containing collection counts (added, removed and changed IDs), changed XP, completion-event additions/removals, history counts, Journal storage present/changed flags and stable risk *codes*. It **never prints** Journal contents, private mission titles, raw identifiers, paths, emails, devices or tokens. Do not upload original backups to public GitHub issues or workflows.

## Interpreting the report

A \`mission_identity_removed\` signal means one or more prior mission IDs are not in the later backup even if the total number of missions is unchanged. \`completion_history_removed\` means a completion entry that existed before is no longer present for a retained mission, or completed missions themselves disappeared. \`xp_decreased\`, \`history_count_decreased\` and \`journal_storage_removed\` are **review signals**, not definitive data loss: a user might have intentionally undone a mission, deleted Journal data, or revised a schedule.

An ordinary \`modified_retained\` count does not mean an ID was removed. The tool does **not** infer account identity from contents. It cannot verify provider ownership, historical Supabase CAS revisions, whether Calendar/Drive shared everything, or a signed Galaxy/Windows actual restoration. It deliberately refuses inputs with unsafe/unknown localStorage keys, embedded-vs-primary progress disagreements, ambiguous/duplicate IDs, invalid completion formats and unsafe account fields.

For older backups with provider/device-local keys, use the separate **safe legacy converter** first and keep both original files unchanged:

\`\`\`bash
python tools/granada_safe_backup_converter.py older.michelslife --output older-safe.michelslife
\`\`\`

Only compare the resulting independently validated safe copies. If the converter rejects a backup, do not bypass its safeguards. Real recovery remains a manual, account-verified operation subject to open #104, #108, #55 and #28; no tool result should automatically upload or overwrite cloud/phone data.

## QA scope

Dedicated workflow \`.github/workflows/granada-recovery-loss-triage.yml\`: synthetic file-based regressions, existing preflight and converter suites, syntax validation and an offline/no-destructive-write check. No personal user data, real credentials, screenshots, live-provider calls or emulator promises. **This is a usable offline recovery aid, not an in-app Settings panel or a substitute for the Android account-boundary fix.**
