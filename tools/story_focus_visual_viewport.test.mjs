import assert from 'node:assert/strict';
import {test} from 'node:test';
import {visibleViewportBounds,calculateScrollCorrection,calculateStoryClearance} from '../android/story-focus-safe-area.mjs';

test('keyboard-shrunken viewport excludes the obscured bottom region',()=>{
 const view=visibleViewportBounds({innerHeight:915,offsetTop:0,height:530});
 assert.deepEqual(view,{top:0,bottom:530});
 assert.equal(calculateScrollCorrection({
  buttonTop:490,buttonBottom:520,availableTop:view.top,availableBottom:view.bottom
 }),8);
});

test('visual viewport scroll offset is honored',()=>{
 const view=visibleViewportBounds({innerHeight:915,offsetTop:85,height:520});
 assert.deepEqual(view,{top:85,bottom:605});
 assert.equal(calculateScrollCorrection({
  buttonTop:91,buttonBottom:125,availableTop:view.top,availableBottom:view.bottom
 }),-12);
});

test('fallback without visualViewport retains original layout viewport',()=>{
 const view=visibleViewportBounds({innerHeight:915});
 assert.deepEqual(view,{top:0,bottom:915});
 assert.equal(calculateScrollCorrection({
  buttonTop:750,buttonBottom:790,availableTop:0,availableBottom:915
 }),0);
});

test('invalid viewport dimensions cannot produce infinite bounds',()=>{
 const view=visibleViewportBounds({innerHeight:800,offsetTop:NaN,height:Infinity});
 assert.deepEqual(view,{top:0,bottom:800});
});

test('running Focus clearance uses visible viewport floor',()=>{
 assert.equal(calculateStoryClearance({
  viewportHeight:530,miniTop:470,miniVisible:true,navTop:480,navVisible:true
 }),124);
});
