# Michel's Life — Git Audit Log

> Chronological technical record of important repository, CI, release, and recovery events.
> This file complements `CHANGELOG.md`: the changelog describes product changes by release, while this audit log records how the repository reached that state.

## 2026-09-30 — v3.0.213 visual rollback to approved v3.0.211 presentation

### User-visible regression identified
- The v3.0.212 Windows release was functionally bilingual but its rendered interface no longer matched the previously approved v3.0.211 presentation.
- Michel's Life remains one application with coexisting English and Spanish modes; switching language must change text only and must not change layout or visual design.

### Root cause
- Exact comparison against the v3.0.211 release source commit `fd8cd4b3` showed only three small CSS block differences, while dozens of JavaScript renderers had been rewritten during source-bilingual hardening.
- The visual regression therefore came primarily from translation logic being moved inside renderers, changing generated markup/renderer behavior instead of only changing visible copy.
- The v3.0.211 frontend contained no `data-mlv-i18n-owned="source"` regions, confirming that its approved renderer structure could remain authoritative while the expanded i18n layer handled language changes globally.

### Corrective action
- `01a23af9` — **Restore v3.0.211 visual renderer baseline**
  - Restored `src/MichelsLife/frontend/index.html` exactly from the v3.0.211 release-build commit `fd8cd4b3`.
  - Kept the current expanded `i18n.js` translation layer.
  - No new layout, styling, card, navigation or renderer redesign was introduced.

### Verification
- Source validation #504 — **success**.
- UI smoke #448 — **success**.
- Verified critical UI render, Spanish first run, installed language selector, Spanish Missions, general and exhaustive Spanish UI, complete bilingual corpus, Spanish-English round trip, translated-control overflow, installer/Settings language behavior, Settings integrity, translated theme controls and Spanish Dashboard.
- This establishes the v3.0.211 presentation as the visual authority and bilingual text behavior as an independent layer.

## 2026-09-30 — v3.0.212 localization hardening, CI recovery, and release

### CI / GitHub Actions infrastructure incident
- Repeated `Source validation` and `UI smoke` runs were failing in only a few seconds before any workflow step executed.
- Failed jobs reported:
  - `runner_id: 0`
  - empty `runner_name`
  - `steps: []`
- A retry of Source validation #475 reproduced the same behavior, confirming it was not a transient workflow-step failure.
- Historical Actions inspection showed the problem affected many commits and both Ubuntu and Windows jobs, predating the final localization commits.
- The source repository was temporarily changed from private to public to restore GitHub-hosted runner availability.
- After the visibility change, jobs immediately began receiving real runners and executing normal steps again.
- This separated the infrastructure problem from actual application/test failures.

### First real failures after runners recovered
- `5ab882fc` — localization work had advanced through planning and Next Up surfaces.
- Source validation then reached the real application checks and exposed bilingual corpus inconsistencies instead of infrastructure failures.

### Bilingual corpus repairs
- `1c131792` — **Align Spanish system defaults with canonical translations**
  - Removed stale disagreement between canonical `PAIRS` and `SPANISH_SYSTEM_DEFAULTS`.
  - Unified:
    - `Read all` → `Marcar todo como leído`
    - `This month vs last month` → `Este mes vs el mes pasado`
- `dfaaad71` — **Make sidebar brand UI smoke deterministic**
  - Replaced a blind DOM geometry read with an explicit wait for the complete brand lockup.
  - Improved failure quality so missing elements no longer surfaced only as `getBoundingClientRect()` null errors.
- `e6e8350e` — **Remove stale Boss Quest anglicisms from Spanish copy**
  - Replaced mixed Spanish/English system copy such as `Boss Quest` / `Jefe Quest` with canonical `Misión de jefe`.
- `17d6c63d` — **Canonicalize late-night mission copy**
  - Removed duplicate English variants that mapped to the same Spanish sentence.
  - Stabilized Spanish → English → Spanish round trips.
- Source validation #479 passed completely on `17d6c63d`, including:
  - release-readiness smoke tests
  - canonical frontend validation
  - Spanish source-copy audit
  - generated bilingual system corpus audit
  - Microsoft Store packaging smoke tests
  - Windows host compile and embedded icon validation

### Sidebar / renderer investigation
- UI smoke exposed that after `renderAll()`, `#v30171Sidebar` could contain only the navigation shell and Focus Dock while the Michel's Life brand lockup disappeared.
- Diagnostics confirmed `LeftNavV30171.renderNav()` still existed, so the problem was not a missing navigation API.
- The investigation then moved from timing assumptions to authoritative renderer dependencies.
- Subsequent commits repaired active renderer dependencies and source-owned bilingual behavior instead of adding another DOM cleanup patch.

### Source-owned bilingual UI hardening
- `d53aed5c` — **Rerender global bilingual UI on language changes**
- `c2816eea` — **Move status i18n helpers into the active renderer**
- `a221d228` — **Make status chrome bilingual at source**
- `82e3b5b7` — **Capture route render errors in exhaustive UI audit**
- `4af490c9` — **Retire obsolete English status writer**
- `fe119622` — **Restore canonical runtime translation helpers**
- `0457f9bf` — **Localize contract status and planning copy at source**
- `1ec473d0` — **Stabilize authoritative sidebar UI smoke**
- `1af05fe8` — **Repair exhaustive Spanish UI renderer dependencies**
- `3792716b` — **Finish source-owned Spanish UI copy**
- `91b02688` — **Make cloud conflict language detection authoritative**
- `b95293a9` — **Audit only visible Spanish UI surfaces**
- `a7fc692c` — **Stabilize visible language round trip**
- `50383840` — **Canonicalize system contract identity across languages**

### Pre-release verification
- On `50383840`:
  - Source validation #497 — **success**
  - UI smoke #441 — **success**
- `95fdcc18` — **Log September 30 validation and localization work**
  - Added the v3.0.212 changelog entry and documented the verified localization/CI work.
  - Source validation #498 — **success**
  - UI smoke #442 — **success**

### Version bump and release preparation
- `ba7cb127` — **Bump Michel's Life to v3.0.212**
  - Updated the .NET project/versioning, installer/build validation, and packaged frontend version flow.
  - Source validation #499 — **success**
  - UI smoke #443 — **success**
- `e3c6c3b9` — **Dispatch v3.0.212 Windows release**
  - Initial temporary release dispatcher attempt.
  - Dispatcher run #1 failed because the release target needed correction.
  - Source validation #500 — **success**
  - UI smoke #444 — **success**
- `be55c12c` — **Fix v3.0.212 release dispatcher repository target**
  - Corrected the temporary dispatcher.
  - Dispatcher run #2 — **success**
  - Windows release build #13 — **success**
  - Source validation #501 — **success**
  - UI smoke #445 — **success**

### Published release
- Public release repository: `realmichelduarte/michel-s-life-releases`
- Release: **v3.0.212**
- Published: 2026-09-30
- Release assets:
  - `AppBundle.zip`
  - `MichelsLife-Setup-v3.0.212.exe`
  - `MichelsLife-v3.0.212.exe`
  - `MichelsLife-v3.0.212.exe.sha256`
  - `michels_life_icon.ico`
- The release is a normal final release, not a prerelease.

### Post-release cleanup
- `6ab1be97` — **Remove temporary v3.0.212 release dispatcher**
  - Removed the one-off release dispatch mechanism after successful publication.
  - Source validation #502 — **success**
  - UI smoke #446 — **success**
- Current main therefore ends in a clean post-release state with both primary validation workflows green.

## Repository release policy
- Source repository: `realmichelduarte/michel-s-life`
- Public binary/release channel: `realmichelduarte/michel-s-life-releases`
- Release preference: final releases only; do not use prereleases unless explicitly requested.
- Repository visibility may be made public temporarily when needed to restore GitHub-hosted Actions execution, then returned to private after validation/release work is complete.
- Michel's Life remains proprietary / all rights reserved unless explicitly changed by the owner.

## Audit rule going forward
For every meaningful future Michel's Life development cycle, record:
1. date and affected version;
2. root cause / observed problem;
3. commit(s) that changed behavior;
4. CI/workflow run numbers and outcomes;
5. release publication result and assets;
6. any temporary infrastructure or repository-setting changes;
7. final clean-up state.
