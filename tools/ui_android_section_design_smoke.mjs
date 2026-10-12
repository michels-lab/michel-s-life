import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const url=process.env.MLV_ANDROID_UI_URL||'http://127.0.0.1:4174';
const output='artifacts/android-ui-smoke/sections';
const browser=await chromium.launch({headless:true});
function assert(ok,reason){if(!ok)throw new Error(reason)}

try{
  const context=await browser.newContext({
    viewport:{width:412,height:915},screen:{width:412,height:915},
    isMobile:true,hasTouch:true,deviceScaleFactor:2.625,reducedMotion:'no-preference'
  });
  const page=await context.newPage();
  await page.addInitScript(()=>{
    try{
      const old={
        version:2,
        settings:{characterName:'Michel',onboardingRequired:false,onboardingCompletedAt:'2026-10-01T12:00:00.000Z'},
        activeTab:'dashboard',xp:0,coins:0,totalCoinsEarned:0,
        missions:[
          {id:'mobile-daily',name:'Design smoke daily',canonical:'design smoke daily',
           description:'',category:'academic',type:'daily',difficulty:'medium',xp:25,
           coins:0,priority:'medium',days:[1,2,3,4,5],archived:false,hidden:false,
           createdAt:'2026-01-01T12:00:00.000Z',completions:[]},
          {id:'mobile-weekly',name:'Design smoke weekly',canonical:'design smoke weekly',
           description:'',category:'physical',type:'weekly',difficulty:'medium',xp:25,
           coins:0,priority:'medium',days:[1,3,5],archived:false,hidden:false,
           createdAt:'2026-01-01T12:00:00.000Z',completions:[]}
        ],
        history:[],achievements:[],goals:[],affirmations:[],owned:[],equipped:{}
      };
      localStorage.setItem('vida_rpg_personal_progress_v2',JSON.stringify(old));
      localStorage.setItem('michelsLife.onboarding.v30200','done');
      localStorage.setItem('michelsLife.language.v1','en');
      localStorage.setItem('michelsLife.language.userOverrideBase.v1','en');
      localStorage.setItem('michelsLife.language.installDefault.v1','en');
    }catch(_){}
    window.__MICHELSLIFE_INSTALL_LANGUAGE__='en';
    window.MichelsLifeAndroid={postMessage(){}};
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement.dataset.mlvPlatform==='android' &&
    !!document.querySelector('#mlv-android-topbar') &&
    !!window.__mlvAndroidFastRoute &&
    !!window.MichelsLifeAndroidSections &&
    !!document.getElementById('mlv-android-section-layout'),null,{timeout:60000});
  await mkdir(output,{recursive:true});

  const screenshots=[];
  async function route(id,width=412){
    await page.setViewportSize({width,height:915});
    const done=await page.evaluate(id=>window.__mlvAndroidFastRoute(id),id);
    assert(done!==false,'Android navigation failed for '+id);
    await page.waitForFunction(id=>{
      const tab=document.getElementById('tab-'+id);
      return tab && tab.classList.contains('active') && tab.getBoundingClientRect().width>0;
    },id,{timeout:12000});
    // The screenshot represents a settled page; animation is probed separately.
    await page.waitForTimeout(280);
    const state=await page.evaluate(id=>{
      const tab=document.getElementById('tab-'+id);
      const vw=innerWidth,active=document.getElementById('main');
      const bb=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height}};
      const card=[...tab.querySelectorAll('.card, .v216-contract-card, .v156-ach-card, .v133-ach')]
        .filter(e=>e.getClientRects().length && getComputedStyle(e).display!=='none').slice(0,30);
      const escaped=card.filter(e=>{
        const r=e.getBoundingClientRect();
        return r.width>0 && (r.left< -3 || r.right>vw+3);
      }).map(e=>({cls:String(e.className).slice(0,80),...bb(e)}));
      const section=getComputedStyle(tab);
      const settingsButtons=[...tab.querySelectorAll('.v30171-settings-nav [data-v30171-setting]')]
        .filter(e=>e.getClientRects().length).slice(0,6).map(e=>bb(e).height);
      const contractBtns=[...tab.querySelectorAll('.v216-filter-chip')]
        .filter(e=>e.getClientRects().length).slice(0,6).map(e=>bb(e).height);
      const projectBtns=[...tab.querySelectorAll('#tab-projects [data-v30106-action]')]
        .filter(e=>e.getClientRects().length).slice(0,10).map(e=>bb(e).height);
      const contractKpis=[...tab.querySelectorAll('.v194-kpi')].map(card=>{
        const label=card.querySelector('small')?.getBoundingClientRect();
        const value=card.querySelector('b')?.getBoundingClientRect();
        return {labelBottom:label?.bottom,valueTop:value?.top,
          width:card.getBoundingClientRect().width,
          display:getComputedStyle(card).display};
      });
      const statGrid=tab.querySelector('.stat-hero-grid');
      const statsKpis=[...tab.querySelectorAll('.stat-hero')].map(card=>{
        const rect=card.getBoundingClientRect();
        const label=card.querySelector('small')?.getBoundingClientRect();
        const value=card.querySelector('b')?.getBoundingClientRect();
        return {left:rect.left,right:rect.right,top:rect.top,width:rect.width,
          height:rect.height,labelBottom:label?.bottom,valueTop:value?.top};
      });
      const affirmationRows=[...tab.querySelectorAll('#tab-affirmations .table tbody tr')].slice(0,3).map(row=>({
        width:row.getBoundingClientRect().width,
        columns:[...row.cells].map(cell=>({
          label:cell.dataset.mlvAndroidLabel||'',
          display:getComputedStyle(cell).display,
          width:cell.getBoundingClientRect().width
        }))
      }));
      const affirmationEmpty=tab.querySelector('.mlv-android-affirmations-empty');
      const affirmationHeader=tab.querySelector('#tab-affirmations .table thead');
      return {
        id,viewport:vw,documentWidth:document.documentElement.scrollWidth,
        main:bb(active),tab:bb(tab),cardCount:card.length,escaped,
        display:section.display,settingsButtons,contractBtns,projectBtns,contractKpis,affirmationRows,
        statsKpis,statsGridColumns:statGrid?getComputedStyle(statGrid).gridTemplateColumns:null,
        affirmationEmpty:!!(affirmationEmpty&&affirmationEmpty.getClientRects().length),
        affirmationHeaderDisplay:affirmationHeader?getComputedStyle(affirmationHeader).display:null,
        contractGrid:getComputedStyle(tab.querySelector('.v216-contract-grid')||tab).gridTemplateColumns,
        achievementGrid:getComputedStyle(tab.querySelector('.v156-ach-grid, .v133-ach-grid')||tab).gridTemplateColumns,
      };
    },id);
    assert(state.documentWidth<=width+3,'Android '+id+' causes horizontal document overflow: '+JSON.stringify(state));
    assert(state.tab.width<=width+3 && state.tab.left>=-3,'Android '+id+' tab geometry escapes viewport: '+JSON.stringify(state));
    assert(!state.escaped.length,'Android '+id+' clips cards: '+JSON.stringify(state));
    assert(state.settingsButtons.every(x=>x>=43.5),'Android Settings touch targets too small: '+JSON.stringify(state));
    assert(state.contractBtns.every(x=>x>=43.5),'Android Contracts category targets too small: '+JSON.stringify(state));
    assert(state.projectBtns.every(x=>x>=43.5),'Android Projects action touch targets too small: '+JSON.stringify(state));
    if(id==='contracts'){
      assert(state.contractKpis.length===4&&state.contractKpis.every(x=>
        x.width>=90&&x.display==='flex'&&x.valueTop>=x.labelBottom-1),
        'Contracts metric labels/values overlap in mobile columns: '+JSON.stringify(state));
    }
    if(id==='stats'){
      const k=state.statsKpis;
      assert(k.length===6 && state.statsGridColumns?.split(' ').length===2,
        'Statistics activity overview must be 2 columns on phone: '+JSON.stringify(state));
      assert(k.every((tile,index)=>tile.width>=112&&tile.height>=80&&
        tile.left>=-3&&tile.right<=width+3&&
        tile.valueTop>=tile.labelBottom-1 &&
        (index%2===0 || Math.abs(tile.top-k[index-1].top)<2)),
        'Statistics cards are cramped, overlapping or outside viewport: '+JSON.stringify(state));
    }
    if(id==='affirmations'){
      assert(state.affirmationHeaderDisplay==='none',
        'Affirmations still display cramped desktop table headers: '+JSON.stringify(state));
      if(!state.affirmationRows.length){
        assert(state.affirmationEmpty,
          'No affirmations must show a readable mobile empty state: '+JSON.stringify(state));
      }else{
        assert(state.affirmationRows.every(row=>row.width<=width-6&&row.columns.every(cell=>
          cell.display==='flex'&&cell.label.length>0&&cell.width<=row.width)),
          'Android affirmation editor still uses squeezed desktop columns: '+JSON.stringify(state));
      }
    }
    const filename=output+'/'+id+'-'+width+'.png';
    await page.screenshot({path:filename});
    screenshots.push(filename);
    return state;
  }

  // Verify actual computed layout across sections, not just stylesheet text.
  const audit=[];
  for(const id of ['dashboard','contracts','projects','stats','compare','weekly-review','achievements','affirmations','settings']){
    audit.push(await route(id));
  }
  for(const id of ['contracts','projects','stats','settings']){
    audit.push(await route(id,360));
  }
  // Premium Contracts must have a real compact disclosure: do not leave
  // tiny always-visible desktop chips or an expandable label that cannot open.
  for(const width of [412,360]){
    await route('contracts',width);
    const details=page.locator('#tab-contracts details.mlv-android-contract-filter-details').first();
    assert(await details.count()===1,'Android Contracts filter disclosure is missing at '+width);
    const summary=details.locator('summary');
    const chips=details.locator('.v216-filter-chip');
    assert(await chips.count()>=2,'Canonical Contracts category chips are missing');
    if(await details.evaluate(el=>el.open))await summary.click();
    assert(!(await details.evaluate(el=>el.open)) && !(await chips.first().isVisible()),
      'Contracts filters do not collapse on a phone at '+width);
    await summary.click();
    assert(await details.evaluate(el=>el.open) && await chips.first().isVisible(),
      'Contracts category disclosure did not open by a real touch click at '+width);
    const targets=await details.evaluate(el=>
      [...el.querySelectorAll('.v216-filter-chip')].filter(chip=>chip.getClientRects().length)
        .map(chip=>{const r=chip.getBoundingClientRect();return {
          label:chip.textContent.trim(),left:r.left,right:r.right,width:r.width,height:r.height
        };})
    );
    assert(targets.length>=2 && targets.every(t=>
      t.width>=43.5&&t.height>=43.5&&t.left>=-3&&t.right<=width+3) &&
      await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),
      'Contracts category chips are too small or overflow: '+JSON.stringify({width,targets}));
    const filename=output+'/contracts-categories-open-'+width+'.png';
    await page.screenshot({path:filename});
    screenshots.push(filename);
    await summary.click();
    assert(!(await details.evaluate(el=>el.open)),
      'Contracts category disclosure failed to close at '+width);
    audit.push({id:'contracts-disclosure',width,targets:targets.length,openClose:true});
  }

  // Goals must keep the original create/save engine, not a read-only
  // gallery of stacked desktop cards or a modal with unreachable Save.
  for(const width of [412,360]){
    await route('goals',width);
    const newGoal=page.locator('#tab-goals [data-action="goal-new"]');
    assert(await newGoal.count()===1,'Canonical Goals create entry missing at '+width);
    await newGoal.click();
    const form=page.locator('#modalRoot #goalEditForm');
    await form.waitFor({state:'visible',timeout:9000});
    const name='Android Goals mobile editor QA '+width;
    await form.locator('input[name="name"]').fill(name);
    await form.locator('input[name="target"]').fill('3');
    await form.locator('textarea[name="desc"]').fill('Mobile shared Goals save contract');
    const shortHeight=width===360?620:915;
    await page.setViewportSize({width,height:shortHeight});
    const editor=await page.evaluate(()=>{
      const form=document.getElementById('goalEditForm');
      const modal=form.closest('.modal');
      const bounds=el=>{const r=el.getBoundingClientRect();return {
        left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
      const grid=form.querySelector('.goal-edit-grid');
      const name=form.querySelector('input[name="name"]');
      const submit=form.querySelector('button[type="submit"]');
      return {modal:bounds(modal),gridColumns:getComputedStyle(grid).gridTemplateColumns,
        name:bounds(name),font:parseFloat(getComputedStyle(name).fontSize),
        submit:bounds(submit),overflow:document.documentElement.scrollWidth-innerWidth,
        modalScrollable:modal.scrollHeight>modal.clientHeight,
        viewportWidth:innerWidth,viewportHeight:innerHeight};
    });
    assert(editor.modal.left>=-3&&editor.modal.right<=width+3&&
      editor.modal.top>=-3&&editor.modal.bottom<=shortHeight+3&&
      editor.gridColumns.split(' ').length===1&&
      editor.font>=16&&editor.name.height>=47.5&&editor.overflow<=3,
      'Goals editor still has clipped desktop geometry: '+JSON.stringify({width,editor}));
    await page.screenshot({path:output+'/goals-editor-'+width+'.png'});
    screenshots.push(output+'/goals-editor-'+width+'.png');
    await form.locator('button[type="submit"]').click();
    await page.waitForFunction(value=>
      JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}')
        .goals?.some(g=>g.name===value&&g.target===3),
      name,{timeout:8000});
    assert(await form.count()===0,'Goals editor did not close after real Save at '+width);
    assert(await page.locator('#tab-goals .goal-card').filter({hasText:name}).count()>0,
      'Saved Goal did not render its canonical card at '+width);
    await page.setViewportSize({width,height:915});
    audit.push({id:'goals-editor-save',width,shortHeight,saved:true});
  }

  // The calendar month grid must not be pushed below four stacked desktop
  // summary cards. Measure rendered month metrics on both narrow phone widths.
  for(const width of [412,360]){
    await route('calendar',width);
    const calendar=await page.evaluate(()=>{
      const root=[...document.querySelectorAll(
        '#tab-calendar .v30134-kpis,#tab-calendar .v30135-kpis')]
        .find(el=>el.getClientRects().length);
      if(!root)return null;
      const rect=el=>{const r=el.getBoundingClientRect();return {
        x:r.x,y:r.y,right:r.right,width:r.width,height:r.height};};
      return {columns:getComputedStyle(root).gridTemplateColumns,
        windowWidth:innerWidth,cards:[...root.children].map(rect),
        monthCells:[...document.querySelectorAll(
          '#tab-calendar .v30135-day,#tab-calendar .v30134-day')]
          .filter(el=>el.getClientRects().length).map(cell=>({
            date:cell.getAttribute('data-date'),
            number:cell.querySelector('.v30135-daynum > span,.v30134-daynum > span')?.textContent.trim(),
            metadata:getComputedStyle(cell.querySelector(
              '.v30135-daymeta,.v30134-daymeta')).display,
            dots:!!cell.querySelector('.v30135-stage-dots,.v30134-stage-dots')
          }))};
    });
    assert(calendar&&calendar.cards.length===4&&calendar.columns.split(' ').length===2,
      'Phone Calendar still stacks four desktop KPI cards: '+JSON.stringify(calendar));
    assert(calendar.cards.every((tile,i)=>tile.width>=110&&tile.height>=85&&
      tile.x>=-3&&tile.right<=width+3&&
      (i%2===0||Math.abs(tile.y-calendar.cards[i-1].y)<=2)),
      'Phone Calendar KPI layout clips or breaks row alignment: '+JSON.stringify(calendar));
    assert(calendar.monthCells.length>=28 && calendar.monthCells.every(c=>
      !!c.number && Number.isInteger(Number(c.number)) && c.metadata==='none' && c.dots),
      'Calendar month cells still show clipped desktop Completed/Missed/XP copy: '+
      JSON.stringify(calendar.monthCells.slice(0,5)));
    audit.push({id:'calendar',width,calendar});
  }

  // Story has a legacy-compatible route, but mobile render is still mandatory.
  audit.push(await route('story'));

  // Story/Chapters preserves the canonical renderer. The initial form must
  // stop behaving like a four-column desktop editor on either phone size.
  for(const width of [412,360]){
    await route('story',width);
    const story=await page.evaluate(()=>{
      const form=document.querySelector('#tab-story .v30162-story-form');
      if(!form)return null;
      const bounds=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height}};
      const controls=[...form.querySelectorAll('input,textarea,select,button')];
      return {columns:getComputedStyle(form).gridTemplateColumns,
        form:bounds(form),
        controls:controls.map(el=>({tag:el.tagName.toLowerCase(),...bounds(el),font:getComputedStyle(el).fontSize})),
        viewport:innerWidth};
    });
    assert(story&&story.controls.length>=4,
      'Story canonical edit form was not rendered: '+JSON.stringify(story));
    assert(story.columns.split(' ').length===1 &&
      story.form.right<=width+3 && story.form.left>=-3,
      'Story still uses desktop multi-column edit geometry: '+JSON.stringify(story));
    assert(story.controls.every(el=>el.height>=47.5&&el.left>=-3&&el.right<=width+3 &&
      (el.tag==='button'||parseFloat(el.font)>=15.5)),
      'Story editor is clipped or uses tiny phone controls: '+JSON.stringify(story));
  }

  // About is the real Michel's Lab product, author and socials pane, not a
  // replica or synthetic card. Check links, portrait and lockup at two widths.
  for(const width of [412,360]){
    await route('settings',width);
    const aboutButton=page.locator(
      '#tab-settings .v30171-settings-nav [data-v30171-setting="about"]');
    assert(await aboutButton.count()===1,'Settings/About route is inaccessible');
    await aboutButton.click();
    await page.waitForFunction(()=>{
      const core=document.querySelector(
        '#tab-settings [data-v30171-pane="about"] [data-mlv-about-core]');
      return core&&core.getClientRects().length>0;
    },null,{timeout:10000});
    const about=await page.evaluate(()=>{
      const core=document.querySelector(
        '#tab-settings [data-v30171-pane="about"] [data-mlv-about-core]');
      const bounds=el=>{const r=el.getBoundingClientRect();return {
        left:r.left,right:r.right,width:r.width,height:r.height}};
      const links=[...core.querySelectorAll('.mlvdev-social')];
      const product=core.querySelector('.mlvdev-product');
      const main=core.querySelector('.mlvdev-main');
      const portrait=core.querySelector('.mlvdev-avatar');
      return {documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,
        core:bounds(core),productColumns:getComputedStyle(product).gridTemplateColumns,
        mainColumns:getComputedStyle(main).gridTemplateColumns,
        portrait:bounds(portrait),
        links:links.map(el=>({...bounds(el),url:el.getAttribute('href'),
          label:el.textContent.trim()}))};
    });
    assert(about.documentWidth<=width+3&&about.core.left>=-3&&about.core.right<=width+3,
      'Settings/About horizontal overflow: '+JSON.stringify(about));
    assert(about.productColumns.split(' ').length===1 &&
      about.mainColumns.split(' ').length===1&&about.portrait.width<=181,
      'About is still the wide desktop biography: '+JSON.stringify(about));
    assert(about.links.length===5&&about.links.every(x=>
      x.height>=47.5&&x.left>=-3&&x.right<=width+3&&
      x.label&&/^(https:\/\/|mailto:)/.test(x.url||'')),
      'About social cards are clipped, unlabeled or untappable: '+JSON.stringify(about));
    const file=output+'/about-'+width+'.png';
    await page.screenshot({path:file});
    screenshots.push(file);
  }

  // Weekly Review needs the real canonical four metrics within two rows,
  // not four desktop KPI strips pushing the rest of the review below the fold.
  for(const width of [412,360]){
    await route('weekly-review',width);
    const review=await page.evaluate(()=>{
      const hero=document.querySelector('#tab-weekly-review .v30105-review-hero');
      if(!hero)return null;
      const geom=el=>{const r=el.getBoundingClientRect();return {
        x:r.x,right:r.right,y:r.y,width:r.width,height:r.height};};
      const metrics=[...hero.querySelectorAll('.v30105-review-kpi')];
      return {cols:getComputedStyle(hero).gridTemplateColumns,
        hero:geom(hero),header:geom(hero.firstElementChild),
        metrics:metrics.map(geom),
        buttons:[...hero.querySelectorAll('.actions button')].map(geom)};
    });
    assert(review&&review.metrics.length===4&&review.cols.split(' ').length===2 &&
      review.header.width>=review.metrics[0].width*1.8 &&
      review.header.width<=review.hero.width+2,
      'Weekly Review still stacks the four desktop KPIs: '+JSON.stringify(review));
    assert(review.metrics.every((c,i)=>c.width>=110&&c.height>=91&&
      c.x>=-3&&c.right<=width+3&&
      (i%2===0||Math.abs(c.y-review.metrics[i-1].y)<=2)) &&
      review.buttons.length>=2&&review.buttons.every(b=>b.height>=43.5),
      'Weekly Review mobile KPI/actions overflow or touch targets: '+JSON.stringify(review));
    audit.push({id:'weekly-review',width,review});
  }

  // Projects uses its ONE canonical shared create/edit/mission-link form.
  // Check actual touch/hit-test geometry, save through that form and verify
  // the resulting card exists, rather than mocking the project state.
  for(const width of [412,360]){
    await route('projects',width);
    const projectName='Android project editor QA '+width;
    await page.locator('#tab-projects [data-v30106-action="new-project"]').click();
    await page.waitForSelector('#modalRoot #v30106ProjectForm',{state:'visible',timeout:9000});
    await page.locator('#v30106ProjectForm input[name="name"]').fill(projectName);
    await page.locator('#v30106ProjectForm input[name="description"]').fill('Mobile actual form persistence');
    const link=page.locator('#v30106ProjectForm .v30106-link-option input[type="checkbox"]').first();
    if(await link.count())await link.check();
    await page.locator('#v30106ProjectForm button[type="submit"]').scrollIntoViewIfNeeded();
    const editor=await page.evaluate(()=>{
      const form=document.getElementById('v30106ProjectForm');
      const modal=document.querySelector('#modalRoot .modal');
      const nav=document.getElementById('mlv-android-bottom-nav');
      const topbar=document.getElementById('mlv-android-topbar');
      const save=form?.querySelector('button[type="submit"]');
      const bound=el=>{const r=el?.getBoundingClientRect();return r?
        {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null};
      const b=bound(save);
      const hit=b&&document.elementFromPoint((b.left+b.right)/2,(b.top+b.bottom)/2);
      return {viewport:innerWidth,docWidth:document.documentElement.scrollWidth,
        modal:bound(modal),save:b,
        saveReceivesTap:!!hit&&(hit===save||save.contains(hit)),
        cols:getComputedStyle(form.querySelector('.v30106-editor-grid')).gridTemplateColumns,
        fields:[...form.querySelectorAll('.v30106-editor-grid input,.v30106-editor-grid select')].map(bound),
        modalScroll:modal?.scrollTop,
        navHidden:nav&&getComputedStyle(nav).visibility==='hidden',
        topbarHidden:topbar&&getComputedStyle(topbar).visibility==='hidden'};
    });
    assert(editor.modal && editor.modal.top>=-3&&editor.modal.bottom<=918&&
      editor.modal.width<=width+3&&editor.docWidth<=width+3&&
      editor.cols.split(' ').length===1,
      'Android Projects editor escapes phone or keeps desktop columns: '+JSON.stringify(editor));
    assert(editor.fields.length===4&&editor.fields.every(x=>x.height>=47.5) &&
      editor.save.height>=48&&editor.save.top>=-3&&editor.save.bottom<=915&&
      editor.saveReceivesTap&&editor.navHidden&&editor.topbarHidden,
      'Android Projects editor Save is blocked or fields too small: '+JSON.stringify(editor));
    const filename=output+'/projects-editor-'+width+'.png';
    await page.screenshot({path:filename});
    screenshots.push(filename);
    await page.locator('#v30106ProjectForm button[type="submit"]').click();
    await page.waitForFunction(name=>[...document.querySelectorAll(
      '#tab-projects .v30106-project-card h3')].some(el=>el.textContent?.trim()===name),
      projectName,{timeout:10000});
    assert(await page.locator('#modalRoot #v30106ProjectForm').count()===0,
      'Project editor remains open after saving canonical project');
    const navVisible=await page.evaluate(()=>getComputedStyle(
      document.getElementById('mlv-android-bottom-nav')).visibility!=='hidden');
    assert(navVisible,'Android navigation was not restored after closing Projects editor');
    audit.push({id:'project-editor',width,editor,saveConfirmed:true});
  }

  // Tappable Achievements filters must actually change the canonical
  // gallery, not merely render nice category chips on mobile.
  for(const width of [412,360]){
    await route('achievements',width);
    // Prior tests/locale or persisted category state can leave the live
    // Achievements view filtered. Reset using the REAL All control before
    // measuring the complete canonical gallery, not a private flag.
    const all=page.locator('#tab-achievements .v134-ach-filter button')
      .filter({hasText:/^All$/});
    assert(await all.count()===1,'Canonical Achievements All control absent at '+width);
    await all.click();
    const filterDiagnosis=await page.evaluate(()=>({
      active:document.body.dataset.mlvAndroidTab,
      globalTab:window.state?.activeTab,
      filter:window.v157Filter,
      v157:document.querySelectorAll('#tab-achievements .v157-ach-card').length,
      v156:document.querySelectorAll('#tab-achievements .v156-ach-card').length,
      title:document.querySelector('#tab-achievements')?.textContent?.slice(0,200),
      mainTab:document.querySelector('#main > .tab.active')?.id
    }));
    console.log('ACHIEVEMENTS_ALL_FILTER_DIAG '+JSON.stringify({width,...filterDiagnosis}));
    await page.waitForFunction(()=>document.querySelectorAll(
      '#tab-achievements .v157-ach-card').length>=20,null,{timeout:7000});
    const allCount=await page.locator('#tab-achievements .v157-ach-card').count();
    assert(allCount>=20,'Canonical Achievements gallery failed at '+width+
      ': '+JSON.stringify(await page.evaluate(()=>({
        filter:window.v157Filter,activeTab:document.body.dataset.mlvAndroidTab,
        content:document.getElementById('tab-achievements')?.textContent?.slice(0,200)
      }))));
    const unlocked=page.locator('#tab-achievements .v134-ach-filter button').filter({hasText:'Unlocked'});
    assert(await unlocked.count()===1,'Unlocked Achievements filter is inaccessible');
    await unlocked.click();
    await page.waitForFunction(initial=>
      document.querySelector('#tab-achievements .v134-ach-filter button.active')
        ?.textContent?.trim()==='Unlocked' &&
      document.querySelectorAll('#tab-achievements .v157-ach-card').length<initial,
      allCount,{timeout:6000});
    await page.locator('#tab-achievements .v134-ach-filter button').filter({hasText:'All'}).click();
    await page.waitForFunction(initial=>document.querySelectorAll(
      '#tab-achievements .v157-ach-card').length===initial,
      allCount,{timeout:6000});
    const filterTarget=await page.evaluate(()=>{
      return [...document.querySelectorAll('#tab-achievements .v134-ach-filter button')]
        .filter(el=>el.getClientRects().length)
        .map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,
          left:r.left,right:r.right,copy:el.textContent.trim()};});
    });
    assert(filterTarget.length>=6&&filterTarget.every(x=>x.height>=43.5&&
      x.width>=44&&x.left>=-3&&x.right<=width+3),
      'Achievement filters are not thumb-size/within phone: '+JSON.stringify(filterTarget));
    audit.push({id:'achievements-actions',width,allCount,filterCount:filterTarget.length});
  }

  // A genuine affirmation must survive Add → Favorite → Hide on the mobile
  // view, with no shadow Android store or desktop source modification.
  await route('affirmations',360);
  const phrase='Android mobile Affirmations action QA';
  page.once('dialog',dialog=>dialog.accept(phrase));
  await page.locator('#tab-affirmations [data-action="add-affirmation"]').click();
  await page.waitForFunction(value=>
    JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}')
      ?.affirmations?.some(a=>a.text===value),phrase,{timeout:6000});
  const synthetic=await page.evaluate(value=>
    JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}')
      ?.affirmations?.find(a=>a.text===value)?.id,phrase);
  assert(!!synthetic,'Add affirmation did not create a canonical record');
  await page.locator('#tab-affirmations [data-action="fav-aff"][data-id="'+synthetic+'"]').click();
  await page.waitForFunction(id=>
    JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}')
      ?.affirmations?.find(a=>a.id===id)?.favorite===true,
    synthetic,{timeout:6000});
  await page.locator('#tab-affirmations [data-action="hide-aff"][data-id="'+synthetic+'"]').click();
  await page.waitForFunction(id=>
    JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}')
      ?.affirmations?.find(a=>a.id===id)?.hidden===true,
    synthetic,{timeout:6000});
  const savedAff=await page.evaluate(id=>{
    const item=typeof state==='object'?state.affirmations.find(a=>a.id===id):null;
    const stored=JSON.parse(localStorage.getItem('vida_rpg_personal_progress_v2')||'{}');
    return {item,saved:stored.affirmations?.find(a=>a.id===id)};
  },synthetic);
  assert(savedAff.item?.favorite&&savedAff.item?.hidden&&
    savedAff.saved?.favorite&&savedAff.saved?.hidden,
    'Android favorites/hide not persisted to canonical state: '+JSON.stringify(savedAff));
  const affScreenshot=output+'/affirmations-actions-360.png';
  await page.screenshot({path:affScreenshot});
  screenshots.push(affScreenshot);
  audit.push({id:'affirmations-actions',width:360,add:true,favorite:true,hidden:true});

  // Real screenshots previously showed Focus label/value text collapsed into
  // a single line and a toast overlapping the persistent bottom nav.
  await route('dashboard');
  // The canonical Dashboard can replace its hero after a fast section
  // transition. Wait for that real hero before asking the mobile Focus view
  // to attach; a fixed 280ms screenshot delay is not a readiness contract.
  await page.waitForFunction(()=>!!document.querySelector(
    '#tab-dashboard.active .v131-hero'),null,{timeout:12000});
  await page.evaluate(()=>window.MichelsLifeMobileExperience?.updateFocus?.());
  await page.waitForFunction(()=>!!document.querySelector(
    '#mlv-android-today-focus .mlv-focus-today-copy span'),null,{timeout:7000});
  const todayLayout=await page.evaluate(()=>{
    const root=document.getElementById('mlv-android-today-focus');
    const copy=root?.querySelector('.mlv-focus-today-copy');
    const title=copy?.querySelector('strong');
    const status=copy?.querySelector('span');
    const a=title?.getBoundingClientRect(),b=status?.getBoundingClientRect();
    return {display:copy?getComputedStyle(copy).display:'',
      title:a?{bottom:a.bottom,top:a.top}:null,
      status:b?{bottom:b.bottom,top:b.top}:null};
  });
  assert(todayLayout.title&&todayLayout.status &&
    todayLayout.status.top>=todayLayout.title.bottom-1,
    'Today Focus title/status overlap: '+JSON.stringify(todayLayout));
  const opened=await page.evaluate(()=>window.MichelsLifeMobileExperience?.openFocus?.());
  assert(opened===true,'Android Focus must open from canonical mobile action');
  const focusStats=await page.evaluate(()=>[...document.querySelectorAll(
    '#mlv-android-focus-sheet .mlv-android-focus-stats>div')].map(panel=>{
      const a=panel.querySelector('span')?.getBoundingClientRect();
      const b=panel.querySelector('strong')?.getBoundingClientRect();
      return {titleBottom:a?.bottom,valueTop:b?.top,panelWidth:panel.getBoundingClientRect().width};
    }));
  assert(focusStats.length===2 && focusStats.every(x=>x.panelWidth>0 &&
    x.valueTop>=x.titleBottom-1),
    'Focus session labels overlap values: '+JSON.stringify(focusStats));
  await page.evaluate(()=>window.MichelsLifeMobileExperience.closeFocus());
  const miniAndToast=await page.evaluate(()=>{
    window.FocusStoryV30162?.toggleFocus?.();
    window.MichelsLifeMobileExperience?.updateFocus?.();
    window.toast?.('Layout smoke','Toast must not block navigation');
    const min=document.getElementById('mlv-android-mini-focus');
    const nav=document.getElementById('mlv-android-bottom-nav');
    const toast=document.getElementById('toastWrap');
    const rect=e=>{const r=e?.getBoundingClientRect();return r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null};
    const copy=min?.querySelector('.mlv-mini-text');
    return {
      mini:rect(min),toast:rect(toast),nav:rect(nav),
      miniCopyDisplay:copy?getComputedStyle(copy).display:'',
      miniToggle:rect(min?.querySelector('.mlv-mini-toggle'))
    };
  });
  assert(miniAndToast.mini?.width>=360 && miniAndToast.miniCopyDisplay==='flex',
    'Android mini Focus is cropped or missing: '+JSON.stringify(miniAndToast));
  assert(miniAndToast.toast?.bottom<=miniAndToast.mini.top-6 &&
    miniAndToast.mini.bottom<=miniAndToast.nav.top+2 &&
    miniAndToast.miniToggle?.height>=43.5,
    'Android toast/mini Focus obstructs navigation or Pause control is too small: '+JSON.stringify(miniAndToast));
  await page.evaluate(()=>{
    const f=window.FocusStoryV30162?.focusState?.();
    if(f?.status==='running')window.FocusStoryV30162?.toggleFocus?.();
    window.MichelsLifeMobileExperience?.updateFocus?.();
    document.getElementById('toastWrap')?.replaceChildren();
  });

  // A real visual animation needs different computed positions at two
  // moments; CSS declaring an animation is not sufficient.
  await page.setViewportSize({width:412,height:915});
  await page.evaluate(()=>window.__mlvAndroidFastRoute('stats'));
  await page.waitForTimeout(280);
  await page.evaluate(()=>window.__mlvAndroidFastRoute('achievements'));
  const motion=await page.evaluate(async()=>{
    const card=document.querySelector('#tab-achievements.active > .card');
    if(!card)return null;
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const first={translate:getComputedStyle(card).translate,opacity:getComputedStyle(card).opacity};
    await new Promise(resolve=>setTimeout(resolve,95));
    const second={translate:getComputedStyle(card).translate,opacity:getComputedStyle(card).opacity};
    return {name:getComputedStyle(card).animationName,first,second};
  });
  assert(motion && motion.name==='mlvAndroidSectionEnter',
    'Android section transition is not applied to a real active card: '+JSON.stringify(motion));
  assert(motion.first.translate!==motion.second.translate ||
    motion.first.opacity!==motion.second.opacity,
    'Android entrance animation did not change computed visual state across frames: '+JSON.stringify(motion));
  await page.emulateMedia({reducedMotion:'reduce'});
  const reduced=await page.evaluate(()=>getComputedStyle(
    document.querySelector('#tab-achievements.active > .card')).animationName);
  assert(reduced==='none','Android ignores reduced-motion accessibility preference: '+reduced);
  await page.emulateMedia({reducedMotion:'no-preference'});
  console.log(JSON.stringify({ok:true,audit,motion,reduced,screenshots},null,2));
  await context.close();
}finally{
  await browser.close();
}
