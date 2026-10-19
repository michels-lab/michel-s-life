import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const index = readFileSync(resolve(repo, 'src/MichelsLife/frontend/index.html'), 'utf8');
function between(start, end) {
  const a = index.indexOf(start);
  const b = index.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, 'Michel\'s Life restore contract missing: ' + start);
  return index.slice(a, b);
}
const sharedSource = between('const MLV_SHARED_STORAGE_KEYS=new Set(', 'function captureCloudBackup()');
const timelineSource = between('function applyBackupJson(', 'async function doRestore()');
const portableSource = between('function applyBackupJson(raw){', 'function diagCard()')
  .replace('function applyBackupJson(raw){', 'function applyPortableBackupJson(raw){');
assert.ok(!timelineSource.includes('localStorage.clear('), 'Timeline restore must not clear device-local storage');
assert.ok(!timelineSource.includes('Object.entries(ls))localStorage.setItem'), 'Timeline must not restore arbitrary cloud keys');

function fixture(entries) {
  const values = new Map(Object.entries(entries));
  const memory = {
    getItem: key => values.has(String(key)) ? values.get(String(key)) : null,
    setItem: (key, value) => values.set(String(key), String(value)),
    removeItem: key => values.delete(String(key)),
    clear: () => { throw new Error('Device-local storage was cleared'); }
  };
  const transient = new Map();
  let reloads = 0;
  const bridgeCalls = [];
  const ctx = {
    localStorage: memory,
    sessionStorage: {setItem: (k, v) => transient.set(k, v)},
    location: {reload: () => { reloads += 1; }},
    window: {SupabaseSyncV30216: {runtime: {connected: false}}},
    bridge: async (action, payload) => {bridgeCalls.push({action, payload}); return {};},
  };
  vm.createContext(ctx);
  vm.runInContext(sharedSource + '\n' + timelineSource + '\n' + portableSource +
    '\nthis.restoreTimeline=applyBackupJson;this.restorePortable=applyPortableBackupJson;', ctx, {timeout: 1500});
  return {ctx, values, transient, bridgeCalls, get reloads(){return reloads;}};
}

const original = {
  'michelsLife.supabase.session.v30216': 'THIS_DEVICE_ACCESS_TOKEN',
  'michelsLife.supabase.meta.v30216': 'THIS_DEVICE_REVISION',
  'michelsLife.supabase.device.v30216': 'THIS_DEVICE_ID',
  'michelsLife.google.auth': 'THIS_DEVICE_GOOGLE_TOKEN',
  'michelsLife.local.notification.id': 'THIS_DEVICE_ALARM',
  'michelslab.developer.notes.v1': '[{\"comment\":\"OWNER PRIVATE NOTE\"}]',
  'michelsLife.journal.v30184': 'OLD_JOURNAL',
  'michelsLife.theme.v342': 'OLD_THEME',
  'vida_rpg_personal_progress_v2': '{"missions":[{"id":"old"}]}',
};
const f = fixture(original);
assert.equal(Object.hasOwn(f.ctx.window.MLVCloudSharedStorageV30216.capture(),
  'michelslab.developer.notes.v1'),false,
  'Developer owner annotations must never be included in shareable cloud data');
const oldCloudBackup = {
  state: {missions:[{id:'restored-mission'}]},
  localStorage: {
    'michelsLife.supabase.session.v30216':'OTHER_DEVICE_ACCESS_TOKEN',
    'michelsLife.supabase.meta.v30216':'OTHER_DEVICE_REVISION',
    'michelsLife.supabase.device.v30216':'OTHER_DEVICE_ID',
    'michelsLife.google.auth':'OTHER_DEVICE_GOOGLE_TOKEN',
    'michelsLife.local.notification.id':'OTHER_DEVICE_ALARM',
    'michelslab.developer.notes.v1':'FOREIGN_DEVELOPER_NOTE',
    'michelsLife.journal.v30184':'RESTORED_JOURNAL',
    'michelsLife.theme.v342':'RESTORED_THEME',
    'unknown-storage-key':'SHOULD_NOT_EXIST'
  }
};
f.ctx.restoreTimeline(JSON.stringify(oldCloudBackup));
for (const key of [
  'michelsLife.supabase.session.v30216','michelsLife.supabase.meta.v30216',
  'michelsLife.supabase.device.v30216','michelsLife.google.auth',
  'michelsLife.local.notification.id',
  'michelslab.developer.notes.v1'
]) assert.equal(f.values.get(key), original[key], 'Device identity changed: ' + key);
assert.equal(f.values.get('michelsLife.journal.v30184'), 'RESTORED_JOURNAL');
assert.equal(f.values.get('michelsLife.theme.v342'), 'RESTORED_THEME');
assert.equal(f.values.has('unknown-storage-key'), false);
assert.equal(JSON.parse(f.values.get('vida_rpg_personal_progress_v2')).missions[0].id, 'restored-mission');
assert.equal(f.transient.get('mlv201TimelineRestored'), '1');
assert.equal(f.reloads, 1);

const invalid = fixture(original);
assert.throws(() => invalid.ctx.restoreTimeline(JSON.stringify({
  localStorage: {'michelsLife.supabase.session.v30216':'ATTACKER'},
})), /no restorable/);
assert.equal(invalid.values.get('michelsLife.supabase.session.v30216'), 'THIS_DEVICE_ACCESS_TOKEN');
assert.equal(invalid.values.get('michelsLife.journal.v30184'), 'OLD_JOURNAL');
assert.equal(invalid.reloads, 0);

const stateOnly = fixture(original);
stateOnly.ctx.restoreTimeline(JSON.stringify({state:{missions:[{id:'state-only'}]},localStorage:{}}));
assert.equal(stateOnly.values.get('michelsLife.journal.v30184'), 'OLD_JOURNAL',
  'Missing shared keys must not wipe current journal');
assert.equal(stateOnly.values.get('michelsLife.supabase.device.v30216'), 'THIS_DEVICE_ID');
assert.equal(JSON.parse(stateOnly.values.get('vida_rpg_personal_progress_v2')).missions[0].id, 'state-only');

const cloud = fixture(original);
await cloud.ctx.restoreTimeline(JSON.stringify(oldCloudBackup), {
  remoteHash:'REMOTE_HASH',remoteModifiedAt:'2026-10-12T00:00:00Z'
});
assert.equal(cloud.bridgeCalls.length, 1);
assert.equal(cloud.bridgeCalls[0].action, 'cloudAccept');
assert.equal(cloud.values.get('michelsLife.supabase.session.v30216'), 'THIS_DEVICE_ACCESS_TOKEN');
assert.equal(cloud.reloads, 1);

const unavailable = fixture(original);
unavailable.ctx.window.MLVCloudSharedStorageV30216 = undefined;
assert.throws(() => unavailable.ctx.restoreTimeline(JSON.stringify(oldCloudBackup)), /safety policy/);
assert.equal(unavailable.values.get('michelsLife.journal.v30184'), 'OLD_JOURNAL');

// Portable .michelslife imports use the SAME approved localStorage boundary as
// Supabase, Drive, and Backup Timeline, even for archives containing old tokens.
const portable = fixture(original);
portable.ctx.restorePortable(JSON.stringify(oldCloudBackup));
for (const key of [
  'michelsLife.supabase.session.v30216','michelsLife.supabase.meta.v30216',
  'michelsLife.supabase.device.v30216','michelsLife.google.auth',
  'michelsLife.local.notification.id',
  'michelslab.developer.notes.v1'
]) assert.equal(portable.values.get(key), original[key],
  'Portable import transferred another device credential: ' + key);
assert.equal(portable.values.get('michelsLife.journal.v30184'), 'RESTORED_JOURNAL');
assert.equal(portable.values.get('michelsLife.theme.v342'), 'RESTORED_THEME');
assert.equal(JSON.parse(portable.values.get('vida_rpg_personal_progress_v2')).missions[0].id, 'restored-mission');
assert.equal(portable.values.has('unknown-storage-key'), false);
assert.equal(portable.transient.get('mlv202Imported'), '1');
assert.equal(portable.reloads, 1);

const portableOnlyUnsafe = fixture(original);
assert.throws(() => portableOnlyUnsafe.ctx.restorePortable(JSON.stringify({
  localStorage: {'michelsLife.supabase.session.v30216':'OTHER_ACCOUNT'}
})), /no.*restorable/i);
assert.equal(portableOnlyUnsafe.values.get('michelsLife.supabase.session.v30216'), 'THIS_DEVICE_ACCESS_TOKEN');
assert.equal(portableOnlyUnsafe.values.get('michelsLife.journal.v30184'), 'OLD_JOURNAL');
assert.equal(portableOnlyUnsafe.reloads, 0);

const portableStateOnly = fixture(original);
portableStateOnly.ctx.restorePortable(JSON.stringify({runtimeState:{missions:[{id:'legacy-portable'}]}}));
assert.equal(portableStateOnly.values.get('michelsLife.journal.v30184'), 'OLD_JOURNAL');
assert.equal(portableStateOnly.values.get('michelsLife.supabase.device.v30216'), 'THIS_DEVICE_ID');
assert.equal(JSON.parse(portableStateOnly.values.get('vida_rpg_personal_progress_v2')).missions[0].id, 'legacy-portable');
assert.equal(portableStateOnly.reloads, 1);

const portableNoPolicy = fixture(original);
portableNoPolicy.ctx.window.MLVCloudSharedStorageV30216 = undefined;
assert.throws(() => portableNoPolicy.ctx.restorePortable(JSON.stringify(oldCloudBackup)), /safety policy/);
assert.equal(portableNoPolicy.values.get('michelsLife.supabase.session.v30216'), 'THIS_DEVICE_ACCESS_TOKEN');
assert.equal(portableNoPolicy.reloads, 0);

console.log('OK: legacy/local/Drive timeline and portable restores preserve device credentials and reject foreign storage keys');
