# File steward: repository file audit

All tracked files classified; Markdown/text docs inspected with size cap. Binary/research-content validity and untracked files not assessed.
No file is auto-deleted or declared unused.

## Coverage

Tracked: 267; classified: 263; readable documents: 74; above read cap: 0; findings: 2.

## File roles

| Role | Count |
|---|---:|
| agent | 9 |
| asset | 12 |
| bitacora | 3 |
| build_script | 6 |
| config | 22 |
| database_migration | 3 |
| document | 67 |
| encoded_source | 2 |
| index | 4 |
| installer_metadata | 1 |
| release_intent | 8 |
| source | 87 |
| test | 8 |
| text_metadata | 1 |
| web_ui | 3 |
| workflow | 27 |

## Findings (human review required)

- **REVIEW / POTENTIAL_UNLOGGED_CHANGES** GIT_AUDIT_LOG.md: 7 implementation/config paths changed since this log's last commit; examples: .github/workflows/file-steward-pr-validation.yml, .github/workflows/granada-android-evidence-gate.yml, .github/workflows/granada-recovery-loss-triage.yml, tools/granada_android_evidence_gate.py, tools/granada_recovery_loss_triage.py, tools/test_granada_android_evidence_gate.py. Next: Inspect diffs and reconcile only meaningful decisions/results in the canonical log (ID 800bb8ed1ada2811)
- **REVIEW / POTENTIAL_UNLOGGED_CHANGES** android/ANDROID_AUDIT_LOG.md: 30 implementation/config paths changed since this log's last commit; examples: .github/workflows/android-emulator-transport-diagnostic.yml, .github/workflows/ci.yml, .github/workflows/file-steward-pr-validation.yml, .github/workflows/granada-android-evidence-gate.yml, .github/workflows/granada-android-usability.yml, .github/workflows/granada-backup-preflight.yml. Next: Inspect diffs and reconcile only meaningful decisions/results in the canonical log (ID 6fc87a8122455e56)

Complete path → purpose/role/certainty list lives in FILE_GOVERNANCE.json. SUMMARY.json has counts only for master polling.
A dated file, duplicate, or suspicious name is an **investigation candidate**, not unwanted material.
No historical science cases, audit logs or evidence may be deleted automatically.
