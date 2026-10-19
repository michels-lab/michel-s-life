#!/usr/bin/env python3
"""Android provider/update truthfulness and read-only permission boundaries."""
from pathlib import Path
import re

root=Path(__file__).resolve().parents[2]
bridge=(root/'android/app/src/main/java/com/michelslab/michelslife/AndroidBridge.kt').read_text(encoding="utf-8")
checker=(root/'android/app/src/main/java/com/michelslab/michelslife/AndroidDirectUpdateChecker.kt').read_text(encoding="utf-8")
main=(root/'android/app/src/main/java/com/michelslab/michelslife/MainActivity.kt').read_text(encoding="utf-8")
auth=(root/'android/app/src/main/java/com/michelslab/michelslife/GoogleAuthorizationCoordinator.kt').read_text(encoding="utf-8")
require=[
    ('native Calendar', '"sync" -> respondError' in bridge and
      'Google Calendar sync is not available on Android yet' in bridge),
    ('no synthetic Calendar counts', 'pushedMissionCount", 0' not in bridge and
      'googleEventCount", 0' not in bridge),
    ('official update check', 'AndroidDirectUpdateChecker.check' in bridge),
    ('unknown on offline', 'checkedOfficialRelease", false' in bridge and
      'updateAvailable", JSONObject.NULL' in bridge),
    ('Direct is distinct from Play', '"android-direct"' in bridge and
      '"google-play"' in bridge and '"developer"' in bridge),
    ('metadata is bounded', 'max = 240_000' in checker),
    ('read-only update discovery', 'installationAutomatic", false' in checker and
      'signatureVerifiedByDiscovery", false' in checker),
    ('exact official domain', 'api.github.com/repos/michels-lab/michel-s-life-releases/releases/latest' in checker),
    ('paired SHA filename', 'name + ".sha256"' in checker),
    ('foreign URL blocked', 'expectedAssetUrl' in checker and 'require(hasAssetUrl)' in checker),
    ('actual OAuth no calendar scopes claimed', 'Scopes.DRIVE_APPFOLDER' in auth and
      'CalendarContract.Events' not in bridge),
    ('navigation external fail closed', 'return true' in main and
      'loaded.path != "/assets/app/index.html"' in main),
]
for label,pass_ in require:
    if not pass_:
        raise SystemExit("FAIL: "+label)
if 'installPackage' in checker or 'PackageInstaller' in checker:
    raise SystemExit("Read-only update checker unexpectedly installs packages")
print("PASS: Google Calendar limitations are honest, update discovery is real and read-only, external links fail closed")
