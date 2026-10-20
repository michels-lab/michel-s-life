# Operación GRANADA — tested Focus, Android Calendar and native image provenance

Date: 2026-10-19 America/Monterrey.
Repo: michels-lab/michel-s-life.
Latest verified main HEAD after #147 merge: 08abf5f2f376fba112fa3a61eebaed4d753214d9.
Latest public unified GitHub Release independently checked: v3.0.221, 13 public assets; Windows 3.0.221, Android Direct 0.2.9 code11. No release created by this operation.

## Integrated completed evidence
- Docs handoff #144 merged to main 72e51f7 after Source/browser/Android UI PASS.
- #145 two-way device privacy browser contract merged de56458 after same-head Source/browser/Android UI PASS. Distinct desktop/Android Chromium contexts retain device-specific synthetic sessions, identity, notification keys and vaults; transfer canonical missions/XP/Journal/theme; reject unknown and malicious legacy keys. Issue #55 stays open until live provider/owner-device proof.
- #146 canonical Android Focus to native alarm mirror lifecycle test merged 6208756 after all exact-head Source/browser/Android UI PASS. With real production Android JS and synthetic Android bridge, verified start, pause, resume, skip/reset, break, deduplication across ticks, one transient bridge failure and retry, no duplicate XP/missions. This does NOT demonstrate live Android OS delivery, Doze or Galaxy lockscreen; issue #53 stays open.

## Active isolated unfinished blocks
- #134: Developer Twin, permanent section comments, AI export, login and updater; source/build/browser green but native installed APK proof red. Windows developer variant paused by owner.
- #135: keyboard Calendar accessibility and Journal live region, branch head 2e7676ca. Original direct keyboard selection changed and saved calendar date, then lost Calendar DOM; reroute via existing mobile navigation repaired that browser flow. Exact-head Android UI passed on a rerun along with source/browser/Gradle. Native installed candidate still red from emulator/ADB transport loss (including rerun). This is not signed Galaxy acceptance.
- #138: native XP and mission completion digest through force-stop/relaunch. Source/browser/Android UI/Gradle green; native installed candidate fail from emulator/ADB loss. Remains draft, not completed.
- #147 was fully validated and merged into main as `08abf5f2f376fba112fa3a61eebaed4d753214d9`: native A/B screenshot manifest with verified official Direct APK SHA-256, checked-out source SHA, 16 actual frame SHA/CRC/dimensions. First attempt failed closed on corrupt SDK system-image ZIP (0 frames) and the Android UI first attempt had an unrelated Settings layout fail. Exact-head reruns passed: **Android16 installed public APK native 16/16 frame manifest PASS, errors=[] (job 118392413509), Android UI PASS, browser UI PASS, source PASS**. This is reproducible native A/B evidence on public APK, NOT current candidate Developer APK or a physical Galaxy acceptance.
- #139: repeated hosted runner failures with distinct root symptoms (post-install ADB loss and pre-boot corrupt SDK download); don't conflate with developer app code or mark native installed screenshots accepted without evidence.

## Coordination and release rules
Claim registry had no active claims when checked. This docs-only branch edits docs/CURRENT_HANDOFF.md plus this dated record. It does not touch #134 shared logs, #135 calendar source/tests, #138 native probe or #147 diagnostic. Windows Installer, Desktop build and Store/MSIX remain paused. No candidate APK from an Action artifact should be offered as a user release; only Michel's explicitly authorized public GitHub Release is eligible for owner testing.

Next turn: #147 evidence complete and integrated. Continue on independent tracked problems if #134/#135/#138 native installed candidate remain red. For #135/#138 require installed native + Galaxy review; #134 Developer Twin must be real signed/installed before release. Keep real-provider #28, #53, #55/#108, #104 and Google Calendar #110 open for distinct user/device acceptance.
