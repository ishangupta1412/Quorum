import { describe, it, expect } from './test-helper';
import { AuditLedger, GENESIS_HASH } from '../src/lib/crypto/audit-ledger';

describe('F21 Cryptographic Hash-Chained Audit Ledger', () => {
  it('appends records and builds a valid hash-chain from genesis', () => {
    const ledger = new AuditLedger();

    const entry1 = ledger.append({
      actorId: 'analyst_01',
      actionType: 'INCIDENT_TRIAGE',
      targetEntityType: 'incident',
      targetEntityId: 'inc_quorum_01',
      payload: { note: 'Beginning investigation of distributed spray' },
    });

    expect(entry1.sequenceId).toBe(1);
    expect(entry1.prevRecordHash).toBe(GENESIS_HASH);
    expect(entry1.recordHash).toBeDefined();

    const entry2 = ledger.append({
      actorId: 'analyst_01',
      actionType: 'ACCOUNT_QUARANTINE_REQUEST',
      targetEntityType: 'user',
      targetEntityId: 'user_0001',
      payload: { reason: 'Confirmed pivot post-spray' },
    });

    expect(entry2.sequenceId).toBe(2);
    expect(entry2.prevRecordHash).toBe(entry1.recordHash);

    const verification = ledger.verify();
    expect(verification.valid).toBe(true);
    expect(verification.totalRecords).toBe(2);
    expect(verification.tamperedIndex).toBeNull();
  });

  it('detects tampering when a record payload is modified post-hoc', () => {
    const ledger = new AuditLedger();

    ledger.append({
      actorId: 'analyst_01',
      actionType: 'TRIAGE_START',
      targetEntityType: 'incident',
      targetEntityId: 'inc_01',
      payload: { note: 'Original note' },
    });

    ledger.append({
      actorId: 'analyst_02',
      actionType: 'TRIAGE_RESOLVE',
      targetEntityType: 'incident',
      targetEntityId: 'inc_01',
      payload: { note: 'Contained threat' },
    });

    expect(ledger.verify().valid).toBe(true);

    // Simulate malicious tamper at record 0
    ledger.tamperRecordForDemo(0, 'malicious_altered_payload_hash');

    const tamperedVerification = ledger.verify();
    expect(tamperedVerification.valid).toBe(false);
    expect(tamperedVerification.tamperedIndex).toBe(0);
    expect(tamperedVerification.errorDetails).toContain('Tamper detected');
  });
});
