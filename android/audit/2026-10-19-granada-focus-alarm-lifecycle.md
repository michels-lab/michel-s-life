# GRANADA — Focus alarm lifecycle safety gate

Date: 2026-10-19 (America/Monterrey)
Repo: michels-lab/michel-s-life
Issue: #53, related Android parity #54.
Branch: granada/android-focus-alarm-lifecycle-20261019.
Base HEAD: de56458ef9a568667fc556b2c4b8334f5109ffcf.

## Change and exact ownership

- New synthetic real-browser probe: tools/ui_android_focus_alarm_lifecycle_smoke.mjs.
- Existing UI smoke workflow gains a step that syntax-checks and runs this same probe.
- This dated log documents implementation, testing gates and missing physical acceptance.

## Tested behavior (synthetic OS bridge; canonical real frontend)

1. Run Android 412px Chromium with the actual app and canonical FocusStoryV30162 timer.
2. Use a synthetic native Android alarm bridge that records each real call and returns a status instead of scheduling an OS alarm.
3. Start work and ensure a single running-deadline alarm request; repeated Focus visual refreshes/ticks must NOT reschedule the identical deadline.
4. Pause and require zero-deadline cancel. Repeated paused ticks must not send duplicate cancels.
5. Resume work, skip to break, start break and reset; request mode, status and deadline must match exactly one canonical Focus phase.
6. Simulate one failed native scheduling response and assert that the next Focus tick retries rather than retaining a false success. Once successful, repeated ticks must deduplicate.
7. Require no mutation of canonical mission IDs or XP and no stale deadline sent on any paused/ready transition.

The probe does NOT claim real OS notifications, Doze/locked-device delivery, notifications permission handling on a Galaxy, simultaneous custom alarms, snooze/reboot, or background OS timing. Those remain P0 #53.

## Coordination

PRs #134 (Developer Twin, native Kotlin and mobile-experience.js), #135 (Calendar accessibility) and #138 (native installed XP persistence) remain unmodified. This branch owns only a new synthetic browser test, its UI workflow invocation and this independent log. Windows native build, Windows Developer Twin, installers and MSIX are paused. No new user-installable APK or version tag.

## Required proof to merge

Check source/syntax + full browser UI and Android UI green for this exact PR head. Browser bridge testing cannot close P0 #53: physically test installed signed Android Direct APK on Galaxy with notification permission, screen locked/Doze/reboot, alarm delivery and long/background session, plus native Android emulator where available. CI checks pending at documentation time.

## First exact-head validation and fixture repair

UI job 118388737727 on initial head 4b2836b timed out while waiting for `window.MichelsLifeMobileExperience`: the normal UI web server serves only the shared desktop frontend, not the Android overlay script. This means none of the new alarm assertions ran and **no Focus defect was demonstrated**. Subsequent isolated test commit c08c2db now explicitly sets the Android platform marker and loads the real repository `android/mobile-experience.js` into this same canonical Chromium session using Playwright `addScriptTag({path:...})`; the same exact-state interactions are then attempted. This is source-identical Android JS, with mock OS transport. Await new exact-head result; do not mark as native notification PASS from this fixture.
