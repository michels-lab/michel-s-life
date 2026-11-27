import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const ui=read('.github/workflows/ui-smoke.yml');
const mobile=read('.github/workflows/android-ui-smoke.yml');
const pipeline=read('.github/workflows/release-unified-v3223-a0212.yml');
const android=read('.github/workflows/android-build.yml');
const about=read('tools/ui_smoke_v303.mjs');
const intent=".michelslab/release-intents/unified-v3223-a0212.txt";

test('real UI suites trigger on owner intent SHA',()=>{
 assert.ok(ui.includes(intent),'desktop UI gate missing intent');
 assert.ok(mobile.includes(intent),'Android UI gate missing intent');
 assert.match(pipeline,/all\(\["Source validation", "UI smoke", "Android UI smoke"\]\[\];/);
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
