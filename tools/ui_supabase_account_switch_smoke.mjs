import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Two *different* synthetic Supabase account IDs sharing one installed
// WebView profile. No credentials or user data leave this test.
const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const host='https://lqnkcqredlxrykynacwr.supabase.co';
const ids={a:'00000000-0000-0000-0000-000000000108',b:'00000000-0000-0000-0000-000000000109',c:'00000000-0000-0000-0000-000000000110'};
const GUEST_MISSION='granada-guest-private-mission';
const A_MISSION='granada-account-a-mission';
const B_MISSION='granada-account-b-mission';
const JOURNAL={
  guest:JSON.stringify({'2026-10-19':'GRANADA_GUEST_NOT_CONSENTED'}),
  a:JSON.stringify({'2026-10-19':'GRANADA_A_PRIVATE_JOURNAL'}),
  b:JSON.stringify({'2026-10-19':'GRANADA_B_PRIVATE_JOURNAL'}),
  c:JSON.stringify({'2026-10-19':'GRANADA_C_REMOTE_JOURNAL'})
};
const byMail={'a@example.test':ids.a,'b@example.test':ids.b,'c@example.test':ids.c};
const remote=new Map(),writes=new Map(),history=[];
const ok=(v,msg)=>assert.ok(v,msg);
const android=process.env.MLV_ACCOUNT_SWITCH_PLATFORM==='android';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:android?{width:412,height:915}:{width:1260,height:780}});
try{
  await context.addInitScript((isAndroid)=>{
    if(isAndroid)window.__MICHELSLIFE_PLATFORM__='android';
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.onboardingCompleted.v1','1');
  },android);
  await context.route(host+'/**',async route=>{
    const req=route.request(),u=new URL(req.url()),p=u.pathname+u.search;
    const method=req.method().toUpperCase();
    const body=req.postData()?JSON.parse(req.postData()):null;
    const token=String(req.headers().authorization||'');
    const id=Object.values(ids).find(x=>token.includes(x))||'';
    const json=(v,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(v)});
    if(p.startsWith('/auth/v1/token?grant_type=password')){
      const who=byMail[body?.email];if(!who)return json({message:'unknown mock account'},403);
      return json({access_token:'token_'+who,refresh_token:'refresh_'+who,expires_in:3600,user:{id:who,email:body.email}});
    }
    if(p.startsWith('/auth/v1/logout'))return json({});
    if(!id)return json({message:'mock auth identity missing'},403);
    if(p.startsWith('/rest/v1/ml_state?select='))return json(remote.has(id)?[structuredClone(remote.get(id))]:[]);
    if(p==='/rest/v1/ml_state'&&method==='POST'){
      if(remote.has(id))return json({message:'duplicate'},409);
      remote.set(id,structuredClone(body));writes.set(id,(writes.get(id)||0)+1);return json([body]);
    }
    if(p.startsWith('/rest/v1/ml_state?on_conflict=')){
      remote.set(id,structuredClone(body));writes.set(id,(writes.get(id)||0)+1);return json([body]);
    }
    if(p.startsWith('/rest/v1/ml_state?user_id=eq.')&&method==='PATCH'){
      const before=remote.get(id),rev=Number(String(u.searchParams.get('revision')||'').replace(/^eq\./,''));
      if(!before||before.revision!==rev)return json([]);
      remote.set(id,{...before,...structuredClone(body)});writes.set(id,(writes.get(id)||0)+1);
      return json([remote.get(id)]);
    }
    if(p==='/rest/v1/ml_state_history'&&method==='POST'){
      history.push({user_id:id,...body});return json({});
    }
    if(p.startsWith('/rest/v1/ml_devices?on_conflict='))return json({});
    if(p.startsWith('/rest/v1/ml_devices?select='))return json([]);
    if(p.startsWith('/rest/v1/ml_state_history?select='))return json([]);
    return json({message:'unknown mock path '+method+' '+p},500);
  });
  const page=await context.newPage();
  const ready=()=>page.waitForFunction(()=>window.SupabaseSyncV30216&&typeof state!=='undefined',null,{timeout:30000});
  await page.goto(url,{waitUntil:'domcontentloaded'});await ready();
  const login=async email=>{
    await page.evaluate(async email=>window.SupabaseSyncV30216.signIn(email,'synthetic-password'),email);
  };
  const logout=async()=>{
    // Native logout must reload; do not race the following account sign-in.
    const reloaded=page.waitForEvent('load',{timeout:30000});
    await page.evaluate(async()=>window.SupabaseSyncV30216.signOut());
    await reloaded;await ready();
  };
  const local=()=>page.evaluate(()=>({
    xp:Number(state.xp||0),
    owner:localStorage.getItem('michelsLife.supabase.boardOwner.v30218'),
    session:window.SupabaseSyncV30216.session()?.user?.id||null,
    stored:Number(JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}').xp||0),
    vaultA:JSON.parse(localStorage.getItem('michelsLife.supabase.localAccount.v30218.'+
      encodeURIComponent('00000000-0000-0000-0000-000000000108'))||'null'),
    vaultB:JSON.parse(localStorage.getItem('michelsLife.supabase.localAccount.v30218.'+
      encodeURIComponent('00000000-0000-0000-0000-000000000109'))||'null'),
    guestVault:JSON.parse(localStorage.getItem('michelsLife.supabase.localGuest.v30218')||'null'),
    journal:localStorage.getItem('michelsLife.journal.v30184'),
    missionIds:(state.missions||[]).map(m=>m.id),
    sessionStorageAuth:!!localStorage.getItem('michelsLife.supabase.session.v30216')
  }));
  // Unowned guest data must be preserved as an opt-in-only, recoverable local
  // vault, NEVER silently uploaded to the first Supabase account.
  await page.evaluate(({mission,journal})=>{
    state.xp=314;
    state.missions.push({id:mission,name:'Guest synthetic mission',type:'oneoff',
      category:'academic',difficulty:'medium',xp:50,coins:0,days:[],
      createdAt:'2026-10-19T12:00:00Z',completions:[]});
    localStorage.setItem('michelsLife.journal.v30184',journal);
    localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify(state));
  },{mission:GUEST_MISSION,journal:JOURNAL.guest});
  await login('a@example.test');
  const aInitial=await local();
  ok(aInitial.xp!==314&&!aInitial.missionIds.includes(GUEST_MISSION)&&
    aInitial.journal!==JOURNAL.guest,
    'First account silently retained unowned guest progress');
  ok(aInitial.guestVault?.snapshot?.state?.missions?.some(m=>m.id===GUEST_MISSION)&&
    aInitial.guestVault.snapshot.localStorage?.['michelsLife.journal.v30184']===JOURNAL.guest,
    'Guest mission or Journal was not retained in a reversible local vault');
  ok(!remote.has(ids.a)&&!(writes.get(ids.a)||0),
    'First A login created remote master without owner approval');
  ok((await page.evaluate(()=>({
    setup:window.SupabaseSyncV30216.runtime.firstMasterPending,
    conflict:window.SupabaseSyncV30216.runtime.cloudConflict,
    modalVisible:document.getElementById('mlv197CloudConflictOverlay')?.classList.contains('show')||false
  }))).setup===true,'New A must show explicit owner-setup pending state');
  ok(!(await page.evaluate(()=>
    document.getElementById('mlv197CloudConflictOverlay')?.classList.contains('show'))),
    'An empty remote account must not obstruct Guest import or Sync actions with conflict modal');

  // The ONLY guest import action must show the actual destination account and
  // respect Cancel without altering either canonical local state or remote.
  await page.evaluate(()=>{
    state.activeTab='settings';renderAll();
    window.LeftNavV30171.buildSettings();
    window.LeftNavV30171.activateSetting('sync');
  });
  const guestImport=page.locator('[data-mlv216-supa="import-guest"]');
  await guestImport.waitFor({state:'visible',timeout:10000});
  const aBeforeDecline=writes.get(ids.a)||0;
  let confirmMessage='';
  page.once('dialog',async dialog=>{
    confirmMessage=dialog.message();
    await dialog.dismiss();
  });
  await guestImport.click();
  await page.waitForTimeout(170);
  ok(confirmMessage.includes('a@example.test')&&
    confirmMessage.toLowerCase().includes('import'),
    'Guest import did not show a destination-account consent confirmation');
  ok((writes.get(ids.a)||0)===aBeforeDecline,
    'Dismissing guest import unexpectedly uploaded progress');
  const afterDecline=await local();
  ok(afterDecline.guestVault?.snapshot?.state?.xp===314&&
    !afterDecline.missionIds.includes(GUEST_MISSION)&&
    afterDecline.journal!==JOURNAL.guest,
    'Dismissing guest import discarded vault or applied guest data');

  ok((await page.evaluate(()=>window.SupabaseSyncV30216.platform()))===(android?'android':'windows'),'Platform detection changed');
  ok(!remote.has(ids.a),'Sign-in or declined guest import created A cloud master');
  const createdA=await page.evaluate(async()=>
    window.SupabaseSyncV30216.sync('upload',{silent:true}));
  ok(createdA?.user_id===ids.a&&remote.get(ids.a)?.revision===1&&writes.get(ids.a)===1,
    'Explicit A account master choice did not create one owned remote revision');
  ok(!remote.get(ids.a)?.snapshot?.state?.missions?.some(m=>m.id===GUEST_MISSION)&&
    remote.get(ids.a)?.snapshot?.localStorage?.['michelsLife.journal.v30184']!==JOURNAL.guest,
    'Owner-approved empty A master unexpectedly imported guest mission/Journal');
  await page.evaluate(async ({mission,journal})=>{
    state.xp=777;state.history.push({id:'a-secret-history',type:'private',description:'A_ONLY'});
    state.missions.push({id:mission,name:'A only synthetic mission',type:'oneoff',
      category:'academic',difficulty:'medium',xp:50,coins:0,days:[],
      createdAt:'2026-10-19T12:00:00Z',completions:[]});
    localStorage.setItem('michelsLife.journal.v30184',journal);
    localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify(state));
    await window.SupabaseSyncV30216.push('a_fixture');
  },{mission:A_MISSION,journal:JOURNAL.a});
  ok(remote.get(ids.a).snapshot.state.xp===777,'A master missing private data');
  ok(remote.get(ids.a).snapshot.state.missions?.some(m=>m.id===A_MISSION)&&
    remote.get(ids.a).snapshot.localStorage?.['michelsLife.journal.v30184']===JOURNAL.a,
    'A canonical cloud snapshot lost account-specific mission/Journal');
  const aWrites=writes.get(ids.a);
  await logout();
  const afterLogout=await local();
  ok(afterLogout.xp!==777&&afterLogout.stored!==777,'A board remains visible after logout');
  ok(!afterLogout.owner&&!afterLogout.session&&!afterLogout.sessionStorageAuth,
    'Logout left an authenticated owner or Supabase token');
  ok(afterLogout.vaultA?.snapshot?.state?.xp===777,'A local recovery vault missing');
  ok(!afterLogout.missionIds.includes(A_MISSION)&&
    !afterLogout.missionIds.includes(GUEST_MISSION)&&
    afterLogout.journal!==JOURNAL.a&&afterLogout.journal!==JOURNAL.guest,
    'Logout exposed account/guest missions or journal');
  ok(afterLogout.vaultA?.snapshot?.state?.missions?.some(m=>m.id===A_MISSION)&&
    afterLogout.vaultA.snapshot.localStorage?.['michelsLife.journal.v30184']===JOURNAL.a,
    'Logout lost A mission or journal backup');

  await login('b@example.test');
  const b=await local();
  ok(b.owner===ids.b&&b.session===ids.b,'B did not receive its own owner identity');
  ok(b.xp!==777&&b.stored!==777,'B sees A local progress');
  ok(!b.missionIds.includes(A_MISSION)&&!b.missionIds.includes(GUEST_MISSION)&&
    b.journal!==JOURNAL.a&&b.journal!==JOURNAL.guest,
    'B sees A or guest mission/Journal without consent');
  ok(!remote.has(ids.b)&&!(writes.get(ids.b)||0),
    'B sign-in created a cloud master without owner action');
  ok(!(await page.evaluate(()=>
    document.getElementById('mlv197CloudConflictOverlay')?.classList.contains('show'))),
    'Empty B account must not trigger a blocking cloud-conflict modal');
  await page.evaluate(async()=>
    window.SupabaseSyncV30216.sync('upload',{silent:true}));
  ok(remote.get(ids.b)?.user_id===ids.b&&writes.get(ids.b)===1,
    'Explicit B owner approval did not create the correct cloud master');
  ok(remote.get(ids.b)?.snapshot?.state?.xp!==777,
    'B explicitly uploaded A data into its master');
  ok(!remote.get(ids.b)?.snapshot?.state?.missions?.some(m=>
    m.id===A_MISSION||m.id===GUEST_MISSION)&&
    remote.get(ids.b)?.snapshot?.localStorage?.['michelsLife.journal.v30184']!==JOURNAL.a&&
    remote.get(ids.b)?.snapshot?.localStorage?.['michelsLife.journal.v30184']!==JOURNAL.guest,
    'B remote master inherited another account/guest mission or journal');
  ok(writes.get(ids.a)===aWrites&&remote.get(ids.a)?.snapshot?.state?.xp===777,'Switch to B modified A cloud master');
  ok(!Object.keys(remote.get(ids.b)?.snapshot?.localStorage||{}).some(k=>/boardOwner|accountVault|localGuest|session|token|device\.v/i.test(k)),
    'Account or device vault metadata reached the Supabase snapshot');

  await page.evaluate(async ({mission,journal})=>{
    state.xp=45;
    state.missions.push({id:mission,name:'B only synthetic mission',type:'oneoff',
      category:'physical',difficulty:'medium',xp:50,coins:0,days:[],
      createdAt:'2026-10-19T12:00:00Z',completions:[]});
    localStorage.setItem('michelsLife.journal.v30184',journal);
    localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify(state));
    await window.SupabaseSyncV30216.push('b_fixture');
  },{mission:B_MISSION,journal:JOURNAL.b});
  await logout();
  await login('a@example.test');
  const restoredA=await local();
  ok(restoredA.owner===ids.a&&restoredA.xp===777&&restoredA.stored===777,
    'Returning to A did not recover A device board');
  ok(restoredA.missionIds.includes(A_MISSION)&&
    !restoredA.missionIds.includes(B_MISSION)&&
    restoredA.journal===JOURNAL.a,
    'Returning to A recovered wrong account missions/Journal');
  ok(remote.get(ids.a).snapshot.state.xp===777,'B contaminated A remote master');
  await logout();

  // C already has an established cloud master: never replace with a prior
  // account's local board merely by signing into C.
  remote.set(ids.c,{user_id:ids.c,revision:5,snapshot:{
    state:{xp:88,missions:[],settings:{v30200GenericProfile:true}},
    localStorage:{'michelsLife.journal.v30184':JOURNAL.c}
  },updated_at:new Date().toISOString()});
  await login('c@example.test');
  const c=await local();
  ok(c.owner===ids.c&&c.xp!==777,'C sees A data');
  ok(remote.get(ids.c).revision===5&&remote.get(ids.c).snapshot.state.xp===88,'Sign-in to existing C overwrote cloud');
  ok(!writes.get(ids.c),'C must not auto-upload');
  await page.evaluate(async()=>window.SupabaseSyncV30216.pull({reload:false}));
  const cAfterPull=await local();
  ok(cAfterPull.xp===88&&cAfterPull.stored===88&&
    !cAfterPull.missionIds.includes(A_MISSION)&&
    !cAfterPull.missionIds.includes(B_MISSION)&&
    cAfterPull.journal===JOURNAL.c,
    'Explicit C cloud adoption did not replace the account-local Journal and missions');

  await logout();
  await login('b@example.test');
  const restoredB=await local();
  ok(restoredB.owner===ids.b&&restoredB.xp===45&&
    restoredB.missionIds.includes(B_MISSION)&&
    !restoredB.missionIds.includes(A_MISSION)&&
    restoredB.journal===JOURNAL.b,
    'Returning to B failed to recover its own mission/Journal');
  ok(remote.get(ids.a).snapshot.state.xp===777&&
    remote.get(ids.a).snapshot.localStorage?.['michelsLife.journal.v30184']===JOURNAL.a,
    'Cross-account round trip unexpectedly touched A cloud');

  // Existing cloud masters must NEVER be overwritten by legacy Guest Import,
  // even if someone clicks the button. No consent dialog is offered.
  const bCloudBeforeImport=JSON.stringify(remote.get(ids.b));
  await logout();
  await login('a@example.test');
  const aBeforeImport=await local();
  ok(aBeforeImport.missionIds.includes(A_MISSION)&&
    aBeforeImport.guestVault?.snapshot?.state?.xp===314,
    'A and guest local recovery snapshots changed before blocked import');
  const originalRemote=JSON.stringify(remote.get(ids.a));
  const originalHistoryCount=history.filter(h=>h.user_id===ids.a).length;
  const originalAWrites=writes.get(ids.a);
  await page.evaluate(()=>{
    state.activeTab='settings';renderAll();
    window.LeftNavV30171.buildSettings();
    window.LeftNavV30171.activateSetting('sync');
  });
  const blockedImport=page.locator('[data-mlv216-supa="import-guest"]');
  await blockedImport.waitFor({state:'visible',timeout:10000});
  let invalidConsentDialog=false;
  page.once('dialog',async d=>{invalidConsentDialog=true;await d.dismiss()});
  await blockedImport.click();
  await page.waitForTimeout(250);
  const aAfterDenied=await local();
  ok(!invalidConsentDialog,'A populated cloud account offered destructive Guest Import consent');
  ok(JSON.stringify(remote.get(ids.a))===originalRemote&&
    writes.get(ids.a)===originalAWrites&&
    history.filter(h=>h.user_id===ids.a).length===originalHistoryCount,
    'Blocked Guest Import modified existing A cloud master/history');
  ok(aAfterDenied.xp===777&&aAfterDenied.journal===JOURNAL.a&&
    aAfterDenied.missionIds.includes(A_MISSION)&&
    aAfterDenied.guestVault?.snapshot?.state?.xp===314,
    'Blocked Guest Import changed account A or deleted guest recovery source');
  ok(JSON.stringify(remote.get(ids.b))===bCloudBeforeImport,
    'Blocked import changed B remote account');

  console.log('OK: '+(android?'Android':'Windows')+
    ' mode: A/B/C account isolation preserves missions, journals, reversible vaults, guest import Cancel/Reject-existing-cloud, and remote revisions');
}finally{await context.close();await browser.close();}
