'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CobeGlobe } from '@/components/ui/CobeGlobe';
import { CoreNav } from '@/components/ui/CoreNav';
import { ConsensusMeter } from '@/components/ui/ConsensusMeter';
import { LiveBipartiteCanvas } from '@/components/ui/LiveBipartiteCanvas';
import { LiveTelemetryFeed } from '@/components/ui/LiveTelemetryFeed';
import { QuorumToastContainer, pushToast, useQuorumSound } from '@/components/ui/ToastSystem';
import { useLiveState } from '@/hooks/useLiveState';
import type { LiveStateSnapshot } from '@/lib/live/state';
import {
  AlertTriangle,
  Radio,
  Zap,
  Activity,
  Network,
  GitBranch,
  RotateCcw,
  Shield,
  Wifi,
  WifiOff,
} from 'lucide-react';

const EMPTY_SNAPSHOT: LiveStateSnapshot = {
  currentScore: 0,
  severityTier: 'LOW',
  status: 'BASELINE',
  clusters: [],
  lastPivot: null,
  reasoning: 'Awaiting telemetry…',
  events: [],
  totalEventsProcessed: 0,
  naiveAlerts: 0,
  loosenedAlerts: 0,
  stats: { total: 0, failed: 0, success: 0, uniqueIps: 0, uniqueUsers: 0 },
  graphNodes: [],
  graphLinks: [],
};

type ViewMode = 'globe' | 'graph' | 'telemetry';

// ── Tier colours ─────────────────────────────────────────────────────────────
function tierColor(tier: string) {
  if (tier === 'CRITICAL') return '#DC2626';
  if (tier === 'HIGH') return '#EF4444';
  if (tier === 'MEDIUM') return '#F59E0B';
  return '#64748B';
}

// ── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{label}</span>
      <span
        className="text-[10px] font-mono font-bold tabular-nums"
        style={{ color: color ?? '#CBD5E1' }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Crimson Pulse ring ────────────────────────────────────────────────────────
function CrimsonPulse({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <motion.div
        className="absolute inset-0 rounded-none border-2 border-[#DC2626]"
        animate={{ opacity: [0.1, 0.35, 0.1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NexusPage() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<LiveStateSnapshot>(EMPTY_SNAPSHOT);
  const [viewMode, setViewMode] = useState<ViewMode>('globe');
  const [zooming, setZooming] = useState(false);
  const [resetting, setResetting] = useState(false);

  const prevStatusRef = useRef<string>('BASELINE');
  const prevScoreRef  = useRef<number>(0);
  const { playAlert } = useQuorumSound();

  // ── Real-time state subscription (Supabase RT → HTTP poll fallback) ─────────
  const { transport, connected } = useLiveState({
    onUpdate: (partial) => {
      setSnapshot((prev) => {
        const merged: LiveStateSnapshot = { ...prev, ...(partial as LiveStateSnapshot) };

        const newStatus = merged.status;
        const newScore  = merged.currentScore;
        const oldStatus = prevStatusRef.current;
        const oldScore  = prevScoreRef.current;

        if (newStatus === 'PIVOT' && oldStatus !== 'PIVOT') {
          playAlert('CRITICAL');
          pushToast({
            severity: 'CRITICAL',
            title: 'Credential Pivot Confirmed',
            detail: merged.lastPivot
              ? `${merged.lastPivot.userName} authenticated from ${merged.lastPivot.srcIp}`
              : 'Pivot actor detected',
            equation: merged.reasoning,
          });
        } else if (newStatus === 'SPRAY' && oldStatus === 'BASELINE') {
          playAlert('HIGH');
          pushToast({
            severity: 'HIGH',
            title: 'Distributed Password Spray Detected',
            detail: `${merged.clusters.length} cluster(s) · ${merged.stats.uniqueIps} unique IPs → ${merged.stats.uniqueUsers} accounts`,
            equation: merged.reasoning,
          });
        } else if (newScore >= 80 && oldScore < 80) {
          playAlert('HIGH');
          pushToast({
            severity: 'HIGH',
            title: 'Consensus Score Breached Threshold',
            detail: `Score escalated to ${newScore} — ${merged.severityTier}`,
            equation: merged.reasoning,
          });
        } else if (newScore >= 50 && oldScore < 50) {
          playAlert('MEDIUM');
          pushToast({
            severity: 'MEDIUM',
            title: 'Elevated Activity Correlated',
            detail: `Consensus score ${newScore} — bipartite clustering active`,
          });
        }

        prevStatusRef.current = newStatus;
        prevScoreRef.current  = newScore;
        return merged;
      });
    },
    onPivot: (pivotUser, pivotIp) => {
      // Secondary pivot hook — ensures Crimson Pulse fires even when RT delivers
      // the update before the status transition check runs
      pushToast({
        severity: 'CRITICAL',
        title: 'Credential Pivot — Real-time Alert',
        detail: `${pivotUser} authenticated from ${pivotIp}`,
      });
    },
  });

  // ── Reset session ───────────────────────────────────────────────────────────

  const handleReset = async () => {
    setResetting(true);
    try {
      await fetch('/api/v1/live/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      setSnapshot(EMPTY_SNAPSHOT);
      prevStatusRef.current = 'BASELINE';
      prevScoreRef.current = 0;
      pushToast({ severity: 'INFO', title: 'Live Session Reset', detail: 'All state cleared. Awaiting new telemetry.' });
    } finally {
      setResetting(false);
    }
  };

  // ── Drill-in transition ─────────────────────────────────────────────────────
  const handleDrillIn = () => {
    setZooming(true);
    setTimeout(() => router.push('/core/analysis'), 900);
  };

  const color = tierColor(snapshot.severityTier);
  const isThreat = snapshot.status !== 'BASELINE';
  const eventsPerMin = snapshot.totalEventsProcessed
    ? Math.round((snapshot.stats.total / Math.max(1, snapshot.totalEventsProcessed)) * 60)
    : 0;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Global toast overlay */}
      <QuorumToastContainer />

      {/* Crimson pulse on threat */}
      <CrimsonPulse active={isThreat} />

      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',
          backgroundSize: '80px 80px',
          opacity: 0.6,
        }}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="relative z-10 border-b border-white/[0.05] px-6 h-14 flex items-center justify-between"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3">
          <Radio className="w-4 h-4 text-[#DC2626] animate-pulse" />
          <span className="font-mono font-bold text-white tracking-wider text-sm">QUORUM</span>
          <span className="text-[9px] font-mono text-slate-600 border border-white/[0.06] px-2 py-0.5 rounded-sm uppercase tracking-widest">
            Nexus — God View
          </span>
          {/* Live badge */}
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" />
            <span className="text-[9px] font-mono text-[#DC2626] tracking-widest uppercase">Live</span>
          </div>
          {/* Transport indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm border"
            style={{
              borderColor: transport === 'realtime' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.25)',
              background:  transport === 'realtime' ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
            }}
          >
            {transport === 'realtime'
              ? <Wifi className="w-2.5 h-2.5 text-[#10B981]" />
              : <WifiOff className="w-2.5 h-2.5 text-[#F59E0B]" />
            }
            <span
              className="text-[8px] font-mono tracking-widest uppercase font-bold"
              style={{ color: transport === 'realtime' ? '#10B981' : '#F59E0B' }}
            >
              {transport === 'connecting' ? 'connecting…' : transport}
            </span>
          </div>
        </div>


        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div
            className="flex items-center gap-0 border border-white/[0.06] rounded-sm overflow-hidden"
          >
            {([
              { id: 'globe', Icon: Activity, label: 'Globe' },
              { id: 'graph', Icon: Network, label: 'Graph' },
              { id: 'telemetry', Icon: GitBranch, label: 'Feed' },
            ] as { id: ViewMode; Icon: React.ElementType; label: string }[]).map(({ id, Icon, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest transition-all duration-150"
                style={{
                  color: viewMode === id ? '#fff' : '#475569',
                  background: viewMode === id ? 'rgba(255,255,255,0.06)' : 'transparent',
                }}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-slate-600 hover:text-slate-300 border border-white/[0.05] rounded-sm hover:border-white/[0.1] transition-all disabled:opacity-40"
          >
            <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
            Reset
          </button>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex h-[calc(100vh-3.5rem-4.5rem)]">
        {/* ── Centre pane ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex items-stretch relative overflow-hidden">
          {/* Drill-in overlay */}
          <AnimatePresence>
            {zooming && (
              <motion.div
                className="absolute inset-0 z-20 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ background: 'rgba(220,38,38,0.06)' }}
              >
                <motion.div
                  className="rounded-full border border-[#DC2626]/30"
                  initial={{ width: 0, height: 0, opacity: 1 }}
                  animate={{ width: '200vmax', height: '200vmax', opacity: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Globe view */}
          <AnimatePresence mode="wait">
            {viewMode === 'globe' && (
              <motion.div
                key="globe"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="w-[min(70vh,680px)]">
                  <CobeGlobe onClusterClick={handleDrillIn} className="w-full" />
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-700 tracking-widest uppercase"
                >
                  Click globe to drill into active campaign
                </motion.p>
              </motion.div>
            )}

            {/* Bipartite graph view */}
            {viewMode === 'graph' && (
              <motion.div
                key="graph"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1 relative"
              >
                <div className="absolute inset-0 p-4">
                  <div className="h-full border border-white/[0.05] rounded-sm overflow-hidden bg-black/40">
                    <div className="px-4 py-2 border-b border-white/[0.05] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Network className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                          Live Bipartite Graph
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[8px] font-mono text-slate-700">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#EF4444] inline-block opacity-70" />
                          Spray
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#DC2626] inline-block" />
                          Pivot
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#64748B] inline-block opacity-50" />
                          Normal
                        </span>
                      </div>
                    </div>
                    <div className="h-[calc(100%-36px)]">
                      <LiveBipartiteCanvas
                        nodes={snapshot.graphNodes}
                        links={snapshot.graphLinks}
                        width={900}
                        height={500}
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Telemetry feed view */}
            {viewMode === 'telemetry' && (
              <motion.div
                key="telemetry"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1 relative"
              >
                <div className="absolute inset-0 p-4">
                  <div className="h-full border border-white/[0.05] rounded-sm overflow-hidden bg-black/40">
                    <LiveTelemetryFeed
                      events={snapshot.events}
                      maxVisible={60}
                      className="h-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right sidebar ────────────────────────────────────────────────── */}
        <motion.aside
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-72 border-l border-white/[0.05] flex flex-col overflow-y-auto"
          style={{ background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(16px)' }}
        >
          {/* ── Consensus Meter ─────────────────────────────────────────────── */}
          <div className="p-4 border-b border-white/[0.05]">
            <p className="text-[9px] font-mono text-slate-700 uppercase tracking-[0.18em] mb-3">
              Consensus Score
            </p>
            <ConsensusMeter
              score={snapshot.currentScore}
              tier={snapshot.severityTier}
              equation={snapshot.reasoning}
              status={snapshot.status}
            />
          </div>

          {/* ── Live Stats ──────────────────────────────────────────────────── */}
          <div className="p-4 border-b border-white/[0.05]">
            <p className="text-[9px] font-mono text-slate-700 uppercase tracking-[0.18em] mb-2">
              Live Statistics
            </p>
            <div className="space-y-0">
              <StatPill label="Total Events" value={snapshot.stats.total.toLocaleString()} />
              <StatPill label="Failures" value={snapshot.stats.failed.toLocaleString()} color="#EF4444" />
              <StatPill label="Successes" value={snapshot.stats.success.toLocaleString()} color="#10B981" />
              <StatPill label="Unique IPs" value={snapshot.stats.uniqueIps} color="#F59E0B" />
              <StatPill label="Unique Accounts" value={snapshot.stats.uniqueUsers} />
              <StatPill
                label="Naive Alerts"
                value={snapshot.naiveAlerts}
                color={snapshot.naiveAlerts === 0 ? '#10B981' : '#F59E0B'}
              />
              <StatPill
                label="Threshold Alerts"
                value={snapshot.loosenedAlerts}
                color={snapshot.loosenedAlerts > 10 ? '#EF4444' : '#64748B'}
              />
            </div>
          </div>

          {/* ── Active Clusters ─────────────────────────────────────────────── */}
          <div className="p-4 border-b border-white/[0.05] flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-mono text-slate-700 uppercase tracking-[0.18em]">
                Active Clusters
              </p>
              {snapshot.clusters.length > 0 && (
                <span
                  className="text-[8px] font-mono px-1.5 py-0.5 rounded-sm"
                  style={{
                    color,
                    background: `${color}18`,
                    border: `1px solid ${color}30`,
                  }}
                >
                  {snapshot.clusters.length}
                </span>
              )}
            </div>

            {snapshot.clusters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <Shield className="w-6 h-6 text-slate-800" />
                <p className="text-[9px] font-mono text-slate-700">No clusters detected</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {snapshot.clusters.map((c, i) => {
                    const clScore = Math.min(100, Math.round((c.ipCount * c.accountCount) / 2));
                    const clColor = clScore >= 80 ? '#DC2626' : clScore >= 50 ? '#F59E0B' : '#64748B';
                    return (
                      <motion.button
                        key={c.clusterId}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={handleDrillIn}
                        className="w-full text-left p-2.5 rounded-sm border border-white/[0.05] bg-[#080C14] hover:border-white/[0.1] hover:bg-[#0D1220] transition-all group"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <div>
                            <p className="text-[10px] font-mono font-bold text-white">
                              C-{String(c.clusterId).padStart(3, '0')}
                            </p>
                            <p className="text-[8px] font-mono text-slate-600">
                              {c.ipCount} IPs → {c.accountCount} accounts
                            </p>
                          </div>
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm font-bold"
                            style={{ color: clColor, background: `${clColor}18`, border: `1px solid ${clColor}30` }}
                          >
                            {c.totalEvents}ev
                          </span>
                        </div>

                        {/* Score bar */}
                        <div className="h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: clColor, width: `${Math.min(100, (c.ipCount / 20) * 100)}%` }}
                          />
                        </div>

                        <div className="mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Zap className="w-2.5 h-2.5 text-[#DC2626]" />
                          <span className="text-[8px] font-mono text-[#DC2626]">Drill into Analysis →</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ── Pivot Record ────────────────────────────────────────────────── */}
          {snapshot.lastPivot && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border-t border-[#DC2626]/25"
              style={{ background: 'rgba(220,38,38,0.05)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                <span className="text-[9px] font-mono text-[#DC2626] uppercase tracking-[0.15em] font-bold">
                  Last Pivot
                </span>
              </div>
              <p className="text-[10px] font-mono text-white font-semibold">
                {snapshot.lastPivot.userName}
              </p>
              <p className="text-[9px] font-mono text-slate-500">
                from {snapshot.lastPivot.srcIp}
              </p>
              <p className="text-[8px] font-mono text-slate-700 mt-0.5">
                {new Date(snapshot.lastPivot.timestamp).toLocaleTimeString('en-US', { hour12: false })}
              </p>
            </motion.div>
          )}
        </motion.aside>
      </main>

      <CoreNav />
    </div>
  );
}
