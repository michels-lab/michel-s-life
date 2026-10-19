# Operación GRANADA — separate-account mission, Journal and guest-import QA

Date: 2026-10-19 (America/Monterrey). Repository: michels-lab/michel-s-life.
Branch: granada/account-vault-journal-consent-20261019. Issue #108, related #55 and #28.
Files owned in this isolated PR: tools/ui_supabase_account_switch_smoke.mjs plus this new log. Existing UI smoke workflow already runs the exact script twice: Windows mode and Android 412x915 mode. No shared runtime or Android native file edits.

## Risk addressed
Older app code could retain A's browser-local missions/Journal during A→B Supabase account switching and silently upload A's content to B. The current main already contains an account ownership boundary, per-account local recovery vaults and an explicit guest import confirmation; existing tests verified XP and cloud revisions but not Journal, concrete mission IDs or the decline path for unowned guest data.

## Extended synthetic real-browser acceptance
- Seed local-only, *unowned* guest XP, a private mission ID and a Journal entry. First sign-in to Account A must move the entire guest snapshot into a local recovery vault and must NOT put guest content into A's empty local or remote master.
- Navigate the actual Settings > Sync panel in rendered Chromium. The Import previous local board control must show a native confirmation with the actual destination account. Dismiss the dialog; the guest vault must remain intact, A must remain isolated, and no cloud write must occur.
- Add concrete Account A mission ID, history marker, earned XP and Journal value; upload to A's remote master. After logout/reload, verify all current A data and session tokens are unavailable while the reversible A vault contains all four types of content.
- Sign in to a different existing mock Supabase user B: assert local and B's brand-new remote master contain **none** of A or guest mission/Journal. Ensure A cloud write count and A remote master are unchanged.
- Give B its own XP, mission and Journal; sign out, sign in A and validate restoration of A (including no B content).
- Sign in to already-populated C (independent user UUID/remote revision 5), assert that sign-in does not overwrite the remote; explicitly adopt C's snapshot and validate its own Journal/XP with no A/B crossovers.
- Finish by signing into B again, validating B's mission/Journal/local XP are correctly recovered and A's remote remains unchanged.
- Run the scenario in both Chromium desktop and Android 412x915 platform modes, with isolated mock HTTP responses and only synthetic `example.test` users.

## Boundaries and validation
- Test code invokes canonical signIn/signOut/push/pull, actual click on guest import and existing Supabase provider mock. There is no second data engine, manual migration, product UI redesign, secret or real external provider.
- PR #134 owns Android native bridge/Developer Twin, #135 owns Calendar/Journal accessibility, #138 owns debug APK persistence probe, #140 owns emulator A/B. None of their files are edited.
- Tests must pass on the **exact PR head** in the current UI smoke workflow. Source write commit 720775b276de22f4a19dd30cc87134e37769cc40 is implementation evidence only; CI results are pending.
- Even if green, mock-account tests do NOT close issue #108/#55 until real provider / owner-device privacy proof is obtained. Signed Direct/Galaxy and Google Drive migrations remain separately unverified. No Windows packaging, version change or public release.
