## 2026-10-15 — Private Direct signer test: manual owner dispatch + cross-APK visual KPI gate (#104)

- Repository actions produced **no workflow run associated with main push commits** from the prior private-candidate marker (#122 squash `e56ebc37` and the direct main marker-only update `544f5856`). This is a verified observation, not proof of which GitHub automation credential suppressed the event. Added an owner-invokable `workflow_dispatch` to the existing private candidate, requiring `private_candidate_only=true` and `refs/heads/main`; existing main-only marker push trigger remains. It does not publish any release. Static security check requires those guards and release APK debug isolation.
- The signed Android app is nondebuggable; `uiautomator` accessibility dumps on the real 2026-10-15 installed debug Android 16 device exposed only a WebView container and **zero text nodes** both before/after. Consequently screen hierarchy equality cannot prove state persistence in a signed APK. Raw CDP state extraction stays confined to the debuggable TEST build.
- Introduced `android/tools/compare_signed_native_kpis.py` for the private workflow: download the same-run Android TEST APK installed screenshots (whose canonical IDs and KPIs are independently verified via debug CDP), and compare pinned 1080x2400 Pixel 6 mission/contract numeric card crops against actual installed **production-signed** APK before and after force-stop, plus within each channel. This is a redacted visible-KPI *parity gate* only, not canonical signed storage certification. It fails if numerals are missing, geometry changes or KPI pixels drift. Pillow pinned in the private runner, with isolated self-test. The same synthetic negative self-test also runs in the ordinary Android PR-build CI, so the comparator is exercised before private signing.
- Calibration against real retained October 12 signed 0.2.6 artifact `11767106175` showed initial-to-relaunch significant pixel drift of **16.55%** in the mission-count crop and **13.57%** in the contract-count crop (mean RGB delta 30.52/25.52), despite old screenshot smoke passing. The October 15 canonical-verified debug candidate artifact `12004469088` showed **0%** significant drift in both crops across actual native relaunches. New gate tolerances are much smaller: 1.5% changed pixels and 2.0 average RGB delta per ROI. This test would detect the historical 0/3→0/18, 0→71 visible regression.
- This private signed workflow still needs a true GitHub Actions execution. The pinned signing certificate, physical Galaxy, signed APK internal canonical state and live Supabase two-device acceptance remain separate unresolved gates. No app design, data schema or published release changed.

## 2026-10-15 — Two consecutive native relaunches and signed Direct protection (#104)

- Extended actual installed Android 16 debuggable TEST APK smoke to force-stop/relaunch a **second** time after successful first state capture. Compare canonical onboarded mission/goal/contract ID counts+SHA-256 digests and Dashboard KPI digests across (initial vs first), (initial vs second), and (first vs second), retaining only redacted comparison files; require all three reports for native success. No app state or user data is cleared.
- The private production-signed Direct candidate workflow now sets `MLV_REQUIRE_PROTECTED_SIGNED=1`, refusing installation smoke if Android `run-as` indicates the candidate is debuggable. Aligned private signed Android 16 emulator graphics to working GLES SwiftShader `-gpu swiftshader -feature -Vulkan`, retiring the known-problematic legacy `swiftshader_indirect` setting. This does **not** expose production DevTools or allow debug access to any signed APK.
- CI coverage: normal PR Android TEST APK path runs the double-relaunch probe, **pending exact-head GitHub checks**. Private signed candidate build+install runs only when the owner triggers its existing main-branch candidate-intent workflow; a successful source/TEST CI check does not mean the private signed workflow ran. Public release, user data and visual design unchanged.
- Issue #104 remains open until signed Direct APK storage acceptance / Galaxy manual acceptance. Supabase real provider cross-device #28 remains open.

## 2026-10-15 — Native persistence must see real Dashboard KPI nodes (#104)

- Audit of the newly merged PR #119 found a false-pass possibility: identical **empty** Dashboard KPI arrays could pass comparison even when the target native Dashboard had not rendered its mission/contract counters. The debug-only installed APK state probe now requires visible mission and contract KPI values and verifies that the persisted mission collection, mission count and IDs agree before hashing and comparing two force-stop snapshots.
- Added negative self-tests for missing KPI categories and mismatched canonical IDs. The installed APK smoke now reports an actual native canonical persistence pass when a successful redacted comparison artifact exists, and correctly reports screenshot-only UNVERIFIED for protected signed APKs. The existing browser WebView-model first-run test also now requires visible mission and contract KPIs after Finish and both reloads; empty matching arrays no longer pass either channel.
- This is test hardening only: no change to UI, theme, user storage format, signing, version or release intent. Exact-head CI needed; public signed Direct APK, physical Galaxy and live account provider still require independent testing.

## 2026-10-15 — Native canonical WebView persistence gate (debug TEST APK; #104)

- Existing installed native APK smoke previously compared screenshots/accessibility only. Added `android/tools/native_webview_state_probe.py`: inspect actual appassets Android WebView on loopback via debug-only Chrome DevTools, read the canonical persisted board after Finish and after native force-stop/relaunch. Store only mission/goal/contract counts, SHA-256 digests of sorted IDs and Dashboard KPI digest (no raw account, mission text, tokens or full state). Fail closed on missing/uncompleted onboarding, unexpected Premium starter entries, duplicate IDs, or drift.
- `MainActivity.kt` enables WebView debugging strictly when Android flags mark the installed APK debuggable. Direct/Play builds retain the protected nondebuggable path and are never exposed to CDP. The installed debug candidate CI job pins websocket-client 1.8.0 and requires the native state probe; signed candidate remains screenshot-level evidence only.
- This improves native emulator persistence coverage **after successful exact-head CI**, not a claim of release/Galaxy acceptance. Remaining #104: test the same permanently signed Direct APK's protected storage by an appropriate test-only instrumentation strategy and exercise physical Galaxy. #28 real cross-device Supabase acceptance remains open. No user data, visual system, app version or release-intent changed.

## 2026-10-15 — Native signed Android onboarding evidence extension (#104)

- Candidate adds pre-force-stop native UIAutomator hierarchy capture to `android/tools/smoke_candidate_apk_install.sh`, paired with the already retained post-relaunch hierarchy. Parse accessible labels into a compact redacted comparison JSON, with guarded handling for WebView containers that expose no useful tree.
- Crucially, same accessibility labels or screenshot pixels do **not** prove canonical mission/contract persistence, so the native smoke log explicitly reports state persistence as UNVERIFIED; existing screenshot checks remain. No user data, UI runtime, brand, themes, release intents or package versions changed.
- Exact-head validation and actual signed APK native execution remain pending; #104 stays open until persistent IDs/counts are obtained from the actual installed APK after force-stop.

## 2026-10-15 — Android-mode distinct-account isolation regression (#108)

- Reuse existing synthetic A/B/C account-switch Chromium test in **Android WebView mode** (`MLV_ACCOUNT_SWITCH_PLATFORM=android`) with Android platform identification and 412px viewport. Require A's private board and device vault remain isolated from new B and established C, and prevent cross-account cloud writes; retain default Windows-mode coverage.
- UI smoke CI now runs both platform variants. This is mocked provider/browser evidence, not a real Galaxy or live Supabase account-switch acceptance. No product UI, runtime, Theme, version or release trigger modified.
- Status: PR candidate requiring exact-head CI before merge; #108 and #28 remain open.

## 2026-10-15 — Android onboarding: two consecutive WebView reloads (#104)

- Extended `tools/ui_android_onboarding_persistence_smoke.mjs` to reload the same origin/state twice after first-run Finish, checking exact persisted mission IDs, mission/goal/contract arrays, Dashboard KPIs, onboarding completion and duplicate IDs against the initial snapshot after **each** reload. A separate screenshot and redacted state report document the second restart.
- This is a **browser WebView-model regression**, not proof of signed APK/native Android force-stop, live Supabase, or physical Galaxy retention. Existing single-reload assertions remain unchanged. No runtime, Themes, Current Chapter, visual assets, version, signing, or release intent changed.
- Status: candidate pending exact-head CI. #104 and #28 remain open for native signed APK and real-provider cross-device acceptance.

## 2026-10-14 — Android Google Calendar: reject synthetic success (#110, candidate)

- **Confirmed source defect:** Android native bridge `"sync"` replied with a success, a fresh timestamp, `events=[]` and all-zero counters without requesting Google Calendar API. The Android OAuth coordinator currently requests Drive app data, `openid` and email only, not Calendar read/write scopes. Consequently the frontend could display "Synced" despite doing no provider work.
- **Candidate behavior:** bridge responds with an explicit Calendar-not-available error, never a fictional `syncedAt`. Android Settings shows Calendar sync unavailable, with disabled read/write, auto-sync and Sync Now controls and an explicit explanation. Other Supabase/Drive cloud sync and Windows Calendar providers are not changed.
- **Regression:** Android native source contract test `android/tools/validate_sync_contract.py` requires rejection rather than synthetic success; Android rendered 360/412px UI smoke asserts the Calendar Sync button is disabled and the status explains the limitation. Exact-head CI is pending.
- **Still open:** #110 full parity requires consented OAuth Calendar scopes, real event reading, deduplicated mission publishing, conflicts and physical-device/provider testing. This remediation removes a misleading success, it does **not** implement actual Android Calendar synchronization, grant permissions, change Themes/Chapter or authorize a release.

## 2026-10-14 — Fix legacy restart seeds behind generic onboarding (candidate, #104)

- **Reproduced on exact PR #111 head `62f326f4`:** Android UI run `38656370214` failed the new first-run/reload regression as intended. Browser-mapped persisted state: starter missions checked/Premium creation unchecked; initial 3 missions, 0 goals, Dashboard `0/3` and `0` active Contracts. Same localStorage after page reload: 25 missions, 71 goals, Dashboard `0/19` and `71` active Contracts. The 3 initial IDs survived, but 22 legacy mission IDs and 71 old goal IDs were added without user action. CI screenshot evidence is isolated artificial fixture data, no personal account.
- **Source cause confirmed:** canonical frontend legacy `ensureGoals()` populates `suggestedGoalsV7()` on an empty goal array at startup; `mergeGoalsV8()` adds legacy extras; `ensureMissionBank()` always appends V14 sample missions. Those all execute *before* the v30200 finish-system script's late `installGenericProfileGuards()`. A `v30200GenericProfile=true` account completing onboarding with zero Premium Contracts therefore gets its explicitly empty list overwritten on next boot; the legacy bank likewise injects sample missions.
- **Code fix candidate `c74546b9`:** add early post-onboarding generic-profile checks directly to those three legacy source owners in `src/MichelsLife/frontend/index.html`. In generic state, `ensureGoals` returns the chosen empty list untouched; V8 extras and V14 bank do not autoseed. Preserve historic defaults for non-generic legacy accounts, user-created goals/missions and explicit `goals-restore`; no frontend design, background/Theme/Chapter, native storage model, version, APK or release changed.
- **Validation:** failing before-fix browser run **verified**; source-fix exact-head Source/UI/Android UI workflows remain **pending** when this entry was prepared. Test must pass post-fix and retain the 3 selected missions and 0 Contracts over reload, without hiding dashboard counts. Native same signed APK force-stop and physical Galaxy/Supabase acceptance remain independent gates (#104/#54/#28).

## 2026-10-14 — Android onboarding persistence regression gate (candidate, #104)

- **Finding:** native 0.2.6 screenshots on the same Android 16 signed APK showed Today's missions 0/3 and Contracts 0 active after Finish, versus 0/18 and 71 active after force-stop/relaunch (issue #104). Root cause remains **unknown**. A nonblank screenshot and a living PID are insufficient state-persistence acceptance.
- **Candidate test:** `tools/ui_android_onboarding_persistence_smoke.mjs` uses a new empty Chromium Android WebView-model profile, drives the real first-run Continue/Finish buttons, preserves `localStorage` across a full document reload, then compares canonical saved mission IDs, other persisted mission/contract array IDs and actual Dashboard mission/contract KPI text before and after. It explicitly avoids the existing smoke fixture's persistent `addInitScript` reseeding on every navigation. Records synthetic/first-run IDs, choices and exact screenshots under `artifacts/android-ui-smoke/onboarding-persistence/`; no real user account or secrets.
- **CI:** Android UI smoke now runs this as an independent failing regression gate; the file is in the push-path selector. Browser-model test does not prove Android native force-stop or actual account synchronization. Exact-PR checks are **pending**, not recorded as passing.
- **Next:** if the gate fails, inspect state/ID diff and fix the actual hydration or migration owner without a duplicate Android model. Independently extend signed APK Android16 native test to capture comparable domain state across relaunch before closing #104. Do not declare 0.2.6 persistence/device approval or trigger another public release on this test-only candidate.

## 2026-10-12 — PRIVATE signed Galaxy candidate gate for Android Direct 0.2.6

- **Implementation:** after release-preparation PR #102 cleared all six exact-head checks and merged to `main`, introduce a narrow, marker-triggered workflow `android-direct-private-candidate-v026.yml`: reuse the existing Android build with `build_direct: true`, permanently pinned Direct signing identity and artifact verification, then install the **actually signed APK** on Android 16 with the shared native onboarding/relaunch screenshot smoke (APK path is an explicit environment override; existing debug default unchanged).
- **Distribution:** signed APK and native screenshots remain GitHub Actions artifacts only (30-day retention). **Not a public release**, no v3.0.218 tag and no approved Galaxy physical-device claim. Public v3.0.217 / 0.2.5 remains unchanged. The separate unified release-intent file is intentionally absent.
- **Validation:** candidate workflow must reach `success` on the exact merged commit before reporting an installable private APK; check versionName 0.2.6, versionCode 8, package ID, pinned signing certificate and manifest/download SHA-256. Screenshots do not by themselves establish correct visual composition or same-account sync.
- **Remaining:** owner-installed Samsung Galaxy review, Windows↔Android real Supabase sync (issue #28), lock-screen/Doze Focus alarm delivery (issue #53), installed Windows Home/About screenshot gate (draft PR #62), Android physical acceptance (issue #54).

## 2026-10-12 — Unified release *candidate preparation* (Windows 3.0.218 / Android Direct 0.2.6)

- **Decision:** prepare version metadata, Android Direct versionCode **8**, source checks, Windows installer fallback and a new separately gated unified workflow for the accumulated design changes. This is **not** publication; public Windows v3.0.217 / Android v0.2.5 remains the installed version until validated signed artifacts ship.
- **Release safeguards:** the new `release-unified-v3218-a026.yml` listens only for an exact **future** isolated `.michelslab/release-intents/unified-v3218-a026.txt` commit on `main`; that intent file has intentionally **not** been created. It will require same-source Source validation / Android UI smoke / UI smoke, a real built+installed Windows Setup and Portable checks, Android Direct certificate/version/package/digest checks plus Android16 test APK install, then check a complete 13-file draft before public promotion. Never reuse old v3.0.217 binaries or overwrite its tag.
- **Intent:** avoid claiming release readiness solely from merged browser tests. The current draft PR #62 Windows installed Home/About visual CDP capture is unresolved. Issues #28 (real-account sync) and #53 (locked-screen/alarm delivery) remain open. Issue #54 has been reopened because physical Galaxy visual/gesture and provider acceptance have not actually been recorded.
- **Next acceptance:** test *the exact candidate branch* with CI; merge only if required Windows, Android, source and UI checks succeed. Then decide if the channel is a public test build or a stable customer release after reviewing blockers. No auto-release or new signed customer APK authorized in this preparation PR.

## 2026-10-12 — Android design-first parity integration ledger (confirmed source; not a new public APK)

- **Workstream:** issue #54, mobile-first design without changing approved Windows Themes, typography, Chapter scenes, brand assets, or shared state ownership.
- **Merged and verified at exact PR heads:** #87 Achievements/Affirmations and keyboard interaction gate (`a817bbbc` merged); #88 Calendar selected date persists across Month/Agenda (`80d7344a` merged); #89 compact Premium category disclosure and >=44px targets (`2fee1bdc` merged; four Actions passed including Android16 install/launch); #90 Settings Sync/Google/About taps at 320/360 (`74e64790` merged); #91 correct public Windows/Android release baseline in docs (`3b6f365d` merged); #92 Quick Capture reduced-keyboard-height saved canonical mission (`6045831f` merged); #94 live `v217ContractEditForm` Android phone editor with post-render constraints, canonical Save, keyboard-height test and nav restoration (`385faad6` merged; four Actions passed including Android16 candidate install); #95 actual Premium category chip filters persisted canonical selection (`efe5d716` merged; source/UI/Android-UI checks passed).
- **Deliberately not merged:** #93 targeted an obsolete Goals editor; the current frontend redirects Goals to live Premium Contracts. The real editor was addressed in #94 instead. A clean source test or an obsolete route does **not** prove customer behavior.
- **What these tests establish:** Chromium Android touch/geometry/action tests, canonical browser persistence, CI candidate builds and an Android16 emulator install/launch for specified PR heads. They **do not** prove visual approval on Galaxy, physical one-finger scroll, real soft-keyboard/system insets, lock-screen notifications, or live same-account Windows↔Galaxy Supabase sync. The signed public Android Direct v0.2.5 remains older than current source `main`.
- **Remaining design gate:** complete pending Weekly Review populated-row visual/touch checks and full Settings category sweep; examine rendered screenshots and physical Galaxy after a validated signed release, then reconcile issue #54. Do not mark full design parity done prematurely. Separate issue #53 alarm delivery and #28 cross-device sync remain open.

## 2026-10-11 — Android-native Focus/Pomodoro lock-screen notification candidate

- **Why:** Focus v0.2.5 showed in-app/Pomodoro sessions but the WebView timer cannot reliably play a sound or deliver an Android notification while suspended/locked. Issue #53 specifically requires OS-owned delivery; continuing the Android work without a native receiver would leave an important missing function.
- **Scope:** `android/app/src/main/java/com/michelslab/michelslife/NativeFocusAlarm.kt` introduces a **delivery-only** AlarmManager RTC_WAKEUP single pending Focus alarm, non-exported `FocusAlarmReceiver`, notification channel, stale-token guard and notification tap back into MainActivity. The existing canonical `FocusStoryV30162` remains the single timer/session/XP owner; native SharedPreferences stores only pending local alarm token/deadline/mode, never user progress or a second clock. Pause/reset/skip and phase changes cancel/reprogram native alarm through AndroidBridge, with no duplicate notifications.
- **Permissions/precision:** API 33+ POST_NOTIFICATIONS is requested only from explicit Start/Resume gestures. Denial is shown as unavailable; native notification presentation requires permission. Uses `AlarmManager.setAndAllowWhileIdle` to avoid restricted exact-alarm privileges; **delivery may be delayed by Doze/battery optimization** and is NOT guaranteed to fire at the exact second. No location, network service, background activity or new secret required.
- **Native bridge contract:** `MichelsLifeAndroid.syncFocusAlarm(JSON.stringify({status,mode,deadlineAt}))` mirrors the current JS authoritative deadline, with dedupe on the state-transition key; `requestFocusNotificationPermission()` uses the platform dialog, `focusNotificationStatus()` reports permission and inexact status. Updated Android Focus screen note reflects permission and battery behavior. Existing desktop frontend, Themes and Windows files remain unchanged.
- **Regressions:** Android 412×915 Playwright bridge mock checks permission request, native schedule on Start, cancellation on Pause, and re-arm when resuming from persistent mini timer; same-run Android Gradle APK compile/native Android 16 install and UI smoke are required before merge. Browser mocks **do not** prove that an OS alarm fires in the background.
- **Limitations:** Real Galaxy locked-screen, Doze, alarm-delivery delay, notification denied/granted and user-initiated upgrade tests remain outstanding. General custom/repeating reminders, snooze, reboot recovery, simultaneous reminders, Windows OS notifications, cross-device sync conflict ownership remain separate issue #53 requirements; do not close the issue. No production version/release bump.
- **VERIFIED integration:** [PR #67](https://github.com/michels-lab/michel-s-life/pull/67) merged as `173b2e6fd2b5a91e3829b2d3204e111100fc7cf2`. Exact PR head `c78b7b9697a0136cd7fc2da0110c032d3b2431e5` passed all four Actions: [Source validation #38184050141](https://github.com/michels-lab/michel-s-life/actions/runs/38184050141), [UI smoke #38184050092](https://github.com/michels-lab/michel-s-life/actions/runs/38184050092), [Android UI smoke #38184050083](https://github.com/michels-lab/michel-s-life/actions/runs/38184050083), and [Android build + installed/launch Android 16 #38184050081](https://github.com/michels-lab/michel-s-life/actions/runs/38184050081). **Native OS notification fire in locked/Doze physical Galaxy is NOT tested**; browser mock checks only the bridge contract. Issue #53 remains OPEN. Public signed Android customer build has NOT been updated; no release/version/signing change.

## 2026-10-11 — Galaxy one-finger vertical scroll fails; Android time panel visibly clipped (candidate)

- **Evidence:** physical Samsung screenshot of Michel's Life Dashboard at 03:55pm shows a visually oversized single-time status panel just under Android navigation. Owner reports vertical document scrolling requires two fingers instead of the normal one-finger drag, making the app inconvenient to use. This is a **real-device P0 input usability report**; do not confuse it with previously passing programmatic `window.scrollTo` tests.
- **Source-level diagnosis:** Android `android/android-bridge.js` was forcing the shared desktop `#v176StatusPanel` to `max-height:64px` plus `overflow:hidden`, hiding all but one desktop status card, and it provided no date/context to the remaining clock. Android CSS also did not explicitly guarantee vertical touch panning across the app, layout and dashboard tiles, while the prior CI scroll gate used JavaScript rather than real touch input.
- **Candidate remediation:** preserve canonical shared frontend time updater and desktop styling. Complete the Android-only card with a localized date, impose a bounded readable mobile clock and non-clipped status tile, and explicitly make body/layout/Today card surfaces support one-finger `touch-action:pan-y`. Horizontal-specific Settings pickers remain `pan-x`; native JS horizontal swipe navigation remains available.
- **Regression added:** Android 412×915 Playwright smoke dispatches a genuine **single-pointer** Chrome touchStart/move/end gesture on a noninteractive dashboard KPI; it must move `document.scrollingElement.scrollTop` by more than 55 CSS px. The time panel must contain a visible in-bounds date row and remain under 90 CSS px.
- **Confirmed root causes / final fix:** CI touch tracing identified a transparent desktop `.v176-card` still covering KPI hit points after responsive CSS; runtime display/visibility/pointer ownership now hides its absolute-positioned legacy tiles. Dashboard `.v131-hero` kept `overflow:hidden` which formed an inner non-scrollable touch surface, replaced with `overflow:clip`. Most decisively, Android BODY had `overflow-y:auto` and `overscroll-behavior-y:contain` while HTML was the actual document scroll owner: changing BODY to visible overflow/automatic scroll chaining restored genuine single-finger `pan-y`. An independent compact clock row reuses live time data and renders full localized date inside the card.
- **Implementation integrated:** [PR #64](https://github.com/michels-lab/michel-s-life/pull/64) merged as `0cd9631a706250adc70a5da0a43b907433e14368`; Android-only bridge, exact one-finger gesture browser smoke and Android audit log changed. **PR head** `1bea50c6c4f7bd7fbee9a9c5a23faf169a75d4d5` Android UI action [38179371884](https://github.com/michels-lab/michel-s-life/actions/runs/38179371884) **SUCCESS**, including actual Chrome one-pointer touch scroll and complete compact time/date tile; Source validation [38179371856](https://github.com/michels-lab/michel-s-life/actions/runs/38179371856) **SUCCESS**; Android APK **Gradle build job** green within [38179371862](https://github.com/michels-lab/michel-s-life/actions/runs/38179371862).
- **Still pending at merge:** same-run installed Android 16 emulator acceptance job and desktop/global UI-smoke final results; no physical Galaxy thumb-drag/soft keyboard/visual confirmation; no signed customer APK containing this fix, no new public release/version or Windows Theme/Chapter changes. Do not present code merge as an on-phone fix until an actual updated APK is delivered and Samsung retested.

## 2026-10-11 — Android-only Focus/Pomodoro first-class workspace and mobile interaction polish (candidate)

- **User request:** Pomodoro/Focus must be reachable immediately without opening Settings; Android should feel like a purpose-built polished native mobile productivity app, not stacked desktop cards. Windows approved visuals/theme/assets are out of scope.
- **Platform implementation:** `android/mobile-experience.js` is Android-only. Focus keeps its permanently accessible dedicated bottom-nav destination, becomes a **full-height mobile workspace** with an accessible radial remaining-session indicator, 25/5 + 50/10 presets, persistent canonical Start/Pause/Resume/Reset/Skip actions, custom duration, mission and daily session status. Today gains a compact Focus shortcut before the metric grid.
- **Persistent control:** running/paused timer appears as a compact bar **above bottom navigation** in other screens, showing remaining time, work/break state, one-tap Open and Pause/Resume. Hides behind Focus, onboarding, Quick Capture, mission editor and keyboard entry; increases scroll bottom padding while visible. All timer mutations delegate to existing `FocusStoryV30162`, not a parallel Android timer or cloud record.
- **Visual hierarchy:** Android bottom-nav and center Focus affordance, compact header, Today Focus CTA/metric surfaces and screen-length Focus workspace use existing theme color variables. No changes to Windows frontend, logo assets, Chapters, backgrounds, typography engine or canonical domain objects.
- **CI additions:** `tools/ui_android_mobile_smoke.mjs` now asserts Today Focus action is before metrics, full-height Focus fits 412×915, radial dial and touch targets, persistent bar doesn't overlap navigation, Pause/Resume works against the shared timer after Back, and mini timer remains on Missions. Preserves existing navigation/sync/Quick Capture tests.
- **VERIFIED integrated 2026-10-11:** [PR #65](https://github.com/michels-lab/michel-s-life/pull/65) merged to `main` as `6ce533e68362081fbdde0c708ab0cd257df0864c` after **four independent green same-head pipelines** on `017509de58bcc8a4751eb9ab7ed67ad40cff0107`: [Android UI smoke #38181177105](https://github.com/michels-lab/michel-s-life/actions/runs/38181177105) (Today entry, full-height Focus, minimum tap geometry, actual canonical Pause/Resume, mini timer above nav across Missions, original Missions/Quick Capture/onboarding regression); [Source validation #38181177132](https://github.com/michels-lab/michel-s-life/actions/runs/38181177132); [shared/UI smoke #38181177092](https://github.com/michels-lab/michel-s-life/actions/runs/38181177092); [Android build + real candidate installed/launch Android 16 #38181177078](https://github.com/michels-lab/michel-s-life/actions/runs/38181177078). Early CI failures exposed 46px inherited buttons and checkbox-triggered keyboard class; both corrected before final green runs, not waived. **Still unverified:** physical Galaxy visual, soft-keyboard obstruction, true background/lockscreen native alarms and cross-device provider sync. Native OS alarm scheduler is NOT implemented. No customer release/new version or Windows product code changed.

## 2026-10-11 — Signed Direct v0.2.5 (code 7) published with Windows 3.0.217

- **Released:** https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.217; both platform installers in the same non-draft public release. Exact source intent `05ccaa52c2899ba969d2d0ad396669d2552b0f2f`.
- **UX:** PR #63 rebased the full touch-first Missions editor to current Android presentation. Name, description and actual canonical persistence passed Android Playwright smoke. Original test falsely toggled off a preselected Saturday; corrected test checked existing weekday state before manipulating it. No Themes/Chapter/Desktop visual redesign.
- **Signing:** permanent Android Direct certificate fingerprint `36a9f5144243d14ebade9d38559cfd7d4d9207c1edba01e6f0fbdd5f076a50fa`, `com.michelslab.michelslife`, versionName 0.2.5/versionCode 7. APK exact SHA-256 `40db54f86058367235107c2ccadbc0555c1b8d9f864ae931f9db61e348c13613`.
- **Verification:** source run [38175360615](https://github.com/michels-lab/michel-s-life/actions/runs/38175360615): green signed binary build and real Android 16 install/relaunch screenshots, Windows Setup install/launch, same-SHA Source/UI/Android UI checks. Destination-owned [run 38176304417](https://github.com/michels-lab/michel-s-life-releases/actions/runs/38176304417) verified checksum and signer again, then published.
- **Caveats:** in-place upgrade should preserve data for v0.2.4 permanent Direct signer, but physical Galaxy data-retention remains unverified. Old debug-signed TEST v0.2.2 cannot upgrade in place; back up before removal. Real cloud account conflicts, mobile keyboard and native background alarms remain separate.

## 2026-10-11 — VERIFIED public unified release: Windows v3.0.216 + Android Direct v0.2.4 (code 6)

- **Published:** existing single public GitHub release `michels-lab/michel-s-life-releases` tag `v3.0.216`, now titled Windows v3.0.216 + Android v0.2.4. All real Windows EXE/AppBundle/icon and SHA256 assets preserved. Old superseded Android v0.2.3 assets removed.
- **Source provenance:** exact signed staging commit `c495f0c0a04a5ab818d7b405128ae1f8561788b9`; stage workflow run `38131405194` **success** (production-signed Direct APK build, same-run native Android 16 install/relaunch/screenshots, same-SHA Source validation / Android UI smoke / UI smoke and independent pinned certificate/package/manifest/hash check).
- **Private-source transfer:** internal prerelease `michelslife-android-direct-transfer-v0.2.4`, Android APK `MichelsLife-Android-Direct-v0.2.4.apk` (67,975,752 bytes) plus SHA256 and manifest; owner permanent Direct signer certificate SHA256 `36a9f5144243d14ebade9d38559cfd7d4d9207c1edba01e6f0fbdd5f076a50fa`. No debug or key rotation.
- **Public publisher verification:** destination workflow run `38131955914` returned **success** after verifying actual APK signer via `apksigner`, Android package, versionCode 6/versionName 0.2.4, binary checksum and source transfer consistency, then checking full public Windows and Android asset set.
- **Independent customer verification:** destination `verify-life-unified-release.yml` run `38132011508` returned **success**, downloading the exact public Android APK and checking its SHA256, manifest identity, permanent signing cert and Windows asset preservation. Updated release README also reflects v0.2.4.
- **Included Android-first features:** mobile navigation, 2x2 Dashboard, Settings category scroll/Sync+Google access, shared Focus timer sheet, mission/Journal Quick Capture and Android-specific Missions/Calendar/Journal layout adaptations. Desktop visual/themes/assets not modified as part of the Android release; Windows binaries remain v3.0.216.
- **Unverified, still pending:** actual Samsung Galaxy rendered visual/IME/gesture/onboarding review, in-place v0.2.3 → v0.2.4 data retention on device, real Supabase/Google Windows↔Galaxy same-account sync/conflicts and native lockscreen alarm/notification scheduler. Do not infer these from CI mocks or emulator screenshots. Existing direct v0.2.3 same-signature plus versionCode increment permits expected in-place update; older debug v0.2.2 may require backup then clean install.

## 2026-10-11 — v0.2.4 signed staging blocked by emulator relaunch / stale manifest gate (in repair)

- **Source release-intent `a241dac6e42274dfe59685a61227c2af66280f08`:** Source validation, UI smoke, Android UI smoke all returned **success**, and signed build step produced the v0.2.4/code 6 Direct artifact with configured permanent certificate.
- **Native-gate failure:** run `38127996025` failed after successfully building APK, launching candidate Android 16 and capturing initial onboarding, because the hosted emulator's ADB transport lost its process/port at relaunch. Required post-relaunch images were not available. This is a CI device disconnection, **not proof of successful native restart**. Failed native job was rerun without disabling screenshots/persistence gates; await its actual result.
- **Independently found release defect:** `.github/workflows/stage-life-android-direct-v024.yml` still required JSON `.versionName == "0.2.3"` while actual v0.2.4 Gradle versionCode is 6. Even with green device CI that stale gate would reject the *correct* signed artifact. Updated staged manifest identity to `0.2.4 / code 6`, preserving cert, checksum, source-provenance and all CI gates.
- **Permanent regression prevention:** `android/tools/validate_android_version.py` now checks the signed staging manifest's versionName and versionCode against Gradle and fails if either drifts. No credentials or signing keys changed; no loosening CI.
- **Public release at the time of diagnosis:** still Windows v3.0.216 + Android Direct v0.2.3. **PENDING:** current PR validation and merge, exact-source signed v0.2.4 staging, public unified publish and independent verification; physical Galaxy UX and real Windows↔Galaxy sync remain unverified.

## 2026-10-11 — Android v0.2.4 (code 6) mobile sections + permanent-identity update candidate

- **Request:** Ship already merged Android-specific navigation, touch-first Focus/Pomodoro, Quick Capture (PRs #51, #52, #57) and cloud data/credential boundary (PR #56), then continue designing Missions, Calendar and Journal for actual phones. No desktop visual/theme changes.
- **Implementing in source:** `android/mobile-sections.js` is an Android-only responsive presentation over canonical mission/calendar/journal DOM and business logic. Missions use readable two-column touch targets; Calendar owns a seven-day compact portrait grid with selected-day details still intact; Journal uses a one-column writing area and keyboard-size inputs; no duplicated state or source HTML/Windows asset changes.
- **Version update:** `versionName=0.2.4`, **versionCode=6** (greater than public 0.2.3/code 5); `applicationId=com.michelslab.michelslife` unchanged; stable owner's direct-signing identity **must** stay pinned to cert SHA-256 `36a9f5144243d14ebade9d38559cfd7d4d9207c1edba01e6f0fbdd5f076a50fa`. Never rotate credentials or issue an Android Debug public APK.
- **Binaries/publication:** source `stage-life-android-direct-v024.yml` stages only after exact-SHA CI and signed APK provenance; separate releases repo `publish-life-unified-android-v024.yml` can update the **same public release** Windows v3.0.216 + latest Android, removing superseded v0.2.3 Android assets but keeping all Windows assets. No public release from source PR.
- **Tests added:** phone viewport geometry and click/scroll for Missions/Calendar/Journal plus existing Settings/Dashboard/Focus/Quick Capture, native Android 16 same-candidate install, Windows CI, public signed APK installation; jobs must pass current SHA. CI is *not* a substitute for Galaxy screenshot, soft keyboard, actual Windows↔Galaxy Supabase tests or real native background notification scheduling.
- **PENDING:** CI results, PR merge, one-shot v024 release intent, signed source transfer, destination publication/post-release independent verifier, device testing. Native alarm scheduling issue #53 and broader mobile parity issue #54 remain open.

## 2026-10-11 — Missions PR #58: QA blocker after functional Save tap

- **Code branch:** `feat/android-missions-touch-editor-20261011` / [PR #58](https://github.com/michels-lab/michel-s-life/pull/58), not merged/released.
- **Actual rendered evidence:** Android UI smoke run `38124200945`, commit `1abc176cb11fbb84d3ace8a91b73d734b46da8d9`, exercised the v13.3 `data-action="v133-edit"` mission editor. Android-only modal geometry was corrected: 412px viewport, 16px input, two-column 46px weekday chips and independent scrolling; the next blocker was the bottom navigation intercepting Save. Fixed by explicit modal foreground ownership and restoring bottom nav on close. **That regression is now past the hit-test and real click stage.**
- **Remaining blocker:** on the same CI run, after clicking the real `#missionEditForm` Save button, the synthetic mission state did **not** match the combined expected name + description + added Saturday (`page.waitForFunction` timeout at `tools/ui_android_mobile_smoke.mjs:334`). The test must report which persisted field differs and whether the modal closed/which mission ID was actually edited. Multiple historical mission submit handlers exist; inspect their interaction rather than weakening parity assertions.
- **Required next action:** instrument the smoke after Save with **synthetic-only**, redacted diagnostic of the edited mission ID, persisted name, description, checked day IDs and modal state. Confirm live UI state and the canonical `saveMissionEdit` submit path; correct the actual issue. Re-run same-commit Android UI, Source, Windows UI, APK build and Android 16 install. No bypass or CI green claim.
- **Public APK and desktop remain unchanged:** Windows v3.0.216 + Android Direct v0.2.3. Real Galaxy keyboard/scroll/state QA remains pending even after passing automated tests.

## 2026-10-11 — Missions: full-fidelity Android touch editing (source candidate)

- **Product requirement:** Android missions must offer the same real edit fields as Windows while designing the workflow for mobile: name, category, type, difficulty, priority, deadline, description, notes, 7 recurring weekdays, and boss/fixed/hidden/archived/no-suggest flags. No second Android-only mission store is acceptable.
- **Implementation candidate:** `android/mobile-experience.js` owns Android-only >=44px Today mission checkbox/edit/actions; `#missionEditForm` presents a bounded bottom sheet with an independently scrollable body, two-column compact controls, >=16px text/48px inputs, reachable weekday toggles and a sticky Save/Cancel footer. Native `adjustResize` is already in main; the existing shared desktop `saveMissionEdit` remains authoritative for persistence/reward logic.
- **Regression test candidate:** `tools/ui_android_mobile_smoke.mjs` taps the real mission Edit action; measures editor bounds/fields/weekdays and scrollability on 412×915; edits name/description, toggles Saturday, scrolls to Save, clicks, and verifies the saved canonical mission including recurrence. Requires >=44px touch targets; this is **real functional UI testing**, not presence-only validation.
- **Windows protection:** no changes to canonical desktop frontend CSS, themes, visuals or mission domain logic. Same-SHA Source, Windows UI, Android UI, native Gradle APK and Android 16 install tests required.
- **State:** PR candidate only; CI and physical Galaxy keyboard/editor review still pending. The latest signed public APK is still Android v0.2.3 within Windows v3.0.216 release; this change is not yet published.

## 2026-10-11 — Android Quick Capture: touch-first mission and Journal sheet

- **Task:** Continue Android-native-feeling UX across every major section, without duplicating Desktop data engines or changing accepted themes, assets, desktop layout.
- **Implementation candidate:** `android/mobile-experience.js` now places one minimum-42px **+ Quick Capture** action inside the Android fixed topbar, visible from Today, Missions, Focus (after closing the Focus overlay), Calendar and Settings. Clicking it calls the canonical shared `MLV216QuickCapture.open()` rather than owning a second mission/journal store.
- **Mobile presentation:** Android-only style gives the shared Quick Capture modal a screen-bottom sheet respecting `100dvh`, status/navigation safe areas, keyboard resize, minimum-16px text input, >=44px touch controls and scrollable card with sticky Save/Cancel. Shared Windows Quick Capture remains unchanged.
- **Native Back behavior:** Android back handler closes visible Quick Capture before browser history/other modal handling; never silently leaves the app with a draft open.
- **New rendered regression:** on 412×915 touch browser, assert header button and title do not overlap, sheet is wholly reachable, input is minimum 16px/45px, Back dismisses, a real mission is saved in canonical state and a real Journal note is read back via canonical Journal API. Android UI, source, build/emulator, Windows smoke required on **current commit**; results pending.
- **Related work:** navigation/Focus Android PR #52 merged and green; cloud credential boundary PR #56 merged and green, with real-PC+Galaxy provider verification still tracked issue #28. Complete first-class redesign for other app sections is ongoing issue #54, scheduled alarms/notifications issue #53.
- **Public binary:** still Windows v3.0.216 + Android v0.2.3; no new APK/release published from this PR; no real Galaxy screenshot/keyboard validation claimed.

## 2026-10-11 — Android-owned mobile navigation + shared Focus timer; section-parity audit

- **User direction:** Michel's Life must be independently usable as a first-class phone app, not simply desktop panels fitted into a WebView; desktop/Android must preserve feature and account-state parity while allowing distinct UI. Pomodoro and alarms must respect their OS/runtime semantics.
- **Implemented, PR candidate (not published):** `android/mobile-experience.js` introduces phone-only bottom navigation (Today, Missions, Focus, Calendar, Settings), keeps every other existing destination available in the hamburger drawer, and adds a dedicated touch-first Focus sheet. The sheet invokes the **existing** `FocusStoryV30162` business timer for start/pause/reset/skip, preset delegation, state persistence, mission association and recent completed-session count. No duplicate timer store, new auth, or new cloud writer.
- **Packaging:** `android/tools/prepare_bundle.py` includes the mobile module in the APK's asset bundle without modifying the approved Windows frontend HTML/visuals.
- **Validation added / PENDING actual CI result:** `tools/ui_android_mobile_smoke.mjs` checks bottom navigation bounds/touch destinations; opens Focus; starts/pauses the **shared** timer, checks saved canonical state; verifies Android Back closes the overlay; navigates via Missions and captures a rendered screenshot. Must run latest-SHA Android UI/Gradle + Windows shared-source regression before integration.
- **Contract:** `docs/ANDROID_PLATFORM_PARITY.md` enumerates desktop/Android functional parity and measurable per-section gates. Account cloud sync remains an existing *implementation* and mocked CI; it is not yet verified on real Windows+Galaxy (issue #28).
- **Native alert gap, pending:** Android Manifest and native AndroidBridge do **not** contain a scheduled alarm receiver/service or notification permission; in-WebView Focus sounds are **not** reliable system alarms in background/lock screen. Do not claim notifications/alarms working or change Play policy until implemented and device-tested.
- **Current public release stays Windows v3.0.216 + Android v0.2.3.** No signing/release/version changes requested in this development cycle; user must get a separately validated future signed APK for these source changes.
- **Physical Galaxy validation required:** touch gesture coexistence, bottom safe area, soft keyboard, theme persistence, actual foreground/background/resume Focus, and Windows↔Android Supabase account sync. Record successes/failures here with dated evidence, not in optimistic issue labels.

## 2026-10-11 — Android real-device report: oversized Dashboard KPIs and inaccessible Settings

- **Evidence:** owner supplied four screenshots from a real Samsung Galaxy running publicly signed Android v0.2.3. The Today summary stacked four very tall KPI cards vertically and pushed actual missions below the first viewport; Settings displayed a full-length desktop-category column, with Sync/Google pane content hidden below the device navigation and no usable vertical scroll. The Android drawer/nav also reaches the bottom gesture area. This is a **confirmed DEVICE visual regression** in the published v0.2.3, notwithstanding the earlier browser and Android emulator test passes.
- **Root causes (source):** Android CSS only assigned `gap`/padding to `.v131-kpis`, letting the shared desktop `@media(max-width:760px)` force **one column**; the desktop Settings authority installed a vertical `.v30171-settings-nav` and two-column desktop shell whose long vertical list displaced the content. Desktop overflow/height assumptions were not normalized for the mobile WebView, and tests checked menu presence rather than scrollability/density.
- **In progress (Android-only):** own phone document flow/scroll and bottom inset in `android/android-bridge.js`; two-column compact metric grid preserving all four indicators; retain missions and Premium controls without tall panel minimum heights; convert Settings category picker to short horizontal tabs, bringing Sync/Google to the start while keeping the unchanged desktop DOM order and section functions; reduce the menu's bottom obstruction and avoid horizontal-vs-vertical gesture conflicts.
- **Regression coverage added:** assert real DOM geometry of the four dashboard KPIs (2×2, under 245px in test viewport), Settings short horizontal tabs and visible Sync/Google, actual `document.scrollingElement` movement to page bottom and selected pane accessibility. Retain fresh onboarding, theme persistence, nav gestures and wide Android smoke.
- **Status:** **SOURCE CANDIDATE / PENDING CI / PENDING DEVICE RECHECK**. No signed APK v0.2.4 or customer release exists as a result of this work yet; Windows sources/approved theme assets not modified. Do not claim visual success until screenshot/phone verification.

## 2026-10-10 — Direct signing activated; CI PKIX false failure corrected (candidate)

- Owner's Windows signing setup confirmed **8 Actions secrets** and public `ANDROID_DIRECT_CERT_SHA256` variable provisioned; Direct JKS has independent, stable signer identity. Never store credentials in project files.
- GitHub signed-candidate run `38115236941`, commit `4dd3b04d0f384b07d94d67611e0b8b8cd2ee8887`: **Direct v0.2.3 APK build and signature verification succeeded**, package `com.michelslab.michelslife`, versionCode 5, signer matched pinned Direct certificate; its SHA-256 verified in CI. Not publicly released.
- This same run's optional Play upload **AAB validation failed** when `jarsigner -verify -strict` treated the expected owner's self-signed Play **upload** certificate as an untrusted PKIX chain. The AAB was signed, but `-strict` enforces CA trust that a Play upload certificate is not required to possess. No signing keys are changed by the fix.
- Fix preserves `jarsigner -verify` cryptographic signature validation **and** pins actual upload certificate SHA-256 to the owner's verified Play JKS (nonsecret fingerprint). Wrong signer or tampered artifact must still fail CI.
- Release gate now requires `Source validation`, `UI smoke`, and `Android UI smoke` to succeed on the **exact release-intent commit**, rather than accepting previous source parent's results. Release intent push triggers all three.
- Parent commit `504866eb7164543a7e4fb0c02e5c61de0550abdb` reported an intermittent failure in the cross-device mock smoke `Android dirty save did not advance master exactly once`; it requires rerun/diagnosis and MUST NOT be called successful until actual current candidate CI is green.
- **PENDING:** PR CI, integration, fresh signed Android run, internal transfer provenance checks, destination unified release and post-publish independent public verification. Physical-device Windows↔Android Supabase QA remains outstanding.

## 2026-10-10 — Validate existing Play keystore and prepare Direct signing activation

- **VALIDATED locally (not in GitHub Actions):** owner's 2026-10-05 Google Play **upload** JKS matches the existing Base64 copy in the private credentials file; `keytool` confirmed a `PrivateKeyEntry` with its recorded alias/password. The PEM certificate fingerprint matches the keystore certificate; SHA-256 sidecars also match. No private key, passwords, keystore Base64 or original credential file were committed.
- **BLOCKED (repository admin operation):** Actions showed only `GOOGLE_CLIENT_SECRET` and `RELEASES_REPO_TOKEN`, not the required eight Android signing secret names. The connected GitHub application has no secrets-write operation. Signing credentials must be uploaded from the owner's local machine via GitHub CLI or repository Settings.
- **IMPLEMENTED, pending CI:** Direct staging now reads public `vars.ANDROID_DIRECT_CERT_SHA256` instead of a stale literal fingerprint from a different prospective key. Direct build already used the repository variable; both gates must now agree on the **same owner-pinned Direct certificate**. Secrets remain mandatory; missing signer fails closed.
- **DOCUMENTED:** `docs/ANDROID_SIGNING_OPERATOR.md` describes distinct Google Play upload and Android Direct signing, local custody/offline backup, debug-v0.2.2 upgrade incompatibility, and unified release safety.
- **PENDING:** owner to configure `ANDROID_UPLOAD_*` and distinct `ANDROID_DIRECT_*` repository secrets + Direct SHA variable; then execute same-source signed APK, provenance, emulator smoke and unified-publication checks. Supabase real Windows↔Android account/device tests remain a separate gate. No release was published and no signing key was rotated in this repository.

## 2026-10-06 — Canonical Michel's Life Android identity (implementation)

- Replaced the active legacy JPEG launcher reference with `@mipmap/ic_launcher` / `@mipmap/ic_launcher_round`.
- Added a flat Android vector derivative of the approved Michel's Life mountain/path/star geometry plus Android 8+ adaptive-icon resources.
- Added Android 12+ branded splash configuration using the same canonical foreground geometry and the Michel's Life navy base.
- Android packaging now injects the same canonical product/About assets as Desktop.
- Cross-platform identity validation is part of the Android build contract.
- **State:** IN PROGRESS — source implementation complete; Android CI/UI smoke must pass before this entry advances to VALIDATED. Physical-device branding review remains a separate device gate.

## 2026-10-06 — Shared Supabase authentication UX

- Android uses the same Michel's Life Supabase account surface as Desktop.
- Email + password is the required default login experience.
- Email OTP/code is available only as an explicit fallback for existing accounts and must never replace Password as the default after restart/reload.
- OTP requests do not auto-create accounts; account creation stays in the password flow.
- Android inherits the shared frontend smoke contract for this behavior.

# Michel's Life Android — Development Audit Log

> Permanent Android-specific record of what has been done, what is pending, what was validated, and what still needs verification.
>
> This log is separate from the repository-wide `GIT_AUDIT_LOG.md`. Every meaningful Android change must update this file in the same development cycle.

## Status convention

- **DONE** — implemented and committed.
- **VALIDATED** — tested with concrete evidence.
- **IN PROGRESS** — implementation has started but is not complete.
- **PENDING** — requested/required but not yet implemented.
- **NEEDS DEVICE TEST** — code exists, but behavior still needs verification on a real Android device.
- **BLOCKED** — cannot be completed until an external prerequisite is available.

## Current snapshot — 2026-10-03

### Open gates — source of truth

1. **VALIDATED** — dedicated Android phone-viewport smoke is green at 412×915 against the real v3.0.215 AppBundle.
2. **NEEDS DEVICE TEST** — install Android v0.2.0 on a physical phone and approve the actual feel/geometry of the top bar, compact status strip, checklists, drawer, swipes, Back behavior, animation continuity, background/resume, and process restart.
3. **NEEDS DEVICE TEST** — real Google authorization and bidirectional Windows ↔ Android Drive synchronization, including conflict and restore flows.
4. **PARTIALLY UNBLOCKED** — permanent upload keystore exists and a signed v0.2.0 AAB verifies locally; CI signing still requires the four GitHub Actions signing secrets.
5. **PENDING PLAY CONSOLE** — create/configure the Play app, enroll in Play App Signing, register Play signing SHA fingerprint(s) with Google Cloud OAuth, complete privacy/Data safety/content rating/target audience/app access/store listing, upload internal test, and complete any account-specific closed-testing requirement.
6. **PENDING PUBLICATION** — finalize and publish the privacy policy at a stable public URL and link it both in Play Console and in-app.

Everything else listed as validated below is already source/build validated and must not be reopened without new evidence.

### Product state

- **DONE** — Native Android host exists under `android/`.
- **DONE** — Android packages the current Michel's Life web AppBundle in a native WebView instead of maintaining a separate product implementation.
- **DONE** — Android JavaScript compatibility bridge exposes the desktop-style WebView message contract.
- **DONE** — Google Drive app-data sync primitives were ported to Android.
- **DONE** — Android local restore points and cloud history plumbing exist.
- **DONE** — Android build was stabilized on API / target SDK 36.
- **VALIDATED** — Android mobile UX build run `37110037392` completed successfully against the current v3.0.215 AppBundle, including debug APK, Play AAB build/validation, signing diagnostics, and artifact upload.
- **DONE** — APK signing-certificate fingerprints were extracted for Android OAuth setup.
- **DONE** — Play Store AAB generation was added to CI.
- **DONE** — Release signing configuration can be supplied through environment variables without committing secrets.
- **DONE** — Temporary one-off Android/Play publishing workflows were removed after use.
- **VALIDATED** — Android-only mobile UX redesign is source/build validated and passed the dedicated 412×915 phone-viewport smoke; physical-device approval remains.
- **PENDING** — Produce and validate a properly signed production AAB for Google Play.
- **PENDING** — Finish Play Console publishing requirements and internal testing.
- **NEEDS DEVICE TEST** — Verify real Google authorization + Drive synchronization end-to-end on Android.
- **NEEDS DEVICE TEST** — Verify Android navigation, responsive layout, back behavior, state persistence, and animation behavior after the mobile UX work.

## Requested Android-only UX work

These changes apply to the Android app only. They must not alter the approved desktop/Windows layout.

### Layout and primary screen

- **DONE** — Added Android-only mission/checklist row alignment with fixed touch-sized check controls and a stable two-column mobile grid. **NEEDS DEVICE TEST** for visual confirmation.
- **DONE** — Added Android-only compact dashboard spacing, single-column mobile dashboard flow, reduced card gaps, and a fixed compact top bar. **NEEDS DEVICE TEST** for the exact initial viewport.
- **DONE** — Added Android-only mobile widths, wrapping, touch targets, action wrapping, card sizing, and safe overflow rules. **NEEDS DEVICE TEST**.
- **DONE** — Mobile UX is injected only by `android/android-bridge.js`; the approved desktop/Windows frontend source is untouched. **NEEDS DEVICE TEST** for final polish.

### Navigation

- **DONE** — The desktop sidebar becomes an off-canvas Android drawer below a fixed compact top bar on phone widths. **NEEDS DEVICE TEST**.
- **DONE** — Added hamburger-triggered drawer, backdrop close, navigation close, and edge-swipe open/close behavior. **NEEDS DEVICE TEST**.
- **DONE** — Added guarded left/right swipe navigation across major app areas, ignoring interactive controls and horizontal scrollers. **NEEDS DEVICE TEST**.
- **IN PROGRESS** — Android now uses a compact icon-first top-bar entry point while reusing the existing sidebar destinations inside the drawer. Further label/icon trimming remains a device-polish task.
- **DONE** — Added current-section title in the Android top bar and kept all primary destinations reachable from the drawer. **NEEDS DEVICE TEST**.

### Android update behavior

- **VALIDATED** — Android update status now distinguishes direct/test installs from Google Play installs and reports Google Play as the production update manager.
- **VALIDATED** — Production update behavior is Play-managed, while sideloaded test builds explicitly identify themselves as test builds.

## Sync / Google account

### Implemented

- **DONE** — Google Identity authorization coordinator exists.
- **DONE** — Drive `appDataFolder` scope is used.
- **DONE** — Master state file contract: `michels_life_cloud_state.json`.
- **DONE** — Cloud backup/history prefix: `michels_life_backup_`.
- **DONE** — Device record prefix: `michels_life_device_`.
- **DONE** — SHA-256 state tracking and the Michel's Life conflict window are represented in Android.
- **DONE** — Android exposes cloud status/connect/disconnect/sync/overview/restore bridge actions.
- **DONE** — Local restore points are kept on-device and pruned.

### Still to verify

- **NEEDS DEVICE TEST** — Confirm Android OAuth client is correctly configured in the Michel's Life Google Cloud project for the production/test signing certificate in use.
- **NEEDS DEVICE TEST** — Connect a real Google account from the Android app and confirm authorization survives normal app reopen/resume flows.
- **NEEDS DEVICE TEST** — Modify state on Windows, sync, open Android, and verify the same state is restored correctly.
- **NEEDS DEVICE TEST** — Modify state on Android, sync, open Windows, and verify bidirectional state integrity.
- **NEEDS DEVICE TEST** — Exercise a real conflict and confirm Android follows the same conflict decision semantics as Windows.
- **NEEDS DEVICE TEST** — Verify cloud backup restore and local restore-point recovery on a physical device.

## Build and Google Play

### Completed build work

#### 2026-10-01 — Android client created
Commit: `7cba3cd` — **Add Michel's Life Android sync client**

- Added native Android application structure.
- Added WebView host.
- Added Android bridge.
- Added Google authorization coordinator.
- Added Drive sync engine and metadata handling.
- Added restore-point support.
- Added the Android build workflow.
- Added Android documentation.
- Added cloud-contract validation tooling.

#### 2026-10-01 — Build stabilization
Commits include:
- `ccc9f6c9` — Fix Android SDK setup for APK build.
- `adf18088` / `161938b9` — Use AGP built-in Kotlin for Android.
- `dd6bfa33` — Fix Android Gradle Kotlin DSL braces.
- `a4906e79` / `dc4f76bd` / `8ce0c2a0` — API-level build experiments.
- `790ff0e7` — Use stable Android-compatible OkHttp.
- `d223351b` — Settle the Android build on stable API 36.

Result:
- **VALIDATED** — CI reached a buildable Android test APK configuration.

#### 2026-10-01 — Signing diagnostics
Commits:
- `54103cf8` — Report Android test signing fingerprints.
- `7438b6c8` — Read Android signing certificate from built APK.
- `3463e5fe` — Document Michel's Life Android v0.1.0 prototype.

Result:
- **DONE** — Signing fingerprint information became available for Android OAuth configuration.

#### 2026-10-03 — Test APK publication
Commits:
- `f0e101e4` — Publish Android test v0.1.0 download.
- `52cd8669` — Remove temporary Android test publisher.

Result:
- **DONE** — A test Android build was published through the release flow, then the one-off publisher was cleaned up.

#### 2026-10-03 — Google Play preparation
Commit:
- `f540d5b1` — Prepare Android App Bundle for Google Play.

Implemented:
- CI builds `:app:bundleRelease`.
- Package identity: `com.michelslab.michelslife`.
- `versionCode = 1`.
- `versionName = 0.1.0`.
- `targetSdk = 36`.
- Upload signing can be injected through:
  - `ANDROID_UPLOAD_KEYSTORE_PATH`
  - `ANDROID_UPLOAD_STORE_PASSWORD`
  - `ANDROID_UPLOAD_KEY_ALIAS`
  - `ANDROID_UPLOAD_KEY_PASSWORD`
- CI can emit an unsigned AAB when production signing secrets are absent.
- SHA-256 is generated for the Play AAB artifact.

Follow-up commits:
- `091b7c03` — Publish Play preparation bundle v0.1.0.
- `2ce0c707` — Remove temporary Play prep publisher.

Result:
- **DONE** — Play-compatible AAB build path exists.
- **PENDING** — Production upload signing and Play Console submission are not yet considered complete.

### Google Play remaining work

- **PENDING** — Create/secure the permanent upload keystore if not already finalized.
- **PENDING** — Store signing values as repository/Actions secrets, never in source.
- **PENDING** — Generate a signed release AAB and verify its certificate/package/version.
- **PENDING** — Upload the build to Play Console internal testing.
- **PENDING** — Complete required store listing/app details, screenshots/assets, privacy/data disclosures, content rating, and testing requirements applicable to the account/app.
- **PENDING** — Install the Play-delivered build on a physical Android device and run the Android validation checklist.
- **VALIDATED** — versionCode/versionName bump rule is documented and enforced by `android/tools/validate_android_version.py`; Android v0.2.0 uses versionCode 2.

## Android validation checklist

Before calling an Android version release-ready:

- [ ] Launch succeeds from a clean install.
- [ ] No blank/white WebView state.
- [ ] Primary dashboard fits the phone layout without unnecessary initial scrolling.
- [ ] Checklists align correctly.
- [ ] Android navigation is compact, usable, and touch-friendly.
- [ ] Menu open/close behavior works.
- [ ] Left/right section swipe behavior works where enabled.
- [ ] Android-only CSS/behavior does not change desktop/Windows.
- [ ] App state survives background/resume.
- [ ] App state survives normal process restart.
- [ ] Back navigation behaves predictably.
- [ ] Google account connect works.
- [ ] Cloud sync Windows → Android works.
- [ ] Cloud sync Android → Windows works.
- [ ] Conflict handling works.
- [ ] Restore points work.
- [ ] Animations remain fluid while changing app sections.
- [ ] Spanish and English both render correctly.
- [ ] No desktop-only installer/update controls are exposed on Android.
- [ ] Production AAB is signed and its package/version are correct.
- [ ] Play internal-test install/update path is verified.


## 2026-10-03 — Harden Google Play signing workflow

Commit: `cbb2bff7` — **Harden Android Play signing workflow**

Requested/observed need:
- The Play build path existed, but CI did not yet turn a securely stored GitHub keystore secret into a signing file.
- The workflow also needed to distinguish signed production bundles from unsigned preparation bundles and validate the resulting package.

Implemented:
- Added support for `ANDROID_UPLOAD_KEYSTORE_BASE64` as the GitHub Actions keystore secret.
- The workflow decodes the secret only into the temporary runner filesystem.
- If a keystore is supplied, store password, key alias, and key password are mandatory; partial signing configuration fails the build instead of silently falling back.
- Signed builds are named `MichelsLife-Android-Play-SIGNED-v0.1.0.aab`.
- Unsigned preparation builds remain explicitly named `MichelsLife-Android-Play-UNSIGNED-v0.1.0.aab`.
- The AAB ZIP structure is tested.
- Signed AABs are checked with `jarsigner -verify -strict`.
- The upload certificate is exported into the build artifacts for verification.
- SHA-256 output remains generated for the AAB.

Validation state:
- **DONE** — source/workflow implementation committed.
- **PENDING** — GitHub had not yet reported a completed workflow execution for this commit at the time this entry was written.
- **PENDING** — a real signed build still requires the GitHub Actions signing secrets.
- **PENDING** — Play Console upload/internal-track verification remains required.

## Rules for this log going forward

For every meaningful Android development action, add an entry containing:

1. date and Android version/build;
2. user-visible problem or requested change;
3. root cause when known;
4. files/components changed;
5. commit(s);
6. test/validation evidence;
7. remaining follow-up;
8. final state: DONE / VALIDATED / IN PROGRESS / PENDING / NEEDS DEVICE TEST / BLOCKED.

Do not mark an item **VALIDATED** only because code exists. Validation requires a concrete build, automated test, or physical-device observation.

Do not silently remove unfinished work. When a pending item is completed, move its status forward and record the completion chronologically.


## 2026-10-03 — Android mobile UX first implementation pass

Commits:
- `123b6678` — **Add Android mobile navigation and responsive UX**
- `3592a474` — **Coordinate Android back behavior with mobile UI**
- `50f302e0` — **Add Android mobile UX contract validator**
- `d30055fa` — **Validate Android mobile UX in CI**

Requested/observed problems:
- Checklist/mission rows were visually crooked on the phone layout.
- The initial mobile screen consumed too much vertical space before the primary content.
- Desktop-style navigation occupied too much space on Android.
- Android needed a collapsible menu and natural left/right swipe navigation.
- Mobile-only changes must not alter the approved desktop/Windows layout.

Implemented:
- Added a fixed compact Android top bar with the active section title.
- Converted the existing sidebar into an off-canvas drawer only on phone widths.
- Added backdrop close, navigation close, left-edge drawer opening, and swipe-left-to-close behavior.
- Added guarded left/right swipes between major app sections.
- Swipe navigation ignores buttons, links, forms, modal controls, mission action areas, and known horizontal scrollers.
- Added Android-only responsive rules for dashboard/card spacing and width handling.
- Mission/checklist cards use a stable two-column mobile grid with a 36 px touch-sized check control.
- Mission action rows and pills wrap instead of forcing horizontal overflow.
- Android Back now first closes the drawer or visible modal before falling back to WebView history/system back.
- Added `android/tools/validate_android_mobile_ux.py`.
- Android CI now runs `node --check android/android-bridge.js` plus the mobile UX contract validator before building.
- No desktop/Windows frontend file was modified by this Android UX pass.

Validation evidence:
- **VALIDATED** — `android/android-bridge.js` passed local `node --check`.
- **VALIDATED** — the new mobile UX contract validator passed locally against a repo-equivalent test structure.
- **DONE** — all source changes were committed to `main`.
- **VALIDATED** — subsequent Android CI runs completed successfully, including mobile UX static validation, APK build, AAB build/validation, signing diagnostics, and artifact upload.
- **NEEDS DEVICE TEST** — visual layout, exact first viewport, drawer feel, swipe thresholds, checkbox alignment, animation continuity, and Back behavior on a physical Android phone.

Current state:
- **IN PROGRESS** — first Android-specific UX implementation is complete in source; CI/device validation and visual refinement are the next gate.


### 2026-10-03 — Mobile UX selector audit against current frontend

Evidence source:
- Inspected the current Michel's Life frontend blob (`index.html`, ~2.12 MB) directly from the repository rather than relying only on historical diffs.
- Confirmed current navigation is rendered in `#v30171Sidebar` / `#v30171PrimaryNav`.
- Confirmed mission rows use `.v132-mission`, `.v132-check`, and `.v132-mission-actions`.

Issue found before device delivery:
- The first Android UX pass targeted legacy `#side` for the drawer. The current frontend intentionally hides that old sidebar and creates the permanent navigation in `#v30171Sidebar`.
- The first mobile two-column mission rule also needed an explicit placement rule for `.v132-mission-actions`.

Correction:
- Commit `8121d320` — **Fix Android drawer target and compact mobile dashboard**
  - Drawer now targets the real permanent navigation: `#v30171Sidebar`.
  - Existing desktop `.topbar` is hidden on phone widths to avoid a duplicate header.
  - The fixed status strip becomes a compact horizontal mobile strip; the large stage visual is hidden on Android phone widths.
  - App/layout padding and vertical gaps are reduced so primary Dashboard content starts much higher.
  - `.v132-mission-actions` is explicitly placed under the mission content column instead of falling into an unintended grid cell.
  - Drawer brand/navigation spacing is compacted for phone use.
- Commit `1363d071` — **Validate final Android mobile UI targets**
  - Static validator now checks the real navigation selector and mission-action placement.

Validation:
- **VALIDATED** — current frontend source contains all selectors used by the corrected Android rules.
- **VALIDATED** — corrected Android bridge still passes JavaScript syntax validation locally because the follow-up modifies only validated CSS strings/selectors inside the already syntax-checked bridge.
- **NEEDS DEVICE TEST** — final geometry and gesture feel still require the Android test build on a phone.

State:
- **IN PROGRESS** — source-side Android UX is now aligned with the actual v3.0.215 frontend structure; next gate is CI/build artifact and physical-device review.


## 2026-10-03 — Android v0.2.0 versioning and Play update channel

Build evidence before version bump:
- **VALIDATED** — GitHub Actions run `37110037392` completed with conclusion `success`.
- **VALIDATED** — Android mobile UX validator passed in CI.
- **VALIDATED** — current Michel's Life v3.0.215 AppBundle was downloaded and prepared successfully.
- **VALIDATED** — debug APK build succeeded.
- **VALIDATED** — Play AAB build and AAB validation succeeded.
- **VALIDATED** — signing-certificate diagnostics and artifact upload succeeded.

Versioning/update work in this atomic change:
- Android version moves from `0.1.0 / versionCode 1` to `0.2.0 / versionCode 2`.
- `DriveCloudEngine.ANDROID_VERSION` moves to `0.2.0`.
- CI artifact names use a shared `ANDROID_VERSION` environment value instead of hard-coded `v0.1.0` strings.
- Added `android/tools/validate_android_version.py` so Gradle, CloudSync, Android bridge, and workflow version labels cannot silently drift.
- Android `updateStatus` now distinguishes a Google Play install from a sideloaded/test install.
- Play installs report that updates are managed by Google Play.
- Test builds explicitly report that they are test builds and that production updates come through Google Play.
- The Android app no longer describes APK releases as the final production update mechanism.

Remaining:
- **VALIDATED** — Android v0.2.0 CI run `37110286283` completed successfully.
- **NEEDS DEVICE TEST** — install the v0.2.0 test APK on a physical phone and review the mobile UX.
- **BLOCKED** — signed production Play AAB still requires the permanent upload-keystore secrets.


### 2026-10-03 — Android v0.2.0 CI validation

Run: `37110286283` — **Build Android test APK #34**

Result:
- **VALIDATED** — workflow completed with `success`.
- **VALIDATED** — Windows-compatible cloud contract passed.
- **VALIDATED** — Android version metadata passed at `0.2.0 / versionCode 2`.
- **VALIDATED** — Android mobile UX contract passed.
- **VALIDATED** — current Michel's Life AppBundle prepared successfully.
- **VALIDATED** — debug APK built successfully.
- **VALIDATED** — Play AAB built and validated successfully.
- **VALIDATED** — signing-certificate diagnostics succeeded.
- **VALIDATED** — artifact upload succeeded.

Artifact:
- `MichelsLife-Android-TEST-v0.2.0`
- GitHub Actions artifact id: `11269871127`
- Artifact SHA-256: `139093b8f9dbc1472eba9e4e2c3d7b80decb90590cdaea56af1eb6e73a32c456`

CI maintenance:
- Android workflow trigger paths were narrowed so documentation-only changes under `android/ANDROID_AUDIT_LOG.md` and `android/README.md` no longer waste a full Android build.
- Build-relevant Android source/config/tooling changes still trigger CI.

Remaining gate:
- **NEEDS DEVICE TEST** — install v0.2.0 on a physical Android phone and verify initial viewport, checklist alignment, drawer, swipe navigation, Back behavior, animation continuity, and Google sync.


### 2026-10-03 — Build-trigger cleanup validation

Run: `37110414892` — **Build Android test APK #35**

Result:
- **VALIDATED** — workflow completed with `success` after narrowing Android CI trigger paths.
- **VALIDATED** — cloud contract, Android version metadata, Android mobile UX validation, debug APK, Play AAB, bundle validation, signing diagnostics, and artifact upload all passed again.
- **VALIDATED** — Android v0.2.0 artifact remained correctly named `MichelsLife-Android-TEST-v0.2.0`.
- Artifact id: `11269407443`.
- Artifact SHA-256: `54bdff6fc26de1e1f9c98d8ca644d70fd4d30da40b9d0b14e941b61fa4144582`.

CI behavior now:
- Documentation-only edits to `android/README.md` or `android/ANDROID_AUDIT_LOG.md` do not trigger a full Android build.
- Android source, Gradle config, bridge code, Android tools, and the Android workflow itself continue to trigger CI.

Current Android gate:
- **NEEDS DEVICE TEST** — v0.2.0 is build-validated; the remaining UX gate is physical-device testing.
- **BLOCKED** — production-signed Play AAB still depends on permanent upload-keystore secrets.


### 2026-10-03 — Android initial-scroll root cause found and fixed

Automated evidence:
- UI smoke run `37161658411` loaded the real Android-prepared v3.0.215 AppBundle at a 412×915 mobile viewport.
- The drawer was correctly off-canvas: `#v30171Sidebar` measured from x = -326 to -6.
- There was no horizontal page overflow.
- However, `#main` began at approximately **1914 px**, and the first Dashboard card at approximately **1923 px**.
- This reproduced the user's complaint that the primary screen required a large initial scroll.

Root cause:
- Android had compacted the obsolete `#fixedStatusBar`, but the current frontend's active status UI is `#v176StatusPanel`.
- Desktop responsive rules stack the active panel's Time, Command, and Affirmation cards vertically at phone widths.
- That panel remained in normal document flow above `.layout`, creating the huge vertical gap.

Correction:
- Commit `4902ac8b` — **Compact active status panel on Android**
  - `#fixedStatusBar/.status-strip` remain fully collapsed on Android.
  - `#v176StatusPanel` is constrained to a short Android-only strip.
  - Only the first Time/Greeting card remains in that strip on phone widths.
  - Command and Affirmation status cards no longer consume vertical Dashboard space on Android; their underlying features remain available elsewhere in the app.
  - No desktop/Windows frontend source was changed.
- Commit `584c93a8` — **Validate compact Android status panel**
  - Android static UX validation now requires the current `#v176StatusPanel` mobile rule.

State:
- **DONE** — root cause and source correction.
- **IN PROGRESS** — rerunning Android phone-viewport smoke to verify the Dashboard starts near the top and to continue through checklist/drawer/swipe assertions.
- **NEEDS DEVICE TEST** — physical-phone feel still required after automated validation is green.


### 2026-10-03 — Android phone-viewport smoke green

Workflow:
- `Android UI smoke` run `37162394170` — **SUCCESS**
- Final navigation fix: `57d09a74` — **Route Android swipes through canonical navigation API**

Validated against:
- Current Michel's Life desktop AppBundle v3.0.215 prepared through the same Android injection path.
- Chromium mobile viewport: **412×915**.

Measured geometry:
- Android top bar: y `0–56`, width `412`.
- Desktop top bar: hidden.
- Permanent drawer `#v30171Sidebar`: `position: fixed`, x `-336…-16` while closed; x `0…320` while open.
- Compact active status panel: y `62–126`, height `64`.
- Main content begins at **y = 148 px**.
- First Dashboard card begins at **y = 157 px**.
- Horizontal page overflow: **0 px**.
- Mission checkbox: **36×36 px**, aligned with mission title/content.
- Mission card overflow: **0 px**.
- Swipe-left from Dashboard: **Missions** became active and Android top-bar title became `Missions`.
- Seasonal animation continued during the mobile test: frame **77 → 85**.

Historical comparison:
- Before the Android flow fixes, the same automated viewport measured `#main` at approximately **1914 px** below the top.
- The primary-screen initial-scroll regression is therefore closed in automated validation.

State:
- **VALIDATED AUTOMATICALLY** — initial viewport, drawer geometry/open-close, checklist alignment, no horizontal overflow, swipe navigation, edge-drawer gesture, and animation continuity.
- **NEEDS DEVICE TEST** — actual touch feel, Android Back behavior, background/resume, process restart, and real-device rendering still require the physical phone.


### 2026-10-03 — Android v0.2.0 final automated-validation build

Source:
- Commit `57d09a74` — **Route Android swipes through canonical navigation API**

Native build:
- GitHub Actions run `37162394159` — **Build Android test APK #41**
- Result: **SUCCESS**
- **VALIDATED** — Windows-compatible cloud contract.
- **VALIDATED** — Android version metadata `0.2.0 / versionCode 2`.
- **VALIDATED** — Android mobile UX static contract.
- **VALIDATED** — current v3.0.215 AppBundle preparation.
- **VALIDATED** — debug APK compilation.
- **VALIDATED** — Play AAB compilation and bundle validation.
- **VALIDATED** — signing-certificate diagnostics.
- **VALIDATED** — artifact upload.

Build artifact:
- GitHub artifact id: `11287309798`
- Artifact name: `MichelsLife-Android-TEST-v0.2.0`
- Artifact ZIP digest: `sha256:9278c5af572c9ba392af4e2749c1d13653801ac40fa59638232f3efdd02cfad6`
- Test APK: `MichelsLife-Android-TEST-v0.2.0.apk`
- Test APK SHA-256: `a166f186cac115ddc30f5f062d507c498203d2514a7c8da28c3a7288e07b060c`
- Play-preparation AAB remains explicitly **UNSIGNED** because permanent upload-key secrets are not yet configured.

Android UI validation:
- Dedicated Android UI smoke run `37162394170` — **SUCCESS**
- Viewport: `412×915`.
- Dashboard `#main` begins at `y=148 px`; first card at `y=157 px`.
- Drawer is fixed and off-canvas while closed, then opens to `0…320 px`.
- Mission check target is `36×36 px` with no card/page horizontal overflow.
- Swipe-left routes from Dashboard to Missions using `LeftNavV30171.route`.
- Seasonal animation continued during navigation, frame `77 → 85`.

Conclusion:
- **VALIDATED AUTOMATICALLY** — current Android v0.2.0 source and final test APK build.
- **NEEDS DEVICE TEST** — real-phone visual/touch approval, Android Back, lifecycle/background-resume/process restart.
- **NEEDS DEVICE TEST** — Google authorization + Windows ↔ Android Drive synchronization/conflicts/restores.
- **PARTIALLY UNBLOCKED** — permanent upload key is generated and the v0.2.0 AAB is locally signed/verified; repository-secret configuration is still required for signed CI builds.
- **PENDING PLAY CONSOLE** — Play App Signing/OAuth signing fingerprint, policy/Data safety/rating/audience/listing/internal test and any account-specific production-access test.


### 2026-10-03 — Permanent Google Play upload key and signed AAB prepared

Google Play requirement:
- Upload keys must be stored in a Java keystore and use RSA 2048 bits or higher.
- Michel's Life upload key uses **RSA 4096 / SHA256withRSA**.

Private signing material:
- Permanent upload keystore created outside the repository.
- Alias: `michelslife-upload`.
- Upload certificate SHA-256: `38:90:F6:46:38:93:4D:3D:B2:0A:A3:DC:2D:A2:D0:EA:A7:17:DB:B5:78:B7:9D:9C:36:E9:0B:EA:ED:D0:48:35`.
- Upload certificate SHA-1: `08:5F:E1:FE:3E:92:65:60:60:9C:7B:5A:32:CC:67:BD:6D:31:1E:65`.
- `.gitignore` now excludes `*.jks` and `*.keystore` to reduce accidental private-key commits.

Signed Play bundle:
- Source bundle: v0.2.0 build #41 unsigned Play-preparation AAB.
- Local signed output: `MichelsLife-Android-Play-SIGNED-v0.2.0.aab`.
- Signed AAB SHA-256: `46ee8441a0bd858ebfed42f04be9b675b63a890561512a90afa95cfdbf2fe66a`.
- **VALIDATED** — `jarsigner -verify` reports `jar verified`.
- **VALIDATED** — compressed-data integrity test reports no errors.
- The self-signed certificate warning from `jarsigner` is expected for an Android upload key; Play App Signing uses Google-held app-signing key(s) for distributed APKs.

Remaining signing gate:
- **PENDING USER/REPOSITORY CONFIGURATION** — add the four existing workflow secrets:
  - `ANDROID_UPLOAD_KEYSTORE_BASE64`
  - `ANDROID_UPLOAD_STORE_PASSWORD`
  - `ANDROID_UPLOAD_KEY_ALIAS`
  - `ANDROID_UPLOAD_KEY_PASSWORD`
- Once configured, rerun Android CI and require the artifact name to become **SIGNED** with signature verification green.


### 2026-10-03 — Public privacy-policy site prepared; GitHub Pages enablement required

Prepared:
- Public static policy source: `docs/privacy/index.html`.
- Deployment workflow: `.github/workflows/privacy-pages.yml`.
- Play Console answer sheet: `android/PLAY_CONSOLE_SUBMISSION_DRAFT.md`.

Deployment attempt:
- Workflow `Publish privacy policy` run `37162745935`.
- Checkout succeeded.
- `actions/configure-pages@v5` failed with GitHub's explicit message: **Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions.**
- The workflow itself has the required `pages: write` and `id-token: write` permissions.
- GitHub's configure-pages action cannot self-enable Pages with the workflow's normal `GITHUB_TOKEN`; first-time enablement requires repository settings or a separate token with the required administration/pages permissions.

User action required once:
1. Repository → **Settings → Pages**.
2. **Build and deployment → Source → GitHub Actions**.
3. Rerun **Publish privacy policy**.

Expected site base once enabled:
- `https://realmichelduarte.github.io/michel-s-life/`

State:
- **DONE** — policy content and automated deployment workflow.
- **BLOCKED BY REPOSITORY SETTING** — first-time GitHub Pages enablement.
- **PENDING** — after publication, verify the live URL and add the Privacy Policy link inside Android and Play Console.


### 2026-10-05 — Canonical Android download/signing package rebuilt

Reason:
- Previous generated signing/download attachments were not reliably downloadable from the conversation surface.
- A new canonical private package was generated so all Android v0.2.0 delivery/signing files are available together in one archive.

Canonical private upload key:
- Alias: `michelslife-upload`.
- Algorithm: RSA 4096 / SHA256withRSA.
- Upload certificate SHA-1: `4E:4C:63:1D:EC:EF:24:35:8A:81:11:AD:2D:8D:A4:0C:9C:1C:05:55`.
- Upload certificate SHA-256: `BA:8C:AC:81:57:B4:E0:0B:69:8E:FA:D7:F2:90:90:05:E7:22:30:79:7A:C4:03:2F:7D:BD:CB:17:BC:73:C6:26`.
- This 2026-10-05 key **supersedes the temporary 2026-10-03 locally generated upload-key package**. Use only the 2026-10-05 package going forward unless Google Play App Signing has already been enrolled with another upload key.

Canonical deliverables:
- Test APK SHA-256: `a166f186cac115ddc30f5f062d507c498203d2514a7c8da28c3a7288e07b060c`.
- Signed AAB SHA-256: `ec2acce7617b4970b9083fc5ad3a1a7ca767f85c1353332c95ed836a118393cb`.
- Signed AAB verification: **VALIDATED** with `jarsigner -verify`.
- Complete private archive SHA-256: `055521688c71185619aa2f4d3f457124a2f26e46c4e88885853cec00bacd1de0`.

GitHub Pages:
- User confirmed repository Pages source is now set to **GitHub Actions**.
- Commit `739ce52a` updated the privacy-policy effective date and intentionally retriggered `Publish privacy policy`.
- Live public URL still requires post-deployment verification before being placed in Play Console/in-app.


### 2026-10-05 — Android launcher icon corrected to the approved Michel's Life celestial logo

User correction:
- The Android launcher icon must **not** be a generic star or a newly invented symbol.
- The approved Michel's Life icon is the exact previously selected **third celestial logo image**, stored in the repository as `branding/michels_life_logo.png`.

Previous Android issue:
- Android was still using `res/drawable/ic_launcher.xml`, a temporary vector made from cyan/gold circles plus a generic star.
- That vector did not match the approved Michel's Life identity.

Correction:
- Android now packages the exact `branding/michels_life_logo.png` bytes as `res/drawable-nodpi/michels_life_logo.png`.
- `AndroidManifest.xml` uses that exact asset for both `android:icon` and `android:roundIcon`.
- The temporary generic-star vector is no longer referenced by the launcher.

State:
- **DONE IN SOURCE** — exact approved celestial logo wired to Android launcher.
- **PENDING BUILD/DEVICE VALIDATION** — confirm the launcher icon appearance on the physical Android device after installing the next build.


### 2026-10-05 — Physical phone + emulator feedback incorporated into Android v0.2.1

Observed by user on real phone and PC emulator:
- Launcher still showed the obsolete generic star instead of the approved Michel's Life celestial logo.
- The pink first-run/onboarding overlay could reappear over an existing Michel's Life profile, especially around Settings.
- The onboarding focus checklist rendered as oversized crooked checkbox cards on Android.
- Drawer/backdrop layering made the navigation look heavily dimmed.
- Focus/Quick Capture floating controls collided with the lower Android UI and covered content on Journal/Settings.
- Section changes felt slow and the swipe gesture was not self-explanatory; accidental swipes could change sections.
- Emulator reproduced the same class of mobile bugs and lag.

v0.2.1 corrections:
- Uses the approved Michel's Life celestial branding for Android launcher; resource normalized to an Android-safe JPG after AAPT2 rejected the original PNG container.
- Existing-profile detection suppresses stale onboarding only when real Michel's Life data already exists; true fresh installs keep onboarding.
- Fresh Android onboarding is single-column with fixed 22 px native checkboxes instead of giant stretched controls.
- Drawer is reparented outside desktop stacking contexts and kept above its own backdrop.
- Added explicit previous/next section controls to the Android top bar in addition to hamburger + swipe.
- Swipe threshold increased so casual horizontal movement is less likely to switch sections accidentally.
- Added Android fast routing and removes the legacy multi-delay Settings navigation cascade.
- During Android section switches, CSS transition durations are temporarily suppressed to reduce perceived lag.
- Expensive mobile backdrop filters and sky filters are reduced/disabled in Android.
- WebView uses explicit hardware layer, bound renderer priority, no overscroll/zoom, and offscreen pre-raster.
- Action Dock/Focus controls are reduced and hidden on Journal/Settings where they interfered with writing/settings UI.
- Android version bumped to **0.2.1 / versionCode 3**.

Validation gates:
- **IN PROGRESS** — Android UI smoke must pass with onboarding/profile, drawer, safe-area, explicit arrows, swipe and section-switch budget.
- **IN PROGRESS** — native Android build must pass APK + AAB with the normalized launcher resource.
- **NEEDS DEVICE/EMULATOR RETEST** — final feel and visual behavior on the user's phone and emulator.


### 2026-10-05 — Android Action Dock removed from content + true active-surface navigation

Follow-up to phone/emulator feedback:
- The v0.2.1 Action Dock was smaller/safer but still a fixed overlay on Dashboard/Missions.
- The initial Android “fast route” still called `renderAll()`, so it still paid much of the desktop rendering cost.

Final structural correction:
- `#v30175ActionDock` is now physically reparented into `#v30171Sidebar` and styled as a sticky drawer footer.
- Focus/Quick controls therefore never float over Journal, Settings, or normal content.
- Drawer includes the visible hint: **Swipe ↔ or use ‹ › to change sections**.
- `#v30162FocusDock` launcher geometry is collapsed to zero on Android; its full Focus panel can still open when requested.
- Android section routing now uses `renderMain()` plus permanent nav refresh instead of `renderAll()`.
- Settings receives one explicit canonical Settings build pass on the next animation frame.
- Deferred persistence is retained.

Validation added:
- Android UI smoke requires Action Dock parent `#v30171Sidebar`, computed `position: sticky`, and the navigation hint.
- Smoke route label changed to `android-render-main`.

State:
- **IMPLEMENTED** — source/tests updated.
- **PENDING CI** — native build + Android UI smoke.
- **NEEDS PHONE/EMULATOR RETEST** — install the resulting v0.2.1 APK.


### 2026-10-05 — Physical-device + PC-emulator regression pass (Android v0.2.1)

User evidence:
- Physical Android screenshots still showed oversized/misaligned onboarding check controls, floating Focus/Quick Capture controls obscuring Journal/content, unclear section-changing gestures, and slow transitions.
- PC Android emulator independently reproduced stutter/bugs, proving this was not specific to the physical phone.

Root causes confirmed:
- Android UX rules were gated by a 760 px CSS breakpoint. A wide/landscape emulator therefore fell back to the desktop-heavy layout and legacy navigation/render pipeline.
- The desktop onboarding rule `.mlv200-field input{width:100%;min-height:44px}` also matched nested checkbox inputs, creating the huge pink/white check controls.
- Legacy Settings navigation performs repeated repair/rebuild passes for hundreds of milliseconds; Android now bypasses that cascade through an active-surface fast route.
- A whole-page Android observer from earlier iterations was replaced by narrow nav observation + low-frequency maintenance.
- Quick Capture/Focus actions are moved into the off-canvas drawer rather than floating over content.

Android-only corrections:
- Android app UX breakpoint expanded from 760 px to **4096 px**, so phone, landscape, tablet and desktop-hosted Android emulators all stay in Android mode rather than reverting to desktop.
- Wide Android WebViews center the active content/status surface at a maximum of 1180 px while retaining the Android top bar + drawer.
- Onboarding/focus checkboxes are hard-limited to 20–22 px controls and no longer inherit full-width text-input sizing.
- Existing-user stale onboarding state is suppressed before Michel's Life startup scripts can sanitize a real profile as a fresh install.
- Settings uses `android-render-main` fast routing with one active-surface render rather than the legacy repeated rebuild cascade.
- Section navigation now has explicit ‹/› controls in addition to deliberate horizontal swipe; the drawer explains both.
- The approved Michel's Life celestial launcher logo is enforced in the static Android UX contract.

Automated validation added:
- Existing 412×915 physical-phone-like viewport remains covered.
- New **1536×864 wide Android emulator** viewport must show Android top bar/drawer, no desktop top bar, no stale onboarding overlay, no horizontal overflow and Settings fast-route completion under the smoke threshold.
- Off-canvas actions are treated correctly by geometry (negative X is not a screen overlap).

State:
- **IN PROGRESS** — Android UI smoke and native build are rerunning against these v0.2.1 fixes.
- **NEEDS DEVICE/EMULATOR RETEST** — after CI is green, install the new APK on both the physical phone and PC emulator to confirm touch feel and perceived responsiveness.


## 2026-10-05 — Android v0.2.1 stabilization + Google Play parallel submission track

Version:
- Android `0.2.1`
- `versionCode = 3`
- `compileSdk = 36`
- `targetSdk = 36`
- Package: `com.michelslab.michelslife`

User-visible problems / requested changes:
- Android navigation/settings transitions felt slow on both phone and emulator.
- The onboarding/focus checklist rendered oversized controls on Android.
- Quick/focus actions could overlap app content.
- The Android launcher asset needed to remain the approved Michel's Life celestial logo.
- User requested that Google Play publication work proceed in parallel and that the Android project log remain continuously maintained.

Root causes / findings:
- Android WebView needed a lighter observer/maintenance path and hardware-rendering priority.
- The desktop onboarding stylesheet could override the Android checkbox dimensions after render. Automated focus-step measurement reproduced the issue at approximately `262.6 × 48.4 px` for a checkbox.
- Android resource packaging could not use the original repository PNG encoding reliably in AAPT2 release merge, so the Android launcher uses the approved normalized celestial-logo asset that had already compiled successfully.
- Google Play submission is technically ready for API-level policy: the app already targets API 36.

Implemented / relevant commits:
- `f9612202` — Use Android-compatible approved celestial launcher asset.
- `9b9d6d0b` — Force compact Android onboarding checkboxes at runtime.
- Android runtime now reapplies compact onboarding controls with inline `!important` logical and physical sizing, rather than relying only on stylesheet order.
- Android WebView path already includes hardware rendering, high renderer priority, reduced UI observation, compact drawer navigation, and Android-only layout behavior.

Validation evidence:
- GitHub Actions **Build Android test APK #68** completed successfully for `f9612202`, including the Android/Play build path.
- Automated smoke #37 reproduced the actual oversized focus-step checkbox, confirming the bug was real rather than a test-only artifact.
- Smoke #38 is the validation run for the runtime checkbox fix at the time of this log entry.
- Existing-user Android Settings navigation in smoke measured tens of milliseconds in the browser fixture and no longer reintroduced the onboarding overlay.

Google Play parallel work split:
- **USER / Play Console:** create/verify the developer account, create the app record, complete account/device verification, store listing fields, policy questionnaires, and recruit testers when the closed-test requirement applies.
- **ASSISTANT / repository:** keep the Android build release-ready, maintain API 36, signed-AAB workflow, versionCode/versionName discipline, Play App Signing/OAuth checklist, privacy/data-safety technical inventory, automated phone + wide-emulator validation, and this audit log.

Current Play publication dependencies:
- Play Console developer account must be created/verified if not already done.
- A personal developer account created after 2023-11-13 requires a closed test with at least 12 continuously opted-in testers for 14 days before production access.
- Play App Signing must be enabled; after enrollment, its app-signing SHA fingerprint must be registered in the Google Cloud Android OAuth client for `com.michelslab.michelslife`.
- Store listing, Data safety, Content rating, Target audience, App access, Ads declaration, and final privacy-policy URL still require Play Console completion.
- Physical-device and Play-delivered internal-test OAuth/sync validation remain mandatory before calling production release ready.

State:
- **BUILD / PLAY AAB PATH: VALIDATED**
- **CHECKLIST SIZE FIX: IN PROGRESS — automated revalidation running**
- **PLAY CONSOLE SUBMISSION: PENDING USER CONSOLE SETUP**
- **PRODUCTION: BLOCKED until Play Console requirements + required testing + Play-delivered device validation are complete**


## 2026-10-05 — Android v0.2.1 onboarding regression closed + Play parallel-work state

User-visible evidence:
- Physical Android and PC-emulator testing had shown malformed onboarding/focus checks, overlapping Android actions and sluggish section changes.
- Automated fresh-install reproduction confirmed the onboarding checkbox regression at **262.59 × 48.40 px** with a 349.27 × 74 px row.

Root cause / correction:
- Desktop onboarding input sizing could still win after the onboarding step rebuilt its DOM.
- Android now runs `stabilizeAndroidOnboardingControls()` and writes the checkbox/row geometry as Android-only inline `!important` values after onboarding step changes.
- Focus/options checks are constrained to 22 × 22 px; rows use a compact two-column grid.
- Android Settings continues to use the active-surface fast route instead of the desktop global rerender cascade.
- Android app mode remains active through wide emulator/landscape widths rather than reverting to the desktop-heavy shell.

Commits:
- `9b9d6d0b` — Force compact Android onboarding checkboxes at runtime.
- `f9612202` — Use Android-compatible approved celestial launcher asset.
- Prior v0.2.1 Android UX commits cover wide-emulator mode, Settings fast routing, in-drawer action controls and robust swipe validation.

Validation:
- **VALIDATED** — Android UI smoke run **#38** / run `37285236527`: SUCCESS.
- **VALIDATED** — Android build run **#69** / run `37285236594`: SUCCESS.
- **VALIDATED** — Source validation run `37285236498`: SUCCESS.
- Build artifact: `MichelsLife-Android-TEST-v0.2.1`, artifact id `11334113420`.
- Artifact contains test APK plus `MichelsLife-Android-Play-UNSIGNED-v0.2.1.aab`.

Google Play state:
- **DONE** — package `com.michelslab.michelslife`, targetSdk 36, versionName 0.2.1, versionCode 3.
- **DONE** — permanent upload key already exists and remains outside source control.
- **BLOCKED** — CI Play AAB is still unsigned until the four repository secrets are configured:
  - `ANDROID_UPLOAD_KEYSTORE_BASE64`
  - `ANDROID_UPLOAD_STORE_PASSWORD`
  - `ANDROID_UPLOAD_KEY_ALIAS`
  - `ANDROID_UPLOAD_KEY_PASSWORD`
- **PENDING USER / PLAY CONSOLE** — create/configure Play Console app, complete policy/listing forms, create testing track and testers.
- **NEEDS RETEST** — install build #69 on the physical phone and PC emulator to confirm perceived responsiveness and visual behavior after the final v0.2.1 fixes.
- **PENDING** — once signing secrets are present, rerun Android build, verify a `Play-SIGNED` AAB, upload it to Play testing, then register the Play app-signing SHA fingerprint in Google Cloud OAuth for Drive sign-in validation.

State:
- **VALIDATED AUTOMATICALLY / PLAY SUBMISSION IN PROGRESS**.


## 2026-10-05 — Android v0.2.2 Supabase primary sync migration

Architecture change:
- Supabase project `michels-life` is now the primary shared sync backend for Windows + Android.
- Android reuses the same canonical frontend Supabase client as Windows instead of duplicating sync logic in Kotlin.
- The shared client records Android device IDs with an `and_` prefix and writes `source_platform='android'`.
- Supabase tables: `ml_state`, `ml_state_history`, `ml_devices`.
- RLS is enabled on all three tables and every policy is scoped to `auth.uid()`.
- Anonymous table privileges were explicitly revoked; Supabase Security Advisor reports zero findings.
- Only the Supabase publishable key is bundled in the client. Secret/service-role keys are forbidden by validation.
- Existing Google Drive native code is retained as a temporary manual recovery/migration fallback. Automatic Drive sync is disabled whenever a Supabase session is active.
- Google Calendar remains independent and available.

Android build pipeline:
- Android build now overlays the branch's canonical Michel's Life frontend into the downloaded base AppBundle before WebView assets are prepared, preventing test APKs from silently packaging an older public-release frontend.
- Android sync contract validation now requires the shared Supabase module/platform markers and rejects secret/service-role markers.
- Android version bumped to **0.2.2 / versionCode 4**.

State:
- **IMPLEMENTED** — shared Supabase sync path + Android platform/device identity.
- **BACKEND VALIDATED** — RLS, authenticated grants, anonymous revoke and Security Advisor.
- **PENDING NATIVE APK/AAB CI** — current branch cannot dispatch the manual Android workflow through the connected GitHub tool; the workflow is prepared to build the canonical Supabase frontend when run/merged.
- **NEEDS DEVICE/EMULATOR RETEST** — sign in to the same Supabase account on Windows + Android, verify first-device choice, cross-device revision conflict behavior and explicit cloud restore.


### 2026-10-05 — Android Supabase platform smoke added

Change:
- Added `tools/ui_supabase_android_sync_smoke.mjs`.
- The test boots the shared canonical frontend with `window.__MICHELSLIFE_PLATFORM__='android'`.
- It verifies the shared Supabase client reports `platform() === 'android'`, creates an `and_*` device id, writes the initial master snapshot with `source_platform='android'`, registers the device as Android, and contains no `sb_secret_` / `service_role` marker.
- Added this Android-mode smoke to the main UI smoke workflow.
- Added `android/tools/validate_sync_contract.py` to the pull-request Source validation workflow so the Android/Supabase contract is no longer only checked by the manual Android build workflow.

State:
- **IMPLEMENTED** — Android-specific Supabase smoke + PR CI contract check.
- **PENDING CURRENT-HEAD CI** — GitHub had not yet surfaced new Source/UI runs for head `7af80e9427bc62740aeb11215decf6dda100b2e4` at the time of this log entry.
- **PREVIOUS SHARED RUNTIME VALIDATION GREEN** — Source validation #721 and UI smoke #611 passed on the immediately preceding Supabase runtime head.


## 2026-10-05 — Governance/infrastructure reconciliation after Supabase migration

- Inherited the repository-level Michel's Lab governance contract from `.michelslab/project.yml`.
- The pre-migration infrastructure audit that described Google Drive as the Android cloud authority is historical context only.
- Android v0.2.2 now uses the shared Supabase primary-sync client from the canonical frontend; native Google Drive support remains a temporary manual fallback.
- Android-specific implementation evidence remains in this log; reusable cloud/auth/security patterns are promoted to `Michel-Software-Standards`.


### 2026-10-05 — Android PR smoke now uses the exact canonical Supabase frontend

Problem found:
- The independent Android UI smoke originally downloaded the public AppBundle and injected only `android-bridge.js`.
- That meant an Android Supabase test could accidentally validate the public-release frontend instead of the branch being reviewed.
- First PR-gate run #40 then failed earlier at canonical validation because the workflow also omitted the frontend version-bump step.

Root-cause correction:
- Android UI smoke now overlays branch `index.html`, `i18n.js`, developer avatar and Michel's Life logo before `prepare_bundle.py`.
- Android UI smoke now runs on pull requests.
- Both Android UI smoke and Android build run `bump_frontend_version.py` before i18n/canonical validation, matching the Desktop packaging sequence.
- The Android UI workflow now executes `ui_supabase_android_sync_smoke.mjs` directly, so Android platform/device attribution is independently gated.

Validation:
- Source validation #734 — **SUCCESS**.
- Android UI smoke #42 — **SUCCESS**:
  - canonical branch frontend overlay — success;
  - Android fixture preparation — success;
  - mobile UX 412×915 — success;
  - Supabase Android sync smoke — success.
- This closes the previous “pending native Android PR validation” gap for the browser/WebView contract. Physical-device/account validation is still the final native behavioral gate.


## 2026-10-05 — `limon` Android handoff

- Shared Supabase/Android browser-WebView contract is green on current handoff HEAD `419de33c4038e371debd1a74fd8d13db0d9907e7`.
- Android UI smoke **#44 — SUCCESS**.
- Source validation **#736 — SUCCESS** and shared UI smoke **#622 — SUCCESS** on the same HEAD.
- Android remains **0.2.2 / versionCode 4**.
- Supabase is the primary sync authority; native Google Drive remains transitional fallback only.
- Still pending: native APK/AAB workflow/build, signing configuration if absent, physical-device/emulator retest, and real same-account Windows ↔ Android Supabase validation.
- `limon` is the project handoff keyword: update logs and preserve the exact continuation state before moving development to another chat.


## 2026-10-05 — Android v0.2.2 native PR build gate validated

Pipeline correction:
- The Android native build now runs on relevant pull requests, so APK/AAB compilation is tested before merge instead of waiting for main/manual dispatch.
- First PR run #71 correctly caught an obsolete validator marker: `validate_android_mobile_ux.py` expected bridge v0.2.1 while the app bridge/version metadata was v0.2.2.
- The validator was aligned to v0.2.2 without changing Android UX behavior.

Validation on candidate HEAD `25054d18`:
- Android UI smoke **#53 — SUCCESS**.
- Native Android build **#76 — SUCCESS**.
- Android version contract remains **0.2.2 / versionCode 4**.
- Windows-compatible Supabase cloud contract, Android UX validator, debug APK assembly and release AAB assembly all passed.
- Artifact: `MichelsLife-Android-TEST-v0.2.2` (artifact id `11379078581`).

Signing state:
- CI explicitly reports `PLAY_BUNDLE_SIGNING=UNSIGNED`.
- Generated Play preparation bundle: `MichelsLife-Android-Play-UNSIGNED-v0.2.2.aab`.
- The permanent upload-key credential file exists outside source control, but the four GitHub Actions repository secrets are still absent. The connected GitHub integration cannot write repository secrets.

Still required before Play submission:
1. Configure `ANDROID_UPLOAD_KEYSTORE_BASE64`, `ANDROID_UPLOAD_STORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`, and `ANDROID_UPLOAD_KEY_PASSWORD` as repository secrets.
2. Rerun the Android build and require a validated `Play-SIGNED` AAB.
3. Test same-account Supabase sync on real Windows + Android and perform physical-device / Play-delivered validation.

## 2026-10-08 — Android v0.2.2 integrated into main (source/CI, not Play release)

- Merge PR #27 on `main` includes v0.2.2 (`versionCode 4`) with the shared Supabase client, Android namespace attribution, The Ascent adaptive launcher and native splash source, and current frontend integration.
- Candidate commit `27fc043bd97e9a0d23383d171cf295ab10d56538` passed Android UI smoke `37828392618`, Android native build `37828392642`, shared UI smoke `37828392673`, Source validation `37828392687` and Windows build `37828392647`.
- GitHub artifact from native build: `MichelsLife-Android-TEST-v0.2.2`, artifact `11572098070`. Log reported `PLAY_BUNDLE_SIGNING=UNSIGNED`, so the Play release AAB cannot be submitted until the existing upload key is configured in GitHub Actions secret variables and signed-AAB validation succeeds.
- Pending: physical device/emulator installed APK tests (onboarding, swipe/back, settings, About and launcher), Google Play Console setup/signing fingerprint/policy fields, actual Play-delivered installation and cross-device Supabase upload/download/conflict/restore with a real account.
- No Google Play release, published Windows v3.0.216 release, live user sync or physical device test is claimed by this entry.

## 2026-10-08 — Last Android v0.2.2 published in SAME public release as Windows v3.0.216

- Owner-directed unified publication succeeded: https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.216. Same page contains the official Windows v3.0.216 Setup/Portable and the latest Android **v0.2.2 (versionCode 4)**. No separate Android product release tag.
- Fresh current-source Android build via reusable `android-build.yml`, staging Actions run `37834743732`: manifest package `com.michelslab.michelslife`, code 4/name 0.2.2, APK signature verification and SHA-256 checks succeeded.
- APK `MichelsLife-Android-v0.2.2-TEST.apk`, SHA-256 `a6ae2debe8f55d58e41d35b8b85b26feac1235d27216ac8668fac7cc27d085c8`, size 68,943,481 bytes. **Debug/test signing** — not stable direct distribution signing and not a Play-delivered app. A previously installed APK with a different certificate cannot be replaced as an in-place update; a backup is required before uninstall/reinstall.
- Public publisher run `37835085327` uploaded/edited successfully but failed final script due to GitHub CLI unsupported field `title` (correct: `name`). Separate public verifier run `37835372113` SUCCESS downloaded the actual APK, validated SHA-256/manifest and all 12 assets co-located on stable Windows `v3.0.216`.
- Still PENDING: persistent Android direct signing credential continuity, Play upload signing secrets/Console distribution, real Android phone/emulator testing and same-account Windows↔Android Supabase sync/conflict/restore. Do not report those as complete merely because a TEST APK is publicly downloadable.

## 2026-10-08 — Android install failure: rotating ephemeral CI Debug certificates CONFIRMED

- User reports Android v0.2.2 public APK shows **App not installed**. Exact phone PackageInstaller code remains unobserved, so signer mismatch is the leading diagnosis, not confirmed on-device.
- **Confirmed root release-process defect:** Three build runs of the same app `com.michelslab.michelslife`, versionName `0.2.2` / code `4`, used three distinct Android Debug cert SHA-256 fingerprints: `37828392642` = `f6dbee86a17b59e0bab48bf9017847587fe62928d745727ed0566d38c9cdd285`; `37829059350` = `f756cf9e9c4ccaf116f297a998a309af5269d68f138a21cda332d69f2701137e`; published `37834743732` = `03f5419fc284c0dc6070ddc4df71e6e102fb440bee16989d53becfd1885f6b25`. These are NOT signature-compatible in-place updates.
- Mitigation: never uninstall an old locally stored user app without an independently verified backup; ADB `INSTALL_FAILED_UPDATE_INCOMPATIBLE` would confirm the on-device certificate mismatch. A fresh APK with another random debug signer is NOT a fix.
- Root-cause correction under implementation: independent `directRelease` build type signed exclusively with a persistent **Android Direct** keystore, explicitly isolated from the Play upload signer and CI debug key. Workflow supports `build_direct=true` only when 4 secure Direct keystore secrets and a pinned `ANDROID_DIRECT_CERT_SHA256` Actions variable exist. Fail closed on missing credentials or signer mismatch. Version/package signature-verifier tool and source CI self-tests added. Full operator and migration notes: `android/DIRECT_DISTRIBUTION_SIGNING.md`.
- **Current release status unchanged:** public unified Windows v3.0.216 + Android v0.2.2 TEST APK remain published, but Android Direct production signing, successful in-place upgrade on user's phone, and Play store release remain **NOT VERIFIED**. Do not replace it with another ephemeral debug APK or say installation is fixed before a permanent signing key is provisioned and actual device validation passes.

## 2026-10-09 — User clarified clean uninstall before failed Android v0.2.2 installation

- **Diagnostic correction:** Owner explicitly said a previous Michel's Life Android installation was uninstalled **before** attempting to install `MichelsLife-Android-v0.2.2-TEST.apk` from the unified Windows+Android release. This invalidates an uncomplicated same-profile in-place-signature-mismatch explanation of the present *App not installed* message. Confirmed rotating CI debug keys remain a **separate future update-release defect**, but are not established as the cause of a failure after complete uninstall.
- Other hypotheses require actual installation evidence: incomplete phone download, Android PackageInstaller/Play Protect policy, APK parsing or compatibility failure, residual installation in another Android profile (Samsung Secure Folder/work profile), other PackageManager failure. Do not guess from generic message.
- Added GitHub Actions emulator smoke `.github/workflows/android-public-install-smoke.yml` to download the actual released v0.2.2 APK and manifest/sidecar, SHA-verify, **clean-install via `adb install`**, launch the app via ActivityManager, check live process, capture screenshot and preserve install/package/logcat evidence. This tests a real Android emulator only, **not the user's Samsung phone**.
- Original app data may have been removed by uninstall; do not claim it is recoverable without a verified independent export, Android restore or synced cloud copy. Avoid asking the user to uninstall again.
- **State at entry:** Source-level test added; emulator run and device-specific install/error diagnosis are not yet validated. Public APK remains a TEST build; no replacement release published.

## 2026-10-09 — Clean-install reality check on EXACT public v0.2.2 APK: PASS on Android 16 emulator

- Owner clarification: prior app was uninstalled before attempting the public v0.2.2 APK. Thus a **simple update signature mismatch is not demonstrated** as the reason for this specific Samsung failure. The separate rotating CI Debug certificate issue remains real for in-place updates, but should not be misreported as proven on-phone causality.
- Public Android APK from the SAME Windows v3.0.216 unified release downloaded into a clean GitHub Actions emulator: `MichelsLife-Android-v0.2.2-TEST.apk`, **68,943,481 bytes**, SHA-256 `a6ae2debe8f55d58e41d35b8b85b26feac1235d27216ac8668fac7cc27d085c8`. APK hash, source manifest and ZIP archive checked before installation.
- Exact-public-file Android 16/API 36 emulator smoke: https://github.com/michels-lab/michel-s-life/actions/runs/38003205139 — **SUCCESS**. Emulator initially had no `com.michelslab.michelslife` package, then ordinary `adb install -r` **without** special test-only bypass returned `Success`. PackageManager reported `versionCode=4`, `minSdk=26`, `targetSdk=36`, `versionName=0.2.2`. Android `am start -W` launched `com.michelslab.michelslife/.MainActivity` with `Status: ok`; process remained running after 15s and a real emulator PNG screenshot (1,166,927 bytes) was captured. The screenshot is only emulator-render evidence, not a Samsung device pass nor human-reviewed visual correctness.
- The initial two test attempts failed due to the test runner invoking each workflow script line as a separate POSIX shell process (not because PackageManager rejected the APK). Root corrected by moving compound installation logic into `android/tools/smoke_published_apk_install.sh` executed as one Bash process, rather than using multiline shell blocks in the emulator action. Successful run is the first genuine install/launch test.
- PR #35 merged to make real **public-APK download + clean Android 16 install + launch + screenshot** a repeatable regression test. No product APK bytes were changed, no new Android binary release published.
- **Phone diagnosis STILL OPEN:** Samsung Auto Blocker and install-unknown-app source permission, phone-download corruption, insufficient storage or other device PackageInstaller failure, and residual package in another phone user/Secure Folder/work profile are possible. Need exact Samsung installer failure or `adb install` error on the phone to confirm; do not ask for destructive uninstall again. Uninstall may have already removed unsynced local app data; check cloud/verified backups before promising restoration.

## 2026-10-09 — Android first-run step 2/3 Continue obstructed + unexpected cyan/pink appearance

- User's physical Galaxy screenshot (709×1536) displays `Choose your focus` (step 2/3), four selected focus checkboxes, and the `Continue`/Back/Start empty footer beneath the native Android system navigation region. A mobile app header is still visible ABOVE the full-screen onboarding overlay, although onboarding should own the foreground. User reports Continue cannot be tapped and theme switches cyan/pink upon interactions. This is **an observed native-device UX regression**, even though a prior APK clean-install emulator smoke passed. App is shown running; do not continue treating installation failure as the current blocker.
- Root layout defect: core onboarding implementation is a desktop scrollable `.mlv200-onboard-card` with content and actions in one overflow container; Android bridge aligned its entire modal below a fixed 56px topbar (and made the topbar z-index `2147483000` higher than the original onboarding z-index `20050`). Footer therefore scrolls behind/system-level bottom gestures and its tap region is occluded; native topbar can also receive clicks while the modal is active. It was insufficient to validate checkbox sizes alone.
- Android-only root layout correction in `android/android-bridge.js`: the first-run modal takes exclusive foreground, native topbar hidden/non-interactive while it exists, modal box is constrained to dynamic viewport and reserves Android gesture safe-area bottom, and the onboarding card is a flex column. A single dynamically inserted `.mlv-android-onboard-scroll` wraps **only** changing wizard content; the `Continue`/`Back`/`Finish` controls remain a persistent 48px+ accessible footer outside the scrolling region. The core desktop onboarding, theme palettes, backgrounds and approved design remain unchanged.
- Newly extended `tools/ui_android_mobile_smoke.mjs` tests real touch hit-testing via `elementFromPoint`, footer bounds above Android navigation zone, hidden topbar, valid content scroller, absence of horizontal overflow and an actual `Continue → final step → Finish` click flow; also asserts tapping focus category checkboxes does not mutate the selected theme/palette and records a step-2 screenshot. `validate_android_mobile_ux.py` now rejects missing invariant selectors/layout.
- **At entry:** these are source changes only. CI browser smoke, native packaged APK screenshot and owner’s Galaxy confirmation still pending; do **not** claim bug fixed in the currently downloadable Android v0.2.2 APK before a newer validated Android package is published. Future unified public release must include the current Windows version alongside latest Android; do not replace a user-installed APK with an unrelated/debug signing key without warning/data continuity plan.

## 2026-10-09 — Android onboarding P0 code merged; CI confirms tappable Continue and complete flow

- Source PR #37 merged at `43d7e70cc8054e2ba8cef8362029109045c7374b`. Android-only modal/flex scroll/foreground implementation and real clickable footer remain on the canonical `main` branch. No Michel's Life desktop theme/UI sources were changed; accepted desktop appearance is preserved.
- Android UI browser smoke Actions run `38004838876` **SUCCESS** on 412×915 mobile/touch profile: validated layout hit target and safe bottom margin for `Continue` and `Finish`, non-interactive hidden topbar while onboarding, full first-run `Continue → Finish` event/callback flow and completion persistence. Verified focus checkbox interactions did not mutate palette/storage/theme-body state. Screenshot `android-mobile-onboarding-step2.png` from the exact PR source is retained in CI artifact `11651051259`; visually reviewed against the phone report: unoccluded buttons and no topbar at the top of modal (Chromium fixture, **not native device**).
- Android APK native compilation from PR `38004839077` **SUCCESS**; Source validation `38004838875` **SUCCESS**. Separate actual-public release Android install run `38004838999` checked the unmodified older release APK, **not the new UI build**, so must not be misrepresented as a post-fix native UI/device pass. Shared UI smoke `38004839174` was still running when PR was merged, unrelated to this Android-only change.
- **Release and Galaxy status:** v0.2.2 downloadable TEST APK still contains old onboarding bug. A newly built Android artifact with fix is not automatically the released APK. Owner's physical S26 Ultra, theme transition in all routes, runtime tap against Android system gesture navigation and future permanent APK signing remain **PENDING**. Do not force an update with another ephemeral Debug signing key; owner should be informed of backup risk before uninstall/reinstall.

## 2026-10-09 — Android v0.2.3 / versionCode 5 onboarding patch candidate (UNRELEASED)

- After the owner requested executing master sync plus a corrected Android release, prepared source candidate Android versionName `0.2.3`, versionCode `5` from merged P0 modal fix PR #37. Version aliases are synchronized in Gradle, CloudSync, Android bridge, Android workflow, mobile UX source validator and Android README. Existing Windows app/release remains independently versioned v3.0.216.
- Intended correction: the `Continue`/Back/`Finish` first-run footer stays above native Android navigation, blocking modal hides the app topbar and owns taps, independently scrollable form, focus-category tap cannot reset theme; preserve desktop themes and approved assets.
- Browser mobile smoke previously PASS on #37: https://github.com/michels-lab/michel-s-life/actions/runs/38004838876; native Android code build previously PASS on #37: https://github.com/michels-lab/michel-s-life/actions/runs/38004839077. These are **previous-source evidence, not validation of v0.2.3**. New version needs its own candidate CI build and real installed candidate onboarding test.
- **Release blocker:** Dedicated Android Direct signing secrets (`ANDROID_DIRECT_KEYSTORE_BASE64`, `ANDROID_DIRECT_STORE_PASSWORD`, `ANDROID_DIRECT_KEY_ALIAS`, `ANDROID_DIRECT_KEY_PASSWORD`) and pinned Actions variable `ANDROID_DIRECT_CERT_SHA256` are not configured in the last observed workflow runner environment. Never silently substitute debug APK for stable update. The already installed v0.2.2 test APK has an ephemeral CI certificate; even a newly production-signed v0.2.3 cannot update it in place unless the matching old private debug key exists. Preserve user data/backup before any future uninstall. The user reported a running Android screenshot, so current problem is onboarding, not global APK-install invalidity.
- Product-level unified publisher issue #31 also remains separate. Do **not** claim a new customer download exists from code or CI artifacts alone; publish only when distribution signing and candidate acceptance are complete, on the existing one Windows+Android customer-facing release channel.

## 2026-10-09 — Android 0.2.3 native smoke evidence

- Native APK fresh-install and Activity launch **PASS** on Android 16 in run 38011148596; actual package 0.2.3 was accepted by PackageManager.
- The first nonblank installed-APK screenshot revealed an incomplete/corrupted WebView layout despite the process running. **VISUAL PASS NOT VERIFIED**; user-facing native UI has a P0 issue #41. Follow-up candidate script captures screenshots over the subsequent 55 seconds for actual pixel review.
- Browser Android touch/Continue/Finish checks and code compilation passed; they do not prove physical-device or production APK appearance.
- Existing public unified release still carries Android v0.2.2 TEST. New permanent Direct key certificate publicly pinned as a01a0540165a00cd228a5fc78adc855bd1c1e6b8195391769c219d76ebd582f2, but its private material is not configured in GitHub Actions. Production release **BLOCKED** by signing, native visual review and old-signature data migration.

## 2026-10-10 — Root-cause remediation for Android cyan→pink after Continue (candidate, NOT RELEASED)

- Actual Android UI smoke with synchronous `CSSStyleDeclaration.setProperty` stack traces ([run 38107065040](https://github.com/michels-lab/michel-s-life/actions/runs/38107065040)) identified the **last pink writer** as legacy v3090's `setVars() → applyVisual()`, not just newer v3130's palette default. Legacy `michelsLifeTheme.v3000` can contain only `glassAtmosphere/text/mutedText/premium`; v3090 interpreted it as a complete palette and filled missing fields with desktop pink, overriding Android cyan on each render.
- Fix in `src/MichelsLife/frontend/index.html`: **Android v3090 delegates `applyVisual` to the existing canonical v3130 owner** rather than writing competing old variables after v3130 has initialized. Explicit `saveIt` user palette changes still flow to canonical v3130; Desktop's v3090 implementation is untouched. This is authority consolidation, not a timer or CSS override workaround.
- No changed product versions or releases. CI needs to confirm current branch Android UI smoke (including cyan→pink Continue assertion), generic desktop UI themes, source/generated bundle checks and actual Android APK before merge. Native Samsung remains independently pending.

### Same-SHA feedback on first palette-owner correction

- Android UI run `38108675284` no longer changes `--accent` cyan→pink, which proves legacy v3090 was a competing pink writer. It still caught a **subtle panel/card token mismatch** on first Continue: `--ui-panel-rgb` `17,24,43`→`16,24,41`, `--ui-card-rgb` `16,23,42`→`17,24,39`. This is still a real visible background-color shift and cannot be waived.
- Root mismatch: the actual canonical modern `ColorThemeV30184.current()` defines the original-world default colors, while older v3130 embedded another cyan preset variant. Updated Android v3130 fallback to take current normalized colors from the canonical modern controller, keeping explicitly selected `t` colors dominant and preserving desktop defaults. Latest same-commit CI required.

## 2026-10-10 — Native Finish stable, ADB capture retries and retained relaunch evidence

- Examined the exact Android 16 installed v0.2.3 candidate run `38108743820`, screenshot artifact `11690902166`. Step 3/3 shows `Finish setup`; actual native tap transitioned to dashboard in `step4-after-native-finish.png`, and dashboard remained fully and correctly visible in `step4-after-native-finish-30s.png`. This establishes **native Finish visual transition PASS** on the Pixel 6 emulator, not just browser source.
- The later force-stop/relaunch step reported `Status: ok` and `LaunchState: COLD`, but the host's adb transport returned `error: closed` when querying the process, before any new post-relaunch screenshots. CI failed from missing transport, so **native persistence after relaunch and stable post-relaunch paint remain UNVERIFIED in this run**. An earlier run `38106988250` did capture a post-relaunch Dashboard without onboarding, but first paint had cropped logo/gray blocks.
- Carried over real installed-candidate taps, Finish and 30/60s post-relaunch screenshot evidence from superseded QA PR #43 into a fresh QA branch based on Android v0.2.3 current release candidate **with the integrated theme fix**. All real `adb exec-out screencap` calls now use a bounded five-attempt helper that validates PNG bytes and records the last stderr, adb devices and logcat on sustained failure. Relaunched process verification also has bounded retries. No mock or screenshot substitution, no false visual PASS.
- Require actual same-SHA Android native candidate screenshots and pixel inspection before closing #41. No product UI/theme/assets, platform version, signing or customer release changed by QA tooling.


## 2026-10-12 — Current Android Direct release acceptance ledger and documentation correction

- Reconciled Android docs with the actual Gradle and Actions build version (`0.2.5`, `versionCode=7`), and with unified public Windows `3.0.217` + Android Direct `0.2.5` distribution. Previous README / Play-readiness values (`0.2.3` or `0.2.1`) were stale and must not be used for installation guidance.
- Public Direct APK uses a permanent distribution certificate, distinct from ephemeral v0.2.2 TEST debug signature and from separate Google Play upload/app signing. Migration from TEST to Direct must not claim in-place install or preservation of unsynced data. No secrets are stored in documentation.
- Existing Android mobile browser regression suite covers one-finger gesture scroll, complete clock tile, Missions editor, Focus workspace and persistence. These checks are **automated/browser evidence**; they do not replace physical S26 Ultra testing.
- Physical acceptance still required: direct v0.2.4→0.2.5 upgrade retaining user state; touch scrolling, onboarding and modal footer/keyboard on Galaxy; locked/background/reboot Focus notification behavior and battery optimization; permission rejection; Supabase two-device upload/download, concurrent edits/conflict/restore; Google OAuth/Calendar/Drive; safety export and recovery.
- Google Play submission, Google-held app-signing certificate OAuth setup, and actual store install remain provider-bound/unverified. Do not mark complete based only on AAB existence.
- No product frontend, approved visual assets, Windows runtime, signing configuration or public release was changed in this documentation reconciliation.


## 2026-10-12 — Android Focus pending alarm recovery after reboot/package replacement (candidate)

- **Finding:** Issue #53 had a working one-shot `AlarmManager` Focus mirror while the process is backgrounded, but Android discards pending system alarms at reboot. Previously, no manifest receiver restored the pending delivery. Package upgrades also needed an idempotent re-arm path.
- **Implementation:** A non-exported `FocusAlarmBootReceiver` handles Android `BOOT_COMPLETED` and `MY_PACKAGE_REPLACED`, using only existing device-local `NativeFocusAlarm` token/mode/deadline metadata to re-arm `RTC_WAKEUP` with `setAndAllowWhileIdle`. Receiver is granted `RECEIVE_BOOT_COMPLETED`. Recovery rejects corrupt token/mode, already elapsed, and implausibly future deadlines; cancellation clears stale metadata. No duplicate timer/session/XP engine, no new cloud keys, no platform/visual/version/release changes.
- **Automated safeguards:** Android UX source validator checks receiver permission/non-export and token/staleness guards; Gradle/Android APK CI still required on this exact candidate head. Actual phone reboot, Doze/battery optimization, notification denial and delivery timestamps remain **NOT VERIFIED**.
- **State:** source candidate in PR, not yet merged or published. Even after compile smoke, issue #53 must stay open until real device and wider reminder/Windows tests pass.

## 2026-10-12 — Android local restore-point path containment (security candidate)

- **Finding:** `AndroidBridge.safeRestoreFile()` used `file.path.startsWith(base.path)` after canonicalization, which could accept sibling directories sharing the `restore-points` string prefix when given a crafted relative filename. The WebView bridge must not be allowed to load adjacent device-private files as restore JSON.
- **Fix:** Require a bounded filename with a restricted character set, and a canonical regular file whose `parentFile` equals the exact canonical `restore-points` directory. This rejects `../`, absolute paths, sibling-prefix names and symlink escapes while retaining the existing restore filename format.
- **Regression guard:** `validate_sync_contract.py` rejects the old text-prefix check and checks for canonical parent and filename containment. Android Gradle build/CI and actual restore-operation verification must pass before merging. No user data, secrets, versions, themes or release artifacts changed.
- **State:** candidate source change; source/Android build evidence and physical restore tests pending. P0 auth/device-local cloud snapshot issue #55 remains independent and open.


## 2026-10-12 — P0 shared Backup Timeline restore device-isolation fix (candidate)

- **Finding:** The shared frontend's `applyBackupJson()` for Backup Timeline restored arbitrary `backup.localStorage` entries, called `localStorage.clear()`, then preserved only three Supabase device keys. Old backups can contain account sessions, Google/provider tokens, permission data, local notification IDs or other device-only settings. This path remained unsafe even though canonical Supabase/Drive primary restore already used `MLVCloudSharedStorageV30216`.
- **Fix:** The timeline restore delegates exclusively to the same canonical `MLVCloudSharedStorageV30216.allowed/restore` contract, rejects foreign-only backups, preserves device-local keys by not clearing whole localStorage, supports legacy valid user state, and keeps existing cloud-accept/reload semantics. No duplicate state engine, UI redesign or product version bump.
- **Automated acceptance:** Added `tools/test_cloud_restore_storage.mjs` to evaluate the actual live HTML allowlist and timeline function in an isolated JavaScript context with synthetic per-device Supabase tokens/device IDs, provider tokens, local alarm IDs, Journal/Theme, state-only archives, foreign-only archives and cloud restore acknowledgement. Wired the test into both desktop UI smoke and Android build CI. Every affected workflow must pass at exact candidate head before merge.
- **Independent remaining gates:** True Windows↔Galaxy account sync, concurrent revision recovery and real historical backup restore on the phone remain **NOT VERIFIED**. Issue #55 remains open until a full multi-device audit and evidence; no customer binary published from this candidate.


## 2026-10-12 — Android design-first parity pass for every canonical section (candidate)

- **New priority:** User directed the Android visual experience to be completed before non-blocking sync/Windows/backlog work. Hourly development automation has been reordered accordingly; the desktop visual system, chapter art, palettes, approved Themes and domain engines are frozen.
- **Current finding:** Previously `android/mobile-sections.js` owned only Missions, Calendar and Journal; Premium Contracts, Stats/Compare, Achievements, Affirmations, Goals and canonical Settings remained at risk of desktop multi-column clipping and small touch targets, despite working route/data engines.
- **Implementation in Android-only mobile sections owner:** Reflow Premium Contracts (search, filters, one-column cards, split action row), Goals/weekly planning, Stats/Compare and charts, Achievements, Affirmations (overflow-contained table), Story images, Settings (horizontal category navigation and 44px targets), responsive typography, form inputs at 16px (prevents WebView zoom), and semantic section density at <=720px. Shared desktop DOM, theme colors, background assets, data schema and Chapter animation engines untouched. Dashboard KPI layout excluded from generic single-column fallback. Added short section entrance transition and `prefers-reduced-motion` off-switch, not a Chapter asset animation.
- **New measurable candidate test:** `tools/ui_android_section_design_smoke.mjs` visits Today, Contracts, Stats, Achievements, Affirmations, Settings at 412x915; rechecks Contracts/Stats/Settings at 360x915; inspects card overflow and computed interactive target dimensions, captures screenshots of each actual route, verifies two distinct computed frames of animation and reduced motion. Story is probed if its legacy router is discoverable. Wired into the Android UI smoke workflow; Android source validator enforces platform-only selectors and design coverage.
- **Acceptance gate:** Candidate workflow screenshot/real computed geometry and existing Android touch/navigation smoke, compiled Android candidate/install, desktop source and visual regression all required before merge. A browser screenshot is not a Samsung physical-device pass. Native keyboard interactions, Premium Contracts saved progress, project links, Chapters scene screenshots and cross-device state acceptance still require separate evidence. No new public release in this PR.
- **State:** design candidate, PR/CI pending; do NOT declare all sections visually finished until per-section screenshots and device acceptance are audited.


## 2026-10-12 — Phone-first Story/Chapters editor and About identity screen (candidate)

- **Finding:** Despite the broader Android-only visual pass in PR #74, canonical Story chapter/moment creation still inherited a desktop four-column form with 34px-high controls. The canonical Settings → About identity card also retained multi-column product, portrait, author and social layout that could be cramped on 360/412px screens.
- **Design fix:** Android-only, <=720px style ownership in `android/mobile-sections.js`: one-column Story editing forms with 48px inputs/buttons and 16px input type to avoid Android zoom, responsive hero/timeline and archive layout; one-column product/author/studio identity in About, 180px portrait, 48px social cards, two-column metadata and visible wrap/focus. Original Michel’s Lab logo, author portrait, original Chapter art and business-state engines remain untouched. **No desktop frontend, asset, template, version or release change.**
- **Validation:** Extend rendered `ui_android_section_design_smoke.mjs` with real Story editor geometry and real Settings/About social link, brand layout and screenshot tests at **412×915 and 360×915**; source validator enforces the design contract. Required exact-head Android browser smoke, Windows UI smoke/source checks and candidate APK compile + Android 16 install remain the merge gates.
- **Remaining:** Real Galaxy soft-keyboard/one-finger review, Chapter scene visual ownership, Android provider sync and owner subjective visual acceptance are **not** established by browser CI. Issue #54 remains open for full section parity. No public release authorized by this candidate.


### 2026-10-12 — Real rendered phone QA regression corrections (PR #75)

- **Observed failed candidate (412×915):** Story editor entered a one-column grid, but actual controls were only 34–37px tall, overriding the expected 48px mobile target. Fixed by reapplying 48px min-height and 16px input typography to real canonical Story controls in the existing Android-only `enforceRendered()` ownership pass.
- **Observed failed candidate (412×915):** Actual Settings/About portrait still rendered at **300×400px**, overriding the intended 180px photo sizing. Fixed through the same narrow-device rendered ownership pass, without replacing the canonical image or changing desktop styles.
- **Observed failed candidate (360×915):** Settings horizontal category-nav buttons remained **40px high** because the *original Android bridge* set `min-height:40px!important` after section styles were applied. Root-cause correction updates the bridge’s mobile Settings inline and stylesheet min-height to 48px, instead of adding yet another competing Android override.
- Each defect was caught in a real Chromium layout test against the candidate frontend; all new changes require exact-head CI including Android APK installation. These source corrections do **not** establish physical Galaxy approval. No release built/published from failing candidates.


## 2026-10-12 — Compact Statistics overview on narrow Android phones (candidate)

- **Rendered finding:** Reviewing PR #74's actual GitHub Actions screenshot artifact, `sections/stats-360.png` showed the canonical six Stats summary cards vertically stacked because desktop `.stat-hero-grid` insists on `minmax(170px,1fr)`. At 360px this wastes the first several scroll screens despite numbers and titles fitting in two ~150px cards.
- **Mobile-only design change:** At <=720px, retain the original shared Statistics renderer and data but replace the fixed desktop minimum with `repeat(2,minmax(0,1fr))`; use readable 11px labels, 23–29px metric values, 82px minimum card height, 9px gutters and proper overflow wrapping. No desktop Styles, assets, Themes, approved Chapters, state or release changes.
- **Executable proof:** Android Chromium section screenshot smoke now inspects **all six actual KPI nodes** at 412x915 and 360x915: exactly two computed grid tracks, tile widths >=112px, heights >=90px, label-value separation and no viewport escaping. Full CI, candidate APK compilation/install and image review required on final PR SHA before integration.
- **Status:** source candidate only. On-device Galaxy screenshot/performance and same-account data sync remain independent.
