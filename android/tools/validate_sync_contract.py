#!/usr/bin/env python3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
cloud = (root / "app/src/main/java/com/michelslab/michelslife/CloudSync.kt").read_text(encoding="utf-8")
bridge = (root / "app/src/main/java/com/michelslab/michelslife/AndroidBridge.kt").read_text(encoding="utf-8")

required = {
    'https://www.googleapis.com/auth/drive.appdata': cloud,
    'michels_life_cloud_state.json': cloud,
    'michels_life_backup_': cloud,
    'michels_life_device_': cloud,
    'CLOUD_BACKUP_LIMIT = 10': cloud,
    'plusSeconds(3)': cloud,
    'michelsLifeHash': cloud,
    'michelsLifeDevice': cloud,
    'michelsLifeUpdatedAt': cloud,
    'cloudSync': bridge,
    'cloudDirty': bridge,
    'cloudAccept': bridge,
    'cloudOverview': bridge,
    'cloudRestoreBackup': bridge,
}
missing = [needle for needle, text in required.items() if needle not in text]
if missing:
    raise SystemExit("Android cloud contract missing: " + ", ".join(missing))
print("OK: Android cloud contract matches Michel's Life Windows sync primitives")
