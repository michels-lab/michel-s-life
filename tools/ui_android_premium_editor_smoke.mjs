import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const base=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const output='artifacts/android-ui-smoke/premium-editor';
const ok=(yes,why)=>{if(!yes)throw Error(why)};
const browser=await chromium.launch({headless:true});
try{
  await mkdir(output,{recursive:true});
  for(const width of [360,412]){
    const context=await browser.newContext({
      viewport:{width,height:915},screen:{width,height:915},
      deviceScaleFactor:2.625,isMobile:true,hasTouch:true
    });
    const page=await context.newPage();
    await page.addInitScript(()=>{
      localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify({
        version:2,activeTab:'dashboard',xp:0,coins:0,totalCoinsEarned:0,
        settings:{characterName:'Michel',onboardingRequired:false,
          onboardingCompletedAt:'2026-10-01T12:00:00.000Z'},
        missions:[{id:'android-premium-weekly',name:'Android seeded Premium Contract',
          canonical:'android seeded premium contract',description:'Test fixture',
          category:'academic',type:'weekly',difficulty:'medium',xp:25,coins:0,
          priority:'medium',days:[1,3,5],weeklyTarget:2,
          archived:false,hidden:false,createdAt:'2026-01-01T12:00:00.000Z',
          completions:[]}],
        goals:[],history:[],achievements:[],affirmations:[],owned:[],equipped:{}
      }));
      localStorage.setItem('michelsLife.onboarding.v30200','done');
      localStorage.setItem('michelsLife.language.v1','en');
      localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
      localStorage.setItem('michelsLife.language.installDefault.v1','en');
      window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
      window.MichelsLifeAndroid={postMessage(){}};
    });
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>
      document.documentElement.dataset.mlvPlatform==='android' &&
      !!window.__mlvAndroidFastRoute && !!document.getElementById('mlv-android-bottom-nav'),
      null,{timeout:60000});
    ok(await page.evaluate(()=>window.__mlvAndroidFastRoute('contracts'))!==false,
      'Cannot open active Premium Contracts');
    const edit=page.locator(
      '#tab-contracts .v216-contract-card[data-contract-key="mission:android-premium-weekly"] [data-action="v217-edit-contract"]');
    await edit.waitFor({state:'visible',timeout:12000});
    await edit.click();
    const form=page.locator('#modalRoot #v217ContractEditForm');
    await form.waitFor({state:'visible',timeout:12000});
    const label='Android Premium editor validated '+width;
    await form.locator('input[name="name"]').fill(label);
    await form.locator('input[name="target"]').fill('4');
    await form.locator('textarea[name="description"]').fill('Android shared Premium save smoke');
    await page.setViewportSize({width,height:620});
    await form.locator('input[name="name"]').focus();
    const geo=await form.evaluate(el=>{
      const modal=el.closest('.modal'),grid=el.querySelector('.v217-form-grid');
      const name=el.querySelector('[name="name"]'),save=el.querySelector('button[type="submit"]');
      const box=node=>{const r=node.getBoundingClientRect();return {
        left:r.left,right:r.right,top:r.top,bottom:r.bottom,
        width:r.width,height:r.height};};
      return {modal:box(modal),name:box(name),save:box(save),
        cols:getComputedStyle(grid).gridTemplateColumns,
        nameFont:parseFloat(getComputedStyle(name).fontSize),
        modalScrollable:modal.scrollHeight>modal.clientHeight,
        width:innerWidth,height:innerHeight,
        overflow:document.documentElement.scrollWidth-innerWidth};
    });
    ok(geo.modal.left>=-3&&geo.modal.right<=width+3&&
      geo.modal.top>=-3&&geo.modal.bottom<=623&&
      geo.cols.split(' ').length===1&&geo.nameFont>=16&&
      geo.name.height>=47.5&&geo.overflow<=3&&geo.modalScrollable,
      'Live Premium editor is clipped or traps form at '+width+': '+JSON.stringify(geo));
    await page.screenshot({path:output+'/premium-editor-'+width+'-focused.png'});
    await form.locator('button[type="submit"]').click();
    await page.waitForFunction(label=>{
      const s=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}');
      const m=s.missions?.find(x=>x.id==='android-premium-weekly');
      return m?.name===label&&m?.weeklyTarget===4&&
        m?.description==='Android shared Premium save smoke';
    },label,{timeout:8000});
    ok(await form.count()===0,'Premium editor still open after Save at '+width);
    const updated=page.locator(
      '#tab-contracts .v216-contract-card[data-contract-key="mission:android-premium-weekly"]');
    ok((await updated.textContent()||'').includes(label),
      'Updated contract not rendered after canonical save at '+width);
    await page.screenshot({path:output+'/premium-editor-'+width+'-saved.png'});
    console.log('ANDROID_PREMIUM_EDITOR_PASS '+JSON.stringify({width,geo,saved:true}));
    await context.close();
  }
}finally{
  await browser.close();
}
