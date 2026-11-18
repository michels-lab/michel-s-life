import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {safeScriptLocation, safeScriptFingerprint,
  createBrowserScriptFaultTracker} from './browser_script_fault_provenance.mjs';

assert.deepEqual(safeScriptLocation('https://private.example/a/index.html?token=DO_NOT_LOG', 12, 3, 'parser'),
  {origin:'parser', source:'index.html', line:13, column:4});
assert.deepEqual(safeScriptLocation('data:application/javascript,bad-secret', -1, null, 'exception'),
  {origin:'exception', source:'unlocated', line:null, column:null});
assert.equal(safeScriptFingerprint('const x = (').bytes, 11);
const fake = new EventEmitter();
fake.send = async (method, args) => {
  assert.equal(method, 'Debugger.getScriptSource');
  assert.equal(args.scriptId, 'broken1');
  return {scriptSource:'const ownerSecret = "NEVER_PRINT_ME"; const x = ('};
};
const tracker = createBrowserScriptFaultTracker(fake);
fake.emit('Debugger.scriptFailedToParse', {
  url:'https://private.example/a/index.html?token=DO_NOT_LOG',
  startLine:42,startColumn:1,scriptId:'broken1'
});
fake.emit('Runtime.exceptionThrown', {exceptionDetails:{
  exception:{className:'SyntaxError'},url:'https://private.example/a/m.js?token=DO_NOT_LOG',
  lineNumber:6,columnNumber:7
}});
fake.emit('Runtime.exceptionThrown', {exceptionDetails:{
  exception:{className:'TypeError'},url:'https://private.example/x.js',lineNumber:0,columnNumber:0
}});
const snapshot = await tracker.snapshot();
assert.equal(snapshot.length, 2);
assert.deepEqual(snapshot[0], {
  origin:'parser', source:'index.html',line:43,column:2,
  bytes:49,sha256:safeScriptFingerprint('const ownerSecret = "NEVER_PRINT_ME"; const x = (').sha256
});
assert.deepEqual(snapshot[1], {origin:'exception',source:'m.js',line:7,column:8});
assert.equal(JSON.stringify(snapshot).includes('DO_NOT_LOG'), false);
assert.equal(JSON.stringify(snapshot).includes('NEVER_PRINT_ME'), false);
const empty = createBrowserScriptFaultTracker(new EventEmitter());
assert.deepEqual(await empty.snapshot(), []);
assert.throws(() => createBrowserScriptFaultTracker(fake,{limit:0}),/invalid_fault_limit/);
console.log('PASS CDP browser syntax fault source location, hash-only evidence and privacy negatives');
