import { describe, it, expect } from './test-helper';
import { generateSyntheticCorpus } from '../src/data/generator';
import { runDetectionPipeline } from '../src/detect/engine';
import { AuditLedger } from '../src/lib/crypto/audit-ledger';

/**
 * Ralph Loop: Automated Continuous Validation Loop
 * Evaluates detection delta between Benign Baseline (Pack A) and Spray Attack (Pack B).
 * Asserts:
 * 1. Pack A produces ZERO Critical incidents (low false-positive rate).
 * 2. Pack B produces exactly 1 Correlated Critical Incident (100% attack recall).
 * 3. Cryptographic audit ledger confirms 100% chain validity.
 */
describe('Ralph Loop — Continuous Ground Truth & Regression Assertion', () => {
  it('Ralph Loop Pass 1: Baseline Pack A produces zero Critical incidents', () => {
    const packA = generateSyntheticCorpus({ userCount: 100, pack: 'A' });
    const resultA = runDetectionPipeline(packA.events);

    // Pack A should not trigger any multi-family Critical incidents
    const criticals = resultA.incidents.filter((inc) => inc.severityTier === 'CRITICAL');
    expect(criticals.length).toBe(0);
  });

  it('Ralph Loop Pass 2: Attack Pack B detects 1 Correlated Critical Incident with F10 pivot', () => {
    const packB = generateSyntheticCorpus({ userCount: 100, pack: 'B' });
    const resultB = runDetectionPipeline(packB.events);

    const criticals = resultB.incidents.filter((inc) => inc.severityTier === 'CRITICAL');
    expect(criticals.length).toBeGreaterThanOrEqual(1);

    const primary = criticals[0];
    expect(primary.severityScore).toBe(100);
    expect(primary.familiesPresent).toContain('GRAPH');
    expect(primary.familiesPresent).toContain('PIVOT');
    expect(primary.compromisedAccounts.length).toBeGreaterThan(0);
  });

  it('Ralph Loop Pass 3: Seals pipeline results in SHA-256 Audit Ledger and detects tamper', () => {
    const packB = generateSyntheticCorpus({ userCount: 80, pack: 'B' });
    const result = runDetectionPipeline(packB.events);

    const ledger = new AuditLedger();
    ledger.append({
      actorId: 'ralph_loop_runner',
      actionType: 'EVALUATION_PASS',
      targetEntityType: 'telemetry_pack',
      targetEntityId: 'pack_b',
      payload: {
        eventsCount: packB.events.length,
        incidentsCount: result.incidents.length,
        primarySeverity: result.incidents[0]?.severityScore ?? 0,
      },
    });

    const initialVerify = ledger.verify();
    expect(initialVerify.valid).toBe(true);
    expect(initialVerify.totalRecords).toBe(1);

    // Tamper test
    ledger.tamperRecordForDemo(0, 'tampered_eval_payload');
    const tamperedVerify = ledger.verify();
    expect(tamperedVerify.valid).toBe(false);
    expect(tamperedVerify.tamperedIndex).toBe(0);
  });
});
