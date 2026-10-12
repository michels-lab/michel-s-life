import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const base=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const output='artifacts/android-ui-smoke/journal-save';
const ok=(pass,message)=>{if(!pass)throw Error(message)};
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:360,height:915},
    screen:{width:360,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.addInitScript(()=>{
    try{
      if(!localStorage.getItem('vida_rpg_personal_progress_v2'))
      localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
        version:2,activeTab:'dashboard',xp:0,coins:0,totalCoinsEarned:0,
        settings:{characterName:'Michel',onboardingRequired:false,
          onboardingCompletedAt:'2026-10-01T12:00:00.000Z'},
        missions:[],history:[],achievements:[],goals:[],affirmations:[],
        owned:[],equipped:{}
      }));
      localStorage.setItem('michelsLife.onboarding.v30200','done');
      localStorage.setItem('michelsLife.language.v1','en');
      localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
      localStorage.setItem('michelsLife.language.installDefault.v1','en');
    }catch(_){}
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    window.MichelsLifeAndroid={postMessage(){}};
  });
  await mkdir(output,{recursive:true});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement.dataset.mlvPlatform==='android'
    &&!!window.__mlvAndroidFastRoute&&!!window.JournalV30189,
    null,{timeout:60000});
  const title='Phone Journal canonical save QA';
  const body='Original daily writing persisted from the real Android Journal editor.';
  for(const width of [360,412]){
    await page.setViewportSize({width,height:915});
    ok(await page.evaluate(()=>window.__mlvAndroidFastRoute('journal'))!==false,
      'Cannot navigate to canonical mobile Journal');
    await page.locator('#mlv184JournalBody').waitFor({state:'visible',timeout:10000});
    const geom=await page.evaluate(()=>{
      const root=document.querySelector('#tab-journal .mlv184-journal-layout');
      const title=document.getElementById('mlv184JournalTitle');
      const body=document.getElementById('mlv184JournalBody');
      const history=document.querySelector('#tab-journal .mlv184-journal-history');
      const rect=x=>{const a=x?.getBoundingClientRect();return a?
        {left:a.left,right:a.right,top:a.top,bottom:a.bottom,width:a.width,height:a.height}:null;};
      return {width:innerWidth,docWidth:document.documentElement.scrollWidth,
        root:rect(root),title:rect(title),body:rect(body),history:rect(history),
        titleFont:parseFloat(getComputedStyle(title).fontSize),
        bodyFont:parseFloat(getComputedStyle(body).fontSize)};
    });
    ok(geom.docWidth<=width+3&&geom.root.width>200
      &&geom.root.left>=-3&&geom.root.right<=width+3
      &&geom.title.width>=200&&geom.title.right<=width+3
      &&geom.body.width>=200&&geom.body.right<=width+3
      &&geom.titleFont>=16&&geom.bodyFont>=16,
      'Journal phone editor clips or uses tiny font: '+JSON.stringify(geom));
    const file=output+'/journal-'+width+'.png';
    await page.screenshot({path:file});
  }
  await page.locator('#mlv184JournalTitle').fill(title);
  await page.locator('#mlv184JournalBody').fill(body);
  const date=await page.evaluate(()=>{
    const d=new Date(),pad=n=>String(n).padStart(2,'0');
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  });
  await page.waitForFunction(({date,title,body})=>{
    const e=window.JournalV30189?.entry?.(date);
    return e?.title===title&&e?.body===body;
  },{date,title,body},{timeout:10000});
  const status=await page.locator('#mlv184JournalSaveState').innerText();
  ok(/saved/i.test(status),'Journal did not visibly acknowledge autosave: '+status);
  // App route regeneration must rehydrate the same canonical Journal state.
  await page.evaluate(()=>window.__mlvAndroidFastRoute('projects'));
  await page.evaluate(()=>window.__mlvAndroidFastRoute('journal'));
  await page.locator('#mlv184JournalBody').waitFor({state:'visible'});
  ok(await page.locator('#mlv184JournalTitle').inputValue()===title&&
     await page.locator('#mlv184JournalBody').inputValue()===body,
    'Journal content lost when changing Android section');
  // Do not reinitialize localStorage during reload; only the current app store
  // may reconstruct persistent data for the next process.
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  // The v30171 sidebar and native Android navigation initialize after the
  // shared Journal API. Reopening before navigation mounts can be overwritten
  // by the rest of app boot. Wait for full mobile shell, not only an API name.
  await page.waitForFunction(()=>!!window.JournalV30189 &&
    !!window.__mlvAndroidFastRoute &&
    document.documentElement.dataset.mlvPlatform==='android' &&
    !!document.getElementById('mlv-android-topbar') &&
    !!document.getElementById('mlv-android-bottom-nav'),
    null,{timeout:60000});
  await page.waitForTimeout(650);
  await page.evaluate(()=>window.__mlvAndroidFastRoute('journal'));
  try{
    await page.locator('#mlv184JournalBody').waitFor({state:'visible',timeout:12000});
  }catch(error){
    const state=await page.evaluate(date=>({
      activeTab:document.querySelector('#main .tab.active')?.id,
      nav:document.body.dataset.mlvAndroidTab,
      saved:window.JournalV30189?.entry?.(date),
      dataKey:!!localStorage.getItem('vida_rpg_personal_progress_v2'),
      mainText:document.getElementById('main')?.textContent?.slice(0,180)
    }),date);
    throw Error('Canonical Journal failed to restore visible editor after reload: '+
      JSON.stringify(state)+'; cause='+String(error));
  }
  const persisted=await page.evaluate(date=>{
    const api=window.JournalV30189;
    const e=api?.entry?.(date);
    return {title:e?.title,body:e?.body};
  },date);
  ok(persisted.title===title&&persisted.body===body,
    'Journal lost canonical writing on full WebView reload: '+JSON.stringify(persisted));
  // Simulate a short visual viewport/IME scenario without claiming that a
  // Samsung native soft keyboard was opened.
  await page.setViewportSize({width:360,height:640});
  const editor=page.locator('#mlv184JournalBody');
  await editor.focus();
  await editor.scrollIntoViewIfNeeded();
  const keyboard=await page.evaluate(()=>{
    const area=document.getElementById('mlv184JournalBody');
    const title=document.getElementById('mlv184JournalTitle');
    const nav=document.getElementById('mlv-android-bottom-nav');
    const r=area.getBoundingClientRect(),n=nav.getBoundingClientRect();
    return {viewportHeight:innerHeight,areaWidth:r.width,areaRight:r.right,
      focused:document.activeElement===area,navTop:n.top,
      textFont:parseFloat(getComputedStyle(area).fontSize),
      titleWidth:title.getBoundingClientRect().width};
  });
  ok(keyboard.focused&&keyboard.areaWidth>=200&&keyboard.areaRight<=363
    &&keyboard.textFont>=16,
    'Journal editor unusable at short mobile visual viewport: '+JSON.stringify(keyboard));
  await page.screenshot({path:output+'/journal-360-short-viewport.png'});
  console.log('ANDROID_JOURNAL_CANONICAL_SAVE_PASS '+JSON.stringify({
    widths:[360,412],date,savedStatus:status,persisted,shortViewport:keyboard}));
}finally{await browser.close();}
