# GRANADA 2026-10-21 — Backup-loss triage, independent data-integrity block

Owner command: Michel's Life — Operación Granada.

## Preflight and files owned

Verified source \`main\` HEAD at start: \`2621319b741b9cc7cebd5b3a05eb38414f88034d\`. Latest public release: Windows 3.0.221 + Android Direct 0.2.9; no new release created. Android active, Windows packaging paused.

Separate branch: \`granada/offline-recovery-loss-triage-20261021\`. Only **new** code/test/workflow/docs paths:
- \`tools/granada_recovery_loss_triage.py\`
- \`tools/test_granada_recovery_loss_triage.py\`
- \`.github/workflows/granada-recovery-loss-triage.yml\`
- \`docs/RECOVERY_LOSS_TRIAGE.md\`
- This audit entry

No frontend index, Android Developer Twin, CloudSync.kt, native transport, Calendar, Focus, signed channel, credential or release workflow modifications. Existing converter/preflight logic remains untouched.

## Substantial deliverables

1. **Read-only integrity intake:** real local file parsing with strict duplicate/NaN limits and frontend-derived allowed storage keys; requires consistent canonical and embedded progress and blocks account/token/device fields.
2. **Recovery triage algorithm:** set-level added/removed IDs (including equal counts with different IDs), in-place edits distinguished from deletions, multiset completion-event loss, mission removal completion impact, XP/history changes and Journal-presence flags; contains no raw user content.
3. **Safe operational report:** redacted stdout and optional atomic create-only private report; no account decision, automatic upload, merge or restore; fail-on-risk exit status.
4. **Regression gates:** synthetic-only comparison scenarios, file non-mutation, output privacy, duplicate IDs, credential attacks, symlink/hardlink and no-network/no-destructive-write checks; existing safe converter/preflight also rerun.
5. **Operator handoff:** commands and explicit refusal of real-account/Galaxy claims.

## Evidence and remaining gates

Code initially authored on branch. **GitHub Actions must be read at exact latest head before promoting any PASS claim.** Native Android16, signed Galaxy relaunch, real Supabase A/B account consent/ownership and production UI integration remain unresolved. This is a standalone offline *user-operable* tool, not a shipped app feature or release. In particular P0 #108 and #55 (account/provider boundaries), #104 (native persistence), #168/#171 (Story/Focus), #139 (hosted emulator), and draft PR ownership #134/#156/#157/#169/#170 remain in place.

Next GRANADA: check exact-head workflow and tests, fix any red case without touching other branches, then determine merge viability. Do not publish public Android/Windows binaries on documentation or synthetic QA alone.
