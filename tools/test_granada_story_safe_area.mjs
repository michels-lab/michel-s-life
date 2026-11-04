import assert from 'node:assert/strict';
import {calculateStoryClearance,calculateScrollCorrection} from '../android/story-focus-safe-area.mjs';
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}
test('focus plus navigation requires 229px clearance',()=>assert.equal(calculateStoryClearance({viewportHeight:915,miniTop:750,miniVisible:true,navTop:856,navVisible:true}),229));
test('navigation without Focus requires only 123px',()=>assert.equal(calculateStoryClearance({viewportHeight:915,miniVisible:false,navTop:856,navVisible:true}),123));
test('desktop/no fixed panel uses minimum',()=>assert.equal(calculateStoryClearance({viewportHeight:800,miniVisible:false,navVisible:false}),110));
test('extreme overlay capped',()=>assert.equal(calculateStoryClearance({viewportHeight:915,miniVisible:true,miniTop:100,navVisible:false}),400));
test('invalid viewport fails safe',()=>assert.equal(calculateStoryClearance({viewportHeight:-1}),110));
test('covered save button scrolls above mini player',()=>assert.equal(calculateScrollCorrection({buttonTop:700,buttonBottom:770,availableTop:60,availableBottom:740}),48));
test('fully visible CTA does not jump',()=>assert.equal(calculateScrollCorrection({buttonTop:620,buttonBottom:680,availableTop:60,availableBottom:740}),0));
test('button under top bar moves down',()=>assert.equal(calculateScrollCorrection({buttonTop:48,buttonBottom:100,availableTop:112,availableBottom:740}),-82));
test('invalid coordinates fail closed',()=>assert.equal(calculateScrollCorrection({buttonTop:NaN,buttonBottom:100,availableTop:60,availableBottom:740}),0));
test('oversized CTA avoids oscillation',()=>assert.equal(calculateScrollCorrection({buttonTop:100,buttonBottom:900,availableTop:60,availableBottom:740}),0));
console.log(count+'/'+count+' Story safe-area geometry checks passed');
