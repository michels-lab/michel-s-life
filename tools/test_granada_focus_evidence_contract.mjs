#!/usr/bin/env node
/** Deterministic synthetic contracts; never claim real Android capture. */
import assert from 'node:assert/strict';
import { evaluateFocusEvidence } from '../android/tools/verify_focus_notification_status.mjs';
const fixture = ()=>({snapshots:['permission-denied','app-disabled','completion-channel-muted','allowed'].map(scenario=>({
 scenario,
 status:{
  precision:'battery-optimized-inexact',backgroundDeliveryGuaranteed:false,
  backgroundDelivery:scenario==='allowed',notificationsGranted:!(scenario==='permission-denied'||scenario==='app-disabled'),
  ongoingCountdownSupported:true,ongoingCountdownAvailable:!(scenario==='permission-denied'||scenario==='app-disabled'),
  activeDeadlineAt:0,
  deliveryReason:scenario==='allowed'?'inexact-alarm-may-be-delayed-by-battery':
   scenario==='completion-channel-muted'?'focus-completion-channel-disabled':'notification-permission-disabled'
 }
}))});
const cases = [
  ["valid native shapes", ()=>{}, true],
  ["different order", x=>x.snapshots.reverse(), true],
  ["missing snapshot", x=>x.snapshots.pop(), false],
  ["duplicate scenario", x=>x.snapshots[3].scenario='app-disabled', false],
  ["unknown scenario", x=>x.snapshots[0].scenario='made-up', false],
  ["extra top-level secret", x=>x.authToken='secret', false],
  ["extra status secret", x=>x.snapshots[0].status.refreshToken='secret', false],
  ["untrusted snapshot note", x=>x.snapshots[0].account='private', false],
  ["wrong precision", x=>x.snapshots[3].status.precision='exact', false],
  ["claim guaranteed Doze", x=>x.snapshots[3].status.backgroundDeliveryGuaranteed=true, false],
  ["denied falsely true", x=>x.snapshots[0].status.backgroundDelivery=true, false],
  ["muted falsely true", x=>x.snapshots[2].status.backgroundDelivery=true, false],
  ["muted denies entire app", x=>x.snapshots[2].status.notificationsGranted=false, false],
  ["allowed claims disabled", x=>x.snapshots[3].status.notificationsGranted=false, false],
  ["wrong denied reason", x=>x.snapshots[1].status.deliveryReason='foo', false],
  ["missing native reason", x=>delete x.snapshots[2].status.deliveryReason, false],
  ["bad deadline", x=>x.snapshots[3].status.activeDeadlineAt='later', false],
  ["bad optional scheduled", x=>x.snapshots[3].status.scheduled='false', false],
  ["allowed ongoing countdown suppressed", x=>x.snapshots[3].status.ongoingCountdownAvailable=false, false],
  ["denied ongoing countdown falsely allowed", x=>x.snapshots[0].status.ongoingCountdownAvailable=true, false],
  ["array instead of object", x=>x.snapshots[0].status=[], false],
];
let passed=0;
for (const [name,mutate,expectPass] of cases) {
  const doc=fixture(); mutate(doc);
  let actual=true;
  try { evaluateFocusEvidence(doc); } catch { actual=false; }
  assert.equal(actual, expectPass, name); passed++;
}
console.log('PASS:',passed,'Focus evidence consistency tests (synthetic, not device acceptance)');
