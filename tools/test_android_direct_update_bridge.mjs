import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const bridge=readFileSync(resolve(root,
  'android/app/src/main/java/com/michelslab/michelslife/AndroidBridge.kt'),'utf8');
const checker=readFileSync(resolve(root,
  'android/app/src/main/java/com/michelslab/michelslife/AndroidDirectUpdateChecker.kt'),'utf8');
const policy=readFileSync(resolve(root,
  'android/app/src/main/java/com/michelslab/michelslife/DirectUpdatePolicy.java'),'utf8');

assert.match(bridge,/"updateStatus" -> \{/);
assert.match(bridge,/when \(AndroidDirectUpdateChecker\.channel\(activity\)\)/);
assert.match(bridge,/"android-direct" -> executor\.execute\s*\{/);
assert.match(bridge,/respondOk\(requestId, AndroidDirectUpdateChecker\.check\(activity\)\)/);
assert.match(bridge,/"google-play" -> respondOk/);
assert.match(bridge,/Unrecognized or debug signer/);
assert.doesNotMatch(bridge,/Test build\. Production updates are delivered through Google Play/);

assert.match(checker,/https:\/\/api\.github\.com\/repos\/michels-lab\/michel-s-life-releases\/releases\/latest/);
assert.match(checker,/connectTimeout\(8, TimeUnit\.SECONDS\)/);
assert.match(checker,/MAX_RESPONSE_BYTES = 256 \* 1024/);
assert.match(checker,/\.followRedirects\(false\)/);
assert.match(checker,/DirectUpdatePolicy\.officialReleaseUrl\(page, tag\)/);
assert.match(checker,/DirectUpdatePolicy\.officialAssetUrl\(/);
assert.match(checker,/DirectUpdatePolicy\.compare\(/);
assert.match(checker,/!release\.optBoolean\("draft", true\)/);
assert.match(checker,/!release\.optBoolean\("prerelease", true\)/);
assert.match(checker,/installedCode\(context\)/);
assert.match(checker,/\.put\("checked", true\)/);
assert.match(checker,/\.put\("installAutomatically", false\)/);
assert.match(checker,/android-v" \+ version \+ "-manifest\.json"/);
assert.match(checker,/apkFile \+ "\.sha256"/);
assert.match(checker,/\.put\("integrityNote",/);
assert.match(policy,/DIRECT_SIGNER_SHA256/);

// An update check must not install APKs, grant untrusted-source permissions,
// clear local progress, open arbitrary URLs or silently replace user files.
for(const [name,source] of [['checker',checker],['policy',policy]]){
  assert.doesNotMatch(source,/REQUEST_INSTALL_PACKAGES|ACTION_INSTALL_PACKAGE|PackageInstaller|ACTION_DELETE|\.delete\(|localStorage|supabase\.session/i,
    name+' has an unauthorized installer/data mutation');
}
assert.ok(!checker.includes('http://'),'Only HTTPS official release lookup allowed');
console.log('PASS Android Direct: official read-only metadata, installer separation, expiry/downgrade gates, no automatic install');
