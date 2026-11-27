import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

// Execute the real Android Story draft functions from production source.
// Same WebView and sessionStorage, different authenticated local board owners.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const src=readFileSync(resolve(root,'android/mobile-experience.js'),'utf8');
const start=src.indexOf("  const legacyChapterDraftKey=");
const end=src.indexOf("  function boot(){",start);
assert.ok(start>0&&end>start,'Canonical Story draft functions missing');
const code=src.slice(start,end);
const memory=new Map(),local=new Map();
const sessionStorage={
  getItem:key=>memory.get(key)??null,
  setItem:(key,value)=>memory.set(key,String(value)),
  removeItem:key=>memory.delete(key)
};
const localStorage={getItem:key=>local.get(key)??null,setItem:(key,v)=>local.set(key,v),removeItem:key=>local.delete(key)};
let account=null,form=null;
const story={};
const window={SupabaseSyncV30216:{session:()=>account?{user:{id:account}}:null}};
const q=(selector)=>{
  if(selector==='#tab-story.active')return story;
  if(selector==='.v30162-story-hero')return null;
  if(selector==='#v30162ChapterForm')return form;
  return null;
};
const ctx={window,localStorage,sessionStorage,q,JSON,String,Array};
vm.createContext(ctx);
vm.runInContext(code+'\nthis.draft={chapterDraftStorageKey,loadChapterDraft,rememberChapterDraft,discardChapterDraft,restoreChapterDraft};',ctx,{timeout:2000});
const draft=ctx.draft;
const ownerKey='michelsLife.supabase.boardOwner.v30218';
const setAccount=(id,owner=id)=>{
  account=id;
  if(owner===null)local.delete(ownerKey);
  else local.set(ownerKey,owner);
};
const makeForm=(name='',motto='',start='')=>{
  const fields={name:{value:name},motto:{value:motto},start:{value:start}};
  return {id:'v30162ChapterForm',dataset:{},elements:{namedItem:key=>fields[key]},fields};
};
const show=()=>{
  form=makeForm();
  draft.restoreChapterDraft();
  return form.fields;
};
test('A Story title and motto never surface to B or Guest; returning to A recovers its own draft',()=>{
  setAccount('account-aaaa');
  form=makeForm('A SECRET CHAPTER','A PRIVATE MOTTO','2026-11-11');
  draft.rememberChapterDraft(form);
  assert.equal(show().name.value,'A SECRET CHAPTER');
  setAccount('account-bbbb');
  assert.equal(show().name.value,'','B received A unsaved chapter');
  form=makeForm('B chapter','B motto','2026-11-12');
  draft.rememberChapterDraft(form);
  assert.equal(show().motto.value,'B motto');
  setAccount('account-aaaa');
  assert.equal(show().name.value,'A SECRET CHAPTER');
  assert.equal(show().motto.value,'A PRIVATE MOTTO');
  setAccount(null);
  assert.equal(show().name.value,'','Guest received A unsaved chapter');
  form=makeForm('Guest notes','Personal guest motto');
  draft.rememberChapterDraft(form);
  assert.equal(show().name.value,'Guest notes');
  setAccount('account-bbbb');
  assert.equal(show().name.value,'B chapter');
  assert.equal(show().motto.value,'B motto');
});
test('An incomplete or contradictory sign-in never reads or writes a draft',()=>{
  setAccount('account-bbbb','account-aaaa');
  const size=memory.size;
  assert.equal(draft.chapterDraftStorageKey(),null);
  assert.equal(show().name.value,'');
  form=makeForm('SHOULD NOT SAVE');
  draft.rememberChapterDraft(form);
  assert.equal(memory.size,size);
  setAccount(null,'account-aaaa');
  assert.equal(show().name.value,'');
  setAccount('x','x');
  assert.equal(show().name.value,'','Malformed owner id authorized a draft');
});
test('Discard only removes the current account draft; legacy unowned key cannot be revived',()=>{
  memory.set('michelsLife.android.chapterDraft.v1',JSON.stringify({name:'UNOWNED PRIVATE'}));
  setAccount('account-bbbb');
  assert.equal(show().name.value,'B chapter');
  assert.equal(memory.has('michelsLife.android.chapterDraft.v1'),false,'Unsafe v1 draft was retained');
  draft.discardChapterDraft();
  assert.equal(show().name.value,'');
  setAccount('account-aaaa');
  assert.equal(show().name.value,'A SECRET CHAPTER','Discard B erased A chapter');
});
