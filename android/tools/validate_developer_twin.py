#!/usr/bin/env python3
"""No Windows building; inspect isolated Android Developer Twin packaging."""
from pathlib import Path
import re

root=Path(__file__).resolve().parents[2]
js=(root/'src/MichelsLife/DeveloperDiagnostics.js').read_text(encoding='utf-8')
gradle=(root/'android/app/build.gradle.kts').read_text(encoding='utf-8')
main=(root/'android/app/src/main/java/com/michelslab/michelslife/MainActivity.kt').read_text(encoding='utf-8')
prepare=(root/'android/tools/prepare_bundle.py').read_text(encoding='utf-8')
manifest=(root/'android/app/src/main/AndroidManifest.xml').read_text(encoding='utf-8')
workflow=(root/'.github/workflows/android-build.yml').read_text(encoding='utf-8')
ui=(root/'.github/workflows/android-ui-smoke.yml').read_text(encoding='utf-8')
for name,src,required in [
 ('developer JS',js,['MichelsLabDeveloperTwin','function mark(event)','function saveAnnotation()','function audit()','function report()','ownerAnnotations','auditCoverage','owner observation','function openLogin()']),
 ('Gradle',gradle,['create("developerDebug")','applicationIdSuffix = ".developer"','versionNameSuffix = "-developer"','manifestPlaceholders["appAllowBackup"] = "false"']),
 ('Android native',main,['isDeveloperEdition','DeveloperReportBridge(this)','app/developer-diagnostics.js','Intent.ACTION_CREATE_DOCUMENT']),
 ('bundle',prepare,['developerDebug','developer-diagnostics.js']),
 ('manifest',manifest,['android:label="${appLabel}"','android:allowBackup="${appAllowBackup}"','android:dataExtractionRules="@xml/private_data_extraction_rules"']),
 ('build CI',workflow,[':app:assembleDeveloperDebug','MichelsLife-Android-Developer-CANDIDATE']),
 ('Android UI CI',ui,['ui_android_developer_twin_smoke.mjs']),
]:
 for needle in required:
  if needle not in src:
   raise SystemExit(f"{name} lacks {needle}")
if 'developer-diagnostics.js' in (root/'android/app/src/main/assets/app/index.html').read_text(encoding='utf-8') if (root/'android/app/src/main/assets/app/index.html').is_file() else False:
 raise SystemExit("Production shared HTML embeds Developer diagnostics")
if 'window.MichelsLabDeveloperTwin=' not in js or 'window.__mlvAndroidFastRoute' not in js:
 raise SystemExit("Developer UI or real user account route missing")
if 'function auditAll()' not in js or 'nativeRuntime:nativeSnapshot()' not in js:
 raise SystemExit("Developer Edition requires guided multi-section scan and native metrics")
if 'manifestPlaceholders["appAllowBackup"] = "true"' in gradle:
 raise SystemExit("Android packages must not use OS full-app backup of auth/WebView data")
privacy=(root/'android/app/src/main/res/xml/private_data_extraction_rules.xml').read_text(encoding='utf-8')
for tag in ('<cloud-backup>', '<device-transfer>'):
 if tag not in privacy:
  raise SystemExit("Android OS backup/transfer must explicitly deny private app data")
if 'runtimeSnapshot()' not in (root/'android/app/src/main/java/com/michelslab/michelslife/DeveloperReportBridge.kt').read_text(encoding='utf-8'):
 raise SystemExit("Developer native diagnostics snapshot missing")
if 'window.MichelsLabDeveloperNative?.saveReport' not in js:
 raise SystemExit("Developer Android native document export bridge missing")
if re.search(r'localStorage\.setItem\(\s*["\'](?:vida_rpg_personal_progress_v2|sb-)',js):
 raise SystemExit("Diagnostics may not write canonical app or auth storage")
if not (root/'tools/ui_android_developer_twin_smoke.mjs').is_file():
 raise SystemExit("Installed-like Android developer UI smoke missing")
print("PASS: separate Android Developer package, read-only probes, anchored notes, real account route, native report export, CI fixture and production isolation")
