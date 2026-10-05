"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, ShieldCheck, AlertTriangle, RefreshCcw, CheckCircle2 } from 'lucide-react';

interface AuditRow {
  id: number;
  ts: string;
  actor: string;
  action: string;
  rowHash: string;
  prevHash: string;
  status: 'verified' | 'tampered';
}

const MOCK_AUDIT: AuditRow[] = [
  { id: 1, ts: "2026-10-02T04:00:00Z", actor: "SYS_DETECTOR", action: "BATCH_COMMIT", rowHash: "8f2a...d1e2", prevHash: "0000...", status: 'verified' },
  { id: 2, ts: "2026-10-02T04:05:00Z", actor: "SYS_DETECTOR", action: "BATCH_COMMIT", rowHash: "c8d9...f2a1", prevHash: "8f2a...d1e2", status: 'verified' },
  { id: 3, ts: "2026-10-02T04:10:00Z", actor: "ANALYST_PRIYA", action: "STAGE_VERDICT", rowHash: "a3b4...c5d6", prevHash: "c8d9...f2a1", status: 'verified' },
];

export const AuditLedgerViewer = () => {
  const [ledger, setLedger] = useState(MOCK_AUDIT);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyChain = async () => {
    setIsVerifying(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsVerifying(false);
  };

  const simulateTamper = () => {
    setLedger(prev => prev.map((row, idx) =>
      idx === 1 ? { ...row, status: 'tampered', rowHash: "TAMPERED_HASH_999" } : row
    ));
  };

  return (
    <div className="w-full p-6 bg-surface border border-border-subtle rounded-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-white">Audit Ledger (NIST SP 800-92)</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={simulateTamper}
            className="px-3 py-1.5 text-xs font-mono border border-border-subtle text-slate-300 hover:text-severity-high hover:border-severity-high transition-all rounded-sm"
          >
            Simulate Tamper
          </button>
          <button
            onClick={verifyChain}
            disabled={isVerifying}
            className="px-3 py-1.5 text-xs font-mono bg-white text-black hover:bg-severity-critical hover:text-white transition-all rounded-sm font-bold"
          >
            {isVerifying ? "Verifying..." : "Verify Chain"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-border-subtle">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-base text-slate-300 uppercase tracking-tighter text-xs">
            <tr>
              <th className="px-4 py-2 border-r border-border-subtle">ID</th>
              <th className="px-4 py-2 border-r border-border-subtle">Timestamp</th>
              <th className="px-4 py-2 border-r border-border-subtle">Actor</th>
              <th className="px-4 py-2 border-r border-border-subtle">Action</th>
              <th className="px-4 py-2 border-r border-border-subtle">Row Hash</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {ledger.map((row) => (
              <tr key={row.id} className={`group ${row.status === 'tampered' ? 'bg-severity-critical/10' : 'bg-surface'}`}>
                <td className="px-4 py-2 text-slate-300">{row.id}</td>
                <td className="px-4 py-2 text-slate-300">{row.ts}</td>
                <td className="px-4 py-2 text-slate-300">{row.actor}</td>
                <td className="px-4 py-2 text-slate-400">{row.action}</td>
                <td className="px-4 py-2 text-slate-300 font-mono text-xs">{row.rowHash}</td>
                <td className="px-4 py-2">
                  {row.status === 'verified' ? (
                    <span className="flex items-center gap-1 text-status-resolved text-xs font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-severity-critical text-xs font-bold animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> Tampered
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
