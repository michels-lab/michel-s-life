# GRANADA GRANDE — cross-account isolation and user-controlled migration (2026-10-21)

## Precise risk and non-overlap
- Product: **Michel's Life only**, `michels-lab/michel-s-life`; P0 [#108](https://github.com/michels-lab/michel-s-life/issues/108) and related snapshot credentials P0 [#55](https://github.com/michels-lab/michel-s-life/issues/55).
- Before this block, #134 owns AndroidBridge / bridge scripts / Developer Twin, #156 owns the canonical frontend `index.html`, #160 owns Calendar, #157 owns emulator guard, #161 owns daily missions. No edits to any of their files, no Windows packaging, no signing, no user data.
- Source evidence in #108: a sign-out/login into a fresh account could auto-upload prior account's local board. It is a documented **source-path hazard**, not a reproduced live Supabase leak.

## Deliverables in an independent browser-compatible source module
1. **Account isolation with reversible local vault**: immutable legacy rescue, distinct A/B profiles, local revision per profile and a fresh `pending` gate after each authentication. Guest/public board never silently becomes an authenticated user's owned board. No `localStorage.clear()`.
2. **Fail-closed provider guard and recovery**: caller must supply verified real account ID and either a remote data snapshot with revision or confirmed remote-empty account; `authorizeUpload()` only returns true for matching, already-verified account. Existing remote data gets an immutable local recovery point before adoption. Storage failure attempts rollback and fails closed.
3. **One-time guest migration with meaningful consent**: explicit destination ID, SHA-256 of what was previewed, confirmation of empty destination and direct positive owner consent. Existing nonempty data never overwritten. A local receipt prevents repetitive cross-account guest imports.
4. **24 synthetic regression cases** cover A→B(empty), A→B(remote), B→A, sign-out, absent/corrupt owner, malformed IDs, attacker mismatches, consent replay, remote revision, immutable recovery, quota rollback, session/device preservation, UTF-8 digest.
5. **Dedicated CI** isolated to this module/tests; no routine Windows builds, APK signings, live account actions or masking of other failures.

## Validation and limitations
- **Local 2026-10-21:** `node --check` module and tests **PASS**; `node tools/test_granada_account_boundary.mjs` **24/24 PASS** in a synthetic `localStorage` adapter.
- **Not yet integrated/shipped:** The canonical production `index.html` is owned by active PR #156; AndroidBridge/Developer ownership is active in #134. The module does **not** change shipped account sign-out, sign-in, push, app UI or release behavior by itself. Do not close #108 or claim a security fix is live. Account IDs and remote read attestations must come from the real provider, not UI/client assertions; current unit tests cannot prove that integration.
- **Related P0 #55 remains open:** this isolates account ownership but does not provide the verified application shareable-state allowlist or live cloud/Drive restoration safety. No claim that opaque board snapshots are token-free.
- No physical Galaxy, live two-user Supabase, Windows↔Android, native lifecycle, updater, installation or release evidence was obtained. No production release is authorized by these synthetic tests.

## Integration gate and handoff
1. Wait until owner of canonical frontend #156 / Developer Twin #134 has released their files. Rebase and call the module from **the actual sign-out, sign-in, first-upload, remote restore and guest import UI paths**, after identifying the real local revision key and clean empty board factory. Keep private sessions/device IDs outside vault storage and separate from shared snapshots.
2. Add authentic synthetic two-account browser integration test proving no old missions, Journal, XP or revisions appear/upload under B; exercise both B empty and B existing remote. Test explicit preview/consent and rollback on a real UI path. Reject automatic first-upload before remote ownership verification.
3. Run signed native Android + Windows release-safe QA and live A/B account testing with test identities under confirmed owner consent, no private tokens in evidence. Resolve #55 and #108 only after source/CI/physical acceptance and confirm API guarantees.
4. Follow the GRANADA final-only release gate: integration + green exact-head CI + signing/provenance + real device continuity + owner acceptance. No RC/beta/prerelease.

**State:** Functional standalone module implemented and locally tested; production wiring, exact-head CI, native proof, account-provider verification and public release **PENDING**.


## Follow-up GRANADA — crash-consistent account transitions

**Additional concrete threat:** `localStorage` writes one key at a time; a WebView/OS termination after updating the board but before updating the active-account marker could leave **mixed account ownership on the next startup**. Ordinary exception rollback is not sufficient for a process kill. The original helper did not persist a transaction marker.

- Updated `src/MichelsLife/frontend/account-boundary.mjs` to create a **device-local write-ahead rollback journal** before every multi-key mutation. Original values are preserved only on this device; on normal completion the marker disappears. If a WebView terminates mid-switch, a subsequent `AccountBoundary` construction or `active()` call verifies and rolls back every key before any upload authorization.
- Failed partial rollback leaves the journal in place and throws `storage_rollback_failed`; malformed or credentials-targeting journals fail closed with `corrupt_boundary_transaction`. Do not clear the marker or silently continue an account session. Storage quota failures on marker creation do not start a switch.
- Added **five new fault-injection tests** (29 total): simulated crash with A board / B identity mixed, journal recovery delayed by storage failures, forged credential-targeting transaction, malformed/duplicate transaction keys, and failure before creating the journal.
- Exact-head [account boundary CI run 39684463061](https://github.com/michels-lab/michel-s-life/actions/runs/39684463061) **PASS** for syntax checks + all synthetic boundary tests at code head `791f1291f843a5e0267e255a9fc905a63d55b8ef`. This head predates this documentation-only append; recheck final head. The preceding run was red for a malformed injected `null` test entry and was fixed explicitly by validating the entry before destructuring. Do not hide it.
- Existing **Android16 APK build/install job** is a separate native acceptance requirement: earlier head compiled the APK but emulator install/launch failed. Check the latest actual job conclusion; until source is wired into production login/logout/cloud push/restore, real provider A/B account proof and signed native acceptance are missing, #108 stays OPEN.

No main-repo merge, published feature, user account modification, Google/Supabase credential use, cross-project change, Windows native packaging, APK/signing or release was made in this security block.

## GRANADA follow-up — independent Journal/account isolation and real browser lifecycle

**Additional discovered isolation gap:** a Michel's Life Journal is stored separately under canonical shareable key `michelsLife.journal.v30184`, not necessarily inside `vida_rpg_personal_progress_v2`. Vaulting only the mission board could leave account A's Journal visible when B opens or after sign-out, even if A/B mission IDs were separated. This was a standalone-module coverage gap, **not an assertion of live provider leakage**.

- Added an optional, **strictly allowlisted** companion-storage configuration (`companionKeys:['michelsLife.journal.v30184']`). Account A and B vaults now store/restore Journal independently; sign-out clears visible Journal; provider `adoptRemoteState` replaces only the verified account's Journal; guest-only Journal requires preview-bound, explicit destination consent; the preview digest also covers companion content.
- Provider sessions, tokens, device IDs, unknown localStorage keys and arbitrary remote-supplied companion maps are *not* accepted as companions. Corrupted unexpected companion maps fail closed. Transaction journal recovery also restores the Journal if shutdown occurs during a mixed-state switch.
- Six added Journal-oriented synthetic cases, in addition to the original 24 and five interrupted-write cases: **35 synthetic checks** overall.
- New `tools/ui_granada_account_boundary_crash_browser.mjs` uses a **real persistent Chromium localStorage origin**. It terminates the page after simulating the inter-key write point, opens a new page in the same browser profile, requires A-owned data/authorization only, performs A→B→logout→A ownership isolation and rejects a forged journal that targets credentials. **This is NOT Android native WebView, actual provider auth, or signed Galaxy acceptance.**
- Dedicated workflow `.github/workflows/granada-account-boundary.yml` now runs Node assertions **and** real browser lifecycle cases. [Exact code-head dedicated run 39685520423](https://github.com/michels-lab/michel-s-life/actions/runs/39685520423) **SUCCESS** at `26dc5c8d0612e6efdbc214338f8c3e99d445d0cb`. New documentation commit requires its own follow-up check; do not assume other Android workflows green.
- **Release/merge constraints unchanged**: #169 is still not wired into the production canonical frontend login/logout/push/restore, so #108/#55 remain open; Android native exact-head, real A/B Supabase and device verification are outstanding. No private data was read or uploaded, no Windows build/release, no cross-app modules.

When integrating with occupied canonical frontend PR #156 and Android Developer Twin #134, production MUST explicitly pass the approved Journal companion key and real authenticated provider revision data; otherwise it is not a complete account-safety fix.