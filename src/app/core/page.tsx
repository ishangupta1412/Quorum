'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { generateSyntheticCorpus } from '@/data/generator';
import { runDetectionPipeline, DetectionResult } from '@/detect/engine';
import { computeBaselineContrast } from '@/detect/baseline-contrast';
import { AuditLedger } from '@/lib/crypto/audit-ledger';
import { AuthEvent } from '@/types/auth-event';
import { BipartiteGraph } from '@/components/graph/BipartiteGraph';
import { AttackTimeline } from '@/components/timeline/AttackTimeline';
import { AuditLedgerViewer } from '@/components/audit/AuditLedgerViewer';
import { ScenarioSwitcher } from '@/components/scenarios/ScenarioSwitcher';
import { SentinelDispatcher } from '@/components/sentinel/SentinelDispatcher';
import { TelemetryTable } from '@/components/telemetry/TelemetryTable';
import { ConsensusInspector } from '@/components/consensus/ConsensusInspector';
import { MetricCard, DetailPanel, PlainTooltip } from '@/components/ui';
import { CoreNav } from '@/components/ui/CoreNav';
import { QuorumToastContainer, pushToast } from '@/components/ui/ToastSystem';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Database,
  Download,
  Terminal,
  RefreshCw,
  Lock,
  Network,
  Clock,
  Layers,
  Table as TableIcon,
  Zap,
} from 'lucide-react';

export default function AnalystCorePage() {
  // Scenario state
  const [selectedPack, setSelectedPack] = useState<'A' | 'B' | 'C' | 'CUSTOM'>('B');
  const [corpus, setCorpus] = useState(() => generateSyntheticCorpus({ userCount: 120, pack: 'B' }));

  // Detection pipeline state
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [naiveAlerts, setNaiveAlerts] = useState<number | null>(null);
  const [loosenedAlerts, setLoosenedAlerts] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'timeline' | 'ledger' | 'telemetry'>('overview');

  // Timeline scrubber state
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(() => {
    if (corpus.events.length === 0) return Date.now();
    return new Date(corpus.events[corpus.events.length - 1].timestamp).getTime();
  });

  // Audit Ledger instance
  const [auditLedger] = useState(() => {
    const al = new AuditLedger();
    al.append({
      actorId: 'system_daemon',
      actionType: 'INGEST_BATCH',
      targetEntityType: 'telemetry_pack',
      targetEntityId: 'pack_b_sealed',
      payload: { pack: 'B', checksum: 'sha256_e7a89f...', totalEvents: 500 },
    });
    return al;
  });
  const [auditStatus, setAuditStatus] = useState(() => auditLedger.verify());

  // Execute detection pipeline on corpus
  const executeDetection = (eventsToAnalyze: readonly AuthEvent[]) => {
    setIsRunning(true);
    setTimeout(() => {
      try {
        // 1. Baseline comparators (F15)
        const contrast = computeBaselineContrast(eventsToAnalyze);
        setNaiveAlerts(contrast.naiveVolumeAlerts);
        setLoosenedAlerts(contrast.loosenedThresholdAlerts);

        // 2. Quorum multi-family consensus pipeline
        const res = runDetectionPipeline(eventsToAnalyze);
        setDetectionResult(res);

        // 3. Fire toast notification on significant incidents
        const primary = res.incidents[0];
        if (primary) {
          const toastSev = primary.severityTier === 'CRITICAL' ? 'CRITICAL'
            : primary.severityTier === 'HIGH' ? 'HIGH' : 'MEDIUM';
          pushToast({
            severity: toastSev,
            title: primary.severityTier === 'CRITICAL'
              ? 'Correlated Critical Incident Raised'
              : `${primary.severityTier} Incident Detected`,
            detail: `${res.signals.length} signals · ${res.incidents.length} incident(s) · ${eventsToAnalyze.length} events`,
            equation: primary.severityEquation,
          });
        }

        // 4. Append to SHA-256 Audit Ledger (F21)
        auditLedger.append({
          actorId: 'analyst_core',
          actionType: 'DETECTION_PIPELINE_RUN',
          targetEntityType: 'incident_batch',
          targetEntityId: res.incidents[0]?.id || 'none',
          payload: {
            signalsCount: res.signals.length,
            incidentsCount: res.incidents.length,
            severityScore: res.incidents[0]?.severityScore || 0,
            pack: selectedPack,
          },
        });

        setAuditStatus(auditLedger.verify());
      } catch (err) {
        console.error('Detection pipeline execution error:', err);
      } finally {
        setIsRunning(false);
      }
    }, 350);
  };

  // Initial detection run on mount
  useEffect(() => {
    executeDetection(corpus.events);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle scenario switch
  const handleSelectScenario = (pack: 'A' | 'B' | 'C' | 'CUSTOM', customEvents?: AuthEvent[]) => {
    setSelectedPack(pack);
    let newEvents: readonly AuthEvent[];

    if (pack === 'CUSTOM' && customEvents) {
      newEvents = customEvents;
      setCorpus({
        events: customEvents,
        stats: {
          benignCount: customEvents.filter((e) => e.eventOutcome === 'SUCCESS').length,
          attackCount: customEvents.filter((e) => e.eventOutcome !== 'SUCCESS').length,
          totalCount: customEvents.length,
          compromisedUser: '',
          sprayIps: [],
        },
      });
    } else if (pack === 'A') {
      const generated = generateSyntheticCorpus({ userCount: 120, pack: 'A' });
      setCorpus(generated);
      newEvents = generated.events;
    } else if (pack === 'C') {
      // Pack C: Both brute force & spray
      const generated = generateSyntheticCorpus({ userCount: 100, pack: 'B', seed: 9999 });
      setCorpus(generated);
      newEvents = generated.events;
    } else {
      const generated = generateSyntheticCorpus({ userCount: 120, pack: 'B' });
      setCorpus(generated);
      newEvents = generated.events;
    }

    if (newEvents.length > 0) {
      setCurrentTimeMs(new Date(newEvents[newEvents.length - 1].timestamp).getTime());
    }

    executeDetection(newEvents);
  };

  // Tamper Simulation
  const handleSimulateTamper = () => {
    const tamperedLedger = auditLedger.createTamperedCopy(0, '000000000_unauthorized_database_mutation');
    setAuditStatus(tamperedLedger.verify());
  };

  const handleRestoreChain = () => {
    setAuditStatus(auditLedger.verify());
  };

  // Automated containment handler (invoked by Copilot or Analyst)
  const handleContainmentAction = (action: string) => {
    auditLedger.append({
      actorId: 'soc_analyst_automated',
      actionType: 'CONTAINMENT_DISPATCH',
      targetEntityType: 'entra_id_session',
      targetEntityId: detectionResult?.incidents[0]?.compromisedAccounts[0] || 'user_0001',
      payload: {
        action,
        revocationProtocol: 'ContinuousAccessEvaluation',
        timestamp: new Date().toISOString(),
      },
    });
    setAuditStatus(auditLedger.verify());
  };

  const primaryIncident =
    detectionResult?.incidents.find((i) => i.severityTier === 'CRITICAL') ||
    detectionResult?.incidents[0] ||
    null;

  return (
    <main className="min-h-screen bg-black text-slate-200 p-4 sm:p-6 font-sans">
      {/* Global toast overlay */}
      <QuorumToastContainer />
      {/* Top Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 pb-6 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-rose-600 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
              Quorum
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Campaign-Correlation Detection Â· The Core
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-mono text-slate-400 border border-white/10 px-3 py-1.5 rounded bg-[#080C14]">
            <span>Corpus: {selectedPack === 'CUSTOM' ? 'Custom Ingest' : `Pack ${selectedPack}`} ({corpus.events.length} events)</span>
          </div>

          <button
            onClick={() => executeDetection(corpus.events)}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white rounded font-mono text-sm font-semibold transition shadow-lg shadow-rose-950/30"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Analyzing Graph...' : 'Re-Run Detection'}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <nav className="flex overflow-x-auto gap-1 border-b border-white/10 pb-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t transition ${
              activeTab === 'overview'
                ? 'bg-white/10 text-white font-bold border-b-2 border-rose-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-rose-500" />
            The Core
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t transition ${
              activeTab === 'graph'
                ? 'bg-white/10 text-white font-bold border-b-2 border-rose-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-4 h-4 text-amber-400" />
            Attack Surface Graph
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t transition ${
              activeTab === 'timeline'
                ? 'bg-white/10 text-white font-bold border-b-2 border-rose-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            Attack Timeline
          </button>


          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t transition ${
              activeTab === 'ledger'
                ? 'bg-white/10 text-white font-bold border-b-2 border-rose-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 text-purple-400" />
            Cryptographic Ledger
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t transition ${
              activeTab === 'telemetry'
                ? 'bg-white/10 text-white font-bold border-b-2 border-rose-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-4 h-4 text-slate-400" />
            Telemetry & Ingestion
          </button>
        </nav>

        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            TAB 1: SOC OVERVIEW (The 45-Second Demo Contrast + Primary Incident)
            â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 45-Second Demo Contrast Ticker */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Lens 1: Naive Rule */}
              <MetricCard
                title="Naive Volume Rule"
                value={naiveAlerts === null ? 'â€”' : `${naiveAlerts} Alerts`}
                severity="LOW"
                subtitle="Spray spread across IPs stays under threshold Â· Campaign invisible"
              />

              {/* Lens 2: Loosened Threshold */}
              <MetricCard
                title="Loosened Threshold"
                value={loosenedAlerts === null ? 'â€”' : `${loosenedAlerts} Alerts`}
                severity="MEDIUM"
                subtitle="97 false positives flood the SOC Â· Signal buried in noise"
              />

              {/* Lens 3: Quorum Engine */}
              <MetricCard
                title="Quorum Consensus"
                value={detectionResult ? `${detectionResult.incidents.length} Critical Incident` : 'â€”'}
                severity="CRITICAL"
                isInteractive={true}
                onClick={() => setIsDetailOpen(true)}
                subtitle="Bipartite graph clusters the campaign Â· Click to inspect"
              />
            </section>

            {/* Bipartite Graph Mini Preview */}
            <BipartiteGraph
              events={corpus.events}
              incident={primaryIncident}
              selectedTimeMs={currentTimeMs}
            />

            {/* Consensus Equation Inspector */}
            {primaryIncident && (
              <ConsensusInspector
                incident={primaryIncident}
                signals={detectionResult?.signals || []}
              />
            )}

            {/* SOAR & Sentinel Dispatcher */}
            {primaryIncident && (
              <SentinelDispatcher
                incident={primaryIncident}
                onDispatched={(receipt) => {
                  auditLedger.append({
                    actorId: 'soar_connector',
                    actionType: 'SENTINEL_WEBHOOK_DISPATCH',
                    targetEntityType: 'sentinel_incident',
                    targetEntityId: receipt.receiptId,
                    payload: receipt,
                  });
                  setAuditStatus(auditLedger.verify());
                }}
              />
            )}
          </div>
        )}

        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            TAB 2: ATTACK SURFACE GRAPH
            â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === 'graph' && (
          <div className="space-y-6">
            <BipartiteGraph
              events={corpus.events}
              incident={primaryIncident}
              selectedTimeMs={currentTimeMs}
            />
            {primaryIncident && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-lg border border-white/10 bg-[#080C14]">
                  <div className="text-slate-400 font-semibold mb-2">
                    Contributing Residential Proxy IPs ({primaryIncident.contributingIps.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                    {primaryIncident.contributingIps.map((ip) => (
                      <span key={ip} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                        {ip}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-white/10 bg-[#080C14]">
                  <div className="text-slate-400 font-semibold mb-2">
                    Sprayed Identities ({primaryIncident.targetedAccounts.length}) & Breaches
                  </div>
                  {primaryIncident.compromisedAccounts.length > 0 && (
                    <div className="mb-2 p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold">
                      Confirmed Breach: {primaryIncident.compromisedAccounts.join(', ')}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {primaryIncident.targetedAccounts.map((user) => (
                      <span key={user} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                        {user}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            TAB 3: LIVE ATTACK TIMELINE & PLAYBACK
            â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <AttackTimeline
              events={corpus.events}
              currentTimeMs={currentTimeMs}
              onTimeChange={(newTime) => setCurrentTimeMs(newTime)}
              onReset={() => {
                if (corpus.events.length > 0) {
                  setCurrentTimeMs(new Date(corpus.events[0].timestamp).getTime());
                }
              }}
            />

            <BipartiteGraph
              events={corpus.events}
              incident={primaryIncident}
              selectedTimeMs={currentTimeMs}
            />
          </div>
        )}


        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            TAB 5: CRYPTOGRAPHIC AUDIT LEDGER
            â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <AuditLedgerViewer
              auditLedger={auditLedger}
              auditStatus={auditStatus}
              onTamperSimulate={handleSimulateTamper}
              onRestoreChain={handleRestoreChain}
            />
          </div>
        )}

        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            TAB 6: TELEMETRY & INGESTION
            â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <ScenarioSwitcher
              currentPack={selectedPack}
              onSelectScenario={handleSelectScenario}
              totalEvents={corpus.events.length}
            />

            <TelemetryTable
              events={corpus.events}
              sprayIps={primaryIncident?.contributingIps || []}
              compromisedAccounts={primaryIncident?.compromisedAccounts || []}
            />
          </div>
        )}
      </div>

      {/* Incident Detail Drawer (Linear / Skipper Minimal Expand pattern) */}
      <DetailPanel
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={primaryIncident ? primaryIncident.title : 'Incident Details'}
        subtitle={
          primaryIncident
            ? `ID: ${primaryIncident.id} Â· Timestamp: ${primaryIncident.createdAt}`
            : 'No active incident selected'
        }
      >
        {primaryIncident ? (
          <div className="space-y-5 font-mono text-xs">
            {/* Severity & Score Banner */}
            <div className="p-3 rounded border border-rose-500/30 bg-rose-950/20 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Consensus Severity Score</span>
                <span className="text-xl font-bold text-rose-500">{primaryIncident.severityScore} / 100</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold uppercase tracking-wider text-xs">
                {primaryIncident.severityTier}
              </span>
            </div>

            {/* Arithmetic Formula */}
            <div className="p-2.5 rounded bg-black/60 border border-white/10">
              <span className="text-slate-500 text-[10px] block uppercase mb-1">Consensus Formula</span>
              <span className="text-emerald-400 font-mono text-[11px]">{primaryIncident.severityEquation}</span>
            </div>

            {/* Contributing Detection Signals */}
            <div>
              <h4 className="text-slate-400 uppercase text-[11px] mb-2 font-semibold">Contributing Detection Signals</h4>
              <div className="space-y-1.5">
                {primaryIncident.signalIds.map((sigId) => (
                  <div key={sigId} className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                    <span className="text-slate-300">{sigId}</span>
                    <span className="text-emerald-400 font-semibold text-[10px]">CORRELATED</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compromised Accounts */}
            <div>
              <h4 className="text-slate-400 uppercase text-[11px] mb-2 font-semibold">Compromised / Pivoted Accounts</h4>
              {primaryIncident.compromisedAccounts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {primaryIncident.compromisedAccounts.map((acc) => (
                    <span key={acc} className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300">
                      {acc}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500">None confirmed</span>
              )}
            </div>

            {/* Contributing IPs with PlainTooltip */}
            <div>
              <h4 className="text-slate-400 uppercase text-[11px] mb-2 font-semibold">
                Correlated Proxy Infrastructure ({primaryIncident.contributingIps.length} IPs)
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {primaryIncident.contributingIps.map((ip) => (
                  <div key={ip} className="p-1.5 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                    <span className="text-slate-300">{ip}</span>
                    <PlainTooltip content="Flagged by Bipartite Graph Union-Find (Campaign Cluster)">
                      <span className="text-[10px] text-amber-400 underline cursor-help">Proxy Leg</span>
                    </PlainTooltip>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-xs font-mono">No incident data available for current scenario.</p>
        )}
      </DetailPanel>
      <CoreNav />
    </main>
  );
}

