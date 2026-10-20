import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {assembleAudit,ROUTES,WIDTHS} from './granada_android_usability_audit_core.mjs';

const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const out='artifacts/granada-android-usability';
const browser=await chromium.launch({headless:true});
const samples=[];
const extras=[];
const errors=[];
const countErrors=()=>errors.length;
const report=(severity,code,section='unknown',viewport=null)=>
  extras.push({severity,code,section,viewport});
const fixture={
  version:2,activeTab:'dashboard',xp:40,coins:0,totalCoinsEarned:0,
  settings:{characterName:'Granada QA',onboardingRequired:false,
    onboardingCompletedAt:'2026-10-01T12:00:00.000Z'},
  missions:[{id:'granada-tap-fixture',name:'Synthetic private navigation mission',
    canonical:'synthetic private navigation mission',description:'',
    category:'academic',type:'daily',difficulty:'medium',
    xp:20,coins:0,priority:'medium',days:[1,2,3,4,5],
    archived:false,hidden:false,createdAt:'2026-01-01T12:00:00.000Z',
    completions:[]}],
  history:[],achievements:[],goals:[],affirmations:[],owned:[],equipped:{}
};
try{
  await mkdir(out,{recursive:true});
  for(const width of WIDTHS){
    const context=await browser.newContext({
      viewport:{width,height:915},screen:{width,height:915},
      deviceScaleFactor:2.625,isMobile:true,hasTouch:true,
      reducedMotion:'reduce'
    });
    await context.addInitScript(seed=>{
      if(!localStorage.getItem('vida_rpg_personal_progress_v2'))
        localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify(seed));
      localStorage.setItem('michelsLife.onboarding.v30200','done');
      localStorage.setItem('michelsLife.language.v1','en');
      localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
      localStorage.setItem('michelsLife.language.installDefault.v1','en');
      window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
      window.MichelsLifeAndroid={postMessage(){}};
    },fixture);
    const page=await context.newPage();
    page.on('pageerror',()=>errors.push({width,code:'uncaught_app_error'}));
    try{
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForFunction(()=>
        document.documentElement.dataset.mlvPlatform==='android' &&
        !!document.querySelector('#v30171PrimaryNav') &&
        !!document.querySelector('#mlv-android-topbar') &&
        !!document.querySelector('#mlv-android-bottom-nav') &&
        typeof window.__mlvAndroidFastRoute==='function',
        null,{timeout:60000});
      await page.waitForTimeout(450);
      const baseline=await page.evaluate(()=>{
        const s=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}');
        return {xp:s.xp,missions:(s.missions||[]).map(m=>({
          id:m.id,completions:(m.completions||[]).length
        })).sort((a,b)=>String(a.id).localeCompare(String(b.id))),
        goals:(s.goals||[]).map(g=>String(g.id)).sort()};
      });
      for(const route of ROUTES){
        try{
          // Navigate using the real touchscreen drawer, never the internal
          // JavaScript route helper. This catches interception/trapped screens.
          await page.locator('#mlv-android-menu-button').tap({timeout:8000});
          const option=page.locator('#v30171PrimaryNav [data-tab="'+route+'"]');
          if(await option.count()!==1)throw Error('drawer_missing');
          await option.tap({timeout:8000});
          await page.waitForFunction(section=>
            !!document.querySelector('#tab-'+section+'.active') &&
            document.querySelector('#tab-'+section+'.active').getBoundingClientRect().width>0,
            route,{timeout:12000});
          // A drawer tap may finish before its backdrop/slide animation.
          // Measure persistent hit obstruction only after the real drawer
          // has left the viewport; never waive an overlay that remains stuck.
          await page.waitForFunction(()=>{
            const sidebar=document.getElementById('v30171Sidebar');
            return !sidebar || sidebar.getBoundingClientRect().right<=8;
          },null,{timeout:6000});
          await page.waitForTimeout(360);
          const measurement=await page.evaluate(route=>{
            const r=node=>{const x=node?.getBoundingClientRect();
              return x?{left:x.left,right:x.right,top:x.top,bottom:x.bottom,
                width:x.width,height:x.height}:null};
            const nav=document.getElementById('mlv-android-bottom-nav');
            const hit=node=>{
              const b=node.getBoundingClientRect();
              const el=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);
              return !!el&&(el===node||node.contains(el));
            };
            const buttons=[...nav.querySelectorAll('[data-mobile-tab]')]
              .filter(el=>el.getClientRects().length>0)
              .map(el=>({...r(el),hit:hit(el)}));
            const section=document.getElementById('tab-'+route);
            return {
              route,width:innerWidth,documentWidth:document.documentElement.scrollWidth,
              section:r(section),nav:r(nav),
              active:!!section?.classList.contains('active'),
              shellCount:document.querySelectorAll('#mlv-android-topbar').length,
              navButtons:buttons
            };
          },route);
          samples.push(measurement);
          if(['dashboard','journal','story','stats','settings'].includes(route)){
            await page.screenshot({
              path:out+'/'+width+'-'+route+'.png',
              animations:'disabled'
            });
          }
        }catch(error){
          report('error','real_drawer_navigation_failed',route,width);
          // Do not hide blocked coverage by routing through the private API.
          // Continue trying other routes with real controls.
          if(error.message==='drawer_missing')report('error','drawer_route_absent',route,width);
        }
      }
      // A twice-reloaded native-WebView model must not reseed synthetic data,
      // multiply app shells or award XP merely by viewing tabs.
      for(let relaunch=0;relaunch<2;relaunch++){
        await page.reload({waitUntil:'domcontentloaded',timeout:60000});
        await page.waitForFunction(()=>
          !!document.getElementById('mlv-android-bottom-nav') &&
          !!document.getElementById('mlv-android-topbar'),null,{timeout:60000});
        await page.waitForTimeout(500);
        const after=await page.evaluate(()=>{
          const s=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}');
          return {
            xp:s.xp,missions:(s.missions||[]).map(m=>({
              id:m.id,completions:(m.completions||[]).length
            })).sort((a,b)=>String(a.id).localeCompare(String(b.id))),
            goals:(s.goals||[]).map(g=>String(g.id)).sort(),
            shellCount:document.querySelectorAll('#mlv-android-topbar').length,
            navCount:document.querySelectorAll('#mlv-android-bottom-nav').length
          };
        });
        if(JSON.stringify({xp:after.xp,missions:after.missions,goals:after.goals})!==
           JSON.stringify(baseline))
          report('error','canonical_progress_drift_on_relaunch','dashboard',width);
        if(after.shellCount!==1||after.navCount!==1)
          report('error','duplicate_native_shell_on_relaunch','dashboard',width);
      }
    }catch(error){
      report('error','android_fixture_or_boot_failed','dashboard',width);
    }finally{
      await context.close();
    }
  }
  if(countErrors())report('error','uncaught_runtime_errors','unknown',null);
  const result=assembleAudit(samples,extras);
  result.pageErrorCount=countErrors();
  result.inputData='synthetic-fixtures-only';
  result.testedWidths=[...WIDTHS];
  // Whitelisted report only. Never export the WebView's localStorage, DOM,
  // account data, Journal text, screenshot of a real user, or console logs.
  await writeFile(out+'/report.json',JSON.stringify(result,null,2)+'\n');
  console.log('GRANADA_ANDROID_USABILITY '+JSON.stringify({
    status:result.status,coverage:result.coverage,
    errors:result.findings.length,pageErrors:countErrors(),
    findings:result.findings.map(({severity,code,section,viewport})=>({
      severity,code,section,viewport
    }))
  }));
  if(result.status==='fail')process.exitCode=1;
}finally{
  await browser.close();
}
