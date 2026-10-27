# Operación Granada — Android16 native candidate parity (2026-10-23)

## Reproducible evidence
- Source repository: michels-lab/michel-s-life; main reference: 0befa0cdf404af21ee48afe685b5bf8a748a82d2.
- Issue #171 / PR #170 exact source 78b8f66558b675c4a3a7644886b3110ad8df11d2 passed native Android16 synthetic 50 XP exact-once across two real force-stop process relaunches in workflow 39918548698; Story/Focus 6/6 actual browser touches. This is not physical Galaxy, signed Direct, real provider or account safety acceptance.
- Independent same-head normal Android16 candidate smoke workflow 39918548660 attempt 5 failed after the first native screenshot: ADB device offline, emulator QEMU port 5554 refused and second native PNG missing. The debug APK had installed and first launch succeeded; the result is BLOCKED, not a data loss verdict.
- Passing native two-relaunch test used 3072 MiB RAM and 512 MiB heap. Candidate installed smoke omitted these settings. This motivates a controlled host-configuration experiment, not a proven QEMU root-cause fix.

## Scoped changes
- Set identical memory/heap options only on the Android16 candidate-smoke AVD; preserve real framebuffer, first-run taps, dual force-stop canonical state comparisons, and all failures as hard failures.
- Both candidate builder and emulator jobs checkout and assert the actual PR head SHA (push SHA on main), rather than an unverified synthetic merge. No source/release version changes.
- Add five negative structural regression fixtures to prevent losing SHA pinning, silently dropping either memory setting, or bypassing the real native test.
- Do not touch approved UI, Theme, Current Chapter, Android production assets, real accounts, Windows release automation, or other apps.
- PR #134 independently touches other hunks of the same workflow; preserve its Developer Twin work and reconcile before merge. PR #157 owns the native smoke script and #170 owns Story/Focus runtime.

## Gates
- New Python negative fixtures need executed CI result on exact PR source; candidate job must separately install/paint/onboard and prove two actual process restarts. This patch alone does not close #139 or #171 or authorize a new APK release.
- Official last stable remains Windows v3.0.221 / Android Direct v0.2.9 from 2026-10-19; no release produced.

## Follow-up: RAM parity experiment FAILED; add hard native host diagnosis

- Actual exact-head #181 candidate smoke still **RED** at `fa9368a2c2af6f6bdcba8fb5b2bc3df3c71ddc67`, run [40010662716](https://github.com/michels-lab/michel-s-life/actions/runs/40010662716): 3 GiB RAM/512 MiB heap did **not** keep hosted QEMU alive beyond the first actual native frame. The existing `GRANADA_ANDROID_CANDIDATE_PROVENANCE_PARITY_PASS` only proves structural pinning; it cannot certify installation or persistence. Native test remains hard red. No rerun solely to hope for green.
- New `tools/granada_candidate_host_wrapper.sh` wraps the unchanged real native APK install/onboarding/two-relaunch script, records process-name-only counts and cgroup OOM counters immediately at emulator startup and at failure, and consumes existing fail-closed `tools/granada_android16_host_verdict.py`. It preserves the true failing exit status and cannot substitute synthetic pixels. Only bounded categorical verdict is emitted; raw logcat/user data are never uploaded by this new diagnostic.
- Success is not granted unless the original script returns 0 **and** three canonical native state comparison reports each say PASS **and** time-separated genuine CRC-complete PNG files exist. This is an added acceptance check, not a weakening.
- New independent offline negative fixtures prove that a simulated native exit code 27 propagates as failure with host-only evidence, that a fake exit 0 without actual native evidence is still rejected, and that the original native smoke cannot silently disappear from the wrapper. Existing five negative SHA/resource/skip checks are retained and updated for the wrapped script.
- **Still BLOCKED until exact-head host-classification workflow runs**. Even a host OOM classification does not establish app QA, a root-cause fix, physical Galaxy acceptance, signing or live account isolation. Do not merge/publish on this change alone.

### Exact-head native host failure: classification confirmed from actual retained artifact

- Run [40012790317](https://github.com/michels-lab/michel-s-life/actions/runs/40012790317), **source SHA `1d9cdd33463aed856535726aea7368a7d7a2e0dc`** (before documentation-only commit): Android APK build PASS, source smoke PASS, Android UI smoke PASS, UI smoke PASS, new candidate wrapper negative regressions **3/3 PASS**, and original five regression controls PASS. Full real Android16 candidate install/launch **FAIL** at `step0-after-30s.png`: actual first rendered image `step0.png` captured; next native screen attempt produced `error: closed`, no emulator port 5554, and all five real screenshot retries failed.
- Retrieved exact retained GitHub Actions **HostEvidence** artifact ID `12526714368` and inspected bounded files: `host-before.txt` says `qemu_process_count=1`, `emulator_process_count=0`; `host-after-failure.txt` says `qemu_process_count=0`, `emulator_process_count=0`. `diagnostic-verdict.json` classifies **`qemu_emulator_process_disappeared`**, `status=DIAGNOSTIC_ONLY`, `phase=launched`, `sample=1`, `host_oom_kill_delta=null`. Hence hosted QEMU disappeared; **cause (including host OOM) remains unproven** because memory cgroup counters were unavailable. The app's canonical mission persistence **not tested by this failing job**; separate PR #170 has its narrower positive XP result.
- The new wrapper now demonstrably distinguishes host-emulator disappearance from an asserted successful app validation, retains the hard-red check and rejects missing native evidence. No signing, merging or release from this result; do not replace the QEMU failure with mock pixels. Issue [#139](https://github.com/michels-lab/michel-s-life/issues/139) updated with cross-PR contrast.
