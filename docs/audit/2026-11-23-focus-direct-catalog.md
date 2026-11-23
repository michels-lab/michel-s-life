# Michel's Life — Focus audio catalog directly accessible (2026-11-23)

## Source scope / root cause

The public Windows 3.0.231 / Android 0.2.20 Focus view exposes two synthesized classical excerpt buttons. The other eight ambient compositions and the completion tone selector/preview were placed inside a collapsed advanced Audio drawer, although the canonical audio engine already supported them. The owner's November 23 report explicitly called out the missing visible options and preview, so merely adding more recordings to the underlying state would not fix the navigation failure.

## Candidate changes — feature branch only

- Desktop `src/MichelsLife/frontend/focus-immersive.js`: eight ambient theme buttons rendered directly on Focus, separate from two retained classical buttons. Completion tone picker and its Listen button moved out of advanced Audio. Selection, persistence, soundtrack scheduler, cleanup and preview remain owned by the existing FocusStory and MichelsLifeFocusAudio objects.
- Android `android/mobile-experience.js`: the same eight direct track controls and accessible completion picker/preview. The new nested label is localized by updating its first text node rather than destroying the nested select. A bounded theme list prevents the music section from swallowing the timer on a narrow screen.
- A single `toggleScene` method is shared by both UI surfaces; invalid IDs fail closed; switching while playing closes the prior audio context; tapping active track stops without losing saved preference.
- Regression tests under `tools/test_granada_classical_focus.mjs` target the original hidden-choice failure, one selector per surface, label-preservation guard, all 8 themes and one scheduler.
- No new recording, MP3 material, copyright license, cloud account, personal data, native alarm sound or external service introduced. Mozart/Chaikovski remain *short synthesized excerpts*; the six 24-second native alarm compositions remain independent.

## Evidence separation

- **Source commit:** candidate branch only; review + exact-head CI are required before merging. This note is *not* an installed runtime test or a public release.
- **Physical listening and usability:** Windows and Galaxy owner review PENDING. Full composer performances and alarm catalog parity PENDING. Do not certify from string-based regression tests.
- **Already published stable (unchanged):** Windows 3.0.231 / Android Direct 0.2.20, 13 distribution assets. No candidate release or version bump in this branch.
- **Measured completion baseline:** 7/15 = 47%, unchanged. None of the eight remaining acceptance milestones can be closed by source-only behavior.

## Next checks

Run `node --test tools/test_granada_classical_focus.mjs`, existing Focus/Alarm/UI suites and exact branch-head browser/mobile validations. Review 360–412px screenshot for track-list/timer visibility, desktop accessibility/keyboard and runtime script errors (#168). Alarm ringtone parity must include Android native scheduling, lock-screen/Doze and preview; do not add a WebView-only alarm choice and claim OS delivery.
