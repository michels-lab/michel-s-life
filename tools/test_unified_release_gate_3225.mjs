import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const ui=read('.github/workflows/ui-smoke.yml');
const mobile=read('.github/workflows/android-ui-smoke.yml');
const pipeline=read('.github/workflows/release-unified-v3225-a0214.yml');
const android=read('.github/workflows/android-build.yml');
const about=read('tools/ui_smoke_v303.mjs');
const intent=".michelslab/release-intents/unified-v3225-a0214.txt";

test('real UI suites trigger on owner intent SHA',()=>{
 assert.ok(ui.includes(intent),'desktop UI gate missing intent');
 assert.ok(mobile.includes(intent),'Android UI gate missing intent');
 assert.match(pipeline,/all\(\["Source validation", "UI smoke", "Android UI smoke", "GRANADA Android Direct safe update discovery"\]\[\];/);
 assert.match(pipeline,/\.head_sha==\$sha/);
});
test('About uses candidate version, never prior public version',()=>{
 assert.match(about,/readFileSync\('src\/MichelsLife\/MichelsLife\.csproj'/);
 assert.match(about,/aboutBrand\.version===/);
 assert.ok(!about.includes("v3.0.222"),'About test hard-codes an older version');
});
test('release requires actual signed Android Direct installed screens',()=>{
 assert.match(pipeline,/signed-native-android15:/);
 assert.match(pipeline,/needs: \[exact-source, windows, android, signed-native-android15\]/);
 assert.match(pipeline,/MLV_REQUIRE_PROTECTED_SIGNED: '1'/);
 assert.match(pipeline,/MLV_REQUIRE_NATIVE_STATE_PROBE: '0'/);
 assert.match(pipeline,/SIGNED_DIRECT_NATIVE_API35_PASS/);
 assert.match(pipeline,/steps\.primary\.outcome/);
 assert.match(pipeline,/steps\.fallback\.outcome/);
 assert.match(pipeline,/step4-after-native-finish\.png step5-after-relaunch\.png/);
});
test('debug-native test matrix remains required on regular PR/push',()=>{
 for(const job of ['installed-candidate-smoke','installed-candidate-android15-smoke','installed-candidate-android14-smoke']){
  const index=android.indexOf('  '+job+':');
  assert.ok(index>=0,'missing '+job);
  assert.match(android.slice(index,index+500),/inputs\.build_direct != true/);
 }
});
test('publisher verifies provenance and hashes before public stable visibility',()=>{
 assert.match(pipeline,/signerCertSha256==\$cert/);
 assert.match(pipeline,/test -n "\$GH_TOKEN" && test -n "\$ANDROID_CERT_PIN"/);
 assert.match(pipeline,/sha256sum -c/);
 assert.match(pipeline,/gh release download "\$TAG"/);
 assert.match(pipeline,/gh release edit "\$TAG" --repo "\$DESTINATION" --draft=false --latest/);
});

test('the next signed stable version is aligned across Windows, Android and the official release publisher',()=>{
 const csproj=read('src/MichelsLife/MichelsLife.csproj');
 const gradle=read('android/app/build.gradle.kts');
 const androidBridge=read('android/android-bridge.js');
 const sourceVersion=read('android/app/src/main/java/com/michelslab/michelslife/CloudSync.kt');
 const bump=read('tools/bump_frontend_version.py');
 const materialize=read('tools/materialize_host_source.py');
 assert.match(csproj,/<Version>3\.0\.225<\/Version>/);
 assert.match(gradle,/versionName = "0\.2\.14"/);
 assert.match(gradle,/versionCode = 16/);
 assert.match(androidBridge,/__MICHELSLIFE_ANDROID_BRIDGE__='0\.2\.14'/);
 assert.match(sourceVersion,/ANDROID_VERSION = "0\.2\.14"/);
 assert.match(bump,/TARGET_VERSION = "3\.0\.225"/);
 assert.match(materialize,/APP_VERSION='3\.0\.225'/);
 assert.ok(!pipeline.includes('MichelsLife-Android-Direct-v0.2.12.apk'), 'old signed APK reused');
 assert.ok(!pipeline.includes('MichelsLife-Setup-v3.0.223.exe'), 'old Windows binary reused');
 assert.match(pipeline,/versionCode==16/);
 assert.match(pipeline,/android_version_code':16/);
 assert.match(pipeline,/TAG: v3\.0\.225-android-v0\.2\.14/);
});
test('the next Android Direct updater is in the signed stable release and exact-SHA gate',()=>{
 const updater=read('.github/workflows/granada-android-direct-update.yml');
 const contract=read('android/app/src/main/java/com/michelslab/michelslife/AndroidDirectUpdateChecker.kt');
 const install=read('android/app/src/main/java/com/michelslab/michelslife/VerifiedDirectApk.kt');
 const policy=read('android/app/src/main/java/com/michelslab/michelslife/DirectUpdatePolicy.java');
 const intent='.michelslab/release-intents/unified-v3225-a0214.txt';
 assert.ok(updater.includes(intent),'exact owner-intent updater gate not triggered');
 assert.ok(pipeline.includes('GRANADA Android Direct safe update discovery'),'updater policy not required');
 assert.match(contract,/tagMatchesAndroidVersion\(tag, version\)/);
 assert.match(policy,/androidVersionFromTag\(String tag\)/);
 assert.match(install,/fun requestInstaller\(activity: Activity/);
 assert.match(install,/DirectUpdatePolicy\.DIRECT_SIGNER_SHA256 == signer/);
 const backup=read('src/MichelsLife/frontend/index.html');
 assert.match(backup,/function mlvRestoreSharedStorageKeys\(raw,options=\{\}\)/);
 assert.match(backup,/source:'google-drive-download'/);
});

test('all Android debug-native validation arms consume the actual new APK, not a stale public version',()=>{
 assert.equal((android.match(/ANDROID_VERSION:\s*'?0\.2\.14'?/g)||[]).length,4,
   'global Android build and all three native device jobs must use 0.2.14');
 assert.doesNotMatch(android,/ANDROID_VERSION:\s*'?0\.2\.12'?/);
 assert.match(android,/name: MichelsLife-Android-TEST-v\$\{\{ env\.ANDROID_VERSION \}\}/);
});
