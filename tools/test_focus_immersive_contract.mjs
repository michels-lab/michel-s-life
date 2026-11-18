import {readFileSync} from 'node:fs';
import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import vm from 'node:vm';

const desktop=readFileSync('src/MichelsLife/frontend/focus-immersive.js','utf8');
const android=readFileSync('android/mobile-experience.js','utf8');
const androidBridge=readFileSync('android/android-bridge.js','utf8');
const loader=readFileSync('tools/enable_i18n.py','utf8');
const bundler=readFileSync('tools/replace_bundle_index.py','utf8');

test('shared wallpaper derives from an existing app image, not a hardcoded scene',()=>{
  const scene={kind:'mission-scene'};
  const style={values:{},setProperty(k,v){this.values[k]=v;},removeProperty(k){delete this.values[k];}};
  const doc={
    readyState:'loading',body:{},
    documentElement:{dataset:{mlvPlatform:'android'}},
    querySelector(selector){return selector==='#tab-missions'?scene:null;},
    addEventListener(){}
  };
  const window={__MICHELSLIFE_PLATFORM__:'android'};
  const ctx={window,document:doc,getComputedStyle(node){
    return {backgroundImage:node===scene?'url("assets/current-missions-background.jpg")':'none'};
  }};
  vm.runInNewContext(desktop,ctx,{timeout:1000});
  const target={style,dataset:{}};
  window.MichelsLifeFocusImmersive.applyWallpaper(target);
  assert.equal(target.dataset.mlvFocusWallpaper,'selected-image');
  assert.equal(style.values['--mlv-focus-wallpaper'],'url("assets/current-missions-background.jpg")');
  assert.equal(window.MichelsLifeFocusImmersive.wallpaper(),'url("assets/current-missions-background.jpg")');
});

test('immersive Pomodoro selects the real loaded Michel’s Life background image',()=>{
  const style={setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}};
  const picture={complete:true,naturalWidth:1400,currentSrc:'app://life/sky/background_sets/deep_ocean/night.jpg'};
  const doc={readyState:'loading',body:{},documentElement:{dataset:{mlvPlatform:'android'}},
    querySelector(s){return s==='#mlv184Background img'?picture:null;},
    addEventListener(){}};
  const window={__MICHELSLIFE_PLATFORM__:'android'};
  vm.runInNewContext(desktop,{window,document:doc},{timeout:1000});
  const target={style,dataset:{}};
  window.MichelsLifeFocusImmersive.applyWallpaper(target);
  assert.equal(target.dataset.mlvFocusWallpaper,'selected-image');
  assert.equal(style['--mlv-focus-wallpaper'],'url("app://life/sky/background_sets/deep_ocean/night.jpg")');
});

test('Missions gradient scene remains visible when no file wallpaper exists',()=>{
  const scene={kind:'mission-gradient'};
  const style={values:{},setProperty(k,v){this.values[k]=v;},removeProperty(k){delete this.values[k];}};
  const doc={
    readyState:'loading',body:{},
    documentElement:{dataset:{mlvPlatform:'android'}},
    querySelector(selector){return selector==='#tab-missions'?scene:null;},
    addEventListener(){}
  };
  const window={__MICHELSLIFE_PLATFORM__:'android'};
  const gradient='linear-gradient(120deg, rgba(21, 36, 56, 0.4), rgba(47, 58, 80, 0.8))';
  vm.runInNewContext(desktop,{window,document:doc,getComputedStyle(node){
    return {backgroundImage:node===scene?gradient:'none'};
  }},{timeout:1000});
  const target={style,dataset:{}};
  window.MichelsLifeFocusImmersive.applyWallpaper(target);
  assert.equal(target.dataset.mlvFocusWallpaper,'selected-scene');
  assert.equal(style.values['--mlv-focus-wallpaper'],gradient);
});

test('both platforms keep one canonical timer and deliberate mini/navigation modes',()=>{
  assert.match(desktop,/window\.FocusStoryV30162/);
  assert.match(desktop,/closedMode=live\(state\)\?state\.mode:null/);
  assert.match(desktop,/screen\.hidden=true/);
  assert.match(desktop,/window\.MichelsLifeFocusImmersive\.open=open/);
  assert.match(desktop,/document\.body\.classList\.add\('mlv-desktop-focus-open'\)/);
  assert.match(android,/window\.MichelsLifeFocusImmersive\?\.applyWallpaper\?\.\(root\)/);
  assert.ok(android.includes("minimizedForMode=(state?.status==='running'||state?.status==='paused')?state.mode:null"),
    'Mobile mini must retain the running or paused phase owner');
  assert.match(android,/runningPhase!==minimizedForPhase&&f\.mode!==minimizedForMode/);
  assert.match(android,/z-index:2147483005!important/);
  assert.doesNotMatch(android,/v30162FocusDock/,'Android must never depend on deleted sidebar Focus dock');
  assert.match(android,/background-image:\s*linear-gradient\(/);
  assert.doesNotMatch(desktop,/localStorage\.setItem\(/);
});

test('Android real presets call the canonical engine and persist without ghost DOM',()=>{
  const core=readFileSync('src/MichelsLife/frontend/index.html','utf8');
  assert.match(core,/window\.FocusStoryV30162=\{[^\n]*applyPreset,/);
  assert.match(android,/api\.applyPreset\(preset,selected\[0\],selected\[1\]\)/);
  assert.match(android,/api\.applyPreset\('custom',work,rest\)/);
  assert.match(android,/data-mobile-preset="25\/5"/);
  assert.match(android,/data-mobile-preset="50\/10"/);
  assert.match(android,/data-mobile-preset="90\/15"/);
  assert.doesNotMatch(android,/v30162FocusDock/);
  assert.doesNotMatch(androidBridge,/v30162FocusDock/);
  assert.match(androidBridge,/v30175ActionDock/,'Quick Capture still has an Android bridge');
  assert.doesNotMatch(android,/#v30162WorkMin/);
  assert.doesNotMatch(android,/#v30162BreakMin/);
  assert.doesNotMatch(core,/v30162FocusDock/);
});

test('Settings is a client of the ONE Focus timer and respects cancelled changes',()=>{
  const core=readFileSync('src/MichelsLife/frontend/index.html','utf8');
  const start=core.indexOf('function applyFocusSettings(preset,workValue,breakValue){');
  const end=core.indexOf('function mlvAboutSocialIcon(',start);
  assert.ok(start>=0&&end>start,'Focus Settings source function must be present');
  const fn=core.slice(start,end);
  assert.match(fn,/timer\.applyPreset\(chosen,work,rest\)!==true/);
  assert.doesNotMatch(fn,/\bf\.(?:workMin|breakMin|preset|deadlineAt|remainingMs|phaseTotalMs|status)\s*=/,
    'Settings must not mutate canonical Focus state separately');
  const applied=[],repaint=[];
  let allowed=true;
  const ctx={
    window:{
      FocusStoryV30162:{applyPreset(...values){applied.push(values);return allowed;}},
      MichelsLifeFocusImmersive:{refresh(){repaint.push('desktop');}},
      MichelsLifeMobileExperience:{updateFocus(){repaint.push('android');}}
    },
    refreshFocusPane(){repaint.push('settings');}
  };
  vm.runInNewContext(fn,ctx,{timeout:1000});
  assert.equal(ctx.applyFocusSettings('90/15',2,4),true);
  assert.deepEqual(applied[0],['90/15',90,15]);
  assert.deepEqual(repaint,['desktop','android','settings']);
  allowed=false;repaint.length=0;
  assert.equal(ctx.applyFocusSettings('custom',37,8),false);
  assert.deepEqual(applied[1],['custom',37,8]);
  assert.deepEqual(repaint,[],'A cancelled running timer preset must not repaint or reset state');
  assert.doesNotMatch(core,/Configure the same Focus timer used from the action dock/);
});

test('Windows notifications consume the one canonical Focus timer',()=>{
  const core=readFileSync('src/MichelsLife/frontend/index.html','utf8');
  const shell=readFileSync('src/MichelsLife/DesktopShell.cs','utf8');
  assert.match(core,/function queueWindowsFocus\(type,detail\)/);
  assert.match(core,/function takeWindowsNotification\(\)/);
  assert.match(core,/queueWindowsFocus\('started'/);
  assert.match(core,/queueWindowsFocus\('paused'/);
  assert.match(core,/queueWindowsFocus\('completed'/);
  assert.match(core,/renderFocusDock,setFocusPanelExpanded,toggleFocusPanel,closeFocusPanel,takeWindowsNotification/);
  assert.match(shell,/Tick \+= async \(_, _\) => await PollWindowsFocusAsync\(\)/);
  assert.match(shell,/window\.FocusStoryV30162\?\.takeWindowsNotification\?\.\(\)/);
  assert.match(shell,/ShowBalloonTip\(type == "completed" \? 12000 : 5500/);
  assert.match(core,/function applyPreset\(name,w,b\)/);
  assert.match(core,/renderFocusDock\(\);return true}/);
  assert.match(android,/if\(api\.applyPreset\('custom',work,rest\)===true\)clearDurationDraft\(\)/);
});

test('Windows and Android package the same immersion module once',()=>{
  assert.match(loader,/FOCUS_LOADER_MARKER/);
  assert.match(loader,/text = text\.replace\(FOCUS_LOADER_MARKER, ''\)/);
  assert.match(bundler,/dst\.writestr\("focus-immersive\.js", immersion\.read_bytes\(\)\)/);
});
