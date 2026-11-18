// Regression: the Story provenance test must read the SAME generated Android
// bundle directory as its workflow, never a different CI job's output.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const workflow=await readFile('.github/workflows/granada-story-focus-provenance.yml','utf8');
const matrix=await readFile('tools/ui_granada_story_focus_matrix.mjs','utf8');

function checkContract(workflowText,matrixText){
  const build=workflowText.match(/python android\/tools\/prepare_bundle\.py[^\n]*--assets\s+([^\s]+)/);
  assert.ok(build,'Story provenance workflow missing Android bundle build');
  const consumer=matrixText.match(/const canonicalHtml=await readFile\('([^']+\/index\.html)','utf8'\);/);
  assert.ok(consumer,'Story provenance reader path missing');
  const builtIndex=build[1]+'/index.html';
  assert.equal(consumer[1],builtIndex,
    'Story parser reads a different index.html from the generated fixture');
  return builtIndex;
}

const canonical=checkContract(workflow,matrix);
assert.equal(canonical,'artifacts/android-story-bundle/index.html');

const priorBroken=matrix.replace(canonical,'artifacts/android-ui-bundle/index.html');
assert.notEqual(priorBroken,matrix,'Historical failing path fixture was not applied');
assert.throws(()=>checkContract(workflow,priorBroken),error=>
  error?.code==='ERR_ASSERTION'&&
  error.message.includes('Story parser reads a different index.html'));
const wrongProducer=workflow.replace('--assets artifacts/android-story-bundle',
  '--assets artifacts/android-ui-bundle');
assert.notEqual(wrongProducer,workflow,'Fixture for producer drift was not applied');
assert.throws(()=>checkContract(wrongProducer,matrix),error=>
  error?.code==='ERR_ASSERTION'&&
  error.message.includes('Story parser reads a different index.html'));
console.log('PASS Story bundle producer/consumer path contract + two negative regressions');
