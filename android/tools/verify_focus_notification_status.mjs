#!/usr/bin/env node
/**
 * Michel's Life #53: read-only Focus notification evidence CONTRACT validator.
 * This validates FOUR consistency snapshots of NativeFocusAlarm.status().
 * It CANNOT establish that data came from a real device, that Android posted a
 * notification, or that background/Doze delivery is guaranteed.
 * Capture provenance must be independently verified and never committed with
 * private account, device identifiers, logs or unredacted screenshots.
 */
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function evaluateFocusEvidence(doc) {
  const fail = code => { throw new Error(code); };
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const exactKeys = (x, allowed, code) => {
    if (!object(x) || Object.keys(x).some(k => !allowed.includes(k))) fail(code);
  };
  const scenarios = ['permission-denied', 'app-disabled', 'completion-channel-muted', 'allowed'];
  const statusFields = ['precision', 'backgroundDeliveryGuaranteed', 'backgroundDelivery',
    'notificationsGranted', 'ongoingCountdownSupported', 'ongoingCountdownAvailable',
    'activeDeadlineAt', 'deliveryReason', 'scheduled'];
  exactKeys(doc, ['snapshots'], 'evidence_schema_invalid');
  if (!Array.isArray(doc.snapshots) || doc.snapshots.length !== 4) fail('four_scenarios_required');
  const found = new Set();
  for (const snap of doc.snapshots) {
    exactKeys(snap, ['scenario', 'status'], 'snapshot_fields_invalid');
    if (!scenarios.includes(snap.scenario) || found.has(snap.scenario)) fail('scenario_missing_or_duplicate');
    found.add(snap.scenario);
    const s = snap.status;
    exactKeys(s, statusFields, 'native_status_fields_invalid');
    const mandatory = statusFields.filter(k => k !== 'scheduled');
    if (mandatory.some(k => !Object.hasOwn(s, k))) fail('native_status_incomplete');
    if (s.precision !== 'battery-optimized-inexact' || s.backgroundDeliveryGuaranteed !== false)
      fail('inexact_delivery_contract_invalid');
    for (const k of ['notificationsGranted', 'backgroundDelivery', 'ongoingCountdownSupported', 'ongoingCountdownAvailable']) {
      if (typeof s[k] !== 'boolean') fail('native_status_type_invalid');
    }
    if (s.ongoingCountdownSupported !== true ||
        !Number.isSafeInteger(s.activeDeadlineAt) || s.activeDeadlineAt < 0 ||
        (Object.hasOwn(s, 'scheduled') && typeof s.scheduled !== 'boolean'))
      fail('native_status_type_invalid');
    const denied = snap.scenario === 'permission-denied' || snap.scenario === 'app-disabled';
    const muted = snap.scenario === 'completion-channel-muted';
    if (denied && (s.notificationsGranted || s.backgroundDelivery ||
                   s.ongoingCountdownAvailable || s.deliveryReason !== 'notification-permission-disabled'))
      fail('denied_permission_misreported');
    if (muted && (!s.notificationsGranted || s.backgroundDelivery ||
                  s.deliveryReason !== 'focus-completion-channel-disabled'))
      fail('muted_channel_misreported');
    if (snap.scenario === 'allowed' && (!s.notificationsGranted || !s.backgroundDelivery ||
                   !s.ongoingCountdownAvailable ||
                   s.deliveryReason !== 'inexact-alarm-may-be-delayed-by-battery'))
      fail('allowed_channel_misreported');
  }
  return true;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.length !== 3) {
    console.error('Usage: node android/tools/verify_focus_notification_status.mjs <redacted-evidence.json>');
    process.exitCode = 2;
  } else {
    try {
      if (statSync(process.argv[2]).size > 65536) throw new Error('evidence_too_large');
      const data = JSON.parse(readFileSync(process.argv[2], 'utf8'));
      evaluateFocusEvidence(data);
      console.log('PASS: four Focus status consistency checks (NOT physical-device verification)');
    } catch (e) {
      // Error strings from validators are fixed, never copy untrusted data to CI.
      const safeCodes = new Set([
        'evidence_schema_invalid','four_scenarios_required','snapshot_fields_invalid',
        'scenario_missing_or_duplicate','native_status_fields_invalid','native_status_incomplete',
        'inexact_delivery_contract_invalid','native_status_type_invalid',
        'denied_permission_misreported','muted_channel_misreported',
        'allowed_channel_misreported','evidence_too_large'
      ]);
      console.error('FAIL:', safeCodes.has(e.message) ? e.message : 'unreadable_or_malformed_evidence');
      process.exitCode = 1;
    }
  }
}
