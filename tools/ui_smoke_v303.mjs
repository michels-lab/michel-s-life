import { chromium } from 'playwright';
import fs from 'node:fs';

const url=process.env.MLV_UI_URL||'http://127.0.0.1:4173';
const out=process.env.MLV_UI_SCREENSHOTS||'artifacts/ui-smoke';
fs.mkdirSync(out,{recursive:true});

function ok(value,message){if(!value)throw new Error(message)}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
await page.addInitScript(()=>{
  try{localStorage.setItem('michelsLife.onboarding.v30200','done')}catch(_){}
});
try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.LeftNavV30171&&document.querySelector('#v30171Sidebar'),null,{timeout:60000});

  await page.evaluate(()=>{
    try{
      if(window.state?.settings)window.state.settings.onboardingRequired=false;
      if(window.state)window.state.activeTab='dashboard';
      window.save?.();
      window.renderAll?.();
    }catch(_){}
  });
  await page.waitForTimeout(900);

  const logo=await page.$eval('#v30171Sidebar .v30171-brand-mark img',img=>({
    src:img.getAttribute('src'),w:img.naturalWidth,h:img.naturalHeight,
    cw:img.getBoundingClientRect().width,ch:img.getBoundingClientRect().height,
    display:getComputedStyle(img).display,visibility:getComputedStyle(img).visibility,opacity:getComputedStyle(img).opacity
  }));
  ok(logo.src==='assets/michels_life_logo.svg','sidebar is not using the canonical logo asset');
  ok(logo.w>20&&logo.h>20&&logo.cw>=60&&logo.ch>=60&&logo.display!=='none'&&logo.visibility!=='hidden'&&logo.opacity!=='0','canonical sidebar logo is not visibly rendered');

  const defaultType=await page.evaluate(()=>document.documentElement.dataset.mlvTypography);
  ok(defaultType==='midnights','Midnights is not the default typography');

  await page.evaluate(()=>window.LeftNavV30171.route('settings'));
  await page.waitForSelector('[data-v30171-setting="typography"]',{timeout:10000});
  await page.click('[data-v30171-setting="typography"]');
  await page.waitForSelector('[data-v30171-pane="typography"].active [data-mlv-typography-core]',{timeout:10000});

  const headingFonts=await page.evaluate(()=>{
    const a=document.querySelector('[data-v30171-pane="typography"] .v30171-pane-title');
    const b=document.querySelector('[data-v30171-pane="typography"] .section-title h2');
    return {pane:getComputedStyle(a).fontFamily,section:getComputedStyle(b).fontFamily};
  });
  ok(headingFonts.pane===headingFonts.section,'Settings pane title font does not match the Background Themes-style section heading font');

  const paletteBefore=await page.evaluate(()=>{
    const root=getComputedStyle(document.documentElement),body=getComputedStyle(document.body);
    return {
      text:root.getPropertyValue('--text'),bg:root.getPropertyValue('--bg'),
      accent:root.getPropertyValue('--accent'),gold:root.getPropertyValue('--gold'),
      bodyColor:body.color,bodyBackground:body.backgroundImage
    };
  });

  await page.click('[data-mlv-font-preset="folklore"]');
  await page.waitForFunction(()=>document.documentElement.dataset.mlvTypography==='folklore');
  const paletteAfter=await page.evaluate(()=>{
    const root=getComputedStyle(document.documentElement),body=getComputedStyle(document.body);
    return {
      text:root.getPropertyValue('--text'),bg:root.getPropertyValue('--bg'),
      accent:root.getPropertyValue('--accent'),gold:root.getPropertyValue('--gold'),
      bodyColor:body.color,bodyBackground:body.backgroundImage
    };
  });
  ok(JSON.stringify(paletteBefore)===JSON.stringify(paletteAfter),'Typography preset changed app colors/backgrounds');

  await page.screenshot({path:`${out}/01-typography.png`,fullPage:true});
  await page.evaluate(()=>window.MLVTypographyV303.apply('midnights',true));

  await page.click('[data-v30171-setting="themes"]');
  await page.waitForSelector('[data-v30171-pane="themes"].active',{timeout:10000});
  await page.screenshot({path:`${out}/02-themes.png`,fullPage:true});

  await page.click('[data-v30171-setting="about"]');
  await page.waitForSelector('[data-v30171-pane="about"].active .mlvdev-avatar',{timeout:10000});
  const avatar=await page.$eval('.mlvdev-avatar',img=>({w:img.naturalWidth,h:img.naturalHeight,cw:img.getBoundingClientRect().width,ch:img.getBoundingClientRect().height,src:img.getAttribute('src')}));
  ok(avatar.src==='assets/michel_duarte_avatar.jpg','About is not using the canonical developer portrait');
  ok(avatar.w>100&&avatar.h>100&&avatar.cw>=180&&avatar.ch>=220,'About portrait is missing or still rendered as a thumbnail');
  await page.screenshot({path:`${out}/03-about.png`,fullPage:true});

  await page.click('[data-v30171-setting="chapters"]');
  await page.waitForSelector('[data-v30171-pane="chapters"].active .v30171-scene-card',{timeout:10000});
  const chapterData=await page.evaluate(()=>({
    current:window.ChapterScenesV30170?.currentPack?.()||'',
    options:[...document.querySelectorAll('[data-v30170-scene]')].map(x=>x.dataset.v30170Scene)
  }));
  const target=chapterData.options.find(x=>x&&x!==chapterData.current);
  ok(!!target,'No alternate Chapter Scene option available for interaction test');
  await page.click(`[data-v30170-scene="${target}"]`);
  await page.waitForFunction(t=>window.ChapterScenesV30170?.currentPack?.()===t,target,{timeout:10000});
  await page.screenshot({path:`${out}/04-chapters.png`,fullPage:true});

  const cloudCount=await page.evaluate(()=>{
    try{window.toast?.('Cloud overview','Google token refresh failed: test','error',{persistent:true})}catch(_){}
    try{window.notification?.('Cloud overview','Google token refresh failed: test',{kind:'error',persistent:true})}catch(_){}
    return [...document.querySelectorAll('.toast')].filter(x=>/cloud overview/i.test(x.textContent||'')).length;
  });
  ok(cloudCount===0,'Cloud overview popup is still visible');

  await page.evaluate(()=>window.LeftNavV30171.route('dashboard'));
  await page.waitForTimeout(600);
  await page.screenshot({path:`${out}/05-dashboard.png`,fullPage:true});

  console.log(JSON.stringify({logo,headingFonts,avatar,chapterTarget:target,typography:'midnights',cloudPopups:cloudCount},null,2));
} finally {
  await browser.close();
}
