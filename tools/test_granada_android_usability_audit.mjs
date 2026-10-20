import assert from 'node:assert/strict';
import test from 'node:test';
import {analyzeRoute,assembleAudit,ROUTES,WIDTHS} from './granada_android_usability_audit_core.mjs';

const sample=(route='dashboard',width=360)=>({
  route,width,documentWidth:width,active:true,shellCount:1,
  section:{left:0,right:width,width,height:600,top:70,bottom:670},
  nav:{left:0,right:width,width,height:70,top:845,bottom:915},
  navButtons:Array.from({length:5},(_,i)=>({
    left:i*60,right:(i+1)*60,width:60,height:60,hit:true
  }))
});

test('valid route preserves only structural metrics',()=>{
  const input={...sample(),userName:'DO-NOT-EXPORT',journal:'PRIVATE_TEXT'};
  const record=analyzeRoute(input);
  assert.equal(record.findings.length,0);
  assert(!JSON.stringify(record).includes('PRIVATE_TEXT'));
  assert(!JSON.stringify(record).includes('DO-NOT-EXPORT'));
});

test('real Android widths and all required canonical sections',()=>{
  const fixtures=WIDTHS.flatMap(width=>ROUTES.map(route=>sample(route,width)));
  const report=assembleAudit(fixtures);
  assert.equal(report.status,'pass');
  assert.deepEqual(Object.values(report.coverage),[9,9,9]);
  assert.equal(report.sections.length,27);
  assert.equal(report.galaxyValidated,false);
  assert.equal(report.releaseValidated,false);
});

test('missing route is a blocking failure',()=>{
  const report=assembleAudit([sample('dashboard',360)]);
  assert.equal(report.status,'fail');
  assert(report.findings.some(f=>f.code==='missing_route_coverage'&&f.section==='story'));
});

test('touch target covered by an overlay fails closed',()=>{
  const x=sample();
  x.navButtons[2].hit=false;
  assert(analyzeRoute(x).findings.some(f=>f.code==='bottom_nav_target_obstructed'));
});

test('truncated nav targets are rejected',()=>{
  const x=sample();
  x.navButtons[4].right=999;
  assert(analyzeRoute(x).findings.some(f=>f.code==='bottom_nav_touch_target_invalid'));
});

test('squeezed section is rejected even if document width looks fine',()=>{
  const x=sample();
  x.section.left=-25;
  assert(analyzeRoute(x).findings.some(f=>f.code==='section_escapes_viewport'));
});

test('cross-viewport horizontal scroll is a blocking error',()=>{
  const x=sample('calendar',320);x.documentWidth=345;
  assert(analyzeRoute(x).findings.some(f=>f.code==='horizontal_overflow'));
});

test('duplicate mobile shells and hidden nav reject test fixture',()=>{
  const x=sample();x.shellCount=2;x.nav=null;
  const codes=analyzeRoute(x).findings.map(f=>f.code);
  assert(codes.includes('duplicate_or_missing_mobile_shell'));
  assert(codes.includes('bottom_nav_not_visible'));
});

test('report sanitizes arbitrary user-supplied values',()=>{
  const report=assembleAudit([sample()],[
    {severity:'error',code:'token=SECRET-ACCESS-CODE',section:'RAW_PRIVATE_SECTION',
      viewport:9000},
    {severity:'info',code:'raw_sensitive_message',section:'dashboard',viewport:320}
  ]);
  const serialized=JSON.stringify(report);
  assert.equal(report.status,'fail');
  assert(!serialized.includes('SECRET-ACCESS-CODE'));
  assert(!serialized.includes('RAW_PRIVATE_SECTION'));
  assert(!serialized.includes('raw_sensitive_message'));
});

test('invalid geometry and nonfinite values cannot pass',()=>{
  const x=sample();x.documentWidth=Number.POSITIVE_INFINITY;
  x.section.width=Number.NaN;
  const codes=analyzeRoute(x).findings.map(f=>f.code);
  assert(codes.includes('document_width_invalid'));
  assert(codes.includes('section_not_visible'));
});

test('no fabricated acceptance, even when all browser checks pass',()=>{
  const report=assembleAudit(WIDTHS.flatMap(w=>ROUTES.map(r=>sample(r,w))));
  assert.equal(report.environment,'chromium-android-touch-simulation');
  assert.equal(report.galaxyValidated,false);
  assert.equal(report.releaseValidated,false);
});
