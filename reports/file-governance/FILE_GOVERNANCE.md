# File steward: repository file audit

All tracked files classified; Markdown/text docs inspected with size cap. Binary/research-content validity and untracked files not assessed.
No file is auto-deleted or declared unused.

## Coverage

Tracked: 313; classified: 309; readable documents: 91; above read cap: 0; findings: 6.

## File roles

| Role | Count |
|---|---:|
| agent | 9 |
| asset | 12 |
| bitacora | 3 |
| build_script | 6 |
| config | 22 |
| database_migration | 3 |
| document | 84 |
| encoded_source | 2 |
| index | 4 |
| installer_metadata | 1 |
| release_intent | 8 |
| source | 101 |
| test | 16 |
| text_metadata | 1 |
| web_ui | 3 |
| workflow | 34 |

## Findings (human review required)

- **CONFIRMED / BROKEN_RELATIVE_LINK** docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md: Missing: docs/src/MichelsLife/frontend/index.html. Next: Fix link or restore target (ID 41ca2b94e805646f)
- **CONFIRMED / BROKEN_RELATIVE_LINK** docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md: Missing: docs/AGENTS.md. Next: Fix link or restore target (ID 7a232f866547f4b1)
- **CONFIRMED / BROKEN_RELATIVE_LINK** docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md: Missing: docs/tools/ui_android_section_design_smoke.mjs. Next: Fix link or restore target (ID c9b0ed37825bd396)
- **CONFIRMED / BROKEN_RELATIVE_LINK** docs/audit/2026-10-22-granada-lovable-ui-prototype-rejected.md: Missing: docs/android/audit/2026-10-12-ui-screenshot-gallery.md. Next: Fix link or restore target (ID 55915b207228a042)
- **REVIEW / POTENTIAL_UNLOGGED_CHANGES** GIT_AUDIT_LOG.md: 46 implementation/config paths changed since this log's last commit; examples: .github/workflows/android-ui-smoke.yml, .github/workflows/ci.yml, .github/workflows/external-ui-baseline-guard.yml, .github/workflows/file-steward-pr-validation.yml, .github/workflows/granada-android-drive-privacy.yml, .github/workflows/granada-android-evidence-gate.yml. Next: Inspect diffs and reconcile only meaningful decisions/results in the canonical log (ID 6e893375bdcfac48)
- **REVIEW / POTENTIAL_UNLOGGED_CHANGES** android/ANDROID_AUDIT_LOG.md: 9 implementation/config paths changed since this log's last commit; examples: .github/workflows/granada-story-focus-provenance.yml, android/mobile-sections.js, android/story-focus-safe-area.mjs, tools/granada_story_diagnostic_core.mjs, tools/test_granada_story_diagnostic_core.mjs, tools/test_granada_story_safe_area.mjs. Next: Inspect diffs and reconcile only meaningful decisions/results in the canonical log (ID 82911d5598710a80)

Complete path → purpose/role/certainty list lives in FILE_GOVERNANCE.json. SUMMARY.json has counts only for master polling.
A dated file, duplicate, or suspicious name is an **investigation candidate**, not unwanted material.
No historical science cases, audit logs or evidence may be deleted automatically.
