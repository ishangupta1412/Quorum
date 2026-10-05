"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Activity,
  Clock,
  Terminal,
  Cpu,
  Layers,
  CheckCircle2,
  Lock,
  Download,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { CommandCenter3DGraph } from '../graph/CommandCenter3DGraph';
import { AuthEvent, Incident } from '@/types/auth-event';

interface EventEvidence {
  hash: string;
  timestamp: string;
  user: string;
  ip: string;
  outcome: string;
}

const MOCK_EVIDENCE: EventEvidence[] = [
  { hash: "e1f2a8b301", timestamp: "2026-10-02T04:42:01Z", user: "admin_corp", ip: "192.168.1.105", outcome: "FAILURE_BAD_CREDENTIALS" },
  { hash: "c8d9f2a102", timestamp: "2026-10-02T04:43:12Z", user: "admin_corp", ip: "45.12.33.101", outcome: "FAILURE_BAD_CREDENTIALS" },
  { hash: "a3b4c5d603", timestamp: "2026-10-02T04:45:30Z", user: "admin_corp", ip: "103.22.11.54", outcome: "FAILURE_BAD_CREDENTIALS" },
  { hash: "f7e8d9c004", timestamp: "2026-10-02T04:50:11Z", user: "admin_corp", ip: "185.44.12.99", outcome: "SUCCESS" },
];

const MOCK_EVENTS: AuthEvent[] = [
  {
    eventHash: "e1f2a8b301",
    timestamp: "2026-10-02T04:42:01Z",
    tsTzAssumed: false,
    userName: "admin_corp",
    userRaw: "admin_corp",
    userPresent: true,
    srcIp: "192.168.1.105",
    ipScope: "private",
    eventOutcome: "FAILURE_BAD_CREDENTIALS",
    sourceSystem: "AzureVPN",
  },
  {
    eventHash: "c8d9f2a102",
    timestamp: "2026-10-02T04:43:12Z",
    tsTzAssumed: false,
    userName: "admin_corp",
    userRaw: "admin_corp",
    userPresent: true,
    srcIp: "45.12.33.101",
    ipScope: "public",
    eventOutcome: "FAILURE_BAD_CREDENTIALS",
    sourceSystem: "AzureVPN",
  },
  {
    eventHash: "a3b4c5d603",
    timestamp: "2026-10-02T04:45:30Z",
    tsTzAssumed: false,
    userName: "admin_corp",
    userRaw: "admin_corp",
    userPresent: true,
    srcIp: "103.22.11.54",
    ipScope: "public",
    eventOutcome: "FAILURE_BAD_CREDENTIALS",
    sourceSystem: "AzureVPN",
  },
  {
    eventHash: "f7e8d9c004",
    timestamp: "2026-10-02T04:50:11Z",
    tsTzAssumed: false,
    userName: "admin_corp",
    userRaw: "admin_corp",
    userPresent: true,
    srcIp: "185.44.12.99",
    ipScope: "public",
    eventOutcome: "SUCCESS",
    sourceSystem: "AzureVPN",
  },
];

const MOCK_INCIDENT: Incident = {
  id: "INC-2026-001",
  title: "Distributed Password Spray + Pivot",
  severityScore: 100,
  severityTier: "CRITICAL",
  severityEquation: "Base 100 (F10_pivot) × 1.00 (GRAPH+PIVOT) + 15 -> 100 [CRITICAL]",
  familiesPresent: ["GRAPH", "PIVOT", "STATISTICAL"],
  signalIds: ["sig_f7_01", "sig_f10_01"],
  contributingIps: ["192.168.1.105", "45.12.33.101", "103.22.11.54", "185.44.12.99"],
  targetedAccounts: ["admin_corp", "ceo", "hr_manager", "finance_1"],
  compromisedAccounts: ["admin_corp"],
  status: "OPEN",
  createdAt: "2026-10-02T04:50:15Z",
};

export const IncidentDetailView = ({
  incidentId,
  onBack,
  events = MOCK_EVENTS,
  incident = MOCK_INCIDENT,
}: {
  incidentId: string;
  onBack: () => void;
  events?: readonly AuthEvent[];
  incident?: Incident | null;
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'3d' | 'telemetry' | 'mitre'>('3d');
  const [isStagingVerdict, setIsStagingVerdict] = useState(false);
  const [verdictStaged, setVerdictStaged] = useState(false);

  const activeIncident = incident ?? MOCK_INCIDENT;

  const handleStageVerdict = () => {
    setIsStagingVerdict(true);
    setTimeout(() => {
      setIsStagingVerdict(false);
      setVerdictStaged(true);
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full flex flex-col bg-black text-white font-sans overflow-hidden select-none"
    >
      {/* ─── Top Command Hub Header ────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3.5 bg-[#080C14]/90 border-b border-white/[0.08] backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-white/5 transition-colors rounded-sm border border-white/10 text-slate-400 hover:text-white"
            title="Return to Queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <motion.div
              layoutId={`incident-badge-${incidentId}`}
              className="px-2.5 py-0.5 rounded-sm text-[10px] font-mono font-bold tracking-widest border border-severity-critical/60 bg-severity-critical/15 text-severity-critical flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-severity-critical animate-ping" />
              {activeIncident.severityTier}
            </motion.div>

            <h1 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
              {incidentId}
            </h1>

            <span className="text-slate-600 font-mono text-xs">/</span>

            <span className="text-xs font-mono text-slate-400">
              {activeIncident.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 px-3 py-1 bg-black/40 border border-white/5 rounded-sm text-[11px] font-mono text-slate-400">
            <span>MTTD: <strong className="text-white">2.68 min</strong></span>
            <span className="text-slate-700">|</span>
            <span>Cluster: <strong className="text-amber-400">3 Families</strong></span>
            <span className="text-slate-700">|</span>
            <span>Pivot: <strong className="text-severity-critical">CONFIRMED</strong></span>
          </div>

          <button
            onClick={handleStageVerdict}
            disabled={verdictStaged || isStagingVerdict}
            className="px-3.5 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 rounded-sm border border-white/10 flex items-center gap-2 bg-white text-black hover:bg-severity-critical hover:text-white disabled:opacity-50"
          >
            {verdictStaged ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-status-resolved" />
                VERDICT STAGED
              </>
            ) : isStagingVerdict ? (
              <>
                <Cpu className="w-3.5 h-3.5 animate-spin" />
                STAGING...
              </>
            ) : (
              <>
                <Terminal className="w-3.5 h-3.5" />
                STAGE ARM INCIDENT
              </>
            )}
          </button>
        </div>
      </header>

      {/* ─── 3-Column Asymmetric Command Center Bento Grid ─────────────────── */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden bg-black gap-px bg-white/[0.04]">
        {/* Left Wing (3 Cols): Consensus Arithmetic, Equations, & Ledger Proof */}
        <aside className="col-span-12 lg:col-span-3 bg-[#080C14] flex flex-col overflow-y-auto p-5 gap-5 border-r border-white/[0.08]">
          {/* Section: Severity Arithmetic Breakdown */}
          <section className="p-4 bg-black/60 border border-white/[0.08] rounded-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-severity-critical" />
                Consensus Arithmetic
              </span>
              <span className="font-mono text-[10px] text-severity-critical font-bold">
                SCORE {activeIncident.severityScore}
              </span>
            </div>

            <div className="font-mono text-xs text-white p-3 bg-black border border-white/10 rounded-sm overflow-x-auto mb-3">
              {activeIncident.severityEquation}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2 bg-white/[0.02] border border-white/5 rounded-sm">
                <div className="text-[9px] text-slate-500">BASE</div>
                <div className="text-xs font-bold text-white">100</div>
              </div>
              <div className="p-2 bg-white/[0.02] border border-white/5 rounded-sm">
                <div className="text-[9px] text-slate-500">MULTIPLIER</div>
                <div className="text-xs font-bold text-amber-400">1.00x</div>
              </div>
              <div className="p-2 bg-white/[0.02] border border-white/5 rounded-sm">
                <div className="text-[9px] text-slate-500">PIVOT BONUS</div>
                <div className="text-xs font-bold text-severity-critical">+15</div>
              </div>
            </div>
          </section>

          {/* Section: Participating Detector Families */}
          <section className="p-4 bg-black/60 border border-white/[0.08] rounded-sm">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Layers className="w-3 h-3 text-sky-400" />
              Independent Signals Present
            </span>

            <div className="space-y-2">
              {[
                { name: 'F7_campaign (GRAPH)', desc: 'Union-Find Bipartite Cluster', status: 'CONFIRMED', color: '#F59E0B' },
                { name: 'F10_pivot (PIVOT)', desc: 'Post-Spray Authenticated Breach', status: 'CONFIRMED', color: '#DC2626' },
                { name: 'antigravity-01 (ML)', desc: 'Neural Sequence Anomaly Vote', status: 'ACTIVE', color: '#10B981' },
              ].map((sig) => (
                <div key={sig.name} className="p-2.5 bg-black/40 border border-white/5 rounded-sm flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[11px] font-bold text-white">{sig.name}</div>
                    <div className="font-mono text-[9px] text-slate-500">{sig.desc}</div>
                  </div>
                  <span
                    className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm"
                    style={{ color: sig.color, background: `${sig.color}15`, border: `1px solid ${sig.color}30` }}
                  >
                    {sig.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Cryptographic Audit Ledger Seal */}
          <section className="p-4 bg-black/60 border border-white/[0.08] rounded-sm mt-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-status-resolved" />
                Ledger Chain Integrity
              </span>
              <span className="font-mono text-[9px] text-status-resolved font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED
              </span>
            </div>
            <p className="font-mono text-[10px] text-slate-500 leading-relaxed mb-2">
              SHA-256 genesis anchor intact. Tamper detection verified across all state transitions.
            </p>
            <div className="font-mono text-[9px] text-slate-400 bg-black p-2 border border-white/5 rounded-sm truncate">
              Head: 8f2a41d9e205c8b74a...
            </div>
          </section>
        </aside>

        {/* Center Stage (6 Cols): Beast-Level 3D WebGL Command Center */}
        <main className="col-span-12 lg:col-span-6 bg-black relative flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <CommandCenter3DGraph
              events={events}
              incident={activeIncident}
              selectedNodeId={selectedNode}
              onSelectNode={setSelectedNode}
            />
          </div>

          {/* Bottom Telemetry Ticker */}
          <div className="h-10 bg-[#080C14]/90 border-t border-white/[0.08] px-4 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-severity-critical" />
                Compromised: <strong className="text-white">admin_corp</strong>
              </span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Attacker IP: <strong className="text-white">185.44.12.99</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                FPS: 60 | WebGL: ACTIVE
              </span>
            </div>
          </div>
        </main>

        {/* Right Wing (3 Cols): Evidence Feed & Automated Staging Deck */}
        <aside className="col-span-12 lg:col-span-3 bg-[#080C14] flex flex-col overflow-y-auto p-5 gap-5 border-l border-white/[0.08]">
          {/* Section: Forensic Evidence Timeline */}
          <section className="p-4 bg-black/60 border border-white/[0.08] rounded-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                Forensic Sequence (4 Events)
              </span>
              <span className="font-mono text-[9px] text-slate-600">CHRONO</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto pr-1">
              {MOCK_EVIDENCE.map((ev, idx) => {
                const isPivot = ev.outcome === 'SUCCESS';
                return (
                  <div
                    key={ev.hash}
                    className={`p-3 rounded-sm border transition-all duration-150 ${
                      isPivot
                        ? 'bg-severity-critical/10 border-severity-critical/40'
                        : 'bg-black/40 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9px] text-slate-500">
                        STEP {idx + 1} · {ev.timestamp.slice(11, 19)} UTC
                      </span>
                      <span
                        className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-sm ${
                          isPivot
                            ? 'bg-severity-critical text-white'
                            : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        {isPivot ? 'PIVOT SUCCESS' : 'SPRAY FAIL'}
                      </span>
                    </div>

                    <div className="font-mono text-xs font-bold text-white truncate">
                      {ev.user}
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-slate-400">
                      <span>{ev.ip}</span>
                      <span className="text-slate-600">{ev.hash}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section: MITRE ATT&CK Mapping */}
          <section className="p-4 bg-black/60 border border-white/[0.08] rounded-sm">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Fingerprint className="w-3 h-3 text-amber-500" />
              MITRE ATT&CK Matrix
            </span>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-2 bg-black/40 border border-white/5 rounded-sm">
                <div className="text-[10px] text-slate-500">T1110.003</div>
                <div className="text-white font-bold">Password Spraying</div>
              </div>
              <div className="p-2 bg-black/40 border border-white/5 rounded-sm">
                <div className="text-[10px] text-slate-500">T1078.004</div>
                <div className="text-white font-bold">Valid Cloud/VPN Accounts</div>
              </div>
            </div>
          </section>

          {/* Section: Sovereign Export Deck */}
          <section className="p-4 bg-black/60 border border-white/[0.08] rounded-sm">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Download className="w-3 h-3 text-slate-400" />
              Intelligence Bundle Export
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => window.open(`/api/v1/export/stix?incidentId=${incidentId}`, '_blank')}
                className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm font-mono text-[10px] text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                STIX 2.1
              </button>
              <button
                onClick={() => window.open(`/api/v1/export/csv?incidentId=${incidentId}`, '_blank')}
                className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm font-mono text-[10px] text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3 h-3" />
                CSV BUNDLE
              </button>
            </div>
          </section>
        </aside>
      </div>
    </motion.div>
  );
};
