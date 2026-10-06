import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
function ok(v,m){if(!v)throw new Error(m)}

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.addInitScript(()=>{
    window.__supaMock={remote:null,devices:[],history:[],pushes:0,raceOnNextPatch:false};
    const original=window.fetch.bind(window);
    window.fetch=async (input,init={})=>{
      const u=String(input);
      if(!u.startsWith('https://lqnkcqredlxrykynacwr.supabase.co'))return original(input,init);
      const path=u.split('.supabase.co')[1]||'';
      const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'content-type':'application/json'}});
      const body=init.body?JSON.parse(init.body):null;
      if(path.startsWith('/auth/v1/token?grant_type=password')){
        return json({access_token:'access_test',refresh_token:'refresh_test',expires_in:3600,user:{id:'00000000-0000-0000-0000-000000000216',email:'sync-test@example.com'}});
      }
      if(path.startsWith('/auth/v1/token?grant_type=refresh_token')){
        return json({access_token:'access_test_2',refresh_token:'refresh_test_2',expires_in:3600,user:{id:'00000000-0000-0000-0000-000000000216',email:'sync-test@example.com'}});
      }
      if(path==='/auth/v1/otp'&&String(init.method||'GET').toUpperCase()==='POST'){
        window.__supaMock.lastOtpRequest=body;
        return json({});
      }
      if(path==='/auth/v1/verify'&&String(init.method||'GET').toUpperCase()==='POST'){
        window.__supaMock.lastOtpVerify=body;
        return json({access_token:'access_otp',refresh_token:'refresh_otp',expires_in:3600,user:{id:'00000000-0000-0000-0000-000000000216',email:body.email}});
      }
      if(path.startsWith('/auth/v1/logout'))return json({});
      if(path.startsWith('/rest/v1/ml_state?select='))return json(window.__supaMock.remote?[window.__supaMock.remote]:[]);
      if(path==='/rest/v1/ml_state'&&String(init.method||'GET').toUpperCase()==='POST'){
        if(window.__supaMock.remote)return json({message:'duplicate key'},409);
        window.__supaMock.remote=body;window.__supaMock.pushes++;return json([body]);
      }
      if(path.startsWith('/rest/v1/ml_state?user_id=eq.')&&String(init.method||'GET').toUpperCase()==='PATCH'){
        if(window.__supaMock.raceOnNextPatch){
          window.__supaMock.raceOnNextPatch=false;
          window.__supaMock.remote={...window.__supaMock.remote,revision:Number(window.__supaMock.remote?.revision||0)+1,updated_at:new Date(Date.now()+120000).toISOString(),source_device_id:'android_race',source_platform:'android'};
          return json([]);
        }
        const params=new URL(u).searchParams,expected=Number(String(params.get('revision')||'').replace(/^eq\./,''));
        if(!window.__supaMock.remote||Number(window.__supaMock.remote.revision)!==expected)return json([]);
        window.__supaMock.remote={...window.__supaMock.remote,...body};window.__supaMock.pushes++;return json([window.__supaMock.remote]);
      }
      if(path.startsWith('/rest/v1/ml_state?on_conflict=')){
        window.__supaMock.remote=body;window.__supaMock.pushes++;return json([body]);
      }
      if(path==='/rest/v1/ml_state_history'){
        window.__supaMock.history.push(body);return json({});
      }
      if(path.startsWith('/rest/v1/ml_devices?on_conflict=')){
        const i=window.__supaMock.devices.findIndex(x=>x.device_id===body.device_id);
        if(i>=0)window.__supaMock.devices[i]=body;else window.__supaMock.devices.push(body);
        return json({});
      }
      if(path.startsWith('/rest/v1/ml_devices?select='))return json(window.__supaMock.devices);
      if(path.startsWith('/rest/v1/ml_state_history?select='))return json(window.__supaMock.history.map((x,i)=>({id:'h'+i,revision:x.revision,source_device_id:x.source_device_id,source_platform:x.source_platform,app_version:x.app_version,reason:x.reason,created_at:new Date().toISOString()})));
      return new Response(JSON.stringify({message:'Unhandled Supabase mock '+path}),{status:500,headers:{'content-type':'application/json'}});
    };
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.SupabaseSyncV30216&&window.LeftNavV30171,null,{timeout:60000});

  const sourceSecurity=await page.evaluate(()=>({
    provider:window.SupabaseSyncV30216.provider,
    hasSecret:[...document.scripts].some(s=>/sb_secret_|service_role/i.test(s.textContent||'')),
    settingsText:document.body.innerText
  }));
  ok(sourceSecurity.provider==='Supabase','Supabase provider not registered');
  ok(!sourceSecurity.hasSecret,'Secret/service-role marker leaked into browser source');

  await page.evaluate(()=>{state.activeTab='settings';renderAll();});
  await page.waitForTimeout(120);
  await page.evaluate(()=>{window.LeftNavV30171.buildSettings();window.LeftNavV30171.activateSetting('sync');});
  await page.waitForTimeout(120);
  ok(await page.locator('[data-v30171-setting="sync"]').count()===1,'Dedicated Sync settings nav missing');
  ok(await page.locator('[data-mlv216-supabase-card]').count()===1,'Supabase settings card missing');

  const authDefault=await page.evaluate(()=>({
    mode:window.SupabaseSyncV30216.authMode(),
    passwordActive:document.querySelector('[data-mlv216-supa="mode-password"]')?.classList.contains('active')||false,
    codeActive:document.querySelector('[data-mlv216-supa="mode-code"]')?.classList.contains('active')||false,
    hasPassword:!!document.querySelector('[data-mlv216-supa-password]'),
    hasCode:!!document.querySelector('[data-mlv216-supa-code]')
  }));
  ok(authDefault.mode==='password'&&authDefault.passwordActive&&!authDefault.codeActive&&authDefault.hasPassword&&!authDefault.hasCode,'Password is not the default Supabase sign-in mode: '+JSON.stringify(authDefault));

  await page.click('[data-mlv216-supa="mode-code"]');
  await page.waitForTimeout(80);
  const codeMode=await page.evaluate(()=>({
    mode:window.SupabaseSyncV30216.authMode(),
    codeActive:document.querySelector('[data-mlv216-supa="mode-code"]')?.classList.contains('active')||false,
    hasCode:!!document.querySelector('[data-mlv216-supa-code]')
  }));
  ok(codeMode.mode==='code'&&codeMode.codeActive&&codeMode.hasCode,'Optional code mode did not activate: '+JSON.stringify(codeMode));
  await page.fill('[data-mlv216-supa-email]','sync-test@example.com');
  await page.click('[data-mlv216-supa="send-code"]');
  await page.waitForTimeout(80);
  const otpRequested=await page.evaluate(()=>window.__supaMock.lastOtpRequest);
  ok(otpRequested?.email==='sync-test@example.com'&&otpRequested?.create_user===false,'OTP request must target an existing account without auto-signup: '+JSON.stringify(otpRequested));
  await page.fill('[data-mlv216-supa-code]','123456');
  await page.click('[data-mlv216-supa="verify-code"]');
  await page.waitForTimeout(120);
  const otpVerified=await page.evaluate(()=>({verify:window.__supaMock.lastOtpVerify,connected:window.SupabaseSyncV30216.runtime.connected}));
  ok(otpVerified.verify?.email==='sync-test@example.com'&&otpVerified.verify?.token==='123456'&&otpVerified.verify?.type==='email','OTP verification payload is wrong: '+JSON.stringify(otpVerified));
  ok(otpVerified.connected,'OTP verification did not establish a Supabase session');
  await page.evaluate(async()=>window.SupabaseSyncV30216.signOut());
  await page.evaluate(()=>window.SupabaseSyncV30216.setAuthMode('password'));
  await page.waitForTimeout(80);

  await page.evaluate(async()=>window.SupabaseSyncV30216.signIn('sync-test@example.com','testpass123'));
  const first=await page.evaluate(()=>({
    runtime:{...window.SupabaseSyncV30216.runtime},
    mock:{remote:window.__supaMock.remote,pushes:window.__supaMock.pushes,devices:window.__supaMock.devices.length},
    session:window.SupabaseSyncV30216.session()
  }));
  ok(first.runtime.connected&&first.runtime.cloudReady,'Sign-in did not activate Supabase runtime');
  ok(first.mock.remote?.revision===1&&first.mock.pushes===1,'First sign-in did not create master snapshot: '+JSON.stringify(first));
  ok(first.mock.devices>=1,'Device registration missing');

  await page.evaluate(()=>{state.xp=Number(state.xp||0)+1;window.save();});
  await page.waitForTimeout(2900);
  const dirtyPush=await page.evaluate(()=>({revision:window.__supaMock.remote?.revision,pushes:window.__supaMock.pushes,meta:JSON.parse(localStorage.getItem('michelsLife.supabase.meta.v30216')||'{}')}));
  ok(dirtyPush.revision===2&&dirtyPush.pushes===2,'Dirty save did not generate exactly one new revision: '+JSON.stringify(dirtyPush));
  ok(dirtyPush.meta.dirty===false,'Dirty flag was not cleared after upload');

  const beforeConflict=dirtyPush.pushes;
  await page.evaluate(()=>{
    window.__supaMock.remote={...window.__supaMock.remote,revision:9,updated_at:new Date(Date.now()+60000).toISOString(),source_device_id:'android_test',source_platform:'android'};
  });
  await page.evaluate(async()=>window.SupabaseSyncV30216.sync('auto',{silent:true}));
  const conflict=await page.evaluate(()=>({
    conflict:window.SupabaseSyncV30216.runtime.cloudConflict,
    pushes:window.__supaMock.pushes,
    revision:window.__supaMock.remote?.revision
  }));
  ok(conflict.conflict&&conflict.conflict.remoteRevision===9,'Newer remote revision did not create conflict: '+JSON.stringify(conflict));
  ok(conflict.pushes===beforeConflict,'Conflict path overwrote newer remote data');

  await page.evaluate(async()=>window.SupabaseSyncV30216.sync('download',{silent:true,reload:false}));
  const downloaded=await page.evaluate(()=>({
    meta:JSON.parse(localStorage.getItem('michelsLife.supabase.meta.v30216')||'{}'),
    runtime:{...window.SupabaseSyncV30216.runtime}
  }));
  ok(downloaded.meta.revision===9,'Explicit cloud download did not adopt remote revision');
  ok(downloaded.meta.dirty===false,'Download left local state dirty');
  const downloadHistory=await page.evaluate(()=>window.__supaMock.history.map(x=>({revision:x.revision,reason:x.reason,source_device_id:x.source_device_id})));
  ok(downloadHistory.some(x=>x.reason==='before_download_local'&&Number(x.revision)===2),'Cloud download did not preserve the pre-download local state: '+JSON.stringify(downloadHistory));

  const beforeRace=await page.evaluate(()=>window.__supaMock.pushes);
  await page.evaluate(()=>{
    const m=JSON.parse(localStorage.getItem('michelsLife.supabase.meta.v30216')||'{}');
    m.dirty=true;localStorage.setItem('michelsLife.supabase.meta.v30216',JSON.stringify(m));
    window.__supaMock.raceOnNextPatch=true;
  });
  await page.evaluate(async()=>window.SupabaseSyncV30216.sync('auto',{silent:true}));
  const race=await page.evaluate(()=>({
    conflict:window.SupabaseSyncV30216.runtime.cloudConflict,
    pushes:window.__supaMock.pushes,
    remote:window.__supaMock.remote,
    meta:JSON.parse(localStorage.getItem('michelsLife.supabase.meta.v30216')||'{}')
  }));
  ok(race.conflict?.remoteRevision===10,'Simultaneous remote write was not converted into a conflict: '+JSON.stringify(race));
  ok(race.pushes===beforeRace,'Compare-and-swap race overwrote the remote state');
  ok(race.remote?.revision===10&&race.remote?.source_device_id==='android_race','Remote race winner was not preserved: '+JSON.stringify(race.remote));
  ok(race.meta.dirty===true,'Race conflict incorrectly cleared the local dirty flag');

  await page.evaluate(async()=>window.SupabaseSyncV30216.sync('upload',{silent:true}));
  const forced=await page.evaluate(()=>({
    conflict:window.SupabaseSyncV30216.runtime.cloudConflict,
    pushes:window.__supaMock.pushes,
    remote:window.__supaMock.remote,
    history:window.__supaMock.history
  }));
  ok(!forced.conflict,'Explicit Use this PC did not clear the conflict');
  ok(forced.pushes===beforeRace+1&&forced.remote?.revision===11,'Explicit force upload did not advance the master exactly once: '+JSON.stringify(forced));
  ok(forced.history.some(x=>Number(x.revision)===10),'Force upload did not preserve the replaced remote revision in history');

  console.log('OK: password-default auth + optional OTP + first upload + dirty sync + remote conflict + CAS race protection + explicit force upload/download');
} finally {
  await browser.close();
}
