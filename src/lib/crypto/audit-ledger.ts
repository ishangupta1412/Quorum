import { AuditEntry } from '../../types/auth-event';
import { sha256 } from './hash';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export interface AuditVerificationResult {
  readonly valid: boolean;
  readonly totalRecords: number;
  readonly tamperedIndex: number | null;
  readonly errorDetails?: string;
}

/**
 * Computes record hash for an audit ledger row.
 */
export function computeRecordHash(
  sequenceId: number,
  timestamp: string,
  actorId: string,
  actionType: string,
  targetEntityType: string,
  targetEntityId: string,
  payloadHash: string,
  prevRecordHash: string
): string {
  const content = `${sequenceId}|${timestamp}|${actorId}|${actionType}|${targetEntityType}|${targetEntityId}|${payloadHash}|${prevRecordHash}`;
  return sha256(content);
}

/**
 * In-memory or client-side cryptographic audit ledger (F21).
 */
export class AuditLedger {
  private chain: AuditEntry[] = [];

  constructor(initialChain?: AuditEntry[]) {
    if (initialChain && initialChain.length > 0) {
      this.chain = [...initialChain];
    }
  }

  /**
   * Appends an action to the cryptographic audit chain.
   */
  append(params: {
    actorId: string;
    actionType: string;
    targetEntityType: string;
    targetEntityId: string;
    payload: Record<string, unknown>;
  }): AuditEntry {
    const sequenceId = this.chain.length + 1;
    const timestamp = new Date().toISOString();
    const prevRecordHash =
      this.chain.length === 0
        ? GENESIS_HASH
        : this.chain[this.chain.length - 1].recordHash;

    const payloadHash = sha256(JSON.stringify(params.payload));
    const recordHash = computeRecordHash(
      sequenceId,
      timestamp,
      params.actorId,
      params.actionType,
      params.targetEntityType,
      params.targetEntityId,
      payloadHash,
      prevRecordHash
    );

    const entry: AuditEntry = {
      sequenceId,
      timestamp,
      actorId: params.actorId,
      actionType: params.actionType,
      targetEntityType: params.targetEntityType,
      targetEntityId: params.targetEntityId,
      payloadHash,
      prevRecordHash,
      recordHash,
    };

    this.chain.push(entry);
    return entry;
  }

  /**
   * Cryptographically verifies the entire ledger chain.
   */
  verify(): AuditVerificationResult {
    if (this.chain.length === 0) {
      return { valid: true, totalRecords: 0, tamperedIndex: null };
    }

    for (let i = 0; i < this.chain.length; i++) {
      const current = this.chain[i];
      const expectedPrev = i === 0 ? GENESIS_HASH : this.chain[i - 1].recordHash;

      // 1. Verify link integrity
      if (current.prevRecordHash !== expectedPrev) {
        return {
          valid: false,
          totalRecords: this.chain.length,
          tamperedIndex: i,
          errorDetails: `Chain break at sequence ${current.sequenceId}: prevRecordHash mismatch.`,
        };
      }

      // 2. Recompute current record hash
      const recomputed = computeRecordHash(
        current.sequenceId,
        current.timestamp,
        current.actorId,
        current.actionType,
        current.targetEntityType,
        current.targetEntityId,
        current.payloadHash,
        current.prevRecordHash
      );

      if (recomputed !== current.recordHash) {
        return {
          valid: false,
          totalRecords: this.chain.length,
          tamperedIndex: i,
          errorDetails: `Tamper detected at sequence ${current.sequenceId}: signature invalid.`,
        };
      }
    }

    return {
      valid: true,
      totalRecords: this.chain.length,
      tamperedIndex: null,
    };
  }

  /**
   * Returns current records.
   */
  getRecords(): readonly AuditEntry[] {
    return this.chain;
  }

  /**
   * Stage demonstration method: intentionally mutates a record to prove tamper detection works!
   */
  tamperRecordForDemo(index: number, fakePayloadHash: string): void {
    if (index >= 0 && index < this.chain.length) {
      const record = this.chain[index];
      // Force rewrite without re-signing to simulate malicious DB update
      (this.chain[index] as any) = {
        ...record,
        payloadHash: fakePayloadHash,
      };
    }
  }
}
