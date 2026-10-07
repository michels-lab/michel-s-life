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
      window.LeftNavV30171?.renderNav?.();
    }catch(_){}
  });
  try{
    await page.waitForFunction(()=>{
      const root=document.querySelector('#v30171Sidebar');
      const brand=root?.querySelector('.v30171-brand');
      const img=brand?.querySelector('.v30171-brand-mark img');
      const title=brand?.querySelector('.v30171-brand-title');
      const sub=brand?.querySelector('.v30171-brand-sub');
      return !!(brand&&img&&title&&sub&&img.getAttribute('src'));
    },null,{timeout:10000});
  }catch(error){
    const diagnostic=await page.evaluate(()=>({
      sidebar:document.querySelector('#v30171Sidebar')?.innerHTML||'',
      hasApi:typeof window.LeftNavV30171?.renderNav==='function',
      activeTab:window.state?.activeTab||'',
      renderAllType:typeof window.renderAll,
      brand:!!document.querySelector('#v30171Sidebar .v30171-brand'),
      mark:!!document.querySelector('#v30171Sidebar .v30171-brand-mark'),
      image:!!document.querySelector('#v30171Sidebar .v30171-brand-mark img'),
      title:!!document.querySelector('#v30171Sidebar .v30171-brand-title'),
      sub:!!document.querySelector('#v30171Sidebar .v30171-brand-sub')
    }));
    throw new Error('Sidebar brand lockup did not recover after renderAll: '+JSON.stringify(diagnostic));
  }
  await page.waitForTimeout(250);

  const logo=await page.evaluate(()=>{
    const img=document.querySelector('#v30171Sidebar .v30171-brand-mark img');
    const title=document.querySelector('#v30171Sidebar .v30171-brand-title');
    const sub=document.querySelector('#v30171Sidebar .v30171-brand-sub');
    const brand=document.querySelector('#v30171Sidebar .v30171-brand');
    if(!brand||!img||!title||!sub)throw new Error('Sidebar brand lockup incomplete after render: '+JSON.stringify({brand:!!brand,img:!!img,title:!!title,sub:!!sub}));
    const ir=img.getBoundingClientRect(),tr=title.getBoundingClientRect(),sr=sub.getBoundingClientRect(),br=brand.getBoundingClientRect();
    return {
      src:img.getAttribute('src'),w:img.naturalWidth,h:img.naturalHeight,cw:ir.width,ch:ir.height,
      display:getComputedStyle(img).display,visibility:getComputedStyle(img).visibility,opacity:getComputedStyle(img).opacity,
      direction:getComputedStyle(brand).flexDirection,
      imgBottom:ir.bottom,titleTop:tr.top,titleBottom:tr.bottom,subTop:sr.top,
      imgCenter:ir.left+ir.width/2,titleCenter:tr.left+tr.width/2,subCenter:sr.left+sr.width/2,brandCenter:br.left+br.width/2
    };
  });
  ok(logo.src==='assets/michels_life_mark.svg','sidebar is not using the canonical Michel’s Life mark');
  ok(logo.w>20&&logo.h>20&&logo.cw>=80&&logo.ch>=80&&logo.display!=='none'&&logo.visibility!=='hidden'&&logo.opacity!=='0','canonical sidebar mark is not visibly rendered');
  console.log('BRAND_GEOMETRY '+JSON.stringify(logo));
  ok(logo.direction==='column','Michel’s Life brand is not stacked vertically: '+JSON.stringify(logo));
  ok(logo.imgBottom<=logo.titleTop+2&&logo.titleBottom<=logo.subTop+2,'Michel’s Life mark/title/subtitle are not in the approved vertical order: '+JSON.stringify(logo));
  ok(Math.abs(logo.imgCenter-logo.brandCenter)<4&&Math.abs(logo.titleCenter-logo.brandCenter)<4&&Math.abs(logo.subCenter-logo.brandCenter)<4,'Michel’s Life brand is not centered: '+JSON.stringify(logo));

  const defaultType=await page.evaluate(()=>document.documentElement.dataset.mlvTypography);
  ok(defaultType==='midnights','Midnights is not the default typography');

  await page.evaluate(()=>window.LeftNavV30171.route('settings'));
  await page.waitForSelector('[data-v30171-setting="typography"]',{timeout:10000});
  await page.click('[data-v30171-setting="typography"]');
  await page.waitForSelector('[data-v30171-pane="typography"].active [data-mlv-typography-core]',{timeout:10000});
  await page.waitForTimeout(1200);
  const typographyRoute=await page.evaluate(()=>({
    activePane:document.querySelector('.v30171-settings-pane.active')?.dataset?.v30171Pane||'',
    activeButton:document.querySelector('.v30171-settings-btn.active')?.dataset?.v30171Setting||'',
    saved:localStorage.getItem('michelsLife.settingsSection.v30171')||''
  }));
  ok(typographyRoute.activePane==='typography'&&typographyRoute.activeButton==='typography'&&typographyRoute.saved==='typography','Typography route fell back to General after delayed rerenders');

  const headingFonts=await page.evaluate(()=>{
    const a=document.querySelector('[data-v30171-pane="typography"] .v30171-pane-title');
    const b=document.querySelector('[data-v30171-pane="typography"] .section-title h2');
    return {pane:getComputedStyle(a).fontFamily,section:getComputedStyle(b).fontFamily};
  });
  ok(headingFonts.pane===headingFonts.section,'Settings pane title font does not match the Background Themes-style section heading font');
  const eraCatalog=await page.evaluate(()=>({
    ids:[...document.querySelectorAll('[data-mlv-font-preset]')].map(x=>x.dataset.mlvFontPreset),
    labels:[...document.querySelectorAll('.mlv303-font-copy b')].map(x=>(x.textContent||'').trim()),
    artists:[...document.querySelectorAll('.mlv303-artist-head b')].map(x=>(x.textContent||'').trim())
  }));
  for(const id of ['red','aka','born_to_die','paradise','ultraviolence','folklore','evermore','ocean_blvd'])ok(eraCatalog.ids.includes(id),'Missing independent typography era: '+id);
  ok(!eraCatalog.labels.some(x=>/Red\s*\/\s*Lana|folklore\s*\/\s*evermore|Chemtrails\s*\/\s*Blue Banisters/i.test(x)),'Typography still contains merged eras: '+JSON.stringify(eraCatalog.labels));
  ok(eraCatalog.artists.length===0,'Typography must use one unified era grid without artist group headings: '+JSON.stringify(eraCatalog.artists));

  const typographyPaletteCheck=await page.evaluate(()=>{
    const capture=()=>{
      const root=getComputedStyle(document.documentElement),body=getComputedStyle(document.body);
      return {
        text:root.getPropertyValue('--text'),bg:root.getPropertyValue('--bg'),
        accent:root.getPropertyValue('--accent'),gold:root.getPropertyValue('--gold'),
        bodyColor:body.color,bodyBackground:body.backgroundImage
      };
    };
    const mid=document.querySelector('[data-mlv-font-preset="midnights"]');
    const folk=document.querySelector('[data-mlv-font-preset="folklore"]');
    const before={
      palette:capture(),
      midPreview:getComputedStyle(mid.querySelector('.mlv303-font-word')).fontFamily,
      folkPreview:getComputedStyle(folk.querySelector('.mlv303-font-word')).fontFamily,
      midState:mid.querySelector('.mlv303-font-state')?.textContent||'',
      folkState:folk.querySelector('.mlv303-font-state')?.textContent||''
    };
    window.MLVTypographyV303.apply('folklore',true);
    const selectedCard=document.querySelector('[data-mlv-font-preset="folklore"]');
    const after={
      palette:capture(),
      selected:document.documentElement.dataset.mlvTypography,
      midPreview:getComputedStyle(mid.querySelector('.mlv303-font-word')).fontFamily,
      folkPreview:getComputedStyle(folk.querySelector('.mlv303-font-word')).fontFamily,
      midState:mid.querySelector('.mlv303-font-state')?.textContent||'',
      folkState:folk.querySelector('.mlv303-font-state')?.textContent||'',
      selectedText:getComputedStyle(selectedCard.querySelector('.mlv303-font-copy b')).color,
      bodyText:getComputedStyle(document.body).color,
      selectedBg:getComputedStyle(selectedCard).backgroundImage
    };
    return {before,after};
  });
  ok(typographyPaletteCheck.after.selected==='folklore','Typography API did not apply Folklore');
  ok(JSON.stringify(typographyPaletteCheck.before.palette)===JSON.stringify(typographyPaletteCheck.after.palette),'Typography API changed app colors/backgrounds: '+JSON.stringify(typographyPaletteCheck));
  ok(typographyPaletteCheck.before.midPreview!==typographyPaletteCheck.before.folkPreview,'Typography cards are not previewing distinct font stacks');
  ok(typographyPaletteCheck.before.midPreview===typographyPaletteCheck.after.midPreview&&typographyPaletteCheck.before.folkPreview===typographyPaletteCheck.after.folkPreview,'Changing the active font altered the other cards’ previews');
  ok(/SELECTED/.test(typographyPaletteCheck.after.folkState)&&/PREVIEW/.test(typographyPaletteCheck.after.midState),'Typography selected/preview labels did not update correctly');
  ok(typographyPaletteCheck.after.selectedText===typographyPaletteCheck.after.bodyText,'Selected typography card text is not readable in the normal interface text color');
  await page.evaluate(()=>window.MLVTypographyV303.apply('midnights',true));
  await page.waitForFunction(()=>document.documentElement.dataset.mlvTypography==='midnights');

  await page.screenshot({path:`${out}/01-typography.png`,fullPage:true});
  await page.evaluate(()=>window.MLVTypographyV303.apply('midnights',true));

  await page.click('[data-v30171-setting="themes"]');
  await page.waitForSelector('[data-v30171-pane="themes"].active',{timeout:10000});
  await page.screenshot({path:`${out}/02-themes.png`,fullPage:true});

  await page.click('[data-v30171-setting="about"]');
  await page.waitForSelector('[data-v30171-pane="about"].active .mlvdev-avatar',{timeout:10000});
  const aboutBrand=await page.evaluate(()=>{
    const avatar=document.querySelector('.mlvdev-avatar');
    const product=document.querySelector('[data-mlv-product-brand="canonical"] img');
    const author=document.querySelector('[data-mlv-author-brand="canonical"]');
    const lab=document.querySelector('.mlvdev-studio-lockup img');
    const socials=[...document.querySelectorAll('.mlvdev-social')];
    const version=[...document.querySelectorAll('.mlvdev-meta b')].map(x=>(x.textContent||'').trim()).find(x=>/^v3\.0\.216$/.test(x))||'';
    return {
      avatar:{w:avatar?.naturalWidth||0,h:avatar?.naturalHeight||0,cw:avatar?.getBoundingClientRect().width||0,ch:avatar?.getBoundingClientRect().height||0,src:avatar?.getAttribute('src')||''},
      productSrc:product?.getAttribute('src')||'',productWidth:product?.naturalWidth||0,
      author:!!author,labSrc:lab?.getAttribute('src')||'',labWidth:lab?.naturalWidth||0,
      socialCount:socials.length,socialNames:socials.map(x=>x.querySelector('strong')?.textContent?.trim()||''),
      socialIcons:socials.filter(x=>x.querySelector('svg.mlvdev-social-icon')).length,version
    };
  });
  ok(aboutBrand.avatar.src==='assets/michel_duarte_avatar.jpg','About is not using the canonical developer portrait');
  ok(aboutBrand.avatar.w===1440&&aboutBrand.avatar.h===1920&&aboutBrand.avatar.cw>=170&&aboutBrand.avatar.ch>=220,'About canonical portrait is missing or incorrectly rendered: '+JSON.stringify(aboutBrand.avatar));
  ok(aboutBrand.productSrc==='assets/michels_life_lockup.svg'&&aboutBrand.productWidth>100,'About product identity is not using the canonical Michel’s Life lockup');
  ok(aboutBrand.author,'About author hierarchy is missing');
  ok(aboutBrand.labSrc==='assets/michels_lab_lockup.png'&&aboutBrand.labWidth>100,'About parent brand is not using the canonical Michel’s Lab lockup: '+JSON.stringify(aboutBrand));
  ok(aboutBrand.socialCount===5&&aboutBrand.socialIcons===5,'About socials must expose five visible icon+name links: '+JSON.stringify(aboutBrand));
  ok(JSON.stringify(aboutBrand.socialNames)===JSON.stringify(['Instagram','Facebook','LinkedIn','GitHub','Email']),'About social order/names drifted: '+JSON.stringify(aboutBrand.socialNames));
  ok(aboutBrand.version==='v3.0.216','About does not show the current build version: '+JSON.stringify(aboutBrand));
  await page.screenshot({path:`${out}/03-about.png`,fullPage:true});

  await page.evaluate(()=>{
    if(!window.FocusStoryV30162?.activeChapter?.()){
      window.FocusStoryV30162?.createChapter?.('UI Test Chapter','',new Date().toISOString().slice(0,10));
    }
  });
  await page.click('[data-v30171-setting="chapters"]');
  await page.waitForSelector('[data-v30171-pane="chapters"].active [data-mlv184-chapter]',{timeout:10000});
  const chapterData=await page.evaluate(()=>({
    current:window.FocusStoryV30162?.activeChapter?.()?.scenePack||'dark_kingdom',
    options:[...document.querySelectorAll('[data-v30171-pane="chapters"].active [data-mlv184-chapter]')].map(x=>x.dataset.mlv184Chapter)
  }));
  const target=chapterData.options.find(x=>x&&x!==chapterData.current);
  ok(!!target,'No alternate Chapter Scene option available for interaction test');
  await page.click(`[data-v30171-pane="chapters"].active [data-mlv184-chapter="${target}"]`);
  await page.waitForFunction(t=>window.FocusStoryV30162?.activeChapter?.()?.scenePack===t,target,{timeout:10000});
  await page.waitForSelector(`[data-v30171-pane="chapters"].active [data-mlv184-chapter="${target}"].active`,{timeout:10000});
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

  console.log(JSON.stringify({logo,typographyRoute,typographyPaletteCheck,headingFonts,avatar:aboutBrand.avatar,chapterTarget:target,typography:'midnights',cloudPopups:cloudCount},null,2));
} finally {
  await browser.close();
}
