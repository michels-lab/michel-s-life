import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(resolve(root,'android/android-bridge.js'),'utf8');
const start=source.indexOf('  function setDrawer(open){');
const end=source.indexOf('  function activeTabId(){',start);
assert.ok(start>=0&&end>start,'Canonical Android menu function missing');
assert.equal(source.indexOf('  function setDrawer(open){',start+1),-1,
  'Duplicate Android drawer owner is not allowed');
const real=source.slice(start,end);

function setup(){
  const classes=new Set(),attrs=new Map(),styles=new Map(),priorities=new Map();
  const side={style:{
    setProperty:(key,value,priority)=>{
      styles.set(key,String(value));priorities.set(key,String(priority||''));
    },
    getPropertyValue:(key)=>styles.get(key)||'',
    getPropertyPriority:(key)=>priorities.get(key)||''
  }};
  const button={setAttribute:(key,val)=>attrs.set(key,val)};
  const doc={body:{classList:{
    toggle:(key,on)=>{if(on)classes.add(key);else classes.delete(key);},
    contains:key=>classes.has(key)
  }}};
  const ctx={document:doc,q:selector=>{
    if(selector==='#v30171Sidebar')return side;
    if(selector==='#mlv-android-menu-button')return button;
    return null;
  },setImportantOnce:(element,key,value)=>{
    if(element.style.getPropertyValue(key)!==value ||
       element.style.getPropertyPriority(key)!=='important')
      element.style.setProperty(key,value,'important');
  }};
  vm.createContext(ctx);
  vm.runInContext(real+'\nthis.androidDrawer=setDrawer;',ctx,{timeout:1000});
  return {apply:ctx.androidDrawer,classes,attrs,styles,priorities,side};
}

test('open immediately moves drawer to x=0 without an animation frame',()=>{
  const x=setup();
  x.apply(true);
  assert.equal(x.classes.has('mlv-android-nav-open'),true);
  assert.equal(x.styles.get('transform'),'translateX(0)');
  assert.equal(x.styles.get('transition'),'none');
  assert.equal(x.priorities.get('transform'),'important');
  assert.equal(x.priorities.get('transition'),'important');
  assert.equal(x.attrs.get('aria-expanded'),'true');
});

test('a stale off-screen transform is repaired on the next open reassertion',()=>{
  const x=setup();x.apply(true);
  x.side.style.setProperty('transform','translateX(-105%)','important');
  x.apply(true);
  assert.equal(x.styles.get('transform'),'translateX(0)');
  assert.equal(x.classes.has('mlv-android-nav-open'),true);
});

test('close returns off-screen position and retains its exit animation',()=>{
  const x=setup();x.apply(true);x.apply(false);
  assert.equal(x.styles.get('transform'),'translateX(-105%)');
  assert.equal(x.styles.get('transition'),'transform .16s ease');
  assert.equal(x.attrs.get('aria-expanded'),'false');
  assert.equal(x.classes.has('mlv-android-nav-open'),false);
});

test('reopening after close is atomic, without stale exit transition',()=>{
  const x=setup();x.apply(true);x.apply(false);x.apply(true);
  assert.equal(x.styles.get('transform'),'translateX(0)');
  assert.equal(x.styles.get('transition'),'none');
  assert.equal(x.attrs.get('aria-expanded'),'true');
});

test('maintenance reasserts visible geometry on canonical sidebar rebuild',()=>{
  assert.match(source,/const drawerOpen=document\.body\.classList\.contains\('mlv-android-nav-open'\)/);
  assert.match(source,/setImportantOnce\(side,'transition',drawerOpen\?'none':'transform \.16s ease'\)/);
  assert.match(source,/setImportantOnce\(side,'transform',drawerOpen\?'translateX\(0\)':'translateX\(-105%\)'\)/);
});
