import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';

const html=readFileSync('src/MichelsLife/frontend/index.html','utf8');
const focus=readFileSync('src/MichelsLife/frontend/focus-immersive.js','utf8');
const alarms=readFileSync('src/MichelsLife/frontend/personal-alarms.js','utf8');

test('chapter is backed by artwork and a real recovery layer, not black empty surface',()=>{
 assert.match(html,/function heroLayers\(\)/);
 assert.match(html,/mlv184ChapterRecovery/);
 assert.match(html,/recovery\.style\.backgroundImage=/);
 assert.match(html,/backdrop\?\.complete&&backdrop\.naturalWidth>0/);
 assert.match(html,/art\.dataset\.mlv189TriedPreview/);
 assert.match(html,/hero\.dataset\.mlv189Art='recovery'/);
 assert.match(html,/\.mlv184-chapter-root #mlv184ChapterRecovery\{/);
 assert.match(html,/#mlv184ChapterArt\{z-index:1!important\}/);
 assert.match(html,/#mlv184ChapterShade\{z-index:2!important\}/);
 assert.match(html,/#mlv184ChapterAtmosphere\{z-index:3!important\}/);
 assert.match(html,/:not\(#mlv184ChapterRecovery\):not\(\.v30165-hero-aura\)\{position:relative!important;z-index:4!important\}/);
 assert.match(html, /\.v30165-rpg-chapter-hero \.v30165-hero-aura\{position:absolute!important/);
 // Flat opaque 74-100% overpaint was the actual black-card regression.
 assert.doesNotMatch(html,/let chapterSig='';function applyChapter\(force\)\{[^\n]*v\.enabled\?v\.header\/100:\.74/);
 assert.match(html,/const left=Math\.max\(\.23,Math\.min\(\.51,requested\*\.58\)\)/);
});
test('focus/alarms own real window click, not early pointerdown that hides its button',()=>{
 assert.match(focus,/window\.addEventListener\?\.\('click',dispatchFocusInput,true\)/);
 assert.match(alarms,/window\.addEventListener\?\.\('click',captureAlarmLauncher,true\)/);
 assert.doesNotMatch(focus,/window\.addEventListener\?\.\('pointerdown',dispatchFocusInput,true\)/);
 assert.doesNotMatch(alarms,/window\.addEventListener\?\.\('pointerdown',captureAlarmLauncher,true\)/);
});
