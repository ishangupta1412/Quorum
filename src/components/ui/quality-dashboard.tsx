"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Database, ShieldCheck, AlertCircle, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Metric {
  label: string;
  value: string;
  target: string;
  status: 'pass' | 'fail';
  description: string;
}

const METRICS: Metric[] = [
  { label: "A2TP Ratio", value: "1.5 : 1", target: "≤ 3.0", status: 'pass', description: "Incidents raised per true campaign" },
  { label: "Campaign Recall", value: "92%", target: "≥ 92%", status: 'pass', description: "Detected vs planted campaigns" },
  { label: "Median MTTD", value: "2.68 min", target: "≤ 5 min", status: 'pass', description: "First event to incident creation" },
  { label: "Clean Corpus FP", value: "0", target: "≤ 3", status: 'pass', description: "Incidents on zero-attack corpus" },
  { label: "Event F1 Score", value: "0.92", target: "≥ 0.87", status: 'pass', description: "Harmonic mean of Precision/Recall" },
];

export const QualityDashboard = () => {
  return (
    <div className="w-full p-6 bg-base text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tighter flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-status-resolved" />
              Quality Assurance Gates
            </h2>
            <p className="text-xs font-mono text-slate-300 uppercase tracking-widest mt-1">
              Verified against sealed Pack B corpus
            </p>
          </div>
          <div className="px-4 py-2 bg-surface border border-border-subtle rounded-sm">
            <span className="text-xs font-mono text-slate-300 uppercase mr-2">Integrity:</span>
            <span className="text-xs font-mono text-status-resolved font-bold">PASSED</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {METRICS.map((m, idx) => (
            <div key={m.label} className="p-5 bg-surface border border-border-subtle rounded-sm group hover:border-border-bold transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-slate-300 uppercase tracking-widest">{m.label}</span>
                {m.status === 'pass' ? (
                  <CheckCircle2 className="w-3 h-3 text-status-resolved" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-severity-critical" />
                )}
              </div>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-3xl font-bold font-mono text-white">{m.value}</span>
                <span className="text-xs font-mono text-slate-300">Target: {m.target}</span>
              </div>
              <p className="text-xs font-mono text-slate-400">{m.description}</p>
            </div>
          ))}
        </div>

        <div className="p-6 bg-surface border border-border-subtle rounded-sm bg-gradient-to-br from-surface to-base">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-white">Permanent Limitations Statement</h3>
          </div>
          <p className="text-xs font-mono text-slate-400 leading-relaxed italic">
            &quot;Metrics above are measured against a synthetic, labeled corpus generated under controlled parameters. They demonstrate detection performance against modeled attack topologies — they do not prove equivalent recall against unobserved enterprise network anomalies, proprietary log dialect shifts, or novel evasion tactics. Campaigns targeting fewer than 25 accounts fall below the graph detector&apos;s structural floor and rely on rule-level detection alone.&quot;
          </p>
        </div>
      </div>
    </div>
  );
};
