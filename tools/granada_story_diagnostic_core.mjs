// Browser-only Android Story/Focus error provenance. Never capture personal content.
const VALID_PHASES=new Set(['bootstrap','story','settings','focus','resume','relaunch','chapter','final']);
const VALID_ERRORS=new Set(['SyntaxError','ReferenceError','TypeError','RangeError','EvalError','URIError']);
const ASSERT_CODES=new Set(['story_drawer_target_missing','story_form_not_visible','pomodoro_hidden','focus_no_deadline','focus_reset_on_navigation','focus_not_persisted_after_browser_relaunch','progress_mutated_by_navigation','chapter_draft_lost','chapter_motto_lost','start_chapter_missing','chapter_submit_covered','unexpected_javascript_pageerror']);
export function normalizeError(input,phase='bootstrap'){
  if(!VALID_PHASES.has(phase))throw Error('invalid diagnostic phase');
  const rawName=String(input?.name||'Error');
  const kind=VALID_ERRORS.has(rawName)?rawName:'RuntimeError';
  const message=String(input?.message||input||'');
  let code='runtime_error';
  if(ASSERT_CODES.has(message))code=message;
  else if(kind==='SyntaxError'||/unexpected token|unexpected identifier|invalid or unexpected token/i.test(message))code='script_syntax_error';
  else if(kind==='ReferenceError')code='undefined_binding';
  else if(kind==='TypeError')code='invalid_runtime_operation';
  else if(/timeout/i.test(message))code='interaction_timeout';
  else if(/execution context was destroyed|target closed|browser.*closed/i.test(message))code='browser_context_lost';
  const stack=String(input?.stack||'');
  const matches=[...stack.matchAll(/(?:https?:\/\/[^\s)]+\/|\b)([A-Za-z0-9_.-]+\.(?:js|mjs|html))(?:\?[^\s):]*)?:(\d+):(\d+)/g)];
  const hit=matches.find(m=>!/(granada_story|node:|playwright)/i.test(m[1]))||matches[0];
  let source='unlocated',line=null,column=null;
  if(hit){
    source=hit[1].slice(0,72);line=Number(hit[2]);column=Number(hit[3]);
    if(!Number.isSafeInteger(line)||line<1||!Number.isSafeInteger(column)||column<1){source='unlocated';line=null;column=null;}
  }
  return {phase,code,kind,source,line,column};
}
export function evidenceReport({sourceSha,apkSha=null,cases}){
  if(typeof sourceSha!=='string'||!/^[0-9a-f]{40}$/.test(sourceSha))throw Error('source_sha_required');
  if(apkSha!==null)throw Error('browser_run_must_not_claim_native_apk');
  if(!Array.isArray(cases)||cases.length!==6)throw Error('incomplete_3_by_2_matrix');
  const seen=new Set(),out=[];
  for(const c of cases){
    if(![320,360,412].includes(c.width)||!['en','es'].includes(c.language))throw Error('invalid_matrix_case');
    const key=c.width+'/'+c.language;
    if(seen.has(key))throw Error('duplicate_matrix_case');seen.add(key);
    if(typeof c.passed!=='boolean'||!Array.isArray(c.errors)||c.errors.length>35)throw Error('incomplete_case_evidence');
    if(c.passed&&c.errors.length)throw Error('errors_cannot_pass');
    const errors=[];
    for(const e of c.errors){
      if(!e||Object.keys(e).sort().join(',')!=='code,column,kind,line,phase,source'||
         !VALID_PHASES.has(e.phase)||!(VALID_ERRORS.has(e.kind)||e.kind==='RuntimeError')||
         typeof e.code!=='string'||!/^[a-z_]+$/.test(e.code)||
         typeof e.source!=='string'||!/^(unlocated|[A-Za-z0-9_.-]+\.(?:html|js|mjs))$/.test(e.source)||
         (e.line!==null&&(!Number.isSafeInteger(e.line)||e.line<1))||
         (e.column!==null&&(!Number.isSafeInteger(e.column)||e.column<1)))throw Error('unsafe_error_record');
      errors.push({phase:e.phase,code:e.code,kind:e.kind,source:e.source,line:e.line,column:e.column});
    }
    out.push({width:c.width,language:c.language,passed:c.passed,phase:c.phase,errors});
  }
  if(seen.size!==6)throw Error('incomplete_3_by_2_matrix');
  const failed=out.filter(c=>!c.passed).length;
  return {schema:1,mode:'android_webview_browser_model',source_sha:sourceSha,
    status:failed?'FAIL':'PASS',checked:6,passed:6-failed,failed,cases:out,
    limitations:'Browser touchscreen only; no installed APK, native cold relaunch, Galaxy, live account, or signed release acceptance.'};
}
