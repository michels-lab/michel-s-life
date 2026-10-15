import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Two *different* synthetic Supabase account IDs sharing one installed
// WebView profile. No credentials or user data leave this test.
const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const host='https://lqnkcqredlxrykynacwr.supabase.co';
const ids={a:'00000000-0000-0000-0000-000000000108',b:'00000000-0000-0000-0000-000000000109',c:'00000000-0000-0000-0000-000000000110'};
const byMail={'a@example.test':ids.a,'b@example.test':ids.b,'c@example.test':ids.c};
const remote=new Map(),writes=new Map(),history=[];
const ok=(v,msg)=>assert.ok(v,msg);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1260,height:780}});
try{
  await context.addInitScript(()=>{
    localStorage.setItem('michelsLife.onboarding.v30200','done');
    localStorage.setItem('michelsLife.onboardingCompleted.v1','1');
  });
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
      encodeURIComponent('00000000-0000-0000-0000-000000000108'))||'null')
  }));
  await login('a@example.test');
  ok(remote.has(ids.a),'A account must create its own initial master');
  await page.evaluate(async()=>{
    state.xp=777;state.history.push({id:'a-secret-history',type:'private',description:'A_ONLY'});
    localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify(state));
    await window.SupabaseSyncV30216.push('a_fixture');
  });
  ok(remote.get(ids.a).snapshot.state.xp===777,'A master missing private data');
  const aWrites=writes.get(ids.a);
  await logout();
  const afterLogout=await local();
  ok(afterLogout.xp!==777&&afterLogout.stored!==777,'A board remains visible after logout');
  ok(!afterLogout.owner&&!afterLogout.session,'Logout left an authenticated owner');
  ok(afterLogout.vaultA?.snapshot?.state?.xp===777,'A local recovery vault missing');

  await login('b@example.test');
  const b=await local();
  ok(b.owner===ids.b&&b.session===ids.b,'B did not receive its own owner identity');
  ok(b.xp!==777&&b.stored!==777,'B sees A local progress');
  ok(remote.get(ids.b)?.snapshot?.state?.xp!==777,'B uploaded A data into its empty master');
  ok(writes.get(ids.a)===aWrites&&remote.get(ids.a)?.snapshot?.state?.xp===777,'Switch to B modified A cloud master');
  ok(!Object.keys(remote.get(ids.b)?.snapshot?.localStorage||{}).some(k=>/boardOwner|accountVault|localGuest|session|token|device\.v/i.test(k)),
    'Account or device vault metadata reached the Supabase snapshot');

  await page.evaluate(async()=>{
    state.xp=45;localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify(state));
    await window.SupabaseSyncV30216.push('b_fixture');
  });
  await logout();
  await login('a@example.test');
  const restoredA=await local();
  ok(restoredA.owner===ids.a&&restoredA.xp===777&&restoredA.stored===777,'Returning to A did not recover A device board');
  ok(remote.get(ids.a).snapshot.state.xp===777,'B contaminated A remote master');
  await logout();

  // C already has an established cloud master: never replace with a prior
  // account's local board merely by signing into C.
  remote.set(ids.c,{user_id:ids.c,revision:5,snapshot:{state:{xp:88,missions:[],settings:{v30200GenericProfile:true}},localStorage:{}},updated_at:new Date().toISOString()});
  await login('c@example.test');
  const c=await local();
  ok(c.owner===ids.c&&c.xp!==777,'C sees A data');
  ok(remote.get(ids.c).revision===5&&remote.get(ids.c).snapshot.state.xp===88,'Sign-in to existing C overwrote cloud');
  ok(!writes.get(ids.c),'C must not auto-upload');
  await page.evaluate(async()=>window.SupabaseSyncV30216.pull({reload:false}));
  ok((await local()).xp===88,'Explicit cloud adoption for C did not work');

  console.log('OK: different Supabase A/B/C accounts isolate progress, local vault, remote writes and cloud adoption');
}finally{await context.close();await browser.close();}
