import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const ui=read('.github/workflows/ui-smoke.yml');
const androidUI=read('.github/workflows/android-ui-smoke.yml');
const updater=read('.github/workflows/granada-android-direct-update.yml');
const source=read('.github/workflows/release-unified-v3233-a0222.yml');
const android=read('.github/workflows/android-build.yml');
const cs=read('src/MichelsLife/MichelsLife.csproj');
const gradle=read('android/app/build.gradle.kts');
const cloud=read('android/app/src/main/java/com/michelslab/michelslife/CloudSync.kt');
const bridge=read('android/android-bridge.js');
const bump=read('tools/bump_frontend_version.py');
const host=read('tools/materialize_host_source.py');
const note=read('docs/releases/v3.0.233.md');
const intent='.michelslab/release-intents/unified-v3233-a0222.txt';
const settings=read('.github/workflows/granada-settings-live-color.yml');
const classical=read('.github/workflows/granada-classical-focus.yml');
const story=read('.github/workflows/granada-story-focus-provenance.yml');
const dataHealth=read('.github/workflows/granada-data-health.yml');

test('future owner intent triggers ALL exact SHA gates',()=>{
 for(const [name,config] of [['UI',ui],['Android UI',androidUI],['Direct updater',updater]])
   assert.ok(config.includes(intent),name+' must include the 3.0.233 intent');
 assert.ok(source.includes(intent));
 assert.ok(settings.includes(intent),'Settings exact-SHA workflow must run');
 assert.ok(classical.includes(intent),'Classical music exact-SHA workflow must run');
 assert.ok(story.includes(intent),'Story/Focus source integrity must run on exact intent');
 assert.ok(dataHealth.includes(intent),'Data Health must run on exact intent');
 const gate=source.match(/all\(\[([^\]]+)\]\[\];/)?.[1]||'';
 for(const name of ['Source validation','UI smoke','Android UI smoke','GRANADA Android Direct safe update discovery','GRANADA Quick Mission and original Pomodoro audio','GRANADA cross-platform immersive Focus','GRANADA personal alarms — Windows and Android contracts','GRANADA Settings live color persistence','GRANADA classical Focus excerpts','GRANADA - Story Focus touch provenance','GRANADA Data Health and recovery safety'])
   assert.ok(gate.includes('"'+name+'"'),'exact SHA gate is missing '+name);
 assert.match(source,/\.head_sha==\$sha/);
});
test('both installed platform versions and bundlers agree',()=>{
 assert.ok(cs.includes('<Version>3.0.233</Version>'));
 assert.ok(cs.includes('<AssemblyVersion>3.0.233.0</AssemblyVersion>'));
 assert.ok(gradle.includes('versionName = "0.2.22"'));
 assert.ok(gradle.includes('versionCode = 24'));
 assert.ok(bridge.includes("__MICHELSLIFE_ANDROID_BRIDGE__='0.2.22'"));
 assert.ok(cloud.includes('ANDROID_VERSION = "0.2.22"'));
 assert.ok(bump.includes('TARGET_VERSION = "3.0.233"'));
 assert.ok(bump.includes('PREVIOUS_VERSIONS = ("3.0.232"'));
 assert.ok(host.includes("APP_VERSION='3.0.233'"));
 assert.ok(host.includes("LEGACY_APP_VERSIONS=('3.0.232'"));
 assert.equal((android.match(/ANDROID_VERSION:\s*'?0\.2\.22'?/g)||[]).length,4);
 assert.ok(!android.includes('ANDROID_VERSION: 0.2.18'));
});
test('source builds both signed candidates but leaves publication to destination',()=>{
 assert.match(source,/signed-native-android15:/);
 assert.match(source,/needs: \[android\]/);
 assert.match(source,/MLV_REQUIRE_PROTECTED_SIGNED: '1'/);
 assert.match(source,/steps\.primary\.outcome/);
 assert.match(source,/steps\.fallback\.outcome/);
 assert.match(source,/step4-after-native-finish\.png step5-after-relaunch\.png/);
 assert.match(source,/\.versionName=="0\.2\.22"/);
 assert.match(source,/\.versionCode==24/);
 assert.match(source,/MichelsLife-Android-Direct-v0\.2\.22\.apk/);
 assert.ok(!source.includes('RELEASES_REPO_TOKEN'),'retired broken cross-repo publisher must be absent');
 assert.ok(!source.includes('  publish-unified:'),'only destination-owned publisher may publish stable');
 assert.ok(note.includes('3.0.233')&&note.includes('0.2.22'));
});
test('all normal Android candidate native lanes still require actual same-run APK',()=>{
 for(const job of ['installed-candidate-smoke','installed-candidate-android15-smoke','installed-candidate-android14-smoke']){
  const i=android.indexOf('  '+job+':');
  assert.ok(i>0,job+' absent');
  assert.match(android.slice(i,i+500),/inputs\.build_direct != true/);
 }
 assert.match(android,/name: MichelsLife-Android-TEST-v\$\{\{ env\.ANDROID_VERSION \}\}/);
});


test('release validators cannot silently keep the previous build version',()=>{
 for(const path of ['tools/validate_generated_index.py','tools/validate_brand_identity.py']){
   const actual=read(path);
   assert.ok(actual.includes('3.0.233'),path+' must check version of THIS source release');
   assert.ok(!actual.includes('3.0.232'),path+' still validates previous release, rather than this one');
 }
});

test('source intent preflight checks the actual Android versionCode, not the previous release',()=>{
 assert.match(source,/grep -q 'versionCode = 24'/);
 assert.doesNotMatch(source,/grep -q 'versionCode = 23'/);
});
