#!/usr/bin/env python3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
repo = root.parent
cloud = (root / "app/src/main/java/com/michelslab/michelslife/CloudSync.kt").read_text(encoding="utf-8")
bridge = (root / "app/src/main/java/com/michelslab/michelslife/AndroidBridge.kt").read_text(encoding="utf-8")
frontend = (repo / "src/MichelsLife/frontend/index.html").read_text(encoding="utf-8")

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
    'SupabaseSyncV30216': frontend,
    'lqnkcqredlxrykynacwr.supabase.co': frontend,
    'sb_publishable_': frontend,
    "__MICHELSLIFE_PLATFORM__": frontend,
    "source_platform:platform()": frontend,
}
missing = [needle for needle, text in required.items() if needle not in text]
if missing:
    raise SystemExit("Android cloud contract missing: " + ", ".join(missing))
scan_suffixes = {".kt", ".kts", ".js", ".py", ".xml", ".properties"}
security_sources = [repo / "src/MichelsLife/frontend/index.html"]
security_sources.extend(
    p for p in root.rglob("*")
    if p.is_file() and p.suffix.lower() in scan_suffixes
)
for forbidden in ("sb_secret_", "service_role", "github_pat_", "ghp_"):
    offenders = [
        str(p.relative_to(repo))
        for p in security_sources
        if forbidden.lower() in p.read_text(encoding="utf-8", errors="replace").lower()
    ]
    if offenders:
        raise SystemExit(
            "Android executable/config source contains forbidden secret marker "
            + forbidden + ": " + ", ".join(offenders)
        )
print("OK: Android uses shared Supabase primary sync and executable/config sources contain no secret-role credentials")
