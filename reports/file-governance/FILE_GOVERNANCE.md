# File steward: repository file audit

All tracked files classified; Markdown/text docs inspected with size cap. Binary/research-content validity and untracked files not assessed.
No file is auto-deleted or declared unused.

## Coverage

Tracked: 464; classified: 460; readable documents: 112; above read cap: 0; findings: 12.

## File roles

| Role | Count |
|---|---:|
| agent | 9 |
| asset | 12 |
| bitacora | 4 |
| build_script | 6 |
| config | 25 |
| database_migration | 3 |
| document | 104 |
| encoded_source | 2 |
| index | 4 |
| installer_metadata | 1 |
| release_intent | 21 |
| source | 135 |
| test | 63 |
| text_metadata | 1 |
| unknown | 6 |
| web_ui | 3 |
| workflow | 61 |

## Findings (human review required)

- **CONFIRMED / BROKEN_RELATIVE_LINK** docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md: Missing: docs/src/MichelsLife/frontend/index.html. Next: Fix link or restore target (ID 41ca2b94e805646f)
- **CONFIRMED / BROKEN_RELATIVE_LINK** docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md: Missing: docs/AGENTS.md. Next: Fix link or restore target (ID 7a232f866547f4b1)
- **CONFIRMED / BROKEN_RELATIVE_LINK** docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md: Missing: docs/tools/ui_android_section_design_smoke.mjs. Next: Fix link or restore target (ID c9b0ed37825bd396)
- **CONFIRMED / BROKEN_RELATIVE_LINK** docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md: Missing: docs/android/audit/2026-10-12-ui-screenshot-gallery.md. Next: Fix link or restore target (ID 55915b207228a042)
- **REVIEW / POTENTIAL_UNLOGGED_CHANGES** GIT_AUDIT_LOG.md: 20 implementation/config paths changed since this log's last commit; examples: .github/workflows/android-build.yml, .github/workflows/ci.yml, .github/workflows/release-unified-v3232-a0221.yml, .michelslab/project-progress.json, android/android-bridge.js, android/app/src/main/java/com/michelslab/michelslife/CloudSync.kt. Next: Inspect diffs and reconcile only meaningful decisions/results in the canonical log (ID c8f3e39a706c096a)
- **REVIEW / POTENTIAL_UNLOGGED_CHANGES** android/ANDROID_AUDIT_LOG.md: 70 implementation/config paths changed since this log's last commit; examples: .github/workflows/android-build.yml, .github/workflows/android-public-install-smoke.yml, .github/workflows/android-ui-smoke.yml, .github/workflows/build-test-windows.yml, .github/workflows/ci.yml, .github/workflows/file-steward-pr-validation.yml. Next: Inspect diffs and reconcile only meaningful decisions/results in the canonical log (ID d5073223bab2537a)
- **REVIEW / UNKNOWN_PURPOSE** android/app/src/main/res/raw/mlv_focus_aurora.wav: No reliable purpose category from path. Next: Declare role after reviewing usage (ID 5f24662c6e85f329)
- **REVIEW / UNKNOWN_PURPOSE** android/app/src/main/res/raw/mlv_focus_glass.wav: No reliable purpose category from path. Next: Declare role after reviewing usage (ID a3f98f17133ad740)
- **REVIEW / UNKNOWN_PURPOSE** android/app/src/main/res/raw/mlv_focus_midnight.wav: No reliable purpose category from path. Next: Declare role after reviewing usage (ID f071b77e97a69cec)
- **REVIEW / UNKNOWN_PURPOSE** android/app/src/main/res/raw/mlv_focus_observatory.wav: No reliable purpose category from path. Next: Declare role after reviewing usage (ID 586c00d31d4ac5b9)
- **REVIEW / UNKNOWN_PURPOSE** android/app/src/main/res/raw/mlv_focus_silver.wav: No reliable purpose category from path. Next: Declare role after reviewing usage (ID bd129d6ef59f9598)
- **REVIEW / UNKNOWN_PURPOSE** android/app/src/main/res/raw/mlv_focus_soft.wav: No reliable purpose category from path. Next: Declare role after reviewing usage (ID e343c98421a4c10a)

Complete path → purpose/role/certainty list lives in FILE_GOVERNANCE.json. SUMMARY.json has counts only for master polling.
A dated file, duplicate, or suspicious name is an **investigation candidate**, not unwanted material.
No historical science cases, audit logs or evidence may be deleted automatically.
