# 2026-10-12 — Live Premium Contracts editor: mobile phone parity

**Root-cause discovery:** current shared frontend versions v190 and v216 deliberately redirect the obsolete `goals` route to Premium Contracts; `goalEditForm` is legacy. A proposed Goals-only PR #93 was CLOSED before merge after confirming this. The *actual* active editor is `#v217ContractEditForm`, opened from `.v216-contract-card` through `data-action="v217-edit-contract"`.

**Design implementation:** Android-only `mobile-sections.js` CSS owns phone modal geometry, 1-column details, 3 compact progress KPIs, 16px inputs with 48px minimum targets, 44px close and linked-task rows, scrollable internal task picker and sticky Save/Cancel. Preserve the canonical v217 save method and underlying mission/goal ownership. No desktop visual, Themes, Chapter, asset, build version or API change.

**QA:** new Playwright Android mobile test opens an actual seeded weekly mission's v216 Premium Contract card, taps its v217 Edit action, fills Name/Weekly Target/Description, shrinks viewport to 620px to model keyboard obstruction, asserts modal/card width/height, one-column editor, 16px input, internal scroll, captures focused UI, taps Save, validates the same `missions[id]` record and on-screen Contract label; tests both 360 and 412px widths. Workflow runs this gate against reconstructed canonical bundle.

**Status:** candidate awaiting exact-head Android UI, shared UI, source and Android 16 APK build/install. Browser geometry simulation does not establish a physical Galaxy keyboard, Samsung scroll, real Supabase Windows↔Android state propagation or customer release. Keep issue #54 open. No release.
