import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const screenshot=process.env.MLV_ANDROID_UI_SCREENSHOT||'artifacts/ui-smoke/android-mobile.png';
function ok(value,message){if(!value)throw new Error(message)}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({
    viewport:{width:412,height:915},
    screen:{width:412,height:915},
    deviceScaleFactor:2.625,
    isMobile:true,
    hasTouch:true
  });
  const page=await context.newPage();

  await page.addInitScript(()=>{
    try{
      localStorage.setItem('michelsLife.onboarding.v30200','done');
      localStorage.setItem('michelsLife.language.v1','en');
      localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
      localStorage.setItem('michelsLife.language.installDefault.v1','en');
    }catch(_){}
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    window.MichelsLifeAndroid={postMessage(){}};
  });

  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(
    ()=>document.documentElement.dataset.mlvPlatform==='android' &&
        document.getElementById('mlv-android-topbar') &&
        document.getElementById('v30171Sidebar') &&
        document.getElementById('v30171PrimaryNav'),
    null,{timeout:60000}
  );

  const initialActive=await page.evaluate(()=>document.querySelector('#v30171PrimaryNav [aria-current="page"]')?.dataset?.tab||
    document.querySelector('#v30171PrimaryNav .active[data-tab]')?.dataset?.tab||'');
  if(initialActive!=='dashboard'){
    await page.evaluate(()=>document.querySelector('#v30171PrimaryNav [data-tab="dashboard"]')?.click());
    await page.waitForTimeout(350);
  }

  const initial=await page.evaluate(()=>{
    const rect=el=>{const r=el?.getBoundingClientRect();return r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null};
    const topbar=document.getElementById('mlv-android-topbar');
    const oldTop=document.querySelector('.topbar');
    const sidebar=document.getElementById('v30171Sidebar');
    const main=document.getElementById('main');
    const firstCard=main?.querySelector('.card');
    const status=document.getElementById('fixedStatusBar');
    return {
      topbar:rect(topbar),
      topbarDisplay:getComputedStyle(topbar).display,
      oldTopDisplay:oldTop?getComputedStyle(oldTop).display:'',
      sidebar:rect(sidebar),
      sidebarTransform:getComputedStyle(sidebar).transform,
      sidebarPosition:getComputedStyle(sidebar).position,
      activeStatus:rect(document.getElementById('v176StatusPanel')),
      activeStatusMaxHeight:getComputedStyle(document.getElementById('v176StatusPanel')).maxHeight,
      appChildren:Array.from(document.querySelector('.app')?.children||[]).map(el=>({
        id:el.id||'',cls:String(el.className||''),display:getComputedStyle(el).display,
        position:getComputedStyle(el).position,rect:rect(el)
      })),
      main:rect(main),
      firstCard:rect(firstCard),
      status:rect(status),
      overflow:document.documentElement.scrollWidth-window.innerWidth,
      active:document.querySelector('#v30171PrimaryNav [aria-current="page"]')?.dataset?.tab||
             document.querySelector('#v30171PrimaryNav .active[data-tab]')?.dataset?.tab||''
    };
  });

  ok(initial.topbarDisplay!=='none','Android top bar is hidden: '+JSON.stringify(initial));
  ok(initial.topbar&&initial.topbar.top<=1&&initial.topbar.height>=50,'Android top bar geometry is invalid: '+JSON.stringify(initial));
  ok(initial.oldTopDisplay==='none','Desktop top bar is still consuming phone space: '+JSON.stringify(initial));
  ok(initial.sidebar&&initial.sidebar.right<=8,'Android drawer is visible before opening: '+JSON.stringify(initial));
  ok(initial.sidebarPosition==='fixed','Android drawer is still participating in document flow: '+JSON.stringify(initial));
  ok(initial.main&&initial.main.top<190,'Primary content starts too low and still requires an initial scroll: '+JSON.stringify(initial));
  ok(initial.firstCard&&initial.firstCard.top<240,'First dashboard card starts too low: '+JSON.stringify(initial));
  ok(initial.overflow<=2,'Android page has horizontal overflow: '+JSON.stringify(initial));

  await page.locator('#mlv-android-menu-button').click();
  await page.waitForTimeout(260);
  const drawerOpen=await page.evaluate(()=>{
    const s=document.getElementById('v30171Sidebar').getBoundingClientRect();
    return {
      bodyOpen:document.body.classList.contains('mlv-android-nav-open'),
      left:s.left,right:s.right,width:s.width,
      expanded:document.getElementById('mlv-android-menu-button')?.getAttribute('aria-expanded')
    };
  });
  ok(drawerOpen.bodyOpen&&drawerOpen.left>=-2&&drawerOpen.expanded==='true','Drawer did not open correctly: '+JSON.stringify(drawerOpen));

  await page.locator('#mlv-android-drawer-backdrop').click({position:{x:400,y:300}});
  await page.waitForTimeout(240);
  ok(!(await page.evaluate(()=>document.body.classList.contains('mlv-android-nav-open'))),'Backdrop did not close drawer');

  const missionSelector='article.v132-mission, article.v137-mission, article.mission-card, article.quest-card';
  const missionCount=await page.locator(missionSelector).count();
  ok(missionCount>0,'No mission/checklist rows rendered on Dashboard');
  const missionGeometry=await page.locator(missionSelector).first().evaluate(card=>{
    const rect=el=>{const r=el?.getBoundingClientRect();return r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null};
    const check=card.querySelector('.v132-check');
    const content=card.querySelector(':scope > div');
    const title=card.querySelector('h3');
    const actions=card.querySelector('.v132-mission-actions,.v132-actions,.v131-actions,.quest-actions,.actions');
    return {
      card:rect(card),check:rect(check),content:rect(content),title:rect(title),actions:rect(actions),
      columns:getComputedStyle(card).gridTemplateColumns,
      actionsColumn:actions?getComputedStyle(actions).gridColumnStart:'',
      overflow:card.scrollWidth-card.clientWidth
    };
  });
  ok(missionGeometry.check&&missionGeometry.check.width>=35&&missionGeometry.check.height>=35,'Mission checkbox touch target is too small: '+JSON.stringify(missionGeometry));
  ok(missionGeometry.content&&missionGeometry.check.right<=missionGeometry.content.left+2,'Mission checkbox overlaps content: '+JSON.stringify(missionGeometry));
  ok(missionGeometry.title&&Math.abs(missionGeometry.check.top-missionGeometry.title.top)<18,'Mission checkbox/title are vertically crooked: '+JSON.stringify(missionGeometry));
  ok(missionGeometry.overflow<=2,'Mission card horizontally overflows: '+JSON.stringify(missionGeometry));
  if(missionGeometry.actions){
    ok(missionGeometry.actions.left>=missionGeometry.content.left-2,'Mission actions are falling into the checkbox column: '+JSON.stringify(missionGeometry));
  }
  console.log('ANDROID_GEOMETRY '+JSON.stringify({initial,drawerOpen,missionGeometry}));

  const cdp=await context.newCDPSession(page);
  async function touchSwipe(x1,y1,x2,y2){
    await cdp.send('Input.dispatchTouchEvent',{
      type:'touchStart',
      touchPoints:[{x:x1,y:y1,radiusX:2,radiusY:2,force:1,id:1}]
    });
    await page.waitForTimeout(30);
    await cdp.send('Input.dispatchTouchEvent',{
      type:'touchMove',
      touchPoints:[{x:(x1+x2)/2,y:(y1+y2)/2,radiusX:2,radiusY:2,force:1,id:1}]
    });
    await page.waitForTimeout(30);
    await cdp.send('Input.dispatchTouchEvent',{
      type:'touchMove',
      touchPoints:[{x:x2,y:y2,radiusX:2,radiusY:2,force:1,id:1}]
    });
    await page.waitForTimeout(20);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForTimeout(320);
  }

  await touchSwipe(390,700,110,700);
  await page.waitForFunction(
    ()=>document.querySelector('#v30171PrimaryNav [data-tab="missions"]')?.classList.contains('active') ||
        document.querySelector('#v30171PrimaryNav [data-tab="missions"]')?.getAttribute('aria-current')==='page',
    null,{timeout:5000}
  );
  const swipeState=await page.evaluate(()=>({
    active:document.querySelector('#v30171PrimaryNav [aria-current="page"]')?.dataset?.tab||
           document.querySelector('#v30171PrimaryNav .active[data-tab]')?.dataset?.tab||'',
    title:document.getElementById('mlv-android-section-title')?.textContent?.trim()||''
  }));
  ok(swipeState.active==='missions','Left swipe did not move to Missions: '+JSON.stringify(swipeState));

  await touchSwipe(5,720,105,720);
  ok(await page.evaluate(()=>document.body.classList.contains('mlv-android-nav-open')),'Left-edge swipe did not open drawer');
  await touchSwipe(300,720,120,720);
  ok(!(await page.evaluate(()=>document.body.classList.contains('mlv-android-nav-open'))),'Swipe-left did not close open drawer');

  const beforeFrame=await page.evaluate(()=>Number(document.getElementById('v30146Canvas')?.dataset?.frame||0));
  await sleep(260);
  const afterFrame=await page.evaluate(()=>Number(document.getElementById('v30146Canvas')?.dataset?.frame||0));
  if(beforeFrame>0)ok(afterFrame>beforeFrame,'Seasonal animation stalled in Android mobile viewport: '+JSON.stringify({beforeFrame,afterFrame}));

  await mkdir(dirname(screenshot),{recursive:true});
  await page.screenshot({path:screenshot,fullPage:true});
  console.log(JSON.stringify({
    ok:true,
    viewport:{width:412,height:915},
    initial,
    drawerOpen,
    missionGeometry,
    swipeState,
    animation:{beforeFrame,afterFrame}
  },null,2));
}finally{
  await browser.close();
}
