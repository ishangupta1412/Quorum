'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CoreNav } from '@/components/ui/CoreNav';
import { EncryptButton } from '@/components/ui/EncryptButton';
import { AnimatedStateIcon, type IncidentState } from '@/components/ui/AnimatedStateIcons';
import { Shield, CheckCircle2, ChevronRight, Terminal } from 'lucide-react';
import { RawEvidenceModal } from '@/components/ui/RawEvidenceModal';
import { soundEngine } from '@/lib/sound/audio-cues';
import { Incident } from '@/types/auth-event';

/* ── Deterministic synthetic data ───────────────────────────────────── */
const EVIDENCE_ROWS = [
  { id: 'EV-001', ip: '10.0.4.1',  user: 'user_0034', event: 'AUTH_FAILURE', ts: '2026-10-03T22:14:07Z', state: 'critical' as IncidentState },
  { id: 'EV-002', ip: '10.0.4.7',  user: 'user_0012', event: 'AUTH_FAILURE', ts: '2026-10-03T22:14:09Z', state: 'critical' as IncidentState },
  { id: 'EV-003', ip: '10.0.4.12', user: 'user_0067', event: 'AUTH_FAILURE', ts: '2026-10-03T22:14:11Z', state: 'open'     as IncidentState },
  { id: 'EV-004', ip: '10.0.4.19', user: 'user_0089', event: 'AUTH_FAILURE', ts: '2026-10-03T22:14:14Z', state: 'staged'   as IncidentState },
  { id: 'EV-005', ip: '10.0.4.7',  user: 'user_0034', event: 'AUTH_SUCCESS', ts: '2026-10-03T23:58:01Z', state: 'critical' as IncidentState },
  { id: 'EV-006', ip: '10.0.4.23', user: 'user_0099', event: 'AUTH_FAILURE', ts: '2026-10-03T22:14:18Z', state: 'analyzing' as IncidentState },
];

const FAMILIES = [
  { id: 'graph',  label: 'Campaign Graph', score: 100, color: '#DC2626' },
  { id: 'pivot',  label: 'Pivot Detector', score: 100, color: '#EF4444' },
  { id: 'volume', label: 'Brute Force',    score: 0,   color: '#64748B' },
];

/* ── Failure spike chart data (28 points) ───────────────────────────── */
const SPIKE_DATA = [
  2,1,3,2,1,2,3,2,1,2,3,4,8,18,42,67,89,95,88,71,54,38,22,14,8,5,3,2
];

function FailureSpikeChart() {
  const max = Math.max(...SPIKE_DATA);
  const W = 400; const H = 80;
  const pts = SPIKE_DATA.map((v, i) => {
    const x = (i / (SPIKE_DATA.length - 1)) * W;
    const y = H - (v / max) * H;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 80 }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="spk-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Fill area */}
        <motion.polygon
          points={`0,${H} ${pts} ${W},${H}`}
          fill="url(#spk-fill)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        />
        {/* Line */}
        <motion.polyline
          points={pts}
          fill="none"
          stroke="#DC2626"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(220,38,38,0.7))' }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Spike marker */}
        <circle cx={(14 / (SPIKE_DATA.length - 1)) * W} cy={H - (95 / max) * H} r="3" fill="#DC2626"
          style={{ filter: 'drop-shadow(0 0 6px rgba(220,38,38,1))' }} />
      </svg>
      {/* X labels */}
      <div className="flex justify-between mt-1 px-0.5">
        {['22:00','22:15','22:30','22:45','23:00'].map(t => (
          <span key={t} className="text-xs font-mono text-slate-700">{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Consensus gauge (vertical) ─────────────────────────────────────── */
function ConsensusGauge({ score, families }: { score: number; families: typeof FAMILIES }) {
  return (
    <div className="flex flex-col items-center gap-4 h-full">
      {/* Gauge */}
      <div className="relative w-10 flex-1 max-h-48 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
        <motion.div
          className="absolute bottom-0 left-0 right-0 rounded-full"
          style={{ background: score >= 80 ? '#DC2626' : score >= 50 ? '#F59E0B' : '#64748B', boxShadow: '0 0 16px rgba(220,38,38,0.5)' }}
          initial={{ height: '0%' }}
          animate={{ height: `${score}%` }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Tick marks */}
        {[25, 50, 75].map(t => (
          <div key={t} className="absolute w-full border-t border-white/[0.06]" style={{ bottom: `${t}%` }} />
        ))}
      </div>

      {/* Score */}
      <div className="text-center">
        <p className="font-mono font-bold text-3xl" style={{ color: '#DC2626', textShadow: '0 0 20px rgba(220,38,38,0.5)' }}>{score}</p>
        <p className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider mt-0.5">score</p>
      </div>

      {/* Family agreement */}
      <div className="w-full space-y-2.5">
        {families.map(f => (
          <div key={f.id} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-slate-300 font-medium truncate">{f.label}</span>
              <span className="text-xs font-mono font-bold" style={{ color: f.color }}>{f.score}</span>
            </div>
            <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: f.color }}
                initial={{ width: 0 }} animate={{ width: `${f.score}%` }}
                transition={{ duration: 0.9, delay: 0.5 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ANALYSIS_INCIDENT: Incident = {
  id: 'INC-2026-F10',
  title: 'Distributed Password Spray with Account Pivot',
  severityScore: 100,
  severityTier: 'CRITICAL',
  severityEquation: 'Base 100 (F10_pivot) × 1.00 (GRAPH+PIVOT) + 15 -> 100 [CRITICAL]',
  familiesPresent: ['GRAPH', 'PIVOT'],
  signalIds: ['sig_graph_f7', 'sig_pivot_f10'],
  contributingIps: ['10.0.4.1', '10.0.4.7', '10.0.4.12', '10.0.4.19', '10.0.4.23'],
  targetedAccounts: ['user_0034', 'user_0012', 'user_0067', 'user_0089', 'user_0099'],
  compromisedAccounts: ['user_0034'],
  status: 'OPEN',
  createdAt: '2026-10-03T23:58:01Z',
};

/* ═══════════════════════════════════════════════════════════════════════ */
export default function AnalysisPage() {
  const [pivotFlash, setPivotFlash] = useState(false);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);

  // Simulate pivot detection trigger + procedural audio cue
  useEffect(() => {
    const timer = setTimeout(() => {
      setPivotFlash(true);
      soundEngine.playPivotChime();
    }, 2200);
    const reset = setTimeout(() => setPivotFlash(false), 4000);
    return () => { clearTimeout(timer); clearTimeout(reset); };
  }, []);

  const containerV = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
  const cardV = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden pb-20 relative pl-[72px]">
      {/* Pivot flash overlay */}
      {pivotFlash && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.08, 0.04, 0.08, 0] }}
          transition={{ duration: 1.8, times: [0, 0.2, 0.5, 0.7, 1] }}
          style={{ background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.4) 0%, transparent 70%)' }}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.08] px-6 h-14 flex items-center justify-between"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-[#DC2626]" />
          <span className="font-mono font-bold text-white tracking-wider text-base">QUORUM</span>
          <span className="text-xs font-mono font-semibold text-slate-200 border border-white/[0.12] px-2.5 py-0.5 rounded uppercase tracking-wider">Analysis — Tactical Triage</span>
        </div>
        {pivotFlash && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#DC2626]/40 bg-[#DC2626]/15">
            <div className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
            <span className="text-xs font-mono text-[#DC2626] font-bold tracking-wider uppercase">Pivot Detected</span>
          </motion.div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-5 py-5">
        <motion.div variants={containerV} initial="hidden" animate="visible"
          className="grid grid-cols-12 gap-4 auto-rows-min">

          {/* ── A: Severity equation ─── col-span 12 */}
          <motion.div variants={cardV} className="col-span-12 p-4 rounded-sm border border-white/[0.06] bg-[#080C14] flex flex-wrap items-center gap-2">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-[0.18em] mr-2">Consensus Equation</p>
            {[
              { text: 'Base 100',      s: { background:'rgba(220,38,38,0.12)', border:'1px solid rgba(220,38,38,0.2)', color:'#fff' } },
              { text: '(Pivot)',       s: { color:'#64748B' } },
              { text: '×',            s: { color:'#475569', fontSize:'1.1em' } },
              { text: '1.00',         s: { background:'rgba(245,158,11,0.1)',  border:'1px solid rgba(245,158,11,0.2)', color:'#F59E0B' } },
              { text: '(Graph+Pivot)',s: { color:'#64748B' } },
              { text: '+',            s: { color:'#475569' } },
              { text: '15',           s: { background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', color:'#10B981' } },
              { text: '→',            s: { color:'#475569' } },
              { text: '100 [CRITICAL]',s:{ color:'#DC2626', fontWeight:700, textShadow:'0 0 16px rgba(220,38,38,0.6)' } },
            ].map((t, i) => (
              <span key={i} className="font-mono text-xs px-2 py-0.5 rounded-sm" style={t.s}>{t.text}</span>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-xs font-mono text-[#10B981] tracking-widest">VERIFIED</span>
            </div>
          </motion.div>

          {/* ── B: Failure Spike Chart ── col-span 8 */}
          <motion.div variants={cardV} className="col-span-12 lg:col-span-8 p-5 rounded-sm border border-white/[0.06] bg-[#080C14]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-mono text-slate-400 uppercase tracking-[0.18em]">Auth Failure Rate</p>
                <p className="text-sm font-semibold text-white mt-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Campaign Window: 2026-10-03 22:00–23:00</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-0.5 rounded bg-[#DC2626]" style={{ boxShadow: '0 0 6px rgba(220,38,38,0.8)' }} />
                <span className="text-xs font-mono text-slate-400">Failure/min</span>
              </div>
            </div>
            <FailureSpikeChart />
          </motion.div>

          {/* ── C: Consensus Gauge ──── col-span 4 */}
          <motion.div variants={cardV} className="col-span-12 lg:col-span-4 p-5 rounded-sm border border-white/[0.06] bg-[#080C14]">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-[0.18em] mb-4">Consensus Meter</p>
            <ConsensusGauge score={100} families={FAMILIES} />
          </motion.div>

          {/* ── D: Evidence Stream ──── col-span 12 */}
          <motion.div variants={cardV} className="col-span-12 p-5 rounded-sm border border-white/[0.06] bg-[#080C14]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-mono text-slate-400 uppercase tracking-[0.18em]">Evidence Stream</p>
                <p className="text-sm font-semibold text-white mt-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{EVIDENCE_ROWS.length} events correlated</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRawModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inspect Evidence</span>
                </button>
                <button
                  onClick={() => setIsRawModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#DC2626]/20 hover:bg-[#DC2626]/30 border border-[#DC2626]/40 text-xs font-mono text-white transition-colors font-semibold"
                >
                  <span>EXPORT STIX 2.1</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    {['State','ID','Source IP','Account','Event','Timestamp','Action'].map(h => (
                      <th key={h} className="text-left pb-2 text-xs font-mono text-slate-400 uppercase tracking-[0.15em] pr-6 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EVIDENCE_ROWS.map((row, i) => {
                    const isPivot = row.event === 'AUTH_SUCCESS';
                    return (
                      <motion.tr key={row.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.07 }}
                        className="border-b border-white/[0.03] group"
                        style={{ background: isPivot ? 'rgba(220,38,38,0.06)' : 'transparent' }}
                      >
                        <td className="py-2.5 pr-6">
                          <AnimatedStateIcon state={row.state} showLabel />
                        </td>
                        <td className="py-2.5 pr-6">
                          <span className="text-xs font-mono text-slate-300">{row.id}</span>
                        </td>
                        <td className="py-2.5 pr-6">
                          <span className="text-xs font-mono text-[#EF4444]">{row.ip}</span>
                        </td>
                        <td className="py-2.5 pr-6">
                          <span className="text-xs font-mono text-amber-600">{row.user}</span>
                        </td>
                        <td className="py-2.5 pr-6">
                          <span className={`text-xs font-mono font-bold ${isPivot ? 'text-[#DC2626]' : 'text-slate-400'}`}>
                            {row.event}
                            {isPivot && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-sm bg-[#DC2626]/20 border border-[#DC2626]/30 text-[#DC2626]">PIVOT</span>}
                          </span>
                        </td>
                        <td className="py-2.5 pr-6">
                          <span className="text-xs font-mono text-slate-400">{row.ts.replace('T',' ').replace('Z','')}</span>
                        </td>
                        <td className="py-2.5">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <EncryptButton text="INSPECT" variant="ghost" className="text-xs py-1 px-3" showIcon={false} />
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* ── E: Campaign stats row ─ col-span 12 */}
          <motion.div variants={cardV} className="col-span-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Proxy IPs',      value: '12',    color: '#DC2626' },
              { label: 'Target Accounts',value: '47',    color: '#F59E0B' },
              { label: 'Spray Duration', value: '58m',   color: '#64748B' },
              { label: 'Pivot Confirmed',value: 'YES',   color: '#10B981' },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-sm border border-white/[0.05] bg-[#080C14] text-center">
                <p className="font-mono font-bold text-xl" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* ── F: Drill to Forensics ─ */}
          <motion.div variants={cardV} className="col-span-12 flex justify-end">
            <a href="/core/forensics"
              className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors tracking-widest uppercase border border-white/[0.05] hover:border-white/[0.12] px-4 py-2.5 rounded-sm bg-[#080C14]">
              Drill into Forensics
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>

        </motion.div>
      </div>

      <RawEvidenceModal
        isOpen={isRawModalOpen}
        onClose={() => setIsRawModalOpen(false)}
        incident={ANALYSIS_INCIDENT}
      />
      <CoreNav />
    </div>
  );
}
