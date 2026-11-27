import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root='src/MichelsLife/frontend/';
const script=readFileSync(root+'motivation-immersive.js','utf8');
const desktop=readFileSync(root+'focus-immersive.js','utf8');
const alarm=readFileSync(root+'personal-alarms.js','utf8');
const android=readFileSync('android/mobile-experience.js','utf8');
const native=readFileSync('android/app/src/main/java/com/michelslab/michelslife/NativePersonalAlarms.kt','utf8');
const overlay=readFileSync('android/app/src/main/java/com/michelslab/michelslife/PersonalAlarmOverlay.kt','utf8');
const bridge=readFileSync('android/app/src/main/java/com/michelslab/michelslife/AndroidBridge.kt','utf8');
const loader=readFileSync('tools/enable_i18n.py','utf8');
const desktopBundle=readFileSync('tools/replace_bundle_index.py','utf8');
const androidBundle=readFileSync('android/tools/prepare_bundle.py','utf8');
const STORE='vida_rpg_personal_progress_v2';
const OWNER='michelsLife.supabase.boardOwner.v30218';

function load({state,owner=null,signed=null,phrase='Today is a good day'}={}){
 const storage=new Map();
 if(state!==undefined)storage.set(STORE,JSON.stringify(state));
 if(owner!==null)storage.set(OWNER,owner);
 const calls=[];
 const native={rememberAlarmMotivation:(s)=>{calls.push(JSON.parse(s));return true;}};
 const w={
  getSmartMessage:()=>phrase,
  SupabaseSyncV30216:{session:()=>({user:signed?{id:signed}:null})},
  MichelsLifeAndroid:native,
  addEventListener:()=>{},setInterval:()=>{}
 };
 const d={
  readyState:'loading',
  addEventListener(){},
  querySelector:()=>null,
  getElementById:()=>null
 };
 const context={window:w,document:d,localStorage:{
  getItem:k=>storage.get(k)||null
 },console,Math,Date,Set,JSON};
 vm.runInNewContext(script,context,{timeout:1000});
 return {api:w.MichelsLifeMotivation,storage,calls};
}
test('saved visible affirmations are read from the real user board, not a mock bank',()=>{
 const {api}=load({state:{affirmations:[
   {text:'Visible',hidden:false},
   {text:'Invisible',hidden:true},
   {text:'Favorite',favorite:true,hidden:false},
   {text:'Visible',hidden:false}
 ],lastPhrases:['Keep going','Another step']}});
 const data=api.read();
 assert.deepEqual(Array.from(data.affirmations),['Favorite','Visible']);
 assert.ok(data.phrases.includes('Today is a good day'));
 assert.ok(data.phrases.includes('Keep going'));
 assert.ok(!data.affirmations.includes('Invisible'));
});
test('owner mismatch fails closed on personal affirmations, even if local board is stale',()=>{
 const {api,calls}=load({owner:'account-one',signed:'account-two',
  state:{affirmations:[{text:'Previous account secret',hidden:false}]}});
 assert.equal(api.read().affirmations.length,0);
 assert.equal(api.syncNative(),true);
 assert.equal(calls[0].affirmations.length,0);
 assert.ok(!JSON.stringify(calls[0]).includes('Previous account secret'));
});
test('native cache contains only bounded visible text and deduplicates on repeated sync',()=>{
 const huge='A'.repeat(500);
 const {api,calls}=load({state:{affirmations:[
  {text:huge,hidden:false},{text:'Never expose me',hidden:true}]},phrase:'Purpose'});
 assert.equal(api.syncNative(),true);
 assert.equal(api.syncNative(),true);
 assert.equal(calls.length,1);
 assert.equal(calls[0].affirmations[0].length,180);
 assert.ok(!JSON.stringify(calls).includes('Never expose me'));
});
test('selected affirmation and phrase are stable within one alarm or focus scene',()=>{
 const {api}=load({state:{affirmations:[{text:'First'},{text:'Second'}],lastPhrases:['One','Two']}});
 const selected=api.select('focus:work:123');
 assert.equal(api.select('focus:work:123').affirmation,selected.affirmation);
 assert.equal(api.select('focus:work:123').phrase,selected.phrase);
 assert.ok(selected.affirmation);
 assert.ok(selected.phrase);
});
test('both focus platforms and ring view show two motivating lines without duplicating timer state',()=>{
 assert.match(desktop,/mlv-desktop-focus-motivation/);
 assert.match(desktop,/MichelsLifeMotivation\?\.render/);
 assert.match(android,/mlv-android-focus-motivation/);
 assert.match(android,/MichelsLifeMotivation\?\.render/);
 assert.match(alarm,/mlv-alarm-motivation/);
 assert.match(alarm,/MichelsLifeMotivation\?\.render/);
 assert.match(script,/\.textContent=value/); // user authored copy is text, never HTML.
 assert.ok(!script.includes('innerHTML=value'));
});
test('Android closed-WebView overlay reads validated cached copy rather than assuming WebView is alive',()=>{
 assert.match(bridge,/fun rememberAlarmMotivation\(raw: String\)/);
 assert.match(native,/fun rememberMotivation\(context: Context, raw: String\)/);
 assert.match(native,/fun motivationForAlarm\(context: Context, id: String\)/);
 assert.match(native,/KEY_MOTIVATION/);
 assert.match(overlay,/NativePersonalAlarms\.motivationForAlarm\(app, id\)/);
 assert.match(overlay,/content\.addView\(label\("AFIRMACIÓN"/);
 assert.match(overlay,/content\.addView\(label\("FRASE"/);
 assert.match(overlay,/TYPE_APPLICATION_OVERLAY/);
});
test('new shared script is packed for both Windows and Android',()=>{
 assert.match(loader,/MOTIVATION_LOADER_MARKER/);
 assert.match(desktopBundle,/motivation-immersive\.js/);
 assert.match(androidBundle,/motivation-immersive\.js/);
});
