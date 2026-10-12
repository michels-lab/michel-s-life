# 2026-10-12 — Android screenshot gallery for design review

**Problem:** Android UI CI already collects many real browser screenshots for separate sections (360/412/320px), but packages them as loose files in one compressed artifact. This makes cross-screen visual review unnecessarily slow and promotes relying only on green geometry assertions.

**Test infrastructure:** new standard-library Python `tools/android_screenshot_gallery.py` indexes all PNG/JPEG/WebP fixtures into an offline, responsive `artifacts/android-ui-smoke/index.html` gallery. Images remain unmodified, are grouped by actual screenshot directory, and open the full original on click. All links/labels are HTML escaped/URL encoded. No remote assets, runtime scripts or account data. The script self-tests its generated paths and empty-state handling.

**Workflow:** Android UI smoke calls gallery generation `if: always()` before existing artifact upload, so a failed earlier test still retains any screenshots it captured and a browsable landing page for diagnosis.

**Validation:** Python self-test + exact-head Android UI workflow source/UI checks. The gallery only organizes synthetic Chromium screenshots; it is not a visual approval, physical Galaxy capture, or proof of real two-device synchronization. No app behavior, desktop style, version, signing or release change.
