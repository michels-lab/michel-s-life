# Michel's Life — Agent Contract


## Desktop About placement (mandatory)

Every desktop application must display a clearly labeled, usable **About** action in its **fixed top application header** from initial launch and in every workspace. It must remain visible when the window is compact/high-DPI, the body is scrolled or a sidebar is collapsed; footer-only, Home-only, offscreen or hidden-overflow About is forbidden. Keep the header outside the scroll container and validate its actual rendered visibility and click bounds. Source of truth: `michels-lab/Michel-Software-Standards/standards/BRAND_NATIVE_INTERFACE_STANDARD.md`.

This repository contains Michel's Life Desktop and Android. Before editing, read `.michelslab/project.yml`, `MICHELS_LAB_PROJECT.md`, the relevant project log, and the files/workflows that own the behavior being changed.

## Source-of-truth logs

- Desktop/general: `GIT_AUDIT_LOG.md`
- Android: `android/ANDROID_AUDIT_LOG.md`
- Infrastructure/cloud: `docs/INFRASTRUCTURE_AUDIT.md`

Shared Michel's Lab rules live in `michels-lab/Michel-Software-Standards`.

## Product constraints

- Preserve the current accepted visual base unless the task explicitly requests a visual change.
- Do not refactor Themes, backgrounds, Current Chapter, general layout, typography systems or assets as collateral work.
- Frontend source/release deltas and the generated `AppBundle.zip` pipeline are deliberate; inspect the release tooling before changing generated frontend behavior.
- Desktop and Android are separate platform surfaces. Do not force desktop UX onto Android for code reuse.
- Google Drive/OAuth changes require explicit auth, secret-boundary, conflict/recovery and real-provider validation reasoning.
- Never commit OAuth secrets, tokens, signing material or personal app data.


## Fundamental visual identity and About — mandatory

This is a **core Michel's Life product contract**, not optional branding polish.

### Product-wide visual system

The approved mountain/path/star logo geometry is the foundation of the app's visual system. Preserve the defining silhouette, proportions and spatial relationships. Color, monochrome/inverted treatment, glow, glass, outline, translucency, material and motion may adapt to theme/context.

Do not satisfy branding by pasting the source SVG into unrelated screens. Translate the mark's visual DNA into layout rhythm, progress paths, missions, achievements, chapter transitions, status/completion states, cards, highlights and motion where appropriate. The goal is coherent visual ancestry, not repetitive logo placement.

### About hierarchy

About MUST be intentionally designed in this order:

1. **Product identity first** — approved Michel's Life mark/lockup, product name, real current version and product-facing composition derived from the app identity.
2. **About the author** — current canonical Michel Duarte portrait, **Michel Duarte**, and appropriate developer copy.
3. **Michel's Lab parent brand** — official Michel's Lab mark/lockup shown as the studio/ecosystem identity without overpowering Michel's Life.
4. **Social profiles** — each visible network link shows the recognizable network icon **and** the visible network name together, using canonical URLs from the master `brand/developer-profile.json`.

Do not finish About with text-only social links or icon-only social buttons. Accessibility labels/tooltips supplement the visible network name; they do not replace it.

Treat this hierarchy and the product-wide logo-derived design language as part of product completeness. Visual work must not regress it.

Follow `standards/PRODUCT_IDENTITY_STANDARD.md` and `standards/ABOUT_STANDARD.md` in `michels-lab/Michel-Software-Standards`.

## Validation

For Desktop changes, inspect the owning workflow/tooling and run the relevant current-commit checks. The documented baseline includes:

```bash
python tools/release_smoke_test.py
```

Generated frontend/release changes may also require `tools/validate_generated_index.py` and the reconstruction/build path used by CI.

For Android changes, use the Android workflow/Gradle tasks that cover the changed surface. Device-only behavior must remain explicitly unvalidated until tested on a real target device.

For any changed animation, verify a real state/position/transform difference at two moments; an animation declaration alone is not evidence.

## Completion

Update the appropriate audit log with meaningful bugs, decisions, tests, failures and validation. Do not bump versions or publish releases unless the assigned task explicitly authorizes it.


## Intelligent brand adoption

When the user asks to update/adopt the app logo, icon, splash, startup or About:

- use the canonical product assets from `michels-lab/Michel-Software-Standards/shared-assets/product-logos/`;
- follow `standards/PRODUCT_IDENTITY_STANDARD.md` and `standards/BRAND_ADOPTION_PLAYBOOK.md` from the Michel-Software-Standards repository;
- inspect this app's current design system before placing assets;
- replace the real active platform identity references instead of layering the new logo over legacy/generic branding;
- use the app icon for launcher/executable/favicon derivatives, the mark for compact identity, and the lockup for larger splash/About surfaces when appropriate;
- treat the logo geometry as design language where useful, but do not repeat the literal logo across screens;
- build About in the hierarchy Product → Author → Michel's Lab → Social;
- use the canonical Michel Duarte portrait and Michel's Lab mark in About;
- preserve unrelated product behavior;
- update this repository's project/audit log and validate current build/CI;
- do not publish a release unless the user explicitly authorizes it.

A change that merely pastes the SVG/PNG into an arbitrary card or header is not a completed branding migration.

## Cross-chat claim guard

Michel's Lab uses the master `.michelslab/task-claims.json` / generated queue metadata to prevent multiple chats or agents from editing the same tracked task concurrently.

Before starting a delegated tracked task:
- inspect the claim metadata included in the handoff/current master queue when available;
- if a different owner has an active non-stale claim, **stop and report the collision instead of editing**;
- stale claims require a freshness check before work resumes;
- do not treat a claim as validation or release permission;
- return branch/commit/validation status in the handoff so the master owner can heartbeat, complete or release the claim.

## Structured handoff requirement

For any tracked Michel's Lab task, return enough machine-readable continuation context for the master handoff registry:

- task ID and repository;
- owner/role and branch;
- outcome;
- commits and areas changed;
- validations that **actually ran** and their real result;
- evidence status: `verified`, `inferred`, or `blocked`;
- remaining work;
- blockers/manual evidence still required;
- suggested next owner/role when useful.

Do not list planned tests/builds/device checks as completed validation. If required validation was not performed, the task must be released/handed back with that work pending rather than described as complete.

<!-- MICHELSLAB_SHARED_CONTRACT_BEGIN id=child-agent-core version=2026-10-09.1 -->
# Michel's Lab shared child-agent contract

This managed block is cross-project policy. Repository-specific instructions may add stricter local rules outside this block, but they must not weaken or contradict it.

## Shared authority

- Michel's Lab shared standards, product identity, governance, release and coordination rules are authoritative in `michels-lab/Michel-Software-Standards`.
- Keep product implementation truth and product-specific audit logs in this child repository.
- Do not silently invent a conflicting local Michel's Lab rule.
- Never commit secrets, credentials, signing material, private tokens or passwords.
- Historical green CI is not proof for the current commit.

## Product identity / About

- Preserve the approved product-logo geometry; contextual color, material, lighting and motion may adapt without identity drift.
- Branding is a design language, not sticker placement.
- About hierarchy is **Product identity → paired author/studio composition → social profiles**.
- The paired author/studio composition should show **Michel Duarte** and **Michel's Lab** side by side when width permits: portrait + name + developer role on one side; official Michel's Lab logo/lockup + studio name + canonical slogan **`TOOLS WITH IDENTITY.`** on the other.
- Narrow/mobile layouts may stack responsively, but the author and studio must remain visually grouped as one intentional composition.
- Do not replace the Michel's Lab slogan with a paragraph-length studio review by default.
- Use the current canonical Michel Duarte portrait and the official Michel's Lab parent-brand assets from the master authority when implementing/updating About.
- The canonical portrait file is immutable: child repositories must vendor it byte-for-byte. Never resize, crop, recompress, retouch, regenerate, convert or rewrite the portrait asset itself; use render-time layout/object-fit/masking only.
- Visible social controls use recognizable network icon **and** visible network name with canonical profile URLs.


## Brand-native design and workspace architecture (mandatory)

- Product logo geometry is the source of the app's **entire UI design language**; do not paste a canonical SVG in an unrelated sticker card and call branding complete. Use shared typography, spacing, geometry, control and motion tokens from that identity.
- **Every desktop app:** place a visible, labeled **About** action in the fixed top application header on launch and throughout all workspaces. It MUST NOT exist exclusively in a footer, off-screen scroll content, Home, a collapsed sidebar or overflow menu. It must stay accessible at the minimum window size and high DPI; verify actual initial viewport placement and clickable bounds. Header stays fixed while main content scrolls.
- Keep official mark + readable product name and global About/Updates persistently visible independent of collapsible sidebar and selected workspace. No duplicate massive lockup/heading.
- Data shows only data ingestion/catalog/filter controls, Field only 3D tools, Analysis only scientific analysis. Prefer a single 3D view by default and explicit coherent comparison state.
- Compact/one-at-a-time contextual subbars should preserve actual scientific canvas. No persistent overlays hiding a simulation or axis gizmo.
- At normal desktop widths/heights, the initial About viewport must show portrait, product, studio slogan and all five recognizable social icons **with visible names without scrolling**; test viewport intersections, not just existence or scroll reachability. Review actual screenshot.
- On large imports, progress feedback has clear preparing/loading/stalled/completed/failed states and cannot hang forever at zero progress.
- Apply `standards/BRAND_NATIVE_INTERFACE_STANDARD.md`; never claim a cohesive redesign without actual installed-surface screenshots, scientific functional checks and human review.

## Rendered visual brand release gate — mandatory for every app

- For launch, splash, About, launcher or product-identity changes, follow `standards/BRAND_VISUAL_VALIDATION_STANDARD.md`. Checking that an official asset exists/decodes or that a build passes is **not** visual acceptance.
- Inspect computed final UI geometry, theme/text contrast, clipping/overlap and duplicate lockup/heading. CI must fail for known visual violations; require screenshots from the exact candidate when automated capture is available; Michel performs human visual review after release.
- Validate relevant viewport sizes/themes in the actual browser/native/mobile runtime, including the packaged app where possible. If evidence is missing, explicitly report `pending visual review`; never say branding is complete from static tests alone.

## Canonical identity asset precedence

- Product-logo authority is `shared-assets/product-logos/manifest.json` in the master standards repository.
- Michel's Lab parent-brand authority is `shared-assets/michels-lab/manifest.json`.
- Assets explicitly marked legacy/rejected must never supersede the current canonical geometry.
- When `.michelslab/identity-sync.json` marks an identity section `enforced`, child canonical copies must match the master source exactly; hash drift is a governance defect.
- When identity state is `migration_pending`, do not auto-replace local assets. Stop, reconcile the active surfaces explicitly and preserve the approved master geometry.
- A local filename such as `official-*.svg` is not proof of authority by itself; authority comes from the current master manifest and identity-sync policy.

## Cross-chat coordination

- Tracked work follows the master claim lifecycle: `unclaimed → claim → heartbeat → complete/release → structured handoff`.
- If a different owner holds an active non-stale claim, stop instead of duplicating edits.
- A stale claim requires a freshness check before resuming/reclaiming work.
- A claim is coordination state only; it is never validation or release permission.
- Return branch/commit/evidence information so the master claim can be heartbeated, completed or released correctly.

## Structured handoff

For tracked work, return:
- task ID and repository;
- owner/role and branch;
- outcome;
- commits and areas changed;
- validations that **actually ran** and their real result;
- evidence status: `verified`, `inferred`, or `blocked`;
- remaining work;
- blockers/manual evidence still required;
- suggested next owner/role when useful.

Never list a planned build/test/device/store check as completed validation. If required validation was not performed, hand the task back with that work pending instead of claiming completion.

## State truth before status/release claims

Before answering or handing off any question about what is current, released, published, ready, or pending, resolve four independent dimensions from current evidence:

1. **Working HEAD** — current branch/default-branch SHA and relevant PR/branch state.
2. **Latest stable release** — actual published tag/version, publication timestamp, release commit/artifacts.
3. **Same-SHA CI** — validation for the exact commit and affected distribution channel.
4. **External provider state** — Store/Play/cloud/device/provider evidence such as uploaded, certified, published or delivered.

Never collapse these into one status. A newer `main` does not make the latest release newer. A built MSIX/APK/installer is not a Store/Play publication. A GitHub release is not provider publication. If `main` is ahead of the stable release, say so explicitly.

After a merge, release, tag or provider mutation, re-read authoritative state before the final status answer or handoff. If a generated queue/gate conflicts with newer evidence, route reconciliation instead of repeating completed product work.

## Multi-channel distribution and contract-test robustness

- If an app ships through more than one channel (for example direct GitHub Setup/Portable plus Microsoft Store MSIX, or direct APK plus Google Play), treat each channel as a separate validation surface over the shared source.
- A change to shared runtime, version, packaging, updater or identity code must run the affected channel validations on the **current commit**. A Store/Play workflow that only runs on a special distribution branch is insufficient once its shared implementation lives on the default branch.
- Store-managed builds must not also self-update from the direct-download feed unless the product explicitly documents and validates that dual-update design.
- Package creation is not provider publication. Keep evidence states separate: package built/validated → uploaded → certified/approved → published → delivered/installed.
- One authoritative product version must drive all channels. Never use a previous real release number as a runtime/version fallback because it can silently report stale identity; derive from authoritative metadata, fail clearly, or use a neutral non-release sentinel.
- Contract/regression tests must be portable across CI platforms. Normalize or tolerate CRLF/LF and path-separator differences and prefer structural/semantic assertions over exact whitespace or source-format matches.
- Syntax-check executable test/validation scripts before relying on them as semantic gates (for example `node --check` or `python -m py_compile` where applicable).
- When a channel is added or materially changed, update the app audit log and the master store/release gate. Do not describe the channel as published until provider evidence exists.

## Release and evidence boundary

- Do not publish/release unless explicitly authorized.
- Manual/device/store/provider validation remains pending until actually performed.
- Do not fabricate screenshots, device behavior, store status, cloud/provider state or test results.
- Preserve unrelated known-good behavior and keep changes bounded to the assigned task.
- For installable Windows apps, the canonical direct release is built by GitHub Actions from the authorized commit/tag and delivers a real Setup installer as the normal-user artifact.
- Use `<Product>-Setup-vX.Y.Z.exe` for the recommended installer. If a portable build is also shipped, name it explicitly `<Product>-Portable-vX.Y.Z.exe`; never leave the portable filename ambiguous when both exist.
- For installable Windows apps, separate evidence into **BUILD PASS → INSTALL PASS → LAUNCH PASS → FUNCTIONAL PASS**. A green installer/build job is not proof that the installed application starts.
- Smoke-test the generated Windows installer by actually installing it and then **launching the executable from the installed location** before uninstalling. Merely verifying that the EXE exists is insufficient.
- Installed-app LAUNCH PASS requires either a normal GUI process that remains alive long enough to expose a real top-level window, or an app-owned deterministic smoke mode that boots the real installed UI/runtime path and emits explicit success evidence.
- If installed startup fails, preserve process exit/lifetime plus available app logs and Windows Application/.NET crash evidence before failing CI.
- A portable launch PASS and an installed-app LAUNCH PASS are separate claims when both artifacts are shipped.
- Publish SHA-256 for direct Windows binaries. Authenticode/code signing, when available, must happen before final checksum publication. Without a publisher certificate, do not hide or misrepresent Windows Unknown publisher/SmartScreen behavior.
- FoamLens and Michel's Life are the current Windows release references; Michel's Life also demonstrates optional Authenticode and a separate Microsoft Store MSIX path.

## Android first-run modal + persistent theme acceptance (master shared rule)

- **Every Android/mobile app with first-run onboarding or a blocking form/modal** must keep the modal above underlying app chrome and prevent header/drawer/section gestures from receiving taps until the modal closes.
- The primary Continue/Finish controls must remain *physically reachable* and clickable above the Android bottom navigation/gesture region, even on a compact/tall-form step: use true window/safe-area insets, bounded content scrolling **independent of a persistent action footer**; do not rely on a lone desktop overflow container.
- Add real interaction regression coverage: test the **longest** onboarding step using touch/hit-target verification, tap Continue→Finish and confirm persisted completion; check at least one compact and one materially different viewport, including the effect of system status/navigation bars.
- Selecting goal/focus/category checkboxes must not implicitly change the chosen theme. Validate persisted palette/settings and rendered colors before/after category and navigation interaction.
- Keep original approved themes/backgrounds and desktop layout stable unless redesign is explicitly requested. Capture actual installed-APK UI and distinguish browser-harness PASS from native emulator/physical-device evidence. A fixed source/PR is **not** a corrected customer release until the new signed candidate is built, tested, packaged, and published.
- Canonical authority: `platforms/ANDROID.md`, `standards/UI_UX_STANDARD.md`, `standards/RENDERED_UI_RELEASE_GATE.md`. Originating real-world regression: Michel's Life source PR #37 (2026-10-09).

## P0 mandatory rendered-UI release gate (master-owned; every app)

- Source scans/XML assertions, build success, CI green, icon/blob hashes and file presence never prove the app **visibly renders**. Every release of a user-facing app MUST open the actual built/installed candidate and capture **Home + About + changed screens** across two supported viewport sizes; the capture must show meaningful nonblank content, visible author portrait, Michel's Lab logo and **`TOOLS WITH IDENTITY.`**, appropriate icons + network names, working scroll and Close/Back. Test native view bounds/visibility and navigation, not just inflation.
- Screenshots must originate from the actual runtime (Android emulator/physical device, Windows installed GUI, real browser), be checksum-validated and bound to the exact release source SHA plus candidate artifact SHA-256. The owner reviews rendered screenshots after release. Never make human review or protected Environment approval a prerequisite for publication. Preserve automated build/security/integrity checks; capture screenshots when supported, but mark missing evidence as unverified instead of introducing unconditional publication blockers.
- Mandatory reference: `michels-lab/Michel-Software-Standards/standards/RENDERED_UI_RELEASE_GATE.md`; validator: `tools/visual_release_gate.py` (vendor/consume with tests). Never fabricate images, attestations or user approval; agents cannot self-certify independent visual review. Do not claim device/store testing from an emulator. A pure no-UI-change release needs documented same-artifact UI identity and bounded exception as defined in the standard.
- Release manager: report missing visual evidence and open P0 for confirmed visual regressions; do not block publication solely for pending human review. QA agent: inspect actual pixels and record **SOURCE, BUILD, LAUNCH, RENDER, VISUAL REVIEW and DEVICE** independently. App maintainer: implement real UI smoke tests and screenshot capture at appropriate viewports. Static PASS is not visual PASS.
- **Important rollout boundary:** this shared contract does NOT, on its own, modify the child release workflow. Until a repository demonstrably captures and validates rendered evidence, mark its visual QA **NOT VERIFIED** without blocking releases solely for missing human approval.

## HTML Desktop delivery (conditional standard for local browser apps)

If a child app's Desktop distribution is a local HTML browser application, its **primary GitHub Release Desktop asset MUST be a direct, self-contained, versioned `.html` file**, with embedded required imagery/branding so it works without the ZIP or an `assets/` directory. An additional ZIP is allowed but never sufficient by itself. Enforce via manifest + publisher + CI assertion + actual offline browser launch, verify SHA-256 for the standalone HTML, and check that GitHub actually exposes the HTML next to APK and other assets. See master `standards/REPOSITORY_DISTRIBUTION_STANDARD.md`. Native installer apps are unaffected.
<!-- MICHELSLAB_SHARED_CONTRACT_END id=child-agent-core -->
