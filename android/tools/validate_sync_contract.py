#!/usr/bin/env python3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
repo = root.parent
cloud = (root / "app/src/main/java/com/michelslab/michelslife/CloudSync.kt").read_text(encoding="utf-8")
bridge = (root / "app/src/main/java/com/michelslab/michelslife/AndroidBridge.kt").read_text(encoding="utf-8")
frontend = (repo / "src/MichelsLife/frontend/index.html").read_text(encoding="utf-8")
main_activity = (root / "app/src/main/java/com/michelslab/michelslife/MainActivity.kt").read_text(encoding="utf-8")
gradle = (root / "app/build.gradle.kts").read_text(encoding="utf-8")
# Production APK must never expose a remote debugging socket for account data.
guard = "if ((applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0)"
if guard not in main_activity or "WebView.setWebContentsDebuggingEnabled(true)" not in main_activity:
    raise SystemExit("Native state inspection must be gated by Android's debuggable-app flag")
if "isDebuggable = false" not in gradle:
    raise SystemExit("Direct distribution builds must explicitly disable debugging")

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

# Native Google Calendar can now READ through a separate, explicitly consented
# OAuth route. The generic desktop 'sync' action may publish in bulk, so it
# must remain rejected in Android until per-mission write approval exists.
# Never accept a fictional successful sync or claim a provider read silently.
calendar_action = bridge.split('"sync" ->', 1)
if len(calendar_action) != 2:
    raise SystemExit("Android Google Calendar desktop action is missing")
calendar_branch = calendar_action[1].split('else ->', 1)[0]
if 'respondError(' not in calendar_branch or 'publishing is not enabled' not in calendar_branch:
    raise SystemExit("Android must reject bulk Calendar publishing without explicit write consent")
if '"sync" -> respondOk(' in bridge:
    raise SystemExit("Android Calendar may not return a synthetic successful sync")
if '"calendarRead" -> activity.runOnUiThread' not in bridge:
    raise SystemExit("Android must use a real consented native Calendar read route")
if "calendarGateway.readEvents(" not in bridge:
    raise SystemExit("Android Calendar cannot report a successful read without contacting Google")
if '"calendarUpsert"' in bridge or '"calendarDelete"' in bridge:
    raise SystemExit("Native Calendar write actions require separate approval and scope")
if "Read Google Calendar" not in frontend or "calendarViewEvents()" not in frontend:
    raise SystemExit("Android Calendar UI must expose real fetched events")
if "if(opts.silent)return null;" not in frontend:
    raise SystemExit("Calendar OAuth must not be requested by an automatic background sync")

private_candidate = (repo / ".github/workflows/android-direct-private-candidate-v026.yml").read_text(encoding="utf-8")
# Owner-invoked signed-candidate tests must never run on feature refs or imply
# release publication; a workflow_dispatch event needs explicit approval.
# Compile the visual KPI gate in every Android source-validation job without
# requiring Pillow on non-signed CI paths or creating intermediate pycache files.
visual_gate = root / "tools/compare_signed_native_kpis.py"
compile(visual_gate.read_text(encoding="utf-8"), str(visual_gate), "exec")
if "MichelsLife-Android-InstallSmoke-v0.2.6" not in private_candidate:
    raise SystemExit("Signed test requires same-workflow canonical-verified debug evidence")
if "compare_signed_native_kpis.py" not in private_candidate:
    raise SystemExit("Signed private candidate must enforce Dashboard mission/contract visual parity")
if "workflow_dispatch:" not in private_candidate or "private_candidate_only:" not in private_candidate:
    raise SystemExit("Private signed Android candidate needs explicit manual Actions entrypoint")
if "github.ref == 'refs/heads/main'" not in private_candidate:
    raise SystemExit("Private signed Android candidate must reject non-main refs")
if "inputs.private_candidate_only == true" not in private_candidate:
    raise SystemExit("Manual signed Android candidate requires explicit private-only approval")
if 'MLV_REQUIRE_PROTECTED_SIGNED: "1"' not in private_candidate:
    raise SystemExit("Private signed APK smoke must enforce protected non-debuggable installation")

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
