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