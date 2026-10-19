# Operación GRANADA — Account, Journal and guest-import isolation

Date: 2026-10-19 (America/Monterrey)
Repo: michels-lab/michel-s-life
Branch: granada/account-vault-journal-consent-20261019
PR: #142; related issues #108, #55, #28.
Status: independent Chromium regression added; exact-head CI pending.

## Contract

- Seed synthetic unowned guest mission, XP and Journal. Signing into account A must safeguard them in the recoverable guest vault, without making them visible under A or uploading them to A's empty Supabase master.
- In the actual Sync Settings UI, click **Import previous local board**. The confirmation must name destination A; cancel it. Confirm no cloud upload and guest vault unchanged.
- Save A-specific mission, XP, private history and Journal; sign out and reload. Require session/token/visible A data cleared but local A vault intact.
- Authenticate B with a different synthetic Supabase user ID. Neither visible state nor B's first remote master may inherit A or guest mission/Journal. Preserve A remote revision and content.
- Give B unique mission/XP/Journal, return to A and confirm exact A restoration; authenticate existing remote C without overwriting its prior revision 5, explicitly pull C Journal, then return to B to confirm B recovery.
- Existing UI workflow runs the exact same test in Windows desktop mode and Android viewport 412x915. No real accounts or private data used.

## Ownership and limitations

Only tools/ui_supabase_account_switch_smoke.mjs plus this independent audit, outside draft PR #134 Developer Twin native/bridge, #135 Calendar/Journal accessibility, #138 Android native persistence, merged #140 emulator A/B and #141 handoff. No canonical runtime or graphics changed. Windows native packaging and Windows Developer Twin remain paused. No public Android release. Even passing mock CI does not close #108/#55 until actual Supabase and owner-device acceptance.

## Next gate

Read PR #142 exact-head UI CI (and Android UI/source) before merge. Fix only this test if timing or navigation assertions fail. If the test finds a real account-isolation bug, document reproducible findings and obtain source ownership before modifying the shared frontend.

Additional 2026-10-19 candidate (commit 64a5fd9): after the Cancel path and A/B/C isolation, return to A, explicitly Accept the real import confirmation, and require the guest mission/Journal to become A's local and cloud master only after consent. Verify A's previous mission/Journal and XP survive in both a distinct local account vault and the Supabase `before_explicit_guest_import` history. B's remote snapshot must remain byte-for-byte unchanged. This is synthetic browser test evidence, not signed native/provider validation. Exact-head CI required.
