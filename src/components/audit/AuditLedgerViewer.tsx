'use client';

import React, { useState } from 'react';
import { AuditLedger, AuditVerificationResult } from '@/lib/crypto/audit-ledger';
import { Shield, ShieldAlert, CheckCircle, AlertTriangle, Key, Database, RefreshCw, FileText, Download } from 'lucide-react';

interface AuditLedgerViewerProps {
  auditLedger: AuditLedger;
  auditStatus: AuditVerificationResult;
  onTamperSimulate: () => void;
  onRestoreChain: () => void;
}

export function AuditLedgerViewer({
  auditLedger,
  auditStatus,
  onTamperSimulate,
  onRestoreChain,
}: AuditLedgerViewerProps) {
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number | null>(null);
  const records = auditLedger.getRecords();

  const handleDownloadLedger = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quorum-audit-ledger-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedRecord = selectedBlockIdx !== null ? records[selectedBlockIdx] : null;

  return (
    <div className="rounded-lg border border-white/10 bg-[#080C14] p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              Cryptographic Audit Ledger (SHA-256 Hash Chain)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-400">
                Tamper Evident
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly verifiable, tamper-evident hash chain linking every analyst mutation and pipeline execution
            </p>
          </div>
        </div>

        {/* Status Pill & Action Buttons */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono px-3 py-1 rounded border flex items-center gap-1.5 ${
              auditStatus.valid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400 font-bold animate-pulse'
            }`}
          >
            {auditStatus.valid ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                VERIFIED ({records.length} blocks)
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                TAMPER DETECTED (Block #{auditStatus.tamperedIndex !== null ? auditStatus.tamperedIndex + 1 : '?'})
              </>
            )}
          </span>

          {auditStatus.valid ? (
            <button
              onClick={onTamperSimulate}
              className="px-3 py-1 text-xs font-mono bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded text-rose-300 font-semibold transition"
            >
              Simulate DB Tamper
            </button>
          ) : (
            <button
              onClick={onRestoreChain}
              className="px-3 py-1 text-xs font-mono bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded text-emerald-300 font-bold transition flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Restore Cryptographic Chain
            </button>
          )}

          <button
            onClick={handleDownloadLedger}
            className="p-1.5 text-slate-400 hover:text-white border border-white/10 rounded bg-white/5 transition"
            title="Download Full Ledger JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chain Explanation Alert */}
      {!auditStatus.valid && (
        <div className="p-3 rounded border border-rose-500/40 bg-rose-950/20 text-xs font-mono text-rose-300 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            CRITICAL EVIDENCE CORRUPTION ALERT:
          </div>
          <p className="text-[11px] text-slate-300">
            {auditStatus.errorDetails || 'Block signature validation failed. A row was mutated directly in PostgreSQL without updating the SHA-256 hash digest.'}
          </p>
        </div>
      )}

      {/* Visual Hash Chain Blocks */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          Chain Blocks (Click any block to inspect cryptographic payload)
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 pt-1">
          {records.map((rec, idx) => {
            const isTampered = !auditStatus.valid && auditStatus.tamperedIndex === idx;
            const isSelected = selectedBlockIdx === idx;

            return (
              <div
                key={rec.sequenceId}
                onClick={() => setSelectedBlockIdx(isSelected ? null : idx)}
                className={`min-w-[200px] flex-1 p-3 rounded-lg border cursor-pointer transition-all ${
                  isTampered
                    ? 'border-rose-500 bg-rose-950/30 ring-1 ring-rose-500'
                    : isSelected
                      ? 'border-emerald-400 bg-white/10 ring-1 ring-emerald-400'
                      : 'border-white/10 bg-[#04070C] hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                  <span className="font-bold text-white">Block #{rec.sequenceId}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${isTampered ? 'bg-rose-500 text-white font-bold' : 'bg-white/10 text-slate-400'}`}>
                    {rec.actionType}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-slate-400 space-y-1">
                  <div>
                    <span className="text-slate-600 block">ACTOR:</span>
                    <span className="text-slate-300">{rec.actorId}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block">SHA-256 RECORD HASH:</span>
                    <span className={`block truncate ${isTampered ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                      {rec.recordHash.slice(0, 16)}...
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 block">PREV HASH:</span>
                    <span className="block truncate text-slate-500">
                      {rec.prevRecordHash.slice(0, 16)}...
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Block Detailed Modal / Drawer */}
      {selectedRecord && (
        <div className="p-4 rounded-lg border border-white/10 bg-[#04070C] font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-white uppercase flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              Cryptographic Block #{selectedRecord.sequenceId} Detail
            </span>
            <button
              onClick={() => setSelectedBlockIdx(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-slate-500 block">TIMESTAMP:</span>
              <span className="text-slate-200">{selectedRecord.timestamp}</span>
            </div>
            <div>
              <span className="text-slate-500 block">ACTOR ID:</span>
              <span className="text-slate-200">{selectedRecord.actorId}</span>
            </div>
            <div>
              <span className="text-slate-500 block">TARGET ENTITY:</span>
              <span className="text-slate-200">{selectedRecord.targetEntityType} ({selectedRecord.targetEntityId})</span>
            </div>
            <div>
              <span className="text-slate-500 block">PAYLOAD HASH (SHA-256):</span>
              <span className="text-slate-300 break-all">{selectedRecord.payloadHash}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 block">PREVIOUS RECORD HASH:</span>
              <span className="text-slate-400 break-all">{selectedRecord.prevRecordHash}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 block">CURRENT BLOCK RECORD HASH (COMMITTED):</span>
              <span className="text-emerald-400 font-bold break-all">{selectedRecord.recordHash}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
