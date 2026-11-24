# Michel's Life — classical Focus theme excerpts (Granada 2026-11-20)

## Scope and honest playback labels

Two **short, synthesized ambient adaptations of public-domain melodic material** were added to the existing Focus soundscape selector, without deleting any of the eight original A/C themes:

- **Mozart · Sonata in C major, K. 545, first movement (theme excerpt)** — opening right-hand idea C5–E5–G5, continuation and a quiet newly arranged pad; **not** a complete sonata performance.
- **P. I. Tchaikovsky · Morning Prayer, Album for the Young, Op. 39 No. 1 (theme excerpt)** — the opening melodic outline of the chorale as an evolving quiet theme; **not** the complete piano score.

The two new pieces appear under the CL group in the same Windows/Android Focus selector. They do **not** play automatically; a user must explicitly select and start a soundscape. The existing personal alarm ringtones, alarm schedule, Pomodoro finishing chimes, ambient presets and saved user data remain untouched.

## Rights / source provenance

- Wolfgang Amadeus Mozart (1756–1791): Piano Sonata K. 545. Composition in the public domain. Source comparison: Mutopia Project piece 998, https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=998 ; the specific Mutopia engraving is distributed under CC BY-SA 3.0. Source prepared/maintained by Alejandro Sierra. Additional opening pitch cross-check: https://piano.org/songs/mozart-sonata-k545/
- Pyotr Ilyich Tchaikovsky (1840–1893): Morning Prayer, Op. 39 No. 1. Composition public domain. Source: Mutopia Project piece 2032, https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2032 ; typesetting by Rem Zolotykh declared public domain; melodic-note cross-check: https://notenames.app/pieces/tchaikovsky-morning-prayer-letter-notes

**No external commercial recording or audio sample is copied, linked, embedded, or played.** Web Audio generates the sound entirely from note frequencies and local oscillators. The excerpt arrangement is deliberately not advertised as an authentic full performance of either work. Respect the score attribution above in release notes and About/credits if publicly distributed.

## Implementation and verification boundary

- Canonical FocusStory alone persists the v30165Soundscape field, with the two new IDs accepted by its existing validation function.
- The same MichelsLifeFocusAudio engine retains one interval, closes the previous audio context on selection changes, and releases the context when stopped or navigating away.
- Dedicated regression tests assert visible options, source pitch frequencies, canonical persistence, no ambient autoplay, no interval leaks and retention of all previous soundscapes.
- Headless rendering tests and eventual physical Windows/Samsung listening are **separate** from these source contracts. Do not claim this PR is a new signed stable release until exact-head gates and release process pass.

## 24-Nov: classical completion (replaces incorrect ambient routing)
Mozart K.545 opening, score-derived events from [Pianiq k545-1.json](https://github.com/Pabl0sk1/Pianiq/blob/main/src/data/pd-midi/classical/k545-1.json), blob f1cd8917baa55b07222ae31880e96c34725438ec; upstream Mutopia 998, Alejandro Sierra, CC BY-SA 3.0. Excerpt and derivative note data/rendered Mozart audio distributed under CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/). Timing adjusted to piano tempo, no original recording. Tchaikovsky Op.39 No.1 opening eight bars transcribed from [Mutopia 2032](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2032), Schirmer 1904, Rem Zolotykh public-domain edition. Both rendered locally with decaying piano harmonics, one-shot completion and preview, no ambience scheduler. Android WAV and WebAudio use same notes and synthesis formula. Not whole movements or recorded human performances.
