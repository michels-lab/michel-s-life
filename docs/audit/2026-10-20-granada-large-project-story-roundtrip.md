# 2026-10-20 — GRANADA GRANDE Projects / Story / cross-device recovery

## Why this is a large block
Owner now requires end-to-end, multi-deliverable packages instead of a PR for every small check. This is one **joined, development-only, multi-domain regression package**, not a public Android repair. It targets linked #28, #54, #55 and historical #104 without stepping on runtime code owned by concurrent Developer, Calendar, Focus and XP PRs.

### Deliverable A — real Android Projects create/link/rehydrate
- Open the canonical Android Projects route, submit its **real form** with a mission link through the actual UI, verify resulting project card.
- Transfer using the actual shared-storage capture/restore to an isolated Windows Chromium runtime and restart it. Assert Project name, source mission identity and no duplicated mission IDs.
- Re-transfer to Android. Assert project remains after new runtime bootstrap. No new Project model or frontend renderer.

### Deliverable B — real Android Story/Chapter and canonical Journal
- Start a named Chapter with motto through the canonical Android Story UI, then require it in both cloud-capable backup payloads and after Android↔Windows↔Android.
- Modify Journal through canonical JournalV30189 save and check the exact date/body survives reload and return. No parallel Android Journal store or synthetic form submit bypass.

### Deliverable C — XP + device privacy + recovery and rollback
- Modify canonical XP; require runtime, persisted board and official backup state agree across both directions.
- Inject **synthetic** device-local secrets and hostile foreign keys in transfer; ensure receiver values do not change and neither cloud/Drive backup contains their values or disallowed names.
- Preserve a clean pre-import Windows snapshot, recover it explicitly, and separately recover original Android state; assert that imported Project/Chapter do not remain after Windows rollback and original Android Journal/XP return after recovery.

## Exact test surface
- `tools/ui_granada_large_projects_story_roundtrip_smoke.mjs`
- `.github/workflows/granada-large-project-story-cloud.yml` (isolated Chromium CI; no Windows native packaging, signing or emulator)
- Environment: actual `src/MichelsLife/frontend/index.html` over official AppBundle with Android assets, two independently booted actual browser contexts, locally mocked Android transport and synthetic seeded data.
- Script checks fail on missing canonical APIs, missing UI controls, leaked values, state drift, non-idempotent mission presence or browser errors. No direct modifications to public app runtime/data, native AndroidBridge, Developer Twin, Focus, release tags, version or user storage.

## Honest limits, blocked gates, next reentry
This package **does not** authenticate with a live Supabase project or Google Drive, run actual native Android APK/Galaxy, show real Windows installed runtime, sign a package or certify owner acceptance. Direct `MLVCloudSharedStorageV30216.restore` is the shared-storage contract exercise, not a stand-in for provider CAS/conflict handling. Existing #149 handles concurrent Journal version conflict separately; do not claim it validated by this test. #139 hosted emulator transport is still blocked. #134 owns Android auth/updater workflows; do not edit its files. Existing merged #145 validates broader key allowlisting.

Candidate gates: exact-head GitHub Actions Chromium run and any failing runtime assertion triage. If green, review/merge subject to source ownership; physical same-account A/B, Android signed relaunch, and provider history restore remain open under #28/#54/#55/#104. **No release authorization.** This dated log lives outside shared `GIT_AUDIT_LOG.md` / `android/ANDROID_AUDIT_LOG.md`, which #134 currently edits. Consolidate when claim releases safely.

## 2026-10-20 actual CI triage and contract correction

- At SHA `1e031405`, run [39389433272](https://github.com/michels-lab/michel-s-life/actions/runs/39389433272) built the real frontend/Android assets and launched Chromium, then failed checking Project on Windows after **raw unauthenticated guest restore**. At SHA `25a69d3b`, run [39389701935](https://github.com/michels-lab/michel-s-life/actions/runs/39389701935) showed source Android board contained the Project+Chapter, recipient after boot did not.
- At SHA `e6472ff4`, run [39389918136](https://github.com/michels-lab/michel-s-life/actions/runs/39389918136) proved `MLVCloudSharedStorageV30216.restore()` correctly wrote **both** Project and Chapter into Windows localStorage immediately. They disappeared only **after unauthenticated guest client reload**. This is **not yet evidence of a production sync defect**: account-owner isolation may correctly reject unauthenticated cross-device guest import. The test used the wrong acceptance path.
- At SHA `664ba761` the test was corrected to use **both real Chromium runtimes with the same mocked Supabase user**, real sign-in, explicit cloud pull, CAS/revision, Journal conflict and recoverable pre-download history. The test no longer assumes that directly copying another guest's saved board is authorized. It must pass **exact-head CI** before claiming even mocked cross-device parity.
- Never loosen the user/account boundary or bypass the authentic cloud provider path to make a regression green. If the same-account test fails, investigate the precise domain/step and keep the PR blocked rather than treating this as evidence of an authorized guest data transfer.
