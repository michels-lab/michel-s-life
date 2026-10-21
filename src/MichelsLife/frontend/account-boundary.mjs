export const BOUNDARY_PREFIX = 'michelsLife.accountBoundary.v1.';
const ACTIVE = `${BOUNDARY_PREFIX}active`;
const UNCLAIMED = `${BOUNDARY_PREFIX}unclaimed`;
const GUEST = `${BOUNDARY_PREFIX}guest`;
const RECEIPT = `${BOUNDARY_PREFIX}importReceipt`;
const TRANSACTION = `${BOUNDARY_PREFIX}transaction`;
const recoveryKey = (id, board, companions = null) =>
  `${BOUNDARY_PREFIX}recovery.${id}.${digest(companions ? JSON.stringify({board,companions}) : board)}`;
const accountKey = id => `${BOUNDARY_PREFIX}account.${id}`;
const VALID_ID = /^[A-Za-z0-9_-]{6,128}$/;
const SHAREABLE_COMPANIONS = new Set(['michelsLife.journal.v30184']);

// Browser and Node-compatible SHA-256; no Node-only API or external dependency.
const SHA_K = [
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
];
const rotate = (x,n) => (x >>> n) | (x << (32-n));
export function digest(data) {
  if (typeof data !== 'string') throw new TypeError('Board must be a string');
  const input = new TextEncoder().encode(data);
  const bytes = new Uint8Array(Math.ceil((input.length + 9) / 64) * 64);
  bytes.set(input); bytes[input.length] = 0x80;
  const view = new DataView(bytes.buffer);
  const bits = input.length * 8;
  view.setUint32(bytes.length - 8, Math.floor(bits / 0x100000000));
  view.setUint32(bytes.length - 4, bits >>> 0);
  const h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  for(let offset=0;offset<bytes.length;offset+=64) {
    const w = new Uint32Array(64);
    for(let j=0;j<16;j++) w[j]=view.getUint32(offset+j*4);
    for(let j=16;j<64;j++) {
      const a=w[j-15], b=w[j-2];
      w[j]=((w[j-16]+(rotate(a,7)^rotate(a,18)^(a>>>3)))+
        (w[j-7]+(rotate(b,17)^rotate(b,19)^(b>>>10))))>>>0;
    }
    let [a,b,c,d,e,f,g,k]=h;
    for(let j=0;j<64;j++) {
      const t1=(k+(rotate(e,6)^rotate(e,11)^rotate(e,25))+(e&f^~e&g)+SHA_K[j]+w[j])>>>0;
      const t2=((rotate(a,2)^rotate(a,13)^rotate(a,22))+(a&b^a&c^b&c))>>>0;
      k=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
    }
    [a,b,c,d,e,f,g,k].forEach((v,j)=>h[j]=(h[j]+v)>>>0);
  }
  return h.map(v=>v.toString(16).padStart(8,'0')).join('');
}
export class BoundaryError extends Error {
  constructor(code) { super(code); this.name = 'BoundaryError'; this.code = code; }
}
function accountId(id) {
  if (typeof id !== 'string' || !VALID_ID.test(id)) throw new BoundaryError('invalid_account_id');
  return id;
}
function readJson(storage, key) {
  const raw = storage.getItem(key);
  if (raw === null) return null;
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw Error();
    return obj;
  } catch { throw new BoundaryError('corrupt_boundary_record'); }
}
function ensureVault(v, expectedOwner) {
  if (!v || v.version !== 1 || v.ownerId !== expectedOwner ||
      typeof v.board !== 'string' || (v.revision !== null && typeof v.revision !== 'string'))
    throw new BoundaryError('corrupt_or_wrong_owner_vault');
  return v;
}

// A multi-key localStorage update is not atomic across WebView termination.
// Journal original values before switching boards; fail closed on recovery.
function rollback(storage, changes) {
  try {
    for (const {key, before} of [...changes].reverse()) {
      if (storage.getItem(key) === before) continue;
      if (before === null) storage.removeItem(key);
      else storage.setItem(key, before);
      if (storage.getItem(key) !== before) throw Error('rollback_not_verified');
    }
    storage.removeItem(TRANSACTION);
    if (storage.getItem(TRANSACTION) !== null) throw Error('journal_not_cleared');
    return true;
  } catch { return false; }
}
function commit(storage, entries) {
  if (storage.getItem(TRANSACTION) !== null)
    throw new BoundaryError('transaction_requires_recovery');
  const keys = new Set(), changes = [];
  for (const [key, value] of entries) {
    if (keys.has(key) || key === TRANSACTION || typeof key !== 'string' ||
        !(value === null || typeof value === 'string'))
      throw new BoundaryError('invalid_boundary_transaction');
    keys.add(key);
    changes.push({key, before:storage.getItem(key)});
  }
  if (!changes.length) return;
  try {
    storage.setItem(TRANSACTION, JSON.stringify({version:1,changes}));
    if (storage.getItem(TRANSACTION) === null) throw Error('journal_not_stored');
  } catch {
    throw new BoundaryError(storage.getItem(TRANSACTION) === null ?
      'storage_write_failed' : 'transaction_requires_recovery');
  }
  try {
    for (const [key, value] of entries) {
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
    }
    storage.removeItem(TRANSACTION);
    if (storage.getItem(TRANSACTION) !== null) throw Error('journal_remains');
  } catch {
    throw new BoundaryError(rollback(storage, changes) ?
      'storage_write_failed' : 'storage_rollback_failed');
  }
}
const serial = value => JSON.stringify(value);
export class AccountBoundary {
  constructor(storage, { boardKey, revisionKey, emptyBoard, companionKeys = [] }) {
    if (!storage || !['getItem', 'setItem', 'removeItem'].every(m => typeof storage[m] === 'function'))
      throw new BoundaryError('invalid_storage');
    if (![boardKey, revisionKey].every(k => typeof k === 'string' && k.length > 0) ||
        boardKey === revisionKey || boardKey.startsWith(BOUNDARY_PREFIX) ||
        revisionKey.startsWith(BOUNDARY_PREFIX) || typeof emptyBoard !== 'string')
      throw new BoundaryError('invalid_configuration');
    this.s = storage;
    this.boardKey = boardKey;
    this.revisionKey = revisionKey;
    if (!Array.isArray(companionKeys) ||
        new Set(companionKeys).size !== companionKeys.length ||
        !companionKeys.every(key => SHAREABLE_COMPANIONS.has(key) &&
          key !== boardKey && key !== revisionKey))
      throw new BoundaryError('invalid_companion_configuration');
    this.companionKeys = [...companionKeys];
    this.emptyBoard = emptyBoard;
    this.recoverInterrupted();
  }
  _readCompanions() {
    return Object.fromEntries(this.companionKeys.map(key=>[key,this.s.getItem(key)]));
  }
  _normalizeCompanions(value) {
    if (value === undefined || value === null) value={};
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new BoundaryError('invalid_companion_snapshot');
    const keys=Object.keys(value);
    if (keys.some(key=>!this.companionKeys.includes(key) ||
        !(value[key] === null || typeof value[key] === 'string')))
      throw new BoundaryError('invalid_companion_snapshot');
    return Object.fromEntries(this.companionKeys.map(key=>[key,value[key] ?? null]));
  }
  _companionEntries(value) {
    const safe=this._normalizeCompanions(value);
    return this.companionKeys.map(key=>[key,safe[key]]);
  }
  recoverInterrupted() {
    const raw = this.s.getItem(TRANSACTION);
    if (raw === null) return {recovered:false};
    let txn;
    try { txn = JSON.parse(raw); }
    catch { throw new BoundaryError('corrupt_boundary_transaction'); }
    if (!txn || txn.version !== 1 || !Array.isArray(txn.changes) ||
        !txn.changes.length || txn.changes.length > 32)
      throw new BoundaryError('corrupt_boundary_transaction');
    const seen = new Set();
    for (const change of txn.changes) {
      const key = change?.key, before = change?.before;
      if (typeof key !== 'string' || seen.has(key) || key === TRANSACTION ||
          !(key === this.boardKey || key === this.revisionKey ||
            this.companionKeys.includes(key) || key.startsWith(BOUNDARY_PREFIX)) ||
          !(before === null || typeof before === 'string'))
        throw new BoundaryError('corrupt_boundary_transaction');
      seen.add(key);
    }
    if (!rollback(this.s, txn.changes))
      throw new BoundaryError('storage_rollback_failed');
    return {recovered:true};
  }
  active() {
    this.recoverInterrupted();
    const a = readJson(this.s, ACTIVE);
    if (a === null) return null;
    if (a.version !== 1 || !['account', 'guest'].includes(a.kind) ||
        (a.kind === 'account' && (!VALID_ID.test(a.ownerId || '') ||
           !['pending', 'ready'].includes(a.state))) ||
        (a.kind === 'guest' && (a.ownerId !== null || a.state !== 'guest')))
      throw new BoundaryError('corrupt_active_identity');
    return a;
  }
  // Preserve current board before changing accounts, including legacy/unowned data.
  _checkpoint(targetAccountId = null) {
    const a = this.active();
    const board = this.s.getItem(this.boardKey);
    const revision = this.s.getItem(this.revisionKey);
    const auxiliary = this._readCompanions();
    if (a?.kind === 'account') {
      const key = accountKey(a.ownerId);
      // Presence of an account-bound marker is necessary for ownership; never
      // relabel the current board with targetAccountId.
      return [key, serial({ version: 1, ownerId: a.ownerId, board: board ?? this.emptyBoard, revision, auxiliary })];
    }
    if ((board === null || board === this.emptyBoard) && revision === null &&
        Object.values(auxiliary).every(v=>v===null)) return null;
    const key = a?.kind === 'guest' ? GUEST : UNCLAIMED;
    // Keep the original legacy rescue copy immutable rather than overwrite it.
    if (key === UNCLAIMED && this.s.getItem(key) !== null) return null;
    return [key, serial({ version: 1, ownerId: null, board: board ?? this.emptyBoard, revision: null, auxiliary })];
  }
  startAccount(id) {
    id = accountId(id);
    const current = this.active();
    if (current?.kind === 'account' && current.ownerId === id) {
      // Even the same account must re-prove its remote state on a fresh auth.
      commit(this.s, [[ACTIVE, serial({ version: 1, kind: 'account', ownerId: id, state: 'pending' })]]);
      return { accountId: id, state: 'pending', needsRemoteRead: true };
    }
    const target = readJson(this.s, accountKey(id));
    if (target) ensureVault(target, id);
    const checkpoint = this._checkpoint();
    const entries = [];
    if (checkpoint) entries.push(checkpoint);
    entries.push([this.boardKey, target?.board ?? this.emptyBoard]);
    entries.push([this.revisionKey, target?.revision ?? null]);
    entries.push(...this._companionEntries(target?.auxiliary));
    entries.push([ACTIVE, serial({ version: 1, kind: 'account', ownerId: id, state: 'pending' })]);
    commit(this.s, entries);
    return { accountId: id, state: 'pending', needsRemoteRead: true, hadOwnedLocal: !!target };
  }
  signOut() {
    const checkpoint = this._checkpoint();
    const entries = checkpoint ? [checkpoint] : [];
    entries.push([this.boardKey, this.emptyBoard], [this.revisionKey, null],
      ...this._companionEntries({}), [ACTIVE, serial({ version: 1, kind: 'guest', ownerId: null, state: 'guest' })]);
    commit(this.s, entries);
    return { state: 'guest', canUpload: false };
  }
  _requirePending(id) {
    id = accountId(id);
    const a = this.active();
    if (!a || a.kind !== 'account' || a.ownerId !== id || a.state !== 'pending')
      throw new BoundaryError('account_not_pending');
    return id;
  }
  // Existing remote data: caller must use a genuine authenticated provider read.
  adoptRemoteState(id, { board, revision, auxiliary = {} }) {
    id = this._requirePending(id);
    if (typeof board !== 'string' || typeof revision !== 'string' || !revision)
      throw new BoundaryError('invalid_remote_snapshot');
    const entries = [];
    const checkpoint = this._checkpoint();
    if (checkpoint) {
      const recover = recoveryKey(id, this.s.getItem(this.boardKey) ?? this.emptyBoard,
        this.companionKeys.length ? this._readCompanions() : null);
      if (this.s.getItem(recover) === null) entries.push([recover, checkpoint[1]]);
    }
    entries.push([this.boardKey, board], [this.revisionKey, revision],
      ...this._companionEntries(auxiliary), [ACTIVE, serial({ version: 1, kind: 'account', ownerId: id, state: 'ready' })]);
    commit(this.s, entries);
    return { state: 'ready', source: 'remote', canUpload: true };
  }
  // An empty remote account is NOT proof that legacy/guest board belongs to it.
  confirmRemoteEmpty(id, { confirmedAccountId, isEmpty }) {
    id = this._requirePending(id);
    if (confirmedAccountId !== id || isEmpty !== true)
      throw new BoundaryError('remote_empty_not_proven');
    // Retain owned local state for this account, never an unclaimed board.
    const a = readJson(this.s, accountKey(id));
    if (a) ensureVault(a, id);
    commit(this.s, [[this.revisionKey, null],
      [ACTIVE, serial({ version: 1, kind: 'account', ownerId: id, state: 'ready' })]]);
    return { state: 'ready', source: a ? 'owned-local' : 'clean-empty', canUpload: true };
  }
  // Never call this from auth callback alone. Show destination + digest + data
  // preview to the user and request an explicit affirmative action first.
  previewUnclaimed() {
    this.recoverInterrupted();
    const v = readJson(this.s, UNCLAIMED) || readJson(this.s, GUEST);
    if (!v || v.version !== 1 || v.ownerId !== null || typeof v.board !== 'string')
      return null;
    const auxiliary=this._normalizeCompanions(v.auxiliary);
    if (v.board === this.emptyBoard && Object.values(auxiliary).every(v=>v===null)) return null;
    const content=this.companionKeys.length ? JSON.stringify({board:v.board,auxiliary}) : v.board;
    return { source:'device-unclaimed', sha256:digest(content),
      bytes:new TextEncoder().encode(content).length };
  }
  importUnclaimed(id, { confirmedAccountId, confirmedDigest, explicitConsent, remoteEmptyConfirmed }) {
    id = accountId(id);
    const a = this.active();
    if (a?.kind !== 'account' || a.ownerId !== id || a.state !== 'ready')
      throw new BoundaryError('target_not_ready');
    if (confirmedAccountId !== id || explicitConsent !== true || remoteEmptyConfirmed !== true)
      throw new BoundaryError('consent_missing_or_wrong_destination');
    if (this.s.getItem(RECEIPT) !== null) throw new BoundaryError('unclaimed_import_already_completed');
    const source = readJson(this.s, UNCLAIMED) || readJson(this.s, GUEST);
    const preview = this.previewUnclaimed();
    if (!preview || confirmedDigest !== preview.sha256)
      throw new BoundaryError('preview_digest_mismatch');
    if (this.s.getItem(this.boardKey) !== this.emptyBoard || this.s.getItem(this.revisionKey) !== null ||
        Object.values(this._readCompanions()).some(v=>v!==null))
      throw new BoundaryError('target_not_empty');
    const recover = recoveryKey(id, this.emptyBoard);
    const recoverEntry = this.s.getItem(recover) === null ?
      [[recover, serial({ version: 1, ownerId: id, board: this.emptyBoard, revision: null })]] : [];
    commit(this.s, [...recoverEntry,
      [this.boardKey, source.board],
      [this.revisionKey, null],
      ...this._companionEntries(source.auxiliary),
      [RECEIPT, serial({ version: 1, accountId: id, sourceDigest: preview.sha256 })]]);
    return { state: 'ready', imported: true, destinationAccountId: id };
  }
  authorizeUpload(id) {
    id = accountId(id);
    const a = this.active();
    return !!a && a.kind === 'account' && a.ownerId === id && a.state === 'ready';
  }
}
