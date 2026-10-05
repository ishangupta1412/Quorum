'use client';

import React from 'react';
import { Incident, Signal } from '@/types/auth-event';
import { Calculator, Check, AlertCircle, Shield, ArrowRight } from 'lucide-react';

interface ConsensusInspectorProps {
  incident: Incident | null;
  signals: readonly Signal[];
}

export function ConsensusInspector({ incident, signals }: ConsensusInspectorProps) {
  if (!incident) return null;

  const f5Signal = signals.find((s) => s.detectorId === 'F5_brute');
  const f6Signal = signals.find((s) => s.detectorId === 'F6_spray');
  const f7Signal = signals.find((s) => s.detectorId === 'F7_campaign');
  const f10Signal = signals.find((s) => s.detectorId === 'F10_pivot');

  const familiesPresent = incident.familiesPresent || [];

  return (
    <div className="rounded-lg border border-white/10 bg-[#080C14] p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              Multi-Family Consensus Arithmetic
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% EXPLAINABLE
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic mathematical consensus resolving conflicting signals into a unified severity verdict
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-rose-500/20 border border-rose-500/30 text-rose-400">
          FINAL VERDICT: {incident.severityScore}/100 [{incident.severityTier}]
        </span>
      </div>

      {/* The 4 Detection Families Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
        {/* Family 1 */}
        <div className={`p-3 rounded-lg border ${f5Signal ? 'border-amber-500/30 bg-amber-950/10' : 'border-white/5 bg-[#04070C]'}`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 font-bold">Volume Rule</span>
            {f5Signal ? <span className="text-amber-400 font-bold">VOTED</span> : <span className="text-slate-400">INACTIVE</span>}
          </div>
          <div className="text-xs text-slate-300 mb-2">Single-IP Sliding Window Brute Force</div>
          <div className="text-sm font-bold text-slate-200">
            {f5Signal ? `${f5Signal.confidenceScore}% conf` : '0 alerts (stealth)'}
          </div>
        </div>

        {/* Family 2 */}
        <div className={`p-3 rounded-lg border ${f6Signal ? 'border-amber-500/30 bg-amber-950/10' : 'border-white/5 bg-[#04070C]'}`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 font-bold">Statistical Spray</span>
            {f6Signal ? <span className="text-amber-400 font-bold">VOTED</span> : <span className="text-slate-400">INACTIVE</span>}
          </div>
          <div className="text-xs text-slate-300 mb-2">Single-Source Multi-Account Spray</div>
          <div className="text-sm font-bold text-slate-200">
            {f6Signal ? `${f6Signal.confidenceScore}% conf` : 'Sub-threshold'}
          </div>
        </div>

        {/* Family 3 */}
        <div className={`p-3 rounded-lg border ${f7Signal ? 'border-rose-500/40 bg-rose-950/20' : 'border-white/5 bg-[#04070C]'}`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-rose-400 font-bold">Graph Cluster (Flagship)</span>
            {f7Signal ? <span className="text-rose-400 font-bold">VOTED</span> : <span className="text-slate-400">INACTIVE</span>}
          </div>
          <div className="text-xs text-slate-400 mb-2">Bipartite Campaign Union-Find Cluster</div>
          <div className="text-sm font-bold text-rose-400">
            {f7Signal ? `${f7Signal.confidenceScore}% conf (${(f7Signal.evidenceBundle.ipCount as number) || 0} IPs)` : '0 alerts'}
          </div>
        </div>

        {/* Family 4 */}
        <div className={`p-3 rounded-lg border ${f10Signal ? 'border-rose-600 bg-rose-950/40 ring-1 ring-rose-500' : 'border-white/5 bg-[#04070C]'}`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-rose-300 font-bold">Pivot Breach</span>
            {f10Signal ? <span className="text-white font-bold bg-rose-600 px-1 rounded">CONFIRMED</span> : <span className="text-slate-400">INACTIVE</span>}
          </div>
          <div className="text-xs text-slate-300 mb-2">Post-Spray Residential IP Pivot</div>
          <div className="text-sm font-bold text-rose-300">
            {f10Signal ? `Breach: ${(f10Signal.evidenceBundle.compromisedUser as string) || 'user'}` : 'Pre-breach'}
          </div>
        </div>
      </div>

      {/* Arithmetic Derivation Formula Box */}
      <div className="p-4 rounded-lg border border-white/10 bg-[#04070C] space-y-3 font-mono text-xs">
        <div className="text-slate-400 font-semibold text-xs uppercase tracking-wider flex items-center justify-between">
          <span>Mathematical Derivation Proof (Section 12.3)</span>
          <span className="text-emerald-400 font-normal">Deterministic Algebraic Consensus</span>
        </div>

        <code className="text-sm text-rose-400 block break-all font-bold bg-black/60 p-2.5 rounded border border-white/5">
          {incident.severityEquation}
        </code>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs pt-1">
          <div className="border border-white/5 p-2 rounded bg-black/40">
            <span className="text-slate-300 block">1. BASE CONFIDENCE</span>
            <span className="text-slate-200 font-bold">{f10Signal ? f10Signal.confidenceScore : f7Signal ? f7Signal.confidenceScore : 75} pts</span>
          </div>
          <div className="border border-white/5 p-2 rounded bg-black/40">
            <span className="text-slate-300 block">2. FAMILY MULTIPLIER</span>
            <span className="text-slate-200 font-bold">
              {familiesPresent.length === 1 ? '0.50x (1 family)' : familiesPresent.length === 2 ? '1.00x (2 families)' : familiesPresent.length === 3 ? '1.25x (3 families)' : '1.50x (4 families)'}
            </span>
          </div>
          <div className="border border-white/5 p-2 rounded bg-black/40">
            <span className="text-slate-300 block">3. COMPROMISE BONUS</span>
            <span className="text-rose-400 font-bold">{f10Signal ? '+15 pts (PIVOT breach)' : '+0 pts'}</span>
          </div>
          <div className="border border-white/5 p-2 rounded bg-black/40">
            <span className="text-slate-300 block">4. ARITHMETIC FLOOR</span>
            <span className="text-amber-400 font-bold">{f10Signal ? 'Floor 80 [CRITICAL]' : 'Floor 60 [HIGH]'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
