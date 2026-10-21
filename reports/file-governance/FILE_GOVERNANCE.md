# File steward: repository file audit

All tracked files classified; Markdown/text docs inspected with size cap. Binary/research-content validity and untracked files not assessed.
No file is auto-deleted or declared unused.

## Coverage

Tracked: 256; classified: 252; readable documents: 70; above read cap: 0; findings: 26.

## File roles

| Role | Count |
|---|---:|
| agent | 9 |
| asset | 12 |
| bitacora | 3 |
| build_script | 6 |
| config | 21 |
| document | 63 |
| index | 4 |
| license | 1 |
| source | 85 |
| test | 6 |
| unknown | 15 |
| web_ui | 3 |
| workflow | 24 |

## Findings (human review required)

- **REVIEW / POSSIBLY_REDUNDANT_NAME** .github/workflows/granada-backup-preflight.yml: Backup/old/copy/draft name; may be intentional. Next: Check references and history before archiving (ID ec7b88364616f6cf)
- **REVIEW / POSSIBLY_REDUNDANT_NAME** .github/workflows/granada-safe-backup-converter.yml: Backup/old/copy/draft name; may be intentional. Next: Check references and history before archiving (ID ad3c3cd6a3834eef)
- **REVIEW / POSSIBLY_REDUNDANT_NAME** android/PLAY_CONSOLE_SUBMISSION_DRAFT.md: Backup/old/copy/draft name; may be intentional. Next: Check references and history before archiving (ID 7afb0a8225098a1a)
- **REVIEW / POSSIBLY_REDUNDANT_NAME** android/PRIVACY_POLICY_DRAFT.md: Backup/old/copy/draft name; may be intentional. Next: Check references and history before archiving (ID 537040ed16ac2de1)
- **REVIEW / POSSIBLY_REDUNDANT_NAME** docs/BACKUP_PREFLIGHT.md: Backup/old/copy/draft name; may be intentional. Next: Check references and history before archiving (ID 30036a8a1c5ca684)
- **REVIEW / POSSIBLY_REDUNDANT_NAME** docs/SAFE_LEGACY_BACKUP_CONVERSION.md: Backup/old/copy/draft name; may be intentional. Next: Check references and history before archiving (ID 40d5ad51855e9a55)
- **REVIEW / POSSIBLY_REDUNDANT_NAME** tools/granada_backup_preflight.py: Backup/old/copy/draft name; may be intentional. Next: Check references and history before archiving (ID 6552827bb116b503)
- **REVIEW / POSSIBLY_REDUNDANT_NAME** tools/granada_safe_backup_converter.py: Backup/old/copy/draft name; may be intentional. Next: Check references and history before archiving (ID 9812184bdba86af5)
- **REVIEW / POSSIBLY_REDUNDANT_NAME** tools/spanish_copy_source_audit.mjs: Backup/old/copy/draft name; may be intentional. Next: Check references and history before archiving (ID 1b7823cd6375b21b)
- **REVIEW / POSSIBLY_REDUNDANT_NAME** tools/test_granada_backup_preflight.py: Backup/old/copy/draft name; may be intentional. Next: Check references and history before archiving (ID f6cb184d6cd0c1f8)
- **REVIEW / POSSIBLY_REDUNDANT_NAME** tools/test_granada_safe_backup_converter.py: Backup/old/copy/draft name; may be intentional. Next: Check references and history before archiving (ID 817910b19005e99c)
- **REVIEW / UNKNOWN_PURPOSE** .michelslab/candidate-intents/android-direct-v026.txt: No reliable purpose category from path. Next: Declare role after reviewing usage (ID 7d00b0c1712876d3)
- **REVIEW / UNKNOWN_PURPOSE** .michelslab/release-intents/android-v023.txt: No reliable purpose category from path. Next: Declare role after reviewing usage (ID 417a22a9256f65ec)
- **REVIEW / UNKNOWN_PURPOSE** .michelslab/release-intents/android-v024.txt: No reliable purpose category from path. Next: Declare role after reviewing usage (ID aee29b7c3d0566f1)
- **REVIEW / UNKNOWN_PURPOSE** .michelslab/release-intents/unified-v3217-a025.txt: No reliable purpose category from path. Next: Declare role after reviewing usage (ID 097f635071c59f07)
- **REVIEW / UNKNOWN_PURPOSE** .michelslab/release-intents/unified-v3218-a026.txt: No reliable purpose category from path. Next: Declare role after reviewing usage (ID b3af36b6faf1fa35)
- **REVIEW / UNKNOWN_PURPOSE** .michelslab/release-intents/unified-v3219-a027.txt: No reliable purpose category from path. Next: Declare role after reviewing usage (ID 117c853700707dcb)
- **REVIEW / UNKNOWN_PURPOSE** .michelslab/release-intents/unified-v3220-a028.txt: No reliable purpose category from path. Next: Declare role after reviewing usage (ID a4d3032878f168f9)
- **REVIEW / UNKNOWN_PURPOSE** .michelslab/release-intents/unified-v3221-a029.txt: No reliable purpose category from path. Next: Declare role after reviewing usage (ID e2996ef78d5d5bfa)
- **REVIEW / UNKNOWN_PURPOSE** installer/TaskbarPinning.txt: No reliable purpose category from path. Next: Declare role after reviewing usage (ID 5d4d30417d9f7a63)
- **REVIEW / UNKNOWN_PURPOSE** src/MichelsLife/GoogleCalendarService.cs.gz.b64: No reliable purpose category from path. Next: Declare role after reviewing usage (ID da1ab9955e45ac7e)
- **REVIEW / UNKNOWN_PURPOSE** src/MichelsLife/Program.cs.gz.b64: No reliable purpose category from path. Next: Declare role after reviewing usage (ID 6b807bddd0e10afd)
- **REVIEW / UNKNOWN_PURPOSE** src/MichelsLife/app.manifest: No reliable purpose category from path. Next: Declare role after reviewing usage (ID fbebc509becff010)
- **REVIEW / UNKNOWN_PURPOSE** supabase/migrations/20261005112105_michels_life_initial_sync_schema.sql: No reliable purpose category from path. Next: Declare role after reviewing usage (ID b4d06c4850b3c6ab)
- **REVIEW / UNKNOWN_PURPOSE** supabase/migrations/20261005112815_lock_michels_life_sync_to_authenticated.sql: No reliable purpose category from path. Next: Declare role after reviewing usage (ID 0a139aebccfaf828)
- **REVIEW / UNKNOWN_PURPOSE** supabase/migrations/20261006070456_least_privilege_michels_life_sync.sql: No reliable purpose category from path. Next: Declare role after reviewing usage (ID 7a3cb6f5ba1d0140)

Complete path → purpose/role/certainty list lives in FILE_GOVERNANCE.json. SUMMARY.json has counts only for master polling.
A dated file, duplicate, or suspicious name is an **investigation candidate**, not unwanted material.
No historical science cases, audit logs or evidence may be deleted automatically.
