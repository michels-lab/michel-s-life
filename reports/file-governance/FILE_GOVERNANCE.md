# File steward: repository file audit

All tracked files classified; Markdown/text docs inspected with size cap. Binary/research-content validity and untracked files not assessed.
No file is auto-deleted or declared unused.

## Coverage

Tracked: 256; classified: 252; readable documents: 70; above read cap: 0; findings: 1.

## File roles

| Role | Count |
|---|---:|
| agent | 9 |
| asset | 12 |
| bitacora | 3 |
| build_script | 6 |
| config | 22 |
| database_migration | 3 |
| document | 63 |
| encoded_source | 2 |
| index | 4 |
| installer_metadata | 1 |
| release_intent | 8 |
| source | 85 |
| test | 6 |
| text_metadata | 1 |
| web_ui | 3 |
| workflow | 24 |

## Findings (human review required)

- **REVIEW / POTENTIAL_UNLOGGED_CHANGES** android/ANDROID_AUDIT_LOG.md: 23 implementation/config paths changed since this log's last commit; examples: .github/workflows/android-emulator-transport-diagnostic.yml, .github/workflows/ci.yml, .github/workflows/granada-android-usability.yml, .github/workflows/granada-backup-preflight.yml, .github/workflows/granada-large-project-story-cloud.yml, .github/workflows/granada-safe-backup-converter.yml. Next: Inspect diffs and reconcile only meaningful decisions/results in the canonical log (ID 768e12c85385e945)

Complete path → purpose/role/certainty list lives in FILE_GOVERNANCE.json. SUMMARY.json has counts only for master polling.
A dated file, duplicate, or suspicious name is an **investigation candidate**, not unwanted material.
No historical science cases, audit logs or evidence may be deleted automatically.
