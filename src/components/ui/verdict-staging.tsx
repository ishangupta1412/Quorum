"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ShieldAlert, Trash2, Save } from 'lucide-react';

type Verdict = 'disable_account' | 'revoke_sessions' | 'reset_credentials' | 'false_positive' | 'escalate';

const VERDICT_MAP: Record<Verdict, { label: string; color: string }> = {
  disable_account: { label: "Disable Account", color: "text-severity-critical" },
  revoke_sessions: { label: "Revoke Sessions", color: "text-severity-high" },
  reset_credentials: { label: "Reset Credentials", color: "text-severity-medium" },
  false_positive: { label: "False Positive", color: "text-status-resolved" },
  escalate: { label: "Escalate to Tier-3", color: "text-slate-400" },
};

export const VerdictStaging = ({ incidentId, onConfirm }: { incidentId: string, onConfirm: (v: Verdict, note: string) => void }) => {
  const [selectedVerdict, setSelectedVerdict] = useState<Verdict>('escalate');
  const [note, setNote] = useState("");

  return (
    <div className="p-6 bg-surface border border-border-subtle rounded-sm max-w-md mx-auto mt-8">
      <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
        <ShieldAlert className="w-3 h-3" />
        Stage Remediation Action
      </h3>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {Object.entries(VERDICT_MAP).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setSelectedVerdict(key as Verdict)}
            className={`flex items-center justify-between p-3 text-left border transition-all duration-200 rounded-sm font-mono text-xs ${
              selectedVerdict === key
                ? "bg-white/5 border-white text-white"
                : "bg-base border-border-subtle text-slate-500 hover:border-border-bold"
            }`}
          >
            <span className={selectedVerdict === key ? val.color : ""}>{val.label}</span>
            {selectedVerdict === key && <CheckCircle2 className="w-3 h-3 text-white" />}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Justification Note (Mandatory)</label>
        <textarea
          className="w-full bg-base border border-border-subtle p-3 text-xs font-mono text-white focus:outline-none focus:border-border-bold rounded-sm h-24"
          placeholder="Enter reason for this verdict..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <button
        disabled={!note || note.length < 20}
        onClick={() => onConfirm(selectedVerdict, note)}
        className="w-full py-3 bg-white text-black font-bold font-mono text-xs uppercase tracking-widest hover:bg-severity-critical hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
      >
        Stage Verdict
      </button>

      <p className="text-center text-[9px] font-mono text-slate-600 mt-4 italic">
        &quot;staged for human execution — Quorum never auto-enforces&quot;
      </p>
    </div>
  );
};
