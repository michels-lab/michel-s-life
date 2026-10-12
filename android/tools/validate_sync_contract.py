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
# Restore point requests originate in WebView. A canonical path string-prefix
# check is insufficient: /files/restore-points-backup starts with
# /files/restore-points but is outside the intended directory.
if "file.path.startsWith(base.path)" in bridge:
    raise SystemExit("Unsafe Android restore point path-prefix containment detected")
if "file.parentFile != base || !file.isFile" not in bridge:
    raise SystemExit("Android restore must require a regular file directly under its canonical restore directory")
if 'name.matches(Regex("[A-Za-z0-9._-]+"))' not in bridge:
    raise SystemExit("Android restore point file name must reject separators and invalid input")

scan_suffixes = {".kt", ".kts", ".js", ".py", ".xml", ".properties"}
security_sources = [repo / "src/MichelsLife/frontend/index.html"]
security_sources.extend(
    p for p in root.rglob("*")
    if p.is_file()
    and p.resolve() != Path(__file__).resolve()
    and p.suffix.lower() in scan_suffixes
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
