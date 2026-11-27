# Michel’s Life — 24 Nov 2026 · Release 3.0.232 + Android Direct 0.2.21, runtime #168

## Source integration and distribution

- Source [PR #233](https://github.com/michels-lab/michel-s-life/pull/233) includes two-parent merge of [PR #232](https://github.com/michels-lab/michel-s-life/pull/232): 8 ambient + 2 short synthesized classical Focus themes visible, 7 completion sounds with visible preview, Settings weekday live color mapping (active Main, inactive Secondary 66%), and safer legacy translators. This is a **branch candidate** and not merged into main or released.
- New versions aligned at real owners: Windows 3.0.232 (csproj, canonical host/materializer, About, generated frontend, validators), Android Direct 0.2.21/code23 (Gradle, CloudSync, android bridge, 4 android-build env slots). Previous code22 drift was caught by failing Android packaging. A dedicated `tools/test_unified_release_gate_3232.mjs` covers version agreement and 11 same-SHA future release gates.
- Destination [publisher PR #24](https://github.com/michels-lab/michel-s-life-releases/pull/24) is staged, preflight SUCCESS. No publication intent in either repository. It retains a fixed production Android signature, native API35 installed+relaunched capture checks, Windows Setup/Portable native launch, 13 assets, hashes and independent download verification.
- Last **public stable** Windows 3.0.231 / Android Direct 0.2.20 code22, 13 assets. Owner acceptance **7/15 = 47%** unchanged.

## #168 provenance: what evidence actually proves

- Earlier Story/Focus source inventory confirms every inline classic JS block parses cleanly from the generated HTML (0 static JS syntax failures). Chromium occasionally emits SyntaxError in actual page navigation.
- In [run #45341791572](https://github.com/michels-lab/michel-s-life/actions/runs/45341791572) a *document-start* MutationObserver recorded script nodes initially containing full source then undergoing childList text replacement: v217 17752→15707 chars; v251 18783→16156; v3130 12378→11322; v3021 2224→1988. Since this occurs at different phases (before/after DOMContentLoaded), no explanation based solely on a damaged repository blob is supported. Strict DOM text SHA-256 Story/Focus gate FAIL 0/6. Other Android UI runs independently reported SyntaxError.
- First attempt to trace DOM writes **produced misleading `appendChild` ownership**: it attributed any style inserted into BODY/HEAD to a descendant SCRIPT tag. That diagnostic false positive was removed. **Do not blame the Android style/Focus code based on that evidence.**
- Candidate now records actual SCRIPT-parent text mutations with added/removed text lengths and tracks the **V8 compiled script SHA-256 via Chrome DevTools `Debugger.scriptParsed`** for the four suspect scripts. This distinguishes DOM text changes from executed-source integrity, without logging script source, URLs or user data. CI on that exact latest candidate must complete before any conclusion about runtime root cause or release. The existing pageerror and Story/Focus fail-closed gates remain enforced. No source hash mismatch is waived.
- Two historical TreeWalker translators without SCRIPT/STYLE exclusions were corrected earlier; the #168 failures persisted, hence that fix alone was **insufficient**, not a reason to close #168.

## Reentry / stop conditions

1. Inspect [Story/Focus #168 issue](https://github.com/michels-lab/michel-s-life/issues/168) and current PR #233 HEAD, fetch same-HEAD workflow runs (not historical).
2. For each failing device size 320/360/412 and EN/ES, inspect sanitized DOM `addedTextCharacters/removedTextCharacters` and V8 `executedScriptIntegrity`. If V8 source hashes match but DOM does not, analyze runtime pageerrors independently before changing the ownership test. If compiled JS mismatches, trace the actual executing constructor/source.
3. Fix the owning runtime or packaging process, add a regression that fails on old code; verify all 11 gates on the release intent SHA + native Windows and production signed Android 15 install/relaunch before creating the destination publisher intent. All candidate code remains unmerged.
4. Do not conflate CI, producer/publisher merges, actual stable release, physical Galaxy QA, Supabase/Google real-provider checks, or the 7/15 owner acceptance baseline.
