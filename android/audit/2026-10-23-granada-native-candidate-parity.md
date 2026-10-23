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
