#!/usr/bin/env node
/**
 * GRANADA #53 — fail-closed evaluation of REAL Android Focus status captures.
 *
 * Input is a JSON file with four snapshots captured from an installed APK
 * (not fabricated fixtures). Nothing here claims to acquire device evidence.
 *
 * Example: node android/tools/verify_focus_notification_status.mjs evidence.json
 *
 * Each snapshot: { scenario, status } where scenario is one of
 * permission-denied, app-disabled, completion-channel-muted, allowed.
 * status is the native Focus alarm status JSONObject captured after changing
 * that OS setting and querying the app again. Evidence must be anonymized.
 */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const scenarioNames = ['permission-denied', 'app-disabled', 'completion-channel-muted', 'allowed'];
function checkSnapshot(item) {
  assert.ok(item && typeof item === 'object', 'snapshot must be an object');
  assert.ok(scenarioNames.includes(item.scenario), 'unknown scenario');
  const s = item.status;
  assert.ok(s && typeof s === 'object' && !Array.isArray(s), 'real native status required');
  assert.equal(s.precision, 'battery-optimized-inexact', 'must disclose inexact alarm timing');
  assert.equal(s.backgroundDeliveryGuaranteed, false, 'never promise Doze delivery');
  assert.equal(typeof s.backgroundDelivery, 'boolean', 'backgroundDelivery required');
  assert.equal(typeof s.notificationsGranted, 'boolean', 'permission indicator required');
  if (item.scenario === 'permission-denied' || item.scenario === 'app-disabled') {
    assert.equal(s.notificationsGranted, false, 'OS-denied app must not report granted');
    assert.equal(s.backgroundDelivery, false, 'OS-denied app must not promise delivery');
  }
  if (item.scenario === 'completion-channel-muted') {
    assert.equal(s.backgroundDelivery, false, 'muted completion channel cannot deliver');
  }
  if (item.scenario === 'allowed') {
    assert.equal(s.notificationsGranted, true, 'OS permission should be allowed');
    assert.equal(s.backgroundDelivery, true, 'allowed channel should report deliverable (not guaranteed)');
  }
}

if (process.argv.length !== 3) {
  console.error('Usage: node android/tools/verify_focus_notification_status.mjs <real-native-captures.json>');
  process.exit(2);
}
try {
  const doc = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  assert.ok(Array.isArray(doc.snapshots), 'expected snapshots array');
  assert.equal(doc.snapshots.length, scenarioNames.length, 'exactly four OS scenarios required');
  assert.deepEqual(doc.snapshots.map(s => s.scenario).sort(), [...scenarioNames].sort(), 'all scenarios required once');
  for (const s of doc.snapshots) checkSnapshot(s);
  console.log('PASS: four actual-capture Focus notification status contracts');
} catch (error) {
  console.error('FAIL:', error.message);
  process.exitCode = 1;
}
