import { chromium } from 'playwright';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
function ok(v,m){if(!v)throw new Error(m)}

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:412,height:915}});
  await page.addInitScript(()=>{
    window.__MICHELSLIFE_PLATFORM__='android';
    window.__supaMock={remote:null,devices:[],history:[],pushes:0};
    const original=window.fetch.bind(window);
    window.fetch=async (input,init={})=>{
      const u=String(input);
      if(!u.startsWith('https://lqnkcqredlxrykynacwr.supabase.co'))return original(input,init);
      const path=u.split('.supabase.co')[1]||'';
      const json=v=>new Response(JSON.stringify(v),{status:200,headers:{'content-type':'application/json'}});
      const body=init.body?JSON.parse(init.body):null;
      if(path.startsWith('/auth/v1/token?grant_type=password')){
        return json({access_token:'android_access',refresh_token:'android_refresh',expires_in:3600,user:{id:'00000000-0000-0000-0000-000000000216',email:'android-sync@example.com'}});
      }
      if(path.startsWith('/rest/v1/ml_state?select='))return json(window.__supaMock.remote?[window.__supaMock.remote]:[]);
      if(path==='/rest/v1/ml_state'&&String(init.method||'GET').toUpperCase()==='POST'){window.__supaMock.remote=body;window.__supaMock.pushes++;return json([body]);}
      if(path.startsWith('/rest/v1/ml_state?on_conflict=')){window.__supaMock.remote=body;window.__supaMock.pushes++;return json([body]);}
      if(path==='/rest/v1/ml_state_history'){window.__supaMock.history.push(body);return json({});}
      if(path.startsWith('/rest/v1/ml_devices?on_conflict=')){
        const i=window.__supaMock.devices.findIndex(x=>x.device_id===body.device_id);
        if(i>=0)window.__supaMock.devices[i]=body;else window.__supaMock.devices.push(body);
        return json({});
      }
      if(path.startsWith('/rest/v1/ml_devices?select='))return json(window.__supaMock.devices);
      if(path.startsWith('/rest/v1/ml_state_history?select='))return json([]);
      return new Response(JSON.stringify({message:'Unhandled Android Supabase mock '+path}),{status:500,headers:{'content-type':'application/json'}});
    };
  });

  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.SupabaseSyncV30216,null,{timeout:60000});

  const before=await page.evaluate(()=>({
    platform:window.SupabaseSyncV30216.platform(),
    deviceId:window.SupabaseSyncV30216.deviceId(),
    secret:[...document.scripts].some(s=>/sb_secret_|service_role/i.test(s.textContent||''))
  }));
  ok(before.platform==='android','Shared Supabase client did not detect Android: '+JSON.stringify(before));
  ok(/^and_/.test(before.deviceId),'Android device ID does not use Android namespace: '+before.deviceId);
  ok(!before.secret,'Android bundle exposes a Supabase secret/service-role marker');

  await page.evaluate(async()=>window.SupabaseSyncV30216.signIn('android-sync@example.com','testpass123'));
  const after=await page.evaluate(()=>({
    remote:window.__supaMock.remote,
    devices:window.__supaMock.devices,
    runtime:{...window.SupabaseSyncV30216.runtime}
  }));

  ok(after.runtime.connected,'Android Supabase sign-in did not connect');
  ok(after.remote?.source_platform==='android','Android master snapshot has wrong platform: '+JSON.stringify(after.remote));
  ok(/^and_/.test(after.remote?.source_device_id||''),'Android snapshot has wrong device id');
  ok(after.devices.some(d=>d.platform==='android'&&/^and_/.test(d.device_id||'')),'Android device registration missing: '+JSON.stringify(after.devices));

  console.log('OK: Android shared Supabase sync identifies platform/device correctly');
} finally {
  await browser.close();
}
