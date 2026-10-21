import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { AccountBoundary, BoundaryError, digest } from '../src/MichelsLife/frontend/account-boundary.mjs';

const cases = [];
const test = (name, run) => cases.push([name, run]);
class Mem {
  constructor(entries = {}) { this.map = new Map(Object.entries(entries)); this.failKey = null; }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { if (k === this.failKey) throw Error('quota'); this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
}
const boardKey = 'vida_rpg_personal_progress_v2';
const revisionKey = 'synthetic.account.revision';
const sessionKey = 'michelsLife.supabase.session.v30216';
const deviceKey = 'synthetic.device.id';
const emptyBoard = '{"missions":[],"xp":0}';
const A = 'user-aaaaa', B = 'user-bbbbb', C = 'user-ccccc';
const make = (entries = {}) => {
  const s = new Mem({ [sessionKey]: 'fake-access-token-KEEP', [deviceKey]: 'device-ONLY', ...entries });
  return { s, boundary: new AccountBoundary(s, { boardKey, revisionKey, emptyBoard }) };
};
const deny = (fn, code) => assert.throws(fn, e => e instanceof BoundaryError && e.code === code);
const ready = (b, id) => {
  b.startAccount(id);
  b.confirmRemoteEmpty(id, { confirmedAccountId: id, isEmpty: true });
};

test('new account never imports unclaimed board or auto-authorizes upload', () => {
  const { s, boundary: b } = make({ [boardKey]: '{"journal":"PRIVATE A"}', [revisionKey]: 'legacy-revision' });
  assert.equal(b.startAccount(A).state, 'pending');
  assert.equal(b.authorizeUpload(A), false);
  assert.equal(s.getItem(boardKey), emptyBoard);
  assert.equal(s.getItem(revisionKey), null);
  assert.equal(b.previewUnclaimed().sha256, digest('{"journal":"PRIVATE A"}'));
});
test('signout removes A from visible board, not its saved local profile', () => {
  const { s, boundary: b } = make(); ready(b,A);
  s.setItem(boardKey,'A SECRET'); s.setItem(revisionKey,'r-A');
  b.signOut();
  assert.equal(s.getItem(boardKey),emptyBoard);
  assert.equal(b.authorizeUpload(A),false);
  b.startAccount(A); assert.equal(s.getItem(boardKey),'A SECRET');
  assert.equal(s.getItem(revisionKey),'r-A');
  assert.equal(b.authorizeUpload(A),false);
});
test('switch A to new B with empty remote never shows or uploads A state to B', () => {
  const { s, boundary: b } = make(); ready(b,A);
  s.setItem(boardKey,'A JOURNAL'); s.setItem(revisionKey,'revision-A');
  b.startAccount(B);
  assert.equal(s.getItem(boardKey),emptyBoard);
  assert.equal(s.getItem(revisionKey),null);
  assert.equal(b.authorizeUpload(B),false);
  b.confirmRemoteEmpty(B,{confirmedAccountId:B,isEmpty:true});
  assert.equal(s.getItem(boardKey),emptyBoard);
  assert.equal(b.authorizeUpload(B),true);
  b.startAccount(A); assert.equal(s.getItem(boardKey),'A JOURNAL');
  assert.equal(s.getItem(revisionKey),'revision-A');
});
test('switch A to B with existing remote data loads only B data', () => {
  const { s, boundary: b } = make(); ready(b,A);
  s.setItem(boardKey,'A ONLY'); b.startAccount(B);
  b.adoptRemoteState(B,{board:'B REMOTE',revision:'r-B'});
  assert.equal(s.getItem(boardKey),'B REMOTE');
  assert.equal(s.getItem(revisionKey),'r-B');
  assert.equal(b.authorizeUpload(A),false);
  assert.equal(b.authorizeUpload(B),true);
  b.startAccount(A); assert.equal(s.getItem(boardKey),'A ONLY');
});
test('fresh auth of same A requires a new remote read', () => {
  const { boundary: b } = make(); ready(b,A);
  assert.equal(b.authorizeUpload(A),true);
  b.startAccount(A); assert.equal(b.authorizeUpload(A),false);
});
test('remote proof must match authenticated account', () => {
  const { boundary: b } = make(); b.startAccount(B);
  deny(()=>b.confirmRemoteEmpty(B,{confirmedAccountId:A,isEmpty:true}),'remote_empty_not_proven');
  deny(()=>b.confirmRemoteEmpty(B,{confirmedAccountId:B,isEmpty:false}),'remote_empty_not_proven');
  deny(()=>b.adoptRemoteState(A,{board:'A',revision:'r'}),'account_not_pending');
});
test('guest/unclaimed data requires explicit preview-bound consent', () => {
  const { s, boundary: b } = make({[boardKey]:'old guest data'});
  b.startAccount(B);
  b.confirmRemoteEmpty(B,{confirmedAccountId:B,isEmpty:true});
  const info=b.previewUnclaimed();
  deny(()=>b.importUnclaimed(B,{confirmedAccountId:B,confirmedDigest:info.sha256,explicitConsent:false,remoteEmptyConfirmed:true}),'consent_missing_or_wrong_destination');
  deny(()=>b.importUnclaimed(B,{confirmedAccountId:A,confirmedDigest:info.sha256,explicitConsent:true,remoteEmptyConfirmed:true}),'consent_missing_or_wrong_destination');
  deny(()=>b.importUnclaimed(B,{confirmedAccountId:B,confirmedDigest:'a'.repeat(64),explicitConsent:true,remoteEmptyConfirmed:true}),'preview_digest_mismatch');
  const result=b.importUnclaimed(B,{confirmedAccountId:B,confirmedDigest:info.sha256,explicitConsent:true,remoteEmptyConfirmed:true});
  assert.equal(result.imported,true);
  assert.equal(s.getItem(boardKey),'old guest data');
  assert.equal(b.authorizeUpload(B),true);
});
test('import can only happen once, even after account switch', () => {
  const { boundary:b } = make({[boardKey]:'one-time'});
  ready(b,A); const info=b.previewUnclaimed();
  b.importUnclaimed(A,{confirmedAccountId:A,confirmedDigest:info.sha256,explicitConsent:true,remoteEmptyConfirmed:true});
  b.startAccount(B); b.confirmRemoteEmpty(B,{confirmedAccountId:B,isEmpty:true});
  deny(()=>b.importUnclaimed(B,{confirmedAccountId:B,confirmedDigest:info.sha256,explicitConsent:true,remoteEmptyConfirmed:true}),'unclaimed_import_already_completed');
});
test('import never overwrites existing remote or nonempty target', () => {
  const { s, boundary:b } = make({[boardKey]:'legacy'});
  ready(b,B); const info=b.previewUnclaimed(); s.setItem(boardKey,'NEW B MISSIONS');
  deny(()=>b.importUnclaimed(B,{confirmedAccountId:B,confirmedDigest:info.sha256,explicitConsent:true,remoteEmptyConfirmed:true}),'target_not_empty');
  assert.equal(s.getItem(boardKey),'NEW B MISSIONS');
});
test('preserves device ID and auth session in every account transition', () => {
  const { s, boundary:b } = make({[boardKey]:'legacy'});
  ready(b,A); b.signOut(); ready(b,B); b.startAccount(C);
  assert.equal(s.getItem(sessionKey),'fake-access-token-KEEP');
  assert.equal(s.getItem(deviceKey),'device-ONLY');
});
test('storage quota failure rolls back without losing previous account board', () => {
  const { s, boundary:b } = make(); ready(b,A);
  s.setItem(boardKey,'KEEP A'); s.setItem(revisionKey,'rev-A');
  const before=new Map(s.map); s.failKey='michelsLife.accountBoundary.v1.active';
  deny(()=>b.startAccount(B),'storage_write_failed');
  assert.deepEqual(s.map,before);
});
test('corrupt active identity fails closed, never becomes guest', () => {
  const { s, boundary:b } = make({ 'michelsLife.accountBoundary.v1.active': '{bad' });
  deny(()=>b.startAccount(A),'corrupt_boundary_record');
  assert.equal(s.getItem(boardKey),null);
});
test('preexisting owner vault cannot be transplanted to another account', () => {
  const { s, boundary:b } = make();
  s.setItem('michelsLife.accountBoundary.v1.account.user-bbbbb',JSON.stringify({version:1,ownerId:A,board:'A',revision:null}));
  deny(()=>b.startAccount(B),'corrupt_or_wrong_owner_vault');
});
test('rejects malformed account ids, avoids localStorage key injection', () => {
  const { boundary:b } = make();
  deny(()=>b.startAccount('../foo'),'invalid_account_id');
  deny(()=>b.startAccount('user@example.com'),'invalid_account_id');
});
test('missing or corrupt remote revision never qualifies as ready', () => {
  const { boundary:b } = make(); b.startAccount(A);
  deny(()=>b.adoptRemoteState(A,{board:'ok',revision:''}),'invalid_remote_snapshot');
  assert.equal(b.authorizeUpload(A),false);
});
test('same-account local profile retains its revision but cannot upload until checked', () => {
  const { s, boundary:b } = make(); ready(b,A);
  s.setItem(revisionKey,'r1'); s.setItem(boardKey,'local'); b.signOut();
  b.startAccount(A); assert.equal(s.getItem(revisionKey),'r1');
  assert.equal(b.authorizeUpload(A),false);
  b.adoptRemoteState(A,{board:'remote-wins',revision:'r2'});
  assert.equal(s.getItem(boardKey),'remote-wins');
  assert.equal(s.getItem(revisionKey),'r2');
  assert.ok([...s.map.entries()].some(([key,value]) => key.startsWith('michelsLife.accountBoundary.v1.recovery.user-aaaaa.') && value.includes('local')));
});
test('does not import credentials hidden as storage keys', () => {
  const { s, boundary:b } = make({[boardKey]:'board', [sessionKey]:'synthetic-session'});
  b.startAccount(B);
  assert.equal(s.getItem(sessionKey),'synthetic-session');
  assert.equal(b.previewUnclaimed().bytes,5);
});
test('empty guest does not generate an import offer', () => {
  const { boundary:b }=make(); b.startAccount(A);
  assert.equal(b.previewUnclaimed(),null);
});
test('leaving authenticated account never assigns its board to a guest import', () => {
  const { s, boundary:b }=make(); ready(b,A);
  s.setItem(boardKey,'A data'); b.signOut();
  assert.equal(b.previewUnclaimed(),null);
});
test('forged account owner marker cannot authorize uploads under other ID', () => {
  const { boundary:b }=make(); ready(b,A);
  assert.equal(b.authorizeUpload(B),false);
});
test('empty confirmation does not resurrect another account revision', () => {
  const { s,boundary:b }=make(); ready(b,A);
  s.setItem(revisionKey,'A-R'); b.startAccount(B);
  b.confirmRemoteEmpty(B,{confirmedAccountId:B,isEmpty:true});
  assert.equal(s.getItem(revisionKey),null);
});
test('SHA-256 matches official Node crypto vectors incl UTF-8 and multi-block', () => {
  for(const payload of ['', 'abc', '✨ español áéíóú 🗺️', 'X'.repeat(250)])
    assert.equal(digest(payload), createHash('sha256').update(payload).digest('hex'));
});
test('multiple remote adoptions retain immutable distinct recovery records', () => {
  const {s,boundary:b}=make(); ready(b,A);
  s.setItem(boardKey,'local-v1'); b.startAccount(A);
  b.adoptRemoteState(A,{board:'remote-v2',revision:'r2'});
  b.startAccount(A); b.adoptRemoteState(A,{board:'remote-v3',revision:'r3'});
  const records=[...s.map.entries()].filter(([key])=>key.startsWith('michelsLife.accountBoundary.v1.recovery.user-aaaaa.'));
  assert.equal(records.length,2);
  assert.ok(records.some(([,v])=>v.includes('local-v1')));
  assert.ok(records.some(([,v])=>v.includes('remote-v2')));
});
test('clean guest state never offers an empty import', () => {
  const {boundary:b}=make(); ready(b,A); b.signOut();
  b.startAccount(B); assert.equal(b.previewUnclaimed(),null);
});
const txnKey = 'michelsLife.accountBoundary.v1.transaction';
const activeKey = 'michelsLife.accountBoundary.v1.active';
const accountAKey = 'michelsLife.accountBoundary.v1.account.' + A;
const reconstruct = s => new AccountBoundary(s,{boardKey,revisionKey,emptyBoard});
test('WebView crash after overwriting board but before owner switch rolls back A atomically', () => {
  const {s,boundary:b}=make();ready(b,A);
  s.setItem(boardKey,'PRIVATE A BOARD');s.setItem(revisionKey,'A-R');
  const original = new Map(s.map);
  s.setItem(txnKey, JSON.stringify({version:1,changes:[
    {key:accountAKey,before:s.getItem(accountAKey)},
    {key:boardKey,before:s.getItem(boardKey)},
    {key:revisionKey,before:s.getItem(revisionKey)},
    {key:activeKey,before:s.getItem(activeKey)}
  ]}));
  s.setItem(accountAKey,'{\"version\":1,\"ownerId\":\"user-aaaaa\",\"board\":\"PRIVATE A BOARD\",\"revision\":\"A-R\"}');
  s.setItem(boardKey,'PRIVATE B BOARD');s.removeItem(revisionKey);
  s.setItem(activeKey, JSON.stringify({version:1,kind:'account',ownerId:B,state:'pending'}));
  const restart=reconstruct(s);
  assert.equal(restart.active().ownerId,A);
  assert.equal(restart.authorizeUpload(A),true);
  assert.equal(restart.authorizeUpload(B),false);
  assert.deepEqual(s.map,original);
  assert.equal(s.getItem(txnKey),null);
});
test('recovery fails closed and retains journal until storage becomes writable', () => {
  const {s,boundary:b}=make();ready(b,A);
  s.setItem(boardKey,'A BEFORE CRASH');
  s.setItem(txnKey,JSON.stringify({version:1,changes:[
    {key:boardKey,before:'A BEFORE CRASH'}
  ]}));
  s.map.set(boardKey,'B AFTER CRASH');s.failKey=boardKey;
  deny(()=>reconstruct(s),'storage_rollback_failed');
  assert.equal(s.getItem(txnKey)!==null,true);
  s.failKey=null;
  assert.equal(reconstruct(s).authorizeUpload(A),true);
  assert.equal(s.getItem(boardKey),'A BEFORE CRASH');
  assert.equal(s.getItem(txnKey),null);
});
test('untrusted crash journal may not overwrite credentials or arbitrary keys', () => {
  const {s}=make({[boardKey]:'A'});
  const initialToken=s.getItem(sessionKey);
  s.setItem(txnKey,JSON.stringify({version:1,changes:[
    {key:sessionKey,before:'FORGED_OTHER_TOKEN'}]}));
  deny(()=>reconstruct(s),'corrupt_boundary_transaction');
  assert.equal(s.getItem(sessionKey),initialToken);
  assert.ok(s.getItem(txnKey));
});
test('corrupt duplicate journal records are never trusted', () => {
  const {s}=make({[boardKey]:'A'});
  for(const data of [
    '{not-json',
    JSON.stringify({version:1,changes:[null]}),
    JSON.stringify({version:1,changes:[{key:boardKey,before:'X'},{key:boardKey,before:'Y'}]}),
    JSON.stringify({version:1,changes:[{key:txnKey,before:null}]})
  ]){
    s.setItem(txnKey,data);
    deny(()=>reconstruct(s),'corrupt_boundary_transaction');
    assert.equal(s.getItem(boardKey),'A');
  }
});
test('failure writing recovery journal never switches owners or board', () => {
  const {s,boundary:b}=make();ready(b,A);
  s.setItem(boardKey,'A ONLY');
  const before=new Map(s.map);
  s.failKey=txnKey;
  deny(()=>b.startAccount(B),'storage_write_failed');
  assert.deepEqual(s.map,before);
  assert.equal(s.getItem(txnKey),null);
});
const JOURNAL='michelsLife.journal.v30184';
const withJournal=(entries={})=>{
  const s=new Mem({[sessionKey]:'SYNTHETIC_LOCAL_TOKEN',[deviceKey]:'SYNTHETIC_DEVICE_ID',...entries});
  return {s,boundary:new AccountBoundary(s,{boardKey,revisionKey,emptyBoard,
    companionKeys:[JOURNAL]})};
};
test('Journal remains private to A after B login and after signout',()=>{
  const {s,boundary:b}=withJournal();ready(b,A);
  s.setItem(boardKey,'A MISSIONS');s.setItem(JOURNAL,'A PRIVATE JOURNAL');
  b.startAccount(B);
  assert.equal(s.getItem(boardKey),emptyBoard);
  assert.equal(s.getItem(JOURNAL),null);
  assert.equal(b.authorizeUpload(B),false);
  b.confirmRemoteEmpty(B,{confirmedAccountId:B,isEmpty:true});
  s.setItem(boardKey,'B MISSIONS');s.setItem(JOURNAL,'B PRIVATE JOURNAL');
  b.signOut();
  assert.equal(s.getItem(JOURNAL),null);
  b.startAccount(A);
  assert.equal(s.getItem(boardKey),'A MISSIONS');
  assert.equal(s.getItem(JOURNAL),'A PRIVATE JOURNAL');
  assert.equal(b.authorizeUpload(A),false);
  b.confirmRemoteEmpty(A,{confirmedAccountId:A,isEmpty:true});
  b.startAccount(B);
  assert.equal(s.getItem(JOURNAL),'B PRIVATE JOURNAL');
  assert.equal(s.getItem(sessionKey),'SYNTHETIC_LOCAL_TOKEN');
});
test('authenticated remote adoption replaces only its own Journal and preserves recovery',()=>{
  const {s,boundary:b}=withJournal();ready(b,A);
  s.setItem(JOURNAL,'OWNED A LOCAL JOURNAL');
  b.startAccount(A);
  b.adoptRemoteState(A,{board:'A REMOTE',revision:'remote-revision',
    auxiliary:{[JOURNAL]:'OWNED A REMOTE JOURNAL'}});
  assert.equal(s.getItem(JOURNAL),'OWNED A REMOTE JOURNAL');
  assert.ok([...s.map.entries()].some(([key,v])=>
    key.startsWith('michelsLife.accountBoundary.v1.recovery.')&&
    v.includes('OWNED A LOCAL JOURNAL')));
  b.startAccount(B);
  assert.equal(s.getItem(JOURNAL),null);
  b.adoptRemoteState(B,{board:'B REMOTE',revision:'b-r',
    auxiliary:{[JOURNAL]:'B REMOTE JOURNAL'}});
  assert.equal(s.getItem(JOURNAL),'B REMOTE JOURNAL');
  b.startAccount(A);
  assert.equal(s.getItem(JOURNAL),'OWNED A REMOTE JOURNAL');
});
test('guest with Journal only receives explicit consent preview, not silent upload',()=>{
  const {s,boundary:b}=withJournal({[JOURNAL]:'GUEST PRIVATE JOURNAL'});
  b.startAccount(B);
  assert.equal(s.getItem(JOURNAL),null);
  b.confirmRemoteEmpty(B,{confirmedAccountId:B,isEmpty:true});
  const preview=b.previewUnclaimed();
  assert.ok(preview&&preview.bytes>0);
  deny(()=>b.importUnclaimed(B,{confirmedAccountId:B,confirmedDigest:preview.sha256,
    explicitConsent:false,remoteEmptyConfirmed:true}),'consent_missing_or_wrong_destination');
  assert.equal(s.getItem(JOURNAL),null);
  b.importUnclaimed(B,{confirmedAccountId:B,confirmedDigest:preview.sha256,
    explicitConsent:true,remoteEmptyConfirmed:true});
  assert.equal(s.getItem(JOURNAL),'GUEST PRIVATE JOURNAL');
  assert.equal(s.getItem(boardKey),emptyBoard);
});
test('Journal mutation invalidates consent-bound guest digest',()=>{
  const {s,boundary:b}=withJournal({[boardKey]:'GUEST', [JOURNAL]:'GUEST JOURNAL'});
  b.startAccount(B);b.confirmRemoteEmpty(B,{confirmedAccountId:B,isEmpty:true});
  const preview=b.previewUnclaimed();
  const vaultKey='michelsLife.accountBoundary.v1.unclaimed';
  const vault=JSON.parse(s.getItem(vaultKey));
  vault.auxiliary[JOURNAL]='TAMPERED JOURNAL';
  s.setItem(vaultKey,JSON.stringify(vault));
  deny(()=>b.importUnclaimed(B,{confirmedAccountId:B,confirmedDigest:preview.sha256,
    explicitConsent:true,remoteEmptyConfirmed:true}),'preview_digest_mismatch');
  assert.equal(s.getItem(JOURNAL),null);
});
test('companion config and remote snapshots reject provider credentials',()=>{
  const {boundary:b}=withJournal();b.startAccount(A);
  deny(()=>b.adoptRemoteState(A,{board:'A',revision:'r',
    auxiliary:{[sessionKey]:'LEAKED_TOKEN'}}),'invalid_companion_snapshot');
  assert.equal(b.authorizeUpload(A),false);
  const {s}=make();
  deny(()=>new AccountBoundary(s,{boardKey,revisionKey,emptyBoard,
    companionKeys:[sessionKey]}),'invalid_companion_configuration');
});
test('interrupted Journal mutation rolls back safely before authorizing A',()=>{
  const {s,boundary:b}=withJournal();ready(b,A);
  s.setItem(JOURNAL,'ORIGINAL A');
  s.setItem(txnKey,JSON.stringify({version:1,changes:[
    {key:JOURNAL,before:'ORIGINAL A'},
    {key:activeKey,before:s.getItem(activeKey)}
  ]}));
  s.setItem(JOURNAL,'FOREIGN B');
  s.setItem(activeKey,JSON.stringify({version:1,kind:'account',ownerId:B,state:'ready'}));
  const restarted=new AccountBoundary(s,{boardKey,revisionKey,emptyBoard,companionKeys:[JOURNAL]});
  assert.equal(restarted.active().ownerId,A);
  assert.equal(s.getItem(JOURNAL),'ORIGINAL A');
  assert.equal(restarted.authorizeUpload(B),false);
  assert.equal(s.getItem(txnKey),null);
});
let count = 0;
for(const [name, fn] of cases) {
  try { await fn(); count++; console.log(`PASS ${name}`); }
  catch(e) { console.error(`FAIL ${name}: ${e.stack}`); process.exitCode=1; }
}
console.log(`${count}/${cases.length} account-boundary checks passed`);
