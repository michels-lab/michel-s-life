# 2026-10-12 — Android compact-view accessibility regression gate

**Scope:** independently enhance the existing Android UI smoke gate while Calendar and weekly planner are being validated in their own branches; do not collide with those feature files.

**Why:** 360/412px visual screenshots and a green Android build do not prove 320px compact navigation, reduced-motion support, access to Settings/About controls, or scrollability. This is a separate QA requirement, not a parallel restyling of the same CSS.

**Implementation:** a new real Chromium/Playwright Android WebView fixture smoke at 360×915 and 320×915 with `prefers-reduced-motion: reduce`. Routes Dashboard, Missions, Story and Settings. Measures viewport overflow, accessible fixed bottom-nav touch geometry, actual computed animationName of top-level cards, five labeled social links in canonical About, and document vertical scrolling. Captures screenshots under `artifacts/android-ui-smoke/compact-accessibility/`. The Android UI smoke workflow runs this new check on candidate PR HEAD, and its path trigger includes the new file.

**Verification required:** all exact-head Android UI smoke, desktop UI, source, APK compile and Android 16 installed-candidate checks. This test is browser runtime evidence (NOT physical one-finger scroll / hardware keyboard verification). The enhanced QA contract may reveal previously hidden defects; repair them before integrating. No Windows theme, Chapter assets, domain data, build version or release changes.
