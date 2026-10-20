/**
 * Michel's Life GRANADA: privacy-safe Android section health contract.
 * Data-only module, usable in Chromium AND in developer diagnostics.
 * Never serialize DOM markup, textContent, user titles, token values or IDs.
 */
export const ROUTES = Object.freeze([
  'dashboard','missions','contracts','calendar','journal',
  'projects','stats','story','settings'
]);
export const WIDTHS = Object.freeze([320,360,412]);
const finite=(value)=>typeof value==='number'&&Number.isFinite(value);
const safeNum=(value)=>finite(value)?Math.round(value*100)/100:null;
const geometry=(box)=>box&&typeof box==='object'
  ?{left:safeNum(box.left),right:safeNum(box.right),
    top:safeNum(box.top),bottom:safeNum(box.bottom),
    width:safeNum(box.width),height:safeNum(box.height)}:null;
export const codedFinding=(severity,code,section,viewport)=>({
  severity,code,section:ROUTES.includes(section)?section:'unknown',
  viewport:WIDTHS.includes(viewport)?viewport:null
});

export function analyzeRoute(input){
  const route=ROUTES.includes(input?.route)?input.route:'unknown';
  const width=WIDTHS.includes(input?.width)?input.width:null;
  const rect=geometry(input?.section);
  const nav=geometry(input?.nav);
  const results=[];
  const add=(severity,code)=>results.push(codedFinding(severity,code,route,width));
  if(!width)add('error','unsupported_viewport');
  if(!rect || rect.width===null || rect.width<=0)add('error','section_not_visible');
  else if(width && (rect.left<-3||rect.right>width+3))
    add('error','section_escapes_viewport');
  if(!finite(input?.documentWidth))add('error','document_width_invalid');
  else if(width && input.documentWidth>width+3)add('error','horizontal_overflow');
  if(input?.active!==true)add('error','section_not_active');
  if(!nav||nav.width===null||nav.width<=0)add('error','bottom_nav_not_visible');
  if(input?.shellCount!==1)add('error','duplicate_or_missing_mobile_shell');
  const buttons=Array.isArray(input?.navButtons)?input.navButtons:[];
  if(buttons.length<5)add('error','bottom_nav_missing_buttons');
  for(const control of buttons){
    if(!control||!finite(control.width)||!finite(control.height) ||
       control.width<42 || control.height<44 || control.left<-3 ||
       (width && control.right>width+3)){
      add('error','bottom_nav_touch_target_invalid');break;
    }
    if(control.hit!==true){add('error','bottom_nav_target_obstructed');break;}
  }
  // Report only structural metrics; never copy a caller's unknown properties.
  return {
    route,width,active:input?.active===true,
    documentWidth:safeNum(input?.documentWidth),section:rect,nav,
    navCount:buttons.length,findings:results
  };
}

export function assembleAudit(samples,otherFindings=[]){
  const safe=(Array.isArray(samples)?samples:[]).map(analyzeRoute);
  const findings=safe.flatMap(x=>x.findings);
  for(const f of otherFindings){
    if(!f||!['error','warning'].includes(f.severity))continue;
    const code=String(f.code||'').replace(/[^a-z0-9_]/g,'').slice(0,65);
    findings.push(codedFinding(f.severity,code||'unknown_error',f.section,f.viewport));
  }
  const coverage={};
  for(const width of WIDTHS)coverage[width]=ROUTES.filter(route=>
    safe.some(x=>x.route===route&&x.width===width)).length;
  for(const width of WIDTHS){
    for(const route of ROUTES){
      if(!safe.some(x=>x.route===route&&x.width===width))
        findings.push(codedFinding('error','missing_route_coverage',route,width));
    }
  }
  return {
    schema:'mlv.granada.android-usability.v1',
    environment:'chromium-android-touch-simulation',
    releaseValidated:false,
    galaxyValidated:false,
    expectedPerViewport:ROUTES.length,
    coverage,sections:safe,findings,
    status:findings.some(f=>f.severity==='error')?'fail':
      findings.some(f=>f.severity==='warning')?'review':'pass'
  };
}
