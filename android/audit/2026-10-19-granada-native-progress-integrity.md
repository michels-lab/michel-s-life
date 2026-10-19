# Operación GRANADA — Native Android progress integrity, #104

**Date:** 2026-10-19, America/Monterrey  
**Repository:** `michels-lab/michel-s-life`  
**Base HEAD:** `30461e6ca24036154ff8d25c2ed368d071074d1a`  
**Branch:** `granada/native-persistence-progress-digests-20261019`  
**Scope:** existing test-only `android/tools/native_webview_state_probe.py`, this independent log.  
**Status:** test implementation candidate, exact-PR CI + native installed Android16 still pending. No APK source behavior or public release changed.

## Problem and rationale

Issue #104's historic installed signed v0.2.6 relaunch changed mission/contract Dashboard counts. The existing debug native WebView CDP probe compares mission IDs, goals IDs/counts and two Dashboard KPI strings over two force-stops, but does **not** compare individual mission completion IDs, earned XP values or total XP. This leaves a possible false pass if mission IDs and the broad Dashboard counters remain identical while the completion/XP history mutates during hydration.

## Implemented independent checks

- Inspect only the synthetic **debuggable TEST APK** canonical `vida_rpg_personal_progress_v2` storage through the *existing* local CDP bridge. Signed Direct and Play builds remain protected; **never** enable production WebView debugging.
- Extract mission completion tuples (parent mission ID, completion ID, completion date, XP) and canonical total XP transiently in the isolated installed test. Reject missing/malformed completion collection and invalid/negative XP.
- Persist **only counts and SHA-256 digests**: `missionCompletionCount`, `missionCompletionsDigest`, `totalXpDigest`. No raw mission names, completion IDs, dates, tokens, or canonical JSON are written to artifacts.
- Compare these fields on initial launch vs restart 1, initial vs restart 2, and restart 1 vs restart 2 through the preexisting Android candidate smoke calls, in addition to the existing mission/count/KPI gates.
- Expand the Python self-test with synthetic negative cases: changed completion ID, changed XP, missing completion history and invalid total XP must fail. The existing Android build workflow already invokes `python android/tools/native_webview_state_probe.py self-test`.

## Noninterference and limits

- Draft **PR #134** owns Android developer APK, Kotlin native bridge, updater and Android workflow; no overlap.
- Draft **PR #135** owns `android/mobile-sections.js` Calendar/Journal accessibility; no overlap.
- Draft **PR #137** owns `tools/ui_supabase_cross_device_smoke.mjs` plus independent offline sync log; no overlap.
- Windows development/MSIX/installer jobs remain explicitly paused, as does Windows Developer Twin. No release, signing, OAuth/provider state, app data or analytics engine changed.
- The new checks are stronger **native debug TEST APK persistence evidence only**. They do **not** retroactively prove signed Direct internal data retention or the owner's Galaxy first-run/upgrade. The #104 P0 issue remains open until that separate acceptance.

## Evidence and next action

Commit for the probe implementation: `acdc1c7ff3fb73c0ddef6fd61af950bde7a08b61`. Confirmed source written to branch through GitHub. Real exact-head self-test, Android smoke and emulator outcomes must be read before merging. If emulator loses ADB, report native hardware/runner evidence as blocked, not PASS; do not edit occupied PR #134 Android workflow. A genuinely reproducible completion/XP drift requires focused domain/source diagnosis and a new nonconflicting owner assignment before attempting runtime changes.
