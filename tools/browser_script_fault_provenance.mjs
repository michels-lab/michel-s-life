// Fail-closed, privacy-safe CDP evidence for intermittently malformed browser scripts.
// The source code itself, complete URLs, accounts and local app data are NEVER logged.
import {createHash} from 'node:crypto';

export function safeScriptLocation(url, line, column, origin) {
  let source = 'unlocated';
  try {
    const name = new URL(String(url || ''), 'https://invalid.local/').pathname.split('/').pop();
    if (/^[A-Za-z0-9_.-]+\.(?:html|js|mjs)$/.test(name || '')) source = name;
  } catch {}
  return {
    origin: origin === 'parser' ? 'parser' : 'exception', source,
    line: Number.isSafeInteger(line) && line >= 0 ? line + 1 : null,
    column: Number.isSafeInteger(column) && column >= 0 ? column + 1 : null
  };
}

export function safeScriptFingerprint(source) {
  if (typeof source !== 'string') return null;
  return {
    bytes: Buffer.byteLength(source, 'utf8'),
    sha256: createHash('sha256').update(source, 'utf8').digest('hex')
  };
}

export function createBrowserScriptFaultTracker(cdp, {limit = 16} = {}) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw Error('invalid_fault_limit');
  const observed = [], pending = [];
  const push = item => {
    if (observed.length >= limit) observed.shift();
    observed.push(item);
    return item;
  };
  cdp.on('Debugger.scriptFailedToParse', event => {
    const item = push(safeScriptLocation(event?.url, event?.startLine, event?.startColumn, 'parser'));
    if (!event?.scriptId || pending.length >= 100) return;
    pending.push(Promise.resolve().then(() => cdp.send('Debugger.getScriptSource', {scriptId: event.scriptId}))
      .then(reply => {
        const fingerprint = safeScriptFingerprint(reply?.scriptSource);
        if (fingerprint) Object.assign(item, fingerprint);
      }).catch(() => {}));
  });
  cdp.on('Runtime.exceptionThrown', event => {
    const details = event?.exceptionDetails;
    if (details?.exception?.className !== 'SyntaxError') return;
    push(safeScriptLocation(details?.url, details?.lineNumber, details?.columnNumber, 'exception'));
  });
  return {
    async snapshot() {
      await Promise.race([
        Promise.allSettled(pending),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
      return observed.map(item => ({...item}));
    }
  };
}
