import {readFileSync} from 'node:fs';
import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import vm from 'node:vm';

const desktop=readFileSync('src/MichelsLife/frontend/focus-immersive.js','utf8');
const android=readFileSync('android/mobile-experience.js','utf8');
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
  assert.match(android,/#v30162FocusDock\{\s*display:none!important;visibility:hidden!important/);
  assert.match(android,/background-image:\s*linear-gradient\(/);
  assert.doesNotMatch(desktop,/localStorage\.setItem\(/);
});

test('Windows and Android package the same immersion module once',()=>{
  assert.match(loader,/FOCUS_LOADER_MARKER/);
  assert.match(loader,/text = text\.replace\(FOCUS_LOADER_MARKER, ''\)/);
  assert.match(bundler,/dst\.writestr\("focus-immersive\.js", immersion\.read_bytes\(\)\)/);
});
