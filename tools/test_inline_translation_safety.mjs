import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Reproduces issue #168: a legacy render-time i18n TreeWalker rewrote
// textContent of already-parsed inline JS and styles. The canonical HTML
// source parsed cleanly, but the DOM script hash/length then diverged.
const html=readFileSync('src/MichelsLife/frontend/index.html','utf8');
const NodeFilter=Object.freeze({FILTER_ACCEPT:1,FILTER_REJECT:2});
function script(id){
  const tag='<script id="'+id+'">';
  const i=html.indexOf(tag);
  assert.ok(i>=0,'missing owning inline script '+id);
  const end=html.indexOf('</script>',i+tag.length);
  assert.ok(end>i,'missing closing script '+id);
  return html.slice(i+tag.length,end);
}
function ownedFilter(id,terminator){
  const body=script(id);
  const anchor=body.indexOf('createTreeWalker(');
  assert.ok(anchor>=0,'missing TreeWalker '+id);
  const start=body.indexOf('acceptNode(n){',anchor);
  assert.ok(start>=0,'missing acceptNode method '+id);
  const from=start+'acceptNode(n){'.length;
  const to=body.indexOf(terminator,from);
  assert.ok(to>from,'cannot isolate current acceptNode logic '+id);
  const fn=new Function('n','NodeFilter',body.slice(from,to));
  return node=>fn(node,NodeFilter);
}
const walkers=[
  {id:'v134-ambitious-achievements-script',end:'\n    }});'},
  {id:'v162-settings-controls-fix-script',end:'\n      }\n    });'}
];

for(const item of walkers){
  test(item.id+' leaves executable code intact but translates user-facing labels',()=>{
    const filter=ownedFilter(item.id,item.end);
    // A formerly selected node; with the old unguarded function, this
    // destructive translation turned valid source into a different script.
    const testNode={nodeValue:"const x='Configuración';",parentElement:{tagName:'SCRIPT'}};
    const oldFilter=n=>/Configuración/.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    assert.equal(oldFilter(testNode),NodeFilter.FILTER_ACCEPT,'negative fixture no longer reproduces');
    assert.equal(filter(testNode),NodeFilter.FILTER_REJECT,
      'legacy i18n must never translate script source');
    const original=testNode.nodeValue;
    if(filter(testNode)===NodeFilter.FILTER_ACCEPT)
      testNode.nodeValue=testNode.nodeValue.replace('Configuración','Settings');
    assert.equal(testNode.nodeValue,original,'DOM JS source was modified');
    for(const tagName of ['STYLE','NOSCRIPT','TEXTAREA']){
      assert.equal(filter({nodeValue:'Configuración',parentElement:{tagName}}),
        NodeFilter.FILTER_REJECT,tagName+' must be excluded');
    }
    assert.equal(filter({nodeValue:'Configuración',parentElement:null}),
      NodeFilter.FILTER_REJECT,'detached text must not be translated');
    assert.equal(filter({nodeValue:'Configuración',parentElement:{tagName:'DIV'}}),
      NodeFilter.FILTER_ACCEPT,'visible UI text still needs translation');
  });
}

test('all nine canonical visible-text walkers contain an explicit script/style boundary',()=>{
  const boundaries=[...html.matchAll(/createTreeWalker\s*\(/g)];
  assert.ok(boundaries.length>=9,'unexpectedly missing legacy translation walkers');
  for(const marker of boundaries){
    const fragment=html.slice(marker.index,marker.index+760);
    assert.match(fragment,/SCRIPT/,'unsafe walker at byte '+marker.index);
    assert.match(fragment,/STYLE/,'unsafe style handling at byte '+marker.index);
    assert.match(fragment,/FILTER_REJECT/,'TreeWalker filter did not reject non-visible source');
  }
});

test('v153 coin cleanup never writes executable source or normalizes unrelated UI text',()=>{
  const owner=script('v153-no-coins-english-cleanup-script');
  const start=owner.indexOf('  function removeCoinsFromUI(){');
  const end=owner.indexOf('\n  function finalPass(){',start);
  assert.ok(start>=0&&end>start);
  const body=owner.slice(start,end);
  const ids=['v251-weekly-real-fix-script','v3021-dashboard-real-category-filter',
    'v3130-presets-only-settings-script','v217-premium-edit-unified-script'];
  const exclusions=new Set(['SCRIPT','STYLE','NOSCRIPT','TEMPLATE','TEXTAREA','INPUT','SELECT','OPTION','PRE','CODE']);
  function leaf(tagName,textContent,editable=false,owned=false){
    const node={tagName,textContent,children:[],isContentEditable:editable,
      closest(selector){
        const terms=selector.split(',');
        return terms.includes(tagName.toLowerCase())||
          (owned&&terms.includes('[data-mlv-i18n-owned="source"]'))?node:null;
      },classList:{added:[],add(value){this.added.push(value)}}};
    return node;
  }
  const scripts=ids.map(id=>leaf('SCRIPT',script(id)));
  const otherProtected=Array.from(exclusions).filter(x=>x!=='SCRIPT')
    .map(tag=>leaf(tag,'  3 coins;  x   y  '));
  const editor=leaf('DIV','  3 coins  ',true);
  const owned=leaf('DIV','  3 coins  ',false,true);
  const ordinary=leaf('P','  ordinary   spacing  ');
  const mixed=leaf('SPAN','+25 XP · +3 coins');
  const coin=leaf('SMALL','3 coins');
  const unchanged=[...scripts,...otherProtected,editor,owned,ordinary];
  const before=unchanged.map(el=>el.textContent);
  // Return protected elements deliberately, even though the production
  // query now scopes rendered UI, to also test the exclusion boundary.
  const selectors=[];
  const document={querySelectorAll(selector){
    selectors.push(selector);return [...unchanged,mixed,coin];
  }};
  new Function('document',body+'\nremoveCoinsFromUI();')(document);
  assert.ok(selectors.every(x=>x!=='*'),'wildcard leaf cleanup reintroduced');
  assert.deepEqual(unchanged.map(el=>el.textContent),before);
  for(const el of unchanged)assert.deepEqual(el.classList.added,[]);
  assert.equal(mixed.textContent,'+25 XP');
  assert.deepEqual(mixed.classList.added,[],'XP badge must stay visible');
  assert.ok(coin.classList.added.includes('v153-hide-coins'));
});
