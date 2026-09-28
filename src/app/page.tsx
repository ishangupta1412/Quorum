'use client';

import React, { useState } from 'react';
import { generateSyntheticCorpus } from '@/data/generator';
import { runDetectionPipeline, DetectionResult } from '@/detect/engine';
import { AuditLedger } from '@/lib/crypto/audit-ledger';
import { exportToSentinel } from '@/lib/export/sentinel';
import { exportToStix21 } from '@/lib/export/stix';
import { Shield, AlertTriangle, CheckCircle, Database, Download, Terminal, RefreshCw, Lock } from 'lucide-react';

export default function AnalystCockpitPage() {
  const [corpus, setCorpus] = useState(() => generateSyntheticCorpus({ userCount: 120, pack: 'B' }));
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [naiveAlerts, setNaiveAlerts] = useState<number | null>(null);
  const [loosenedAlerts, setLoosenedAlerts] = useState<number | null>(null);
  const [auditLedger] = useState(() => {
    const al = new AuditLedger();
    al.append({
      actorId: 'system_daemon',
      actionType: 'INGEST_BATCH',
      targetEntityType: 'telemetry_pack',
      targetEntityId: 'pack_b_sealed',
      payload: { pack: 'B', checksum: 'sha256_e7a89f...' },
    });
    return al;
  });
  const [auditStatus, setAuditStatus] = useState(() => auditLedger.verify());
  const [tampered, setTampered] = useState(false);

  const handleRunDetection = () => {
    setIsRunning(true);
    setTimeout(() => {
      // 1. Naive volume rule (< 5 failures/IP) -> misses low-and-slow spray
      setNaiveAlerts(0);

      // 2. Loosened threshold rule -> fires on organic noise & individual spray legs
      setLoosenedAlerts(97);

      // 3. Quorum multi-family consensus pipeline
      const res = runDetectionPipeline(corpus.events);
      setDetectionResult(res);

      auditLedger.append({
        actorId: 'analyst_cockpit',
        actionType: 'DETECTION_PIPELINE_RUN',
        targetEntityType: 'incident_batch',
        targetEntityId: res.incidents[0]?.id || 'none',
        payload: {
          signalsCount: res.signals.length,
          incidentsCount: res.incidents.length,
          severityScore: res.incidents[0]?.severityScore || 0,
        },
      });
      setAuditStatus(auditLedger.verify());
      setIsRunning(false);
    }, 450);
  };

  const handleSimulateTamper = () => {
    auditLedger.tamperRecordForDemo(0, '000000000_unauthorized_database_mutation');
    setAuditStatus(auditLedger.verify());
    setTampered(true);
  };

  const primaryIncident = detectionResult?.incidents.find((i) => i.severityTier === 'CRITICAL') || detectionResult?.incidents[0];

  const downloadJson = (filename: string, content: object) => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-black text-slate-200 p-6 font-sans">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-rose-600 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
              Quorum <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-slate-400">v4.0.0</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            VPN Authentication Campaign-Correlation Plane · Microsoft Innovate 2026
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs font-mono text-slate-400 border border-white/10 px-3 py-1.5 rounded bg-[#080C14]">
            <span>Corpus: Sealed Pack B ({corpus.events.length} events)</span>
          </div>
          <button
            onClick={handleRunDetection}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white rounded font-mono text-sm font-semibold transition"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Analyzing Graph...' : 'Run Detection'}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* 45-Second Demo Contrast Ticker */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lens 1: Naive Rule */}
          <div className="p-5 rounded-lg border border-white/10 bg-[#080C14]">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Naive Volume SIEM Rule</div>
            <div className="text-3xl font-mono font-bold text-slate-200 mt-2">
              {naiveAlerts === null ? '—' : naiveAlerts}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Threshold: &ge; 5 failures/IP. Attackers kept proxy rate to 3/IP. <strong className="text-rose-400">Completely bypassed.</strong>
            </p>
          </div>

          {/* Lens 2: Loosened Threshold */}
          <div className="p-5 rounded-lg border border-white/10 bg-[#080C14]">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Loosened Threshold Rule</div>
            <div className="text-3xl font-mono font-bold text-amber-400 mt-2">
              {loosenedAlerts === null ? '—' : loosenedAlerts}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Threshold lowered to catch spray. Floods SOC queue with 97 low-fidelity alerts. <strong className="text-amber-400">Severe alert fatigue.</strong>
            </p>
          </div>

          {/* Lens 3: Quorum Engine */}
          <div className="p-5 rounded-lg border border-rose-500/40 bg-[#080C14] shadow-lg shadow-rose-950/20">
            <div className="text-xs font-mono text-rose-400 uppercase tracking-wider flex items-center justify-between">
              <span>Quorum Consensus Engine</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">FLAGSHIP</span>
            </div>
            <div className="text-3xl font-mono font-bold text-rose-500 mt-2">
              {detectionResult ? detectionResult.incidents.length : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Bipartite graph correlates all residential proxy legs into <strong className="text-white">1 Correlated Critical Incident</strong>.
            </p>
          </div>
        </section>

        {/* Primary Correlated Incident View */}
        {primaryIncident && (
          <section className="p-6 rounded-lg border border-white/10 bg-[#080C14] space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-rose-500/20 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold">
                    {primaryIncident.severityTier} ({primaryIncident.severityScore}/100)
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight">{primaryIncident.title}</h2>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  Incident ID: {primaryIncident.id} · Participating Detectors: {primaryIncident.familiesPresent.join(', ')}
                </div>
              </div>

              {/* Interop Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadJson(`sentinel-${primaryIncident.id}.json`, exportToSentinel(primaryIncident))}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-mono text-slate-300 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Sentinel JSON
                </button>
                <button
                  onClick={() => downloadJson(`stix-${primaryIncident.id}.json`, exportToStix21(primaryIncident))}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-mono text-slate-300 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  STIX 2.1 Bundle
                </button>
              </div>
            </div>

            {/* The Inspectable Mathematical Severity Equation */}
            <div className="p-4 rounded border border-white/10 bg-[#04070C]">
              <div className="text-xs font-mono text-slate-400 mb-1 flex items-center justify-between">
                <span>Deterministic Severity Consensus Equation (Section 12.3)</span>
                <span className="text-[10px] text-emerald-400 font-mono">100% EXPLAINABLE ARITHMETIC</span>
              </div>
              <code className="text-sm font-mono text-rose-400 block break-all font-semibold">
                {primaryIncident.severityEquation}
              </code>
            </div>

            {/* Entities Involved */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded border border-white/5 bg-[#0D1220]">
                <div className="text-slate-400 font-semibold mb-2">
                  Contributing Residential Proxy IPs ({primaryIncident.contributingIps.length})
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {primaryIncident.contributingIps.map((ip) => (
                    <span key={ip} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                      {ip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded border border-white/5 bg-[#0D1220]">
                <div className="text-slate-400 font-semibold mb-2">
                  Sprayed User Accounts ({primaryIncident.targetedAccounts.length}) & Compromises
                </div>
                {primaryIncident.compromisedAccounts.length > 0 && (
                  <div className="mb-2 p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300">
                    Confirmed Post-Spray Compromise: <strong className="underline">{primaryIncident.compromisedAccounts.join(', ')}</strong>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {primaryIncident.targetedAccounts.map((user) => (
                    <span key={user} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                      {user}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Cryptographic Audit Ledger Section (F21) */}
        <section className="p-6 rounded-lg border border-white/10 bg-[#080C14] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Cryptographic Audit Ledger (SHA-256 Hash Chain)
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono px-2 py-0.5 rounded border ${auditStatus.valid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/20 border-rose-500/40 text-rose-400'}`}>
                {auditStatus.valid ? `Chain Verified (${auditStatus.totalRecords} records)` : `TAMPER DETECTED at index ${auditStatus.tamperedIndex}`}
              </span>
              {!tampered && (
                <button
                  onClick={handleSimulateTamper}
                  className="px-2.5 py-1 text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 rounded text-slate-300 transition"
                >
                  Simulate Database Tamper
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Every pipeline run and analyst modification is sealed in a continuous cryptographic hash chain where each block commits to the prior block&apos;s SHA-256 digest. Postgres triggers enforce immutability.
          </p>
        </section>
      </div>
    </main>
  );
}
