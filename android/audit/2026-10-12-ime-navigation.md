# 2026-10-12 — Android Journal keyboard viewport and navigation

The existing Android text-focus class hid the mini Focus timer but not the fixed five-tab bar. On a reduced keyboard viewport the tabs can obscure the canonical Journal editor.

Android-only CSS now hides the bottom tabs during editable focus, and the original focusout handler restores them. No Windows, themes, Chapters, data model, or release changes.

The new Playwright Android UI gate opens the real Journal at 360px and 412px, simulates a 620px viewport, enters text, asserts no horizontal clipping and >=16px input text, captures focused/restored screenshots, and checks tab restoration.

**Acceptance status:** candidate awaiting exact-head CI. A resized Chromium viewport is not a Samsung native IME test; physical Galaxy keyboard/insets/gestures and Android 16 installed screenshot review remain pending. Issue #54 stays open.
