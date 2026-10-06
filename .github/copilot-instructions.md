# Copilot instructions — Michel's Life

Read `AGENTS.md`, `.michelslab/project.yml`, `MICHELS_LAB_PROJECT.md` and the relevant audit log before making changes.

Keep requested changes surgical. Preserve the accepted visual system unless redesign is explicitly in scope. Do not silently alter unrelated themes, backgrounds, Current Chapter, typography or assets.

Respect the generated frontend/AppBundle release architecture. Inspect existing workflows and tools before modifying generated output or release behavior.

Desktop and Android require platform-appropriate validation. Never claim device, OAuth, cloud round-trip, Play delivery or animation behavior was validated unless that validation actually occurred.

Never commit secret values. Update the relevant project audit log for meaningful work. Do not release unless explicitly assigned.

Official Michel's Life branding is geometry-first. Preserve the approved mountain/path/star geometry, but adapt color/material/motion to the surface. Use the motif in progress, missions, achievements and chapter UI where appropriate. Do not satisfy branding by repeatedly pasting the SVG into screens; the logo is a design language, not a sticker.

Product identity / About are fundamental product contracts. Treat the approved mountain/path/star geometry as the visual foundation across the app, not as a sticker. About must lead with Michel's Life identity/version, then About the author with the canonical Michel Duarte portrait, then the official Michel's Lab parent-brand mark, then social links rendered as **network icon + visible network name** using canonical profile URLs.



For logo/About/branding work, follow the Michel-Software-Standards Product Identity Standard and BRAND_ADOPTION_PLAYBOOK. Replace actual platform identity references, adapt the official geometry to this app's existing visual language, avoid sticker-style logo placement, preserve unrelated behavior, validate the build, and do not release without explicit authorization.

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

<!-- MICHELSLAB_SHARED_CONTRACT_BEGIN id=child-agent-core version=2026-10-06.2 -->
# Michel's Lab shared child-agent contract

This managed block is cross-project policy. Repository-specific instructions may add stricter local rules outside this block, but they must not weaken or contradict it.

## Shared authority

- Michel's Lab shared standards, product identity, governance, release and coordination rules are authoritative in `realmichelduarte/Michel-Software-Standards`.
- Keep product implementation truth and product-specific audit logs in this child repository.
- Do not silently invent a conflicting local Michel's Lab rule.
- Never commit secrets, credentials, signing material, private tokens or passwords.
- Historical green CI is not proof for the current commit.

## Product identity / About

- Preserve the approved product-logo geometry; contextual color, material, lighting and motion may adapt without identity drift.
- Branding is a design language, not sticker placement.
- About hierarchy is **Product identity → About the author → Michel's Lab → social profiles**.
- Use the current canonical Michel Duarte portrait and the official Michel's Lab parent-brand assets from the master authority when implementing/updating About.
- Visible social controls use recognizable network icon **and** visible network name with canonical profile URLs.

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

## Release and evidence boundary

- Do not publish/release unless explicitly authorized.
- Manual/device/store/provider validation remains pending until actually performed.
- Do not fabricate screenshots, device behavior, store status, cloud/provider state or test results.
- Preserve unrelated known-good behavior and keep changes bounded to the assigned task.
<!-- MICHELSLAB_SHARED_CONTRACT_END id=child-agent-core -->
