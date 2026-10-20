# Operación GRANADA — Cloud device separation smoke
Date: 2026-10-19.
Repository: michels-lab/michel-s-life. Issue #55.
Branch: granada/cloud-device-boundary-live-20261019.

New test tools/ui_cloud_device_boundary_granada_smoke.mjs uses two isolated Chromium contexts in Windows and Android modes. It exercises existing canonical cloud backup capture and shared storage allowlist using only artificial values. It verifies XP, mission IDs, Journal and theme can transfer in both directions without transferring per-device session keys, revision metadata, identity, notification keys, local recovery vaults or unknown storage entries. Malformed older backup fields are filtered during restore. Both receiving devices are recaptured to check privacy continues after import.

New step in ui-smoke workflow runs node --check and actual test in the built frontend bundle. CI pending until exact branch head checked. No APK, Windows package or release created. No native Android or frontend source changed. #134, #135 and #138 work remains isolated. Provider and real Galaxy account acceptance still required before closing #55.
