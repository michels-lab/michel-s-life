// GRANADA #168: static parser audit of the ACTUAL assembled Android HTML.
// The browser's intermittent SyntaxErrors must never be silently ignored or
// attributed to unrelated projects. Never log inline JS, tokens or personal data.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';

const file=process.argv[2]||'artifacts/android-story-bundle/index.html';
const output='artifacts/granada-story-focus/inline-js-inventory.json';
const html=await readFile(file,'utf8');
const pattern=/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const historicalDigests=new Set([
  '8aa8f3f1e3fb67d692e0457b9ec0d86eb6b59f3a47ef4c678b3452d7c82791fa',
  'f3248c86698be959d718a2358351d67642d276ecaa50326a780ae67fb36ae6b0',
  '710851ad32a142f0aa3f605e35d81dca5fe85e636d0633f1cfce1e3a4d39f4e2'
]);
const scripts=[];
const failures=[];
const linesBefore=(pos)=>html.slice(0,pos).split('\n').length;
let match;
while((match=pattern.exec(html))){
 const index=scripts.length+1;
 const attrs=match[1];
 const type=attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.trim().toLowerCase()||'classic';
 const id=attrs.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1]||'unnamed';
 const safeId=/^[a-zA-Z0-9_.-]{1,96}$/.test(id)?id:'invalid-id';
 const source=match[2];
 const sha=createHash('sha256').update(source,'utf8').digest('hex');
 const bytes=Buffer.byteLength(source,'utf8');
 const startLine=linesBefore(match.index);
 const enabled=!attrs.match(/\bsrc\s*=/i)&&['classic','text/javascript','application/javascript','module'].includes(type)&&source.trim()!=='';
 let syntax='not-js';
 if(enabled&&type!=='module'){
   try{new Script(source,{filename:'canonical-inline-'+index+'.js'});syntax='valid';}
   catch(err){
     syntax='invalid';
     failures.push({index,id:safeId,startLine,bytes,
       category:err instanceof SyntaxError?'syntax_error':'parse_failure',digest:sha});
   }
 }else if(enabled)syntax='module-not-classic';
 const info={index,id:safeId,startLine,bytes,digest:sha,
   type,syntax,historicalFingerprint:historicalDigests.has(sha)};
 scripts.push(info);
}
await mkdir('artifacts/granada-story-focus',{recursive:true});
const report={
 schema:'mlv.granada.story.inline_js_inventory.v1',
 mode:'canonical_generated_android_html',
 scriptCount:scripts.length,
 validClassicCount:scripts.filter(x=>x.syntax==='valid').length,
 parseFailureCount:failures.length,
 previousCdpFingerprintMatches:scripts.filter(x=>x.historicalFingerprint).map(x=>({
   id:x.id,startLine:x.startLine,digest:x.digest
 })),
 scripts,failures
};
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log('GRANADA_INLINE_JS_INVENTORY '+JSON.stringify({
 scripts:report.scriptCount,valid:report.validClassicCount,
 failed:report.parseFailureCount,matchingFailedCdp:report.previousCdpFingerprintMatches
}));
if(scripts.length<100||report.validClassicCount<100||failures.length>0){
 console.error('GRANADA_INLINE_JS_PARSE_FAIL '+JSON.stringify(failures));
 process.exitCode=1;
}
