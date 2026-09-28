import { NextResponse } from 'next/server';
import { AuditLedger } from '@/lib/crypto/audit-ledger';

// In-memory ledger demonstration instance
const serverLedger = new AuditLedger();
serverLedger.append({
  actorId: 'system_daemon',
  actionType: 'GENESIS_BOOTSTRAP',
  targetEntityType: 'system',
  targetEntityId: 'quorum_core',
  payload: { status: 'INITIALIZED', engineVersion: '4.0.0' },
});

export async function GET() {
  const verification = serverLedger.verify();
  const records = serverLedger.getRecords();

  return NextResponse.json({
    success: true,
    data: {
      chainValid: verification.valid,
      totalRecords: verification.totalRecords,
      tamperedIndex: verification.tamperedIndex,
      headHash: records.length > 0 ? records[records.length - 1].recordHash : null,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}
