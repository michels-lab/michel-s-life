import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('src/MichelsLife/frontend/index.html','utf8');
const localStart=source.indexOf('function validDateKey(v){');
const localEnd=source.indexOf('function syncRange(){',localStart);
const start=source.indexOf('function androidMissionSelection(){');
const end=source.indexOf('function googlePaneHTML(){',start);
assert.ok(localStart>0&&localEnd>localStart&&start>0&&end>start,'production code not found');
const production=source.slice(localStart,localEnd)+'\n'+source.slice(start,end);
const futureDate='2026-12-03';
let passes=0;
function harness(options={}){
 const owner={id:'account-a'}, requests=[], renders=[];
 const state={missions:options.missions||[
  {id:'mission-1',name:'Write specs & review',scheduledDate:futureDate,description:'Local only'},
  {id:'mission-2',name:'R&D <script>alert(1)</script>',scheduledDate:'2026-12-05'}
 ],settings:{},xp:123,journal:[{id:'journal-local'}]};
 const runtime={busy:false,error:'',notice:'',calendarSelectedMissionId:'',calendarPublishPreview:null};
 const win={__MICHELSLIFE_PLATFORM__:options.platform||'android',
   MichelsLifeAndroid:options.unavailable?{}:{calendarMissionWriteAvailable:()=>true},
   SupabaseSyncV30216:{session:()=>({user:{id:owner.id}})}};
 const ctx=vm.createContext({state,runtime,window:win,document:{documentElement:{lang:options.lang||'es'}},
  Date,Number,String,Array,Error,JSON,Map,esc:v=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),
  mountGoogleSettings:()=>renders.push(runtime.notice),
  bridge:async(action,payload)=>{requests.push({action,payload});if(options.provider) return options.provider(action,payload);
   return {provider:'google-calendar',missionId:payload.missionId,action:action==='calendarMissionRemove'?'removed':'created',account:'example@test.local'};}
 });
 vm.runInContext(production+
  '\nthis.selectMission=androidMissionSelection;this.renderWriter=androidMissionWriterHtml;this.write=androidMissionWriteFromReview;',ctx,{timeout:1000});
 return {ctx,owner,requests,renders,state,runtime,select:()=>ctx.selectMission(),html:()=>ctx.renderWriter(),write:()=>ctx.write()};
}
const normal=harness();
assert.match(normal.html(),/Google Calendar · Misiones/);
assert.match(normal.html(),/calendar-review-publish/);
assert.match(normal.html(),/calendar-review-remove/);
assert.doesNotMatch(normal.html(),/<script>alert/,'mission title must be escaped');
assert.equal(normal.requests.length,0,'Rendering a pane must never ask for Calendar scopes or write');
const selected=normal.select();
assert.equal(selected.start,futureDate);
assert.equal(selected.end,'2026-12-04');
assert.equal(selected.allDay,true);
assert.equal(selected.ownerId,'account-a');
passes++;
normal.runtime.calendarPublishPreview={...selected,remove:false};
const created=await normal.write();
assert.equal(created.action,'created');
assert.equal(normal.requests.length,1);
assert.equal(normal.requests[0].action,'calendarMissionUpsert');
assert.equal(normal.requests[0].payload.confirmed,true);
assert.equal(normal.requests[0].payload.missionId,'mission-1');
assert.equal(normal.state.xp,123);
assert.equal(normal.state.journal.length,1,'Google Calendar cannot modify Journal');
assert.equal(normal.state.missions.length,2);
assert.equal(normal.runtime.calendarPublishPreview,null);
passes++;
normal.runtime.calendarPublishPreview={...selected,remove:true};
const deleted=await normal.write();
assert.equal(deleted.action,'removed');
assert.equal(normal.requests[1].action,'calendarMissionRemove');
assert.equal(normal.state.missions.length,2);
passes++;
const stale=harness();
stale.runtime.calendarPublishPreview={...stale.select(),remove:false};
stale.state.missions[0].name='Changed after review';
await assert.rejects(()=>stale.write(),/Mission or account changed/);
assert.equal(stale.requests.length,0);
passes++;
const switched=harness();
switched.runtime.calendarPublishPreview={...switched.select(),remove:false};
switched.owner.id='account-b';
await assert.rejects(()=>switched.write(),/Mission or account changed/);
assert.equal(switched.requests.length,0);
passes++;
const busy=harness();
busy.runtime.calendarPublishPreview={...busy.select(),remove:false};
busy.runtime.busy=true;
await assert.rejects(()=>busy.write(),/Review one Calendar mission/);
assert.equal(busy.requests.length,0);
passes++;
const failure=harness({provider:async()=>{throw Error('Bearer SECRET never echo')}});failure.runtime.calendarPublishPreview={...failure.select(),remove:false};
assert.equal(await failure.write(),null);
assert.equal(failure.runtime.busy,false);
assert.doesNotMatch(failure.runtime.error,/SECRET/);
assert.equal(failure.requests.length,1);
passes++;
const forged=harness({provider:async()=>({action:'created',provider:'calendar.google.fake',missionId:'mission-1'})});
forged.runtime.calendarPublishPreview={...forged.select(),remove:false};
assert.equal(await forged.write(),null);
assert.match(forged.runtime.error,/could not confirm/);
passes++;
const unavailable=harness({unavailable:true});
assert.match(unavailable.html(),/no admite escritura/);
assert.doesNotMatch(unavailable.html(),/data-mlv190-google="calendar-review-publish"[^>]*>Confirmar/);
assert.equal(unavailable.requests.length,0);
passes++;
const desktop=harness({platform:'windows'});
assert.equal(desktop.html(),'');
assert.equal(desktop.requests.length,0);
passes++;
const absent=harness({missions:[{id:'m',name:'Undated mission'}]});
assert.throws(()=>absent.select(),/Choose a dated mission/);
assert.match(absent.html(),/Agrega una fecha/);
passes++;
const rollover=harness({missions:[{id:'year-end',name:'Close year',scheduledDate:'2026-12-31'}]});
assert.equal(rollover.select().end,'2027-01-01');
passes++;
const invalid=harness({missions:[{id:'invalid',name:'Invalid day',scheduledDate:'2026-02-30'}]});
assert.throws(()=>invalid.select(),/Mission date is invalid/);
passes++;
console.log('PASS '+passes+'/'+passes+' real Android Calendar mission-write UI, explicit confirm, account-boundary and XP isolation cases');
