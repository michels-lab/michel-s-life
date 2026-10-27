import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Real browser-process terminate/reopen proof of the ACCOUNT BOUNDARY MODULE.
// All users/missions/tokens are synthetic; no provider, credentials or app session.
const URL = process.env.MLV_ACCOUNT_BOUNDARY_BROWSER_URL || 'http://127.0.0.1:4188/';
const MODULE = '/src/MichelsLife/frontend/account-boundary.mjs';
const KEY = 'vida_rpg_personal_progress_v2';
const REV = 'granada.synthetic.account.revision';
const TXN = 'michelsLife.accountBoundary.v1.transaction';
const ACTIVE = 'michelsLife.accountBoundary.v1.active';
const TOKEN = 'granada.synthetic.device.session';
const A='user-aaaaa',B='user-bbbbb',EMPTY='{"missions":[],"xp":0}';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:412,height:915}});
const open=async()=>{const p=await context.newPage();await p.goto(URL,{waitUntil:'domcontentloaded'});return p;};
let phase='bootstrap';
try {
  let page=await open();
  phase='A_owned_state';
  await page.evaluate(async cfg=>{
    const {AccountBoundary}=await import(cfg.module);
    const b=new AccountBoundary(localStorage,{boardKey:cfg.key,revisionKey:cfg.rev,emptyBoard:cfg.empty});
    b.startAccount(cfg.A);
    b.confirmRemoteEmpty(cfg.A,{confirmedAccountId:cfg.A,isEmpty:true});
    localStorage.setItem(cfg.key,JSON.stringify({missions:[{id:'synthetic-A-only'}],xp:222}));
    localStorage.setItem(cfg.rev,'A-revision');
    localStorage.setItem(cfg.token,'SYNTHETIC_DEVICE_LOCAL_TOKEN');
    assertNoOutsideCalls(b.authorizeUpload(cfg.A));
    function assertNoOutsideCalls(pass){if(!pass)throw Error('A_not_ready');}
  },{module:MODULE,key:KEY,rev:REV,empty:EMPTY,A,token:TOKEN});
  // Simulate a force-kill BETWEEN physical localStorage writes, when the
  // journal already exists and the new board is visible under OLD owner.
  phase='crash_mid_switch';
  await page.evaluate(cfg=>{
    const before={board:localStorage.getItem(cfg.key),revision:localStorage.getItem(cfg.rev),
      active:localStorage.getItem(cfg.active)};
    localStorage.setItem(cfg.txn,JSON.stringify({version:1,changes:[
      {key:cfg.key,before:before.board},
      {key:cfg.rev,before:before.revision},
      {key:cfg.active,before:before.active}
    ]}));
    localStorage.setItem(cfg.key,JSON.stringify({missions:[{id:'synthetic-B-only'}],xp:500}));
    localStorage.removeItem(cfg.rev);
    localStorage.setItem(cfg.active,JSON.stringify({version:1,kind:'account',ownerId:cfg.B,state:'ready'}));
  },{key:KEY,rev:REV,active:ACTIVE,txn:TXN,B});
  await page.close();
  phase='real_browser_restart_recovery';
  page=await open();
  const recovered=await page.evaluate(async cfg=>{
    const {AccountBoundary}=await import(cfg.module);
    const b=new AccountBoundary(localStorage,{boardKey:cfg.key,revisionKey:cfg.rev,emptyBoard:cfg.empty});
    const board=JSON.parse(localStorage.getItem(cfg.key));
    return {owner:b.active()?.ownerId,allowedA:b.authorizeUpload(cfg.A),
      allowedB:b.authorizeUpload(cfg.B),xp:board.xp,
      ids:board.missions.map(m=>m.id),revision:localStorage.getItem(cfg.rev),
      markerGone:localStorage.getItem(cfg.txn)===null,
      localTokenIntact:localStorage.getItem(cfg.token)==='SYNTHETIC_DEVICE_LOCAL_TOKEN'};
  },{module:MODULE,key:KEY,rev:REV,empty:EMPTY,A,B,txn:TXN,token:TOKEN});
  assert.deepEqual(recovered,{owner:A,allowedA:true,allowedB:false,xp:222,
    ids:['synthetic-A-only'],revision:'A-revision',markerGone:true,localTokenIntact:true});
  phase='legitimate_account_switch';
  const switched=await page.evaluate(async cfg=>{
    const {AccountBoundary}=await import(cfg.module);
    const b=new AccountBoundary(localStorage,{boardKey:cfg.key,revisionKey:cfg.rev,emptyBoard:cfg.empty});
    const pending=b.startAccount(cfg.B);
    const clean=localStorage.getItem(cfg.key)===cfg.empty &&
      b.authorizeUpload(cfg.B)===false;
    b.confirmRemoteEmpty(cfg.B,{confirmedAccountId:cfg.B,isEmpty:true});
    localStorage.setItem(cfg.key,JSON.stringify({missions:[{id:'synthetic-B-only'}],xp:333}));
    b.signOut();
    const noB=localStorage.getItem(cfg.key)===cfg.empty && !b.authorizeUpload(cfg.B);
    b.startAccount(cfg.A);
    const restored=JSON.parse(localStorage.getItem(cfg.key));
    return {pending:pending.needsRemoteRead,clean,noB,restoredA:restored.xp===222 &&
      restored.missions.length===1&&restored.missions[0].id==='synthetic-A-only',
      needsReproof:!b.authorizeUpload(cfg.A),
      tokenIntact:localStorage.getItem(cfg.token)==='SYNTHETIC_DEVICE_LOCAL_TOKEN'};
  },{module:MODULE,key:KEY,rev:REV,empty:EMPTY,A,B,token:TOKEN});
  assert.deepEqual(switched,{pending:true,clean:true,noB:true,restoredA:true,
    needsReproof:true,tokenIntact:true});
  phase='forged_journal_rejected';
  await page.evaluate(cfg=>localStorage.setItem(cfg.txn,JSON.stringify({
    version:1,changes:[{key:cfg.token,before:'FORGED_CREDENTIAL'}]})),
    {txn:TXN,token:TOKEN});
  await page.close();
  page=await open();
  const rejected=await page.evaluate(async cfg=>{
    const {AccountBoundary}=await import(cfg.module);
    let code='';
    try {new AccountBoundary(localStorage,{boardKey:cfg.key,revisionKey:cfg.rev,emptyBoard:cfg.empty});}
    catch(error){code=error.code||'unclassified';}
    return {code,tokenIntact:localStorage.getItem(cfg.token)==='SYNTHETIC_DEVICE_LOCAL_TOKEN',
      journalRetained:localStorage.getItem(cfg.txn)!==null};
  },{module:MODULE,key:KEY,rev:REV,empty:EMPTY,token:TOKEN,txn:TXN});
  assert.deepEqual(rejected,{code:'corrupt_boundary_transaction',
    tokenIntact:true,journalRetained:true});
  console.log('PASS: 3 actual Chromium persistent-storage scenarios — force-kill recovery, A/B isolation, forged journal fail-closed (synthetic only)');
}catch(error){
  // Never serialize board contents, journal, URLs, identifiers or raw errors.
  console.error('FAIL_ACCOUNT_BOUNDARY_BROWSER '+JSON.stringify({phase,code:'browser_contract_failed'}));
  process.exitCode=1;
}finally{
  await context.close();await browser.close();
}
