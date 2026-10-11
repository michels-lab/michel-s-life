#!/usr/bin/env python3
from pathlib import Path
import re

ANDROID = Path(__file__).resolve().parents[1]
REPO = ANDROID.parent

gradle = (ANDROID / "app/build.gradle.kts").read_text(encoding="utf-8")
cloud = (ANDROID / "app/src/main/java/com/michelslab/michelslife/CloudSync.kt").read_text(encoding="utf-8")
bridge = (ANDROID / "android-bridge.js").read_text(encoding="utf-8")
workflow = (REPO / ".github/workflows/android-build.yml").read_text(encoding="utf-8")

def one(pattern, text, label):
    match = re.search(pattern, text, re.MULTILINE)
    if not match:
        raise SystemExit(f"Could not read {label}")
    return match.group(1)

version_name = one(r'versionName\s*=\s*"([^"]+)"', gradle, "Gradle versionName")
version_code = int(one(r'versionCode\s*=\s*(\d+)', gradle, "Gradle versionCode"))
cloud_version = one(r'ANDROID_VERSION\s*=\s*"([^"]+)"', cloud, "DriveCloudEngine.ANDROID_VERSION")
bridge_version = one(r"__MICHELSLIFE_ANDROID_BRIDGE__='([^']+)'", bridge, "Android bridge version")
workflow_version = one(r'^\s*ANDROID_VERSION:\s*([^\s#]+)', workflow, "workflow ANDROID_VERSION")

versions = {
    "Gradle": version_name,
    "CloudSync": cloud_version,
    "bridge": bridge_version,
    "workflow": workflow_version,
}
if len(set(versions.values())) != 1:
    raise SystemExit("Android version metadata drift: " + ", ".join(f"{k}={v}" for k, v in versions.items()))
if version_code < 1:
    raise SystemExit("Android versionCode must be positive")

# The signed-transfer workflow must never claim a different Android identity
# from the APK actually produced by Gradle. The gate failed closed in 0.2.4
# because the staging manifest accidentally still expected 0.2.3.
staging = REPO / ".github/workflows" / f"stage-life-android-direct-v{version_name.replace('.', '')}.yml"
if staging.exists():
    contract = staging.read_text(encoding="utf-8")
    stage_name = one(r'and\s+\.versionName\s*==\s*"([^"]+)"', contract, "staging manifest versionName")
    stage_code = int(one(r'and\s+\.versionCode\s*==\s*(\d+)', contract, "staging manifest versionCode"))
    if stage_name != version_name or stage_code != version_code:
        raise SystemExit(
            f"Signed-transfer staging manifest identity drift: Gradle {version_name}/code {version_code}, "
            f"stage {stage_name}/code {stage_code}"
        )


print(f"OK: Android version metadata aligned at {version_name} (versionCode {version_code})")
