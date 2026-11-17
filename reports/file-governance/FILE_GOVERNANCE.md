# File steward: repository file audit

All tracked files classified; Markdown/text docs inspected with size cap. Binary/research-content validity and untracked files not assessed.
No file is auto-deleted or declared unused.

## Coverage

Tracked: 404; classified: 400; readable documents: 98; above read cap: 0; findings: 6.

## File roles

| Role | Count |
|---|---:|
| agent | 9 |
| asset | 12 |
| bitacora | 3 |
| build_script | 6 |
| config | 24 |
| database_migration | 3 |
| document | 91 |
| encoded_source | 2 |
| index | 4 |
| installer_metadata | 1 |
| release_intent | 15 |
| source | 129 |
| test | 46 |
| text_metadata | 1 |
| web_ui | 3 |
| workflow | 51 |

## Findings (human review required)

- **CONFIRMED / BROKEN_RELATIVE_LINK** docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md: Missing: docs/src/MichelsLife/frontend/index.html. Next: Fix link or restore target (ID 41ca2b94e805646f)
- **CONFIRMED / BROKEN_RELATIVE_LINK** docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md: Missing: docs/AGENTS.md. Next: Fix link or restore target (ID 7a232f866547f4b1)
- **CONFIRMED / BROKEN_RELATIVE_LINK** docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md: Missing: docs/tools/ui_android_section_design_smoke.mjs. Next: Fix link or restore target (ID c9b0ed37825bd396)
- **CONFIRMED / BROKEN_RELATIVE_LINK** docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md: Missing: docs/android/audit/2026-10-12-ui-screenshot-gallery.md. Next: Fix link or restore target (ID 55915b207228a042)
- **REVIEW / POTENTIAL_UNLOGGED_CHANGES** GIT_AUDIT_LOG.md: 19 implementation/config paths changed since this log's last commit; examples: .github/workflows/android-build.yml, .github/workflows/android-ui-smoke.yml, .github/workflows/ci.yml, .github/workflows/granada-android-direct-update.yml, .github/workflows/granada-chapter-focus-alarms-e2e.yml, .github/workflows/release-unified-v3225-a0214.yml. Next: Inspect diffs and reconcile only meaningful decisions/results in the canonical log (ID b08ae5ea2585c8ff)
- **REVIEW / POTENTIAL_UNLOGGED_CHANGES** android/ANDROID_AUDIT_LOG.md: 19 implementation/config paths changed since this log's last commit; examples: .github/workflows/android-build.yml, .github/workflows/android-ui-smoke.yml, .github/workflows/ci.yml, .github/workflows/granada-android-direct-update.yml, .github/workflows/granada-chapter-focus-alarms-e2e.yml, .github/workflows/release-unified-v3225-a0214.yml. Next: Inspect diffs and reconcile only meaningful decisions/results in the canonical log (ID a277792922793b83)

Complete path → purpose/role/certainty list lives in FILE_GOVERNANCE.json. SUMMARY.json has counts only for master polling.
A dated file, duplicate, or suspicious name is an **investigation candidate**, not unwanted material.
No historical science cases, audit logs or evidence may be deleted automatically.
