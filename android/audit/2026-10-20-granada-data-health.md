# Operación GRANADA grande — in-app Data Health and backup safety
Date: 2026-10-20, America/Monterrey.

## Product work (Android first; shared source engine)
1. **Read-only Data Health panel** in existing Settings > Data, not a new settings system. Explicit Check saved progress button. Reports numeric XP, mission/completion counts and bounded issue codes without exporting names, titles or IDs.
2. **Local, offline file preflight** for selected JSON and .michelslife backups; 10 MiB cap before reading, non-restorable/corrupt JSON detection, missing state, invalid collection structures, IDs, XP and legacy device credential storage.
3. **On-device backup comparison** counts, total XP and completion totals vs the current saved progress. Never falsely claim exact ID/content parity or verified restorable state. No automated restoration, deletion, sign-in or cloud uploads.
4. **Safe developer-friendly evidence** using JSON-only coarse counts and finding codes. Clipboard and downloaded redacted JSON are user-triggered, and both avoid source file contents, tokens, individual identifiers and Journal text. No data is stored by this inspector or transmitted through an endpoint.
5. **Independent regression and touch CI**: 18 Node tests extracted from exact canonical in-app source, and actual Android-mode Chromium touches / input file selection / comparison / two relaunches at 360px and 412px with synthetic mission names and legacy credential fixtures.

## Non-interference / safety boundaries
- This patch changes only the end of canonical frontend index.html, adding one isolated styled module under Settings > Data. No changes to approved Themes, typography, backgrounds, Current Chapter layout, core state/sync engine, Developer Twin, native Kotlin or Windows packaging.
- Existing PR #134 owns Developer Twin/Android bridge and shared audit logs; #135 Calendar/Journal; #138 native relaunch probes; #150 Premium; #151/#152 Focus. Do not alter those files or conflate this end-user panel with the Developer Twin's anchored QA annotations.
- Existing Python preflight on main (#154) remains an engineer-facing, more thorough verifier (including duplicate JSON keys). This browser tool performs JSON.parse; **it cannot detect duplicate object keys in a JSON input**, and must not be described as a security guarantee. No account provider, native file manager, signed APK or Galaxy has been validated solely by browser testing.
- Note that selecting a file is **read-only**. Status ok means elementary structure checks passed, not permission to import without a separate verified backup/recovery path.
- Windows new builds, installers and Store/MSIX remain paused; NO automatic release.
- Progress state and all user-created content remain untouched by the new health inspector.

## Acceptance and next gates
- Review exact-head unit+Android-browser CI run; failures are real blockers. Verify screenshot/tapability against Android UI. Native Galaxy file picker and browser file download support must be tested before treating them as available on all phones.
- Separate P0 native #104 signed-app relaunch, #28 real Supabase dual-device, #55/#108 private-account boundary and #131 Developer Twin issues remain OPEN.
- Technical ownership: only canonical index append plus new independent tools/workflow and this dated log. Record exact SHA and checks on PR before any integration. Do not claim released until a new explicitly authorized APK is signed and published.
