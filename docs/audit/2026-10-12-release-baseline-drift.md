# 2026-10-12 — Correct stale public release references (documentation only)

**Finding:** Source `README.md` and `docs/ANDROID_PLATFORM_PARITY.md` still described Windows v3.0.216 / Android Direct v0.2.3 as the latest customer build even though the canonical `GIT_AUDIT_LOG.md` and `android/ANDROID_AUDIT_LOG.md` record successful unified release Windows v3.0.217 + Android Direct v0.2.5 (versionCode 7) on 2026-10-11.

**Evidence:** source release intent commit `05ccaa52c2899ba969d2d0ad396669d2552b0f2f`; source candidate run `38175360615` passed source/Windows installer/Android16 signed native gates and destination publication run `38176304417` succeeded. Published tag: https://github.com/michels-lab/michel-s-life-releases/releases/tag/v3.0.217.

**Change:** update user-facing landing README and Android parity current baseline. Preserve the distinction between public signed APK and `main` design work that has not yet shipped; never claim physical Galaxy, real provider sync or lock-screen notification success from emulator/browser evidence.

**Scope:** documentation only. No Android/Windows executable, version, signature, CI workflow, theme or design file modified. Validation: literal reference audit and GitHub diff review; no release is authorized.
