import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(path)=>readFileSync(path,'utf8');
const native=read('android/app/src/main/java/com/michelslab/michelslife/VerifiedDirectApk.kt');
const bridge=read('android/app/src/main/java/com/michelslab/michelslife/AndroidBridge.kt');
const checker=read('android/app/src/main/java/com/michelslab/michelslife/AndroidDirectUpdateChecker.kt');
const manifest=read('android/app/src/main/AndroidManifest.xml');
const direct=read('android/app/src/directRelease/AndroidManifest.xml');
const paths=read('android/app/src/main/res/xml/verified_direct_update_paths.xml');
const gradle=read('android/app/build.gradle.kts');
const ui=read('android/android-bridge.js');

// Regression of the former discovery-only code: actual downloaded bytes and
// PackageManager archive certificate must be checked BEFORE OS install.
for(const pattern of [
 /fun stage\(activity: Activity,\s*onProgress:/,
 /AndroidDirectUpdateChecker\.check\(activity\)/,
 /if \(!metadata\.optBoolean\("checked"\) \|\| !metadata\.optBoolean\("updateAvailable"\)\)/,
 /DirectUpdatePolicy\.officialAssetUrl\(url, tag, filename\)/,
 /MessageDigest\.getInstance\("SHA-256"\)/,
 /if \(copied != expectedBytes \|\| hex\(sha\.digest\(\)\) != expectedSha\)/,
 /downloadVerified\(url, candidate, bytes, digest, onProgress\)/,
 /archiveVerified\(activity, candidate, version, code\)/,
 /info\.packageName != activity\.packageName/,
 /info\.versionName != expectedVersion/,
 /code != expectedCode/,
 /signatures\?\.size != 1/,
 /DirectUpdatePolicy\.DIRECT_SIGNER_SHA256 == signer/,
 /fun requestInstaller\(activity: Activity/,
 /val candidate = validatedCandidate\(activity\)/,
 /digestOf\(ready\) != expectedHash/,
 /archiveVerified\(activity, ready, version, code\)/,
 /code <= installedCode/,
 /FLAG_GRANT_READ_URI_PERMISSION/,
 /Intent\(Intent\.ACTION_VIEW\)/,
 /"application\/vnd\.android\.package-archive"/,
 /activity\.packageManager\.canRequestPackageInstalls\(\)/,
 /ACTION_MANAGE_UNKNOWN_APP_SOURCES/,
 /activity\.startActivity\(intent\)/,
 /candidate\.delete\(\)/,
 /marker\.delete\(\)/
]) assert.match(native,pattern,'Missing fail-closed installer contract: '+pattern);

for(const action of ['updateReady','updateDiscard','updateStage','updateInstall','updatePermissionSettings']) {
 assert.match(bridge,new RegExp('"'+action+'" -> executor\\.execute'),'Missing off-thread '+action);
 assert.match(ui,new RegExp("'"+action+"'"),'Missing Android UI action '+action);
}
assert.match(bridge,/VerifiedDirectApk\.readiness\(activity\)/);
assert.match(bridge,/VerifiedDirectApk\.discard\(activity\)/);
assert.match(bridge,/"updateCancel" -> \{/);
assert.doesNotMatch(bridge,/"updateCancel" -> executor\.execute/,
  'Cancel cannot share the busy downloader executor');
assert.match(bridge,/VerifiedDirectApk\.cancel\(activity\)/);
assert.match(bridge,/\.put\("progress", true\)/);
assert.match(bridge,/\.put\("bytes", bytes\)/);
assert.match(bridge,/\.put\("total", total\)/);
assert.match(native,/private val cancelRequested = AtomicBoolean\(false\)/);
assert.match(native,/private val activeCall = AtomicReference<Call\?>\(null\)/);
assert.match(native,/val call = client\.newCall\(request\)/);
assert.match(native,/activeCall\.set\(call\)/);
assert.match(native,/if \(cancelRequested\.get\(\)\) call\.cancel\(\)/);
assert.match(native,/activeCall\.compareAndSet\(call, null\)/);
assert.match(native,/activeCall\.get\(\)\?\.cancel\(\)/);
assert.match(native,/activeCall\.getAndSet\(null\)\?\.cancel\(\)/);
assert.match(native,/val cancelled = cancelRequested\.get\(\) \|\|/,
  'OkHttp cancel causes IOException and must still be reported as Cancelled');
assert.match(native,/cancelRequested\.set\(true\)/);
assert.match(native,/java\.util\.concurrent\.CancellationException/);
assert.match(native,/onProgress\(copied, expectedBytes\)/);
assert.match(native,/nextProgress = copied \+ 524_288L/);
assert.match(native,/fun cancel\(activity: Activity\): JSONObject/);
assert.match(native,/\.put\("cancelled", cancelled\)/);
assert.match(ui,/mlv-android-cancel-update/);
assert.match(ui,/mlv-android-update-progress/);
assert.match(ui,/callNative\(cancel,'updateCancel',20000/);
assert.match(ui,/if\(data\.progress===true\)/);
assert.match(ui,/Number\.isFinite\(bytes\)/);
assert.match(ui,/bytes<=total/);
assert.match(ui,/cancel\.addEventListener\('click'/);
assert.match(bridge,/VerifiedDirectApk\.stage\(activity\)/);
assert.match(bridge,/VerifiedDirectApk\.requestInstaller\(activity\)/);
assert.match(bridge,/VerifiedDirectApk\.openPermissionSettings\(activity\)/);
assert.match(ui,/mlv-android-discard-update/);
assert.match(ui,/callNative\(resumeRequest,'updateReady',20000/);
assert.match(ui,/if\(userRequestedUpdate\)return/);
assert.match(ui,/discard\.addEventListener\('click'/);
assert.match(ui,/callNative\(discard,'updateDiscard',20000/);
assert.match(ui,/mlv-android-stage-update/);
assert.match(ui,/mlv-android-install-update/);
assert.match(ui,/mlv-android-permission-update/);
assert.match(ui,/stage\.addEventListener\('click'/);
assert.match(ui,/install\.addEventListener\('click'/);
assert.match(ui,/permission\.addEventListener\('click'/);
// Previously staged APKs must be checked from DISK on app restart; a
// withdrawn release must never reach the OS package installer.
assert.match(native,/private val staging = AtomicBoolean\(false\)/);
assert.match(native,/staging\.compareAndSet\(false, true\)/);
assert.match(native,/fun readiness\(activity: Activity\): JSONObject/);
assert.match(native,/fun discard\(activity: Activity\): JSONObject/);
assert.match(native,/digestOf\(ready\) != expectedHash/);
assert.match(native,/!archiveVerified\(activity, ready, version, code\)/);
assert.match(native,/private fun matchesCurrentOfficialRelease\(/);
assert.match(native,/AndroidDirectUpdateChecker\.check\(activity\)/);
assert.match(native,/latest\.optString\("verifiedApkSha256"\) == receipt\.optString\("sha256"\)/);
assert.match(native,/if \(!matchesCurrentOfficialRelease\(activity, candidate\.second\)\)/);
assert.match(native,/\.put\("stale", true\)/);
assert.match(native,/listOf\(File\(dir, MARKER\), File\(dir, PENDING_APK\),/);
assert.match(native,/if \(staging\.get\(\)\)/);
assert.match(checker,/verifiedApkSha256/);
assert.match(checker,/verifiedApkUrl/);
assert.match(checker,/verifiedApkSize/);
assert.match(manifest,/android:exported="false"/);
assert.match(manifest,/android:grantUriPermissions="true"/);
assert.match(manifest,/androidx\.core\.content\.FileProvider/);
assert.match(manifest,/verified_direct_update_paths/);
assert.doesNotMatch(manifest,/REQUEST_INSTALL_PACKAGES/,'Play/debug builds must not have sideload permission');
assert.match(direct,/REQUEST_INSTALL_PACKAGES/);
assert.match(paths,/<cache-path name="signed-direct-updates" path="verified-direct-updates\/" \/>/);
assert.doesNotMatch(paths,/<root-path|<external-path|<files-path/,'Only private staging cache can be shared');
assert.match(gradle,/androidx\.core:core:/);

// Installer does not get the URL/hash from JS; the native layer re-fetches
// official metadata. No silent OS installer or local state mutation.
assert.doesNotMatch(native,/\.installPackage\(|PackageInstaller\.Session|pm\.install|Runtime\.getRuntime/);
assert.doesNotMatch(native,/localStorage|SharedPreferences|DATABASE|supabase|cloud\.delete/i);
assert.doesNotMatch(native,/http:\/\//i);
console.log('PASS Direct APK native contract: independent re-attestation, digest, package, signer, size, scoped FileProvider and explicit OS-gated taps');
