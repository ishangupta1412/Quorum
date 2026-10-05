'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CoreNav } from '@/components/ui/CoreNav';
import { ExpandMap } from '@/components/ui/ExpandMap';
import { EncryptButton } from '@/components/ui/EncryptButton';
import { Search, CheckCircle2, AlertTriangle, Hash, Lock, Terminal } from 'lucide-react';
import { RawEvidenceModal } from '@/components/ui/RawEvidenceModal';
import { soundEngine } from '@/lib/sound/audio-cues';
import { Incident } from '@/types/auth-event';

/* ── Deterministic hash chain ───────────────────────────────────────── */
const LEDGER_BLOCKS = [
  { index: 0, type: 'GENESIS',         actor: 'system',          detail: 'Corpus generated: 1247 events, pack B',        hash: 'a1b2c3d4e5f67890abcd1234ef567890abcd1234ef567890abcd1234ef567890', prev: '0000000000000000000000000000000000000000000000000000000000000000' },
  { index: 1, type: 'PIPELINE_RUN',    actor: 'engine',          detail: 'Detection pipeline executed — 3 detectors',    hash: 'b2c3d4e5f67890abcd1234ef567890abcd1234ef567890abcd1234ef56789001', prev: 'a1b2c3d4e5f67890abcd1234ef567890abcd1234ef567890abcd1234ef567890' },
  { index: 2, type: 'CLUSTER_FORMED',  actor: 'graph-detector',  detail: '12 IPs → 47 accounts, cluster C-001 sealed',   hash: 'c3d4e5f67890abcd1234ef567890abcd1234ef567890abcd1234ef5678900112', prev: 'b2c3d4e5f67890abcd1234ef567890abcd1234ef567890abcd1234ef56789001' },
  { index: 3, type: 'PIVOT_CONFIRMED', actor: 'pivot-detector',  detail: 'AUTH_SUCCESS from 10.0.4.7 — user_0034 compromised', hash: 'd4e5f67890abcd1234ef567890abcd1234ef567890abcd1234ef567890011223', prev: 'c3d4e5f67890abcd1234ef567890abcd1234ef567890abcd1234ef5678900112' },
  { index: 4, type: 'SCORE_SEALED',    actor: 'consensus',       detail: 'Score: 100 [CRITICAL]. Equation: 100×1.00+15',  hash: 'e5f67890abcd1234ef567890abcd1234ef567890abcd1234ef5678900112233', prev: 'd4e5f67890abcd1234ef567890abcd1234ef567890abcd1234ef567890011223' },
  { index: 5, type: 'EXPORT_SENTINEL', actor: 'analyst_01',      detail: 'Sentinel bundle exported, incident INC-2026-001', hash: 'f67890abcd1234ef567890abcd1234ef567890abcd1234ef56789001122334', prev: 'e5f67890abcd1234ef567890abcd1234ef567890abcd1234ef5678900112233' },
];

const TYPE_COLOR: Record<string, string> = {
  GENESIS:         '#64748B',
  PIPELINE_RUN:    '#64748B',
  CLUSTER_FORMED:  '#F59E0B',
  PIVOT_CONFIRMED: '#DC2626',
  SCORE_SEALED:    '#DC2626',
  EXPORT_SENTINEL: '#10B981',
};

const IP_HOPS = [
  { ip: '10.0.4.1',  location: 'Moscow, Russia',         coordinates: '55.7558° N, 37.6173° E',  hop: 1 },
  { ip: '10.0.4.7',  location: 'Frankfurt, Germany',      coordinates: '50.1109° N, 8.6821° E',   hop: 2 },
  { ip: '10.0.4.12', location: 'London, United Kingdom',  coordinates: '51.5074° N, 0.1278° W',   hop: 3 },
  { ip: '10.0.4.19', location: 'Singapore',               coordinates: '1.3521° N, 103.8198° E',  hop: 4 },
  { ip: '10.0.4.23', location: 'Seattle, WA',             coordinates: '47.6062° N, 122.3321° W', hop: 5, target: true },
];

const FORENSICS_INCIDENT: Incident = {
  id: 'INC-2026-F21',
  title: 'Audit Ledger Verified - Attack Vector Trace',
  severityScore: 100,
  severityTier: 'CRITICAL',
  severityEquation: 'Base 100 (F10_pivot) × 1.00 (GRAPH+PIVOT) + 15 -> 100 [CRITICAL]',
  familiesPresent: ['GRAPH', 'PIVOT', 'STATISTICAL'],
  signalIds: ['sig_graph_f7', 'sig_pivot_f10', 'sig_brute_f5'],
  contributingIps: ['10.0.4.1', '10.0.4.7', '10.0.4.12', '10.0.4.19', '10.0.4.23'],
  targetedAccounts: ['user_0034', 'user_0012', 'admin_corp'],
  compromisedAccounts: ['user_0034'],
  status: 'OPEN',
  createdAt: '2026-10-03T23:58:01Z',
};

export default function ForensicsPage() {
  const [tampered, setTampered] = useState(false);
  const [tamperedIndex, setTamperedIndex] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);

  const simulateTamper = () => {
    setTampered(true);
    setTamperedIndex(3); // block 3 gets tampered
    setVerified(false);
    soundEngine.playThreatAlert();
  };

  const verifyChain = () => {
    setVerified(true);
    if (tampered) {
      soundEngine.playThreatAlert();
    } else {
      soundEngine.playDispatchSound();
    }
  };

  const containerV = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
  const cardV = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

  return (
    <div className="min-h-screen bg-black text-white pb-20 pl-[72px]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.05] px-6 h-14 flex items-center gap-3"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}>
        <Search className="w-4 h-4 text-[#F59E0B]" />
        <span className="font-mono font-bold text-white tracking-wider text-sm">QUORUM</span>
        <span className="text-xs font-mono text-slate-400 border border-white/[0.06] px-2 py-0.5 rounded-sm uppercase tracking-widest">Forensics — Truth View</span>
      </header>

      <div className="max-w-7xl mx-auto px-5 py-5">
        <motion.div variants={containerV} initial="hidden" animate="visible" className="grid grid-cols-12 gap-4">

          {/* ── IP Geo Tracker ─── col-span 8 */}
          <motion.div variants={cardV} className="col-span-12 lg:col-span-8 p-5 rounded-sm border border-white/[0.06] bg-[#080C14]">
            <div className="mb-5">
              <p className="text-xs font-mono text-slate-400 uppercase tracking-[0.18em]">IP Geographic Tracker</p>
              <p className="text-sm font-semibold text-white mt-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Campaign C-001 — Proxy chain reconstruction
              </p>
            </div>

            {/* Hop chain */}
            <div className="relative">
              {IP_HOPS.map((hop, i) => (
                <div key={hop.ip} className="flex items-start gap-4 mb-4 last:mb-0">
                  {/* Connector */}
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold"
                      style={{
                        background: hop.target ? '#DC2626' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${hop.target ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        color: hop.target ? '#fff' : '#64748B',
                        boxShadow: hop.target ? '0 0 16px rgba(220,38,38,0.5)' : 'none',
                      }}>
                      {hop.hop}
                    </div>
                    {i < IP_HOPS.length - 1 && (
                      <div className="w-px flex-1 mt-1 mb-1 min-h-4"
                        style={{ background: 'linear-gradient(180deg, rgba(220,38,38,0.3), rgba(245,158,11,0.3))' }} />
                    )}
                  </div>

                  {/* ExpandMap + info */}
                  <div className="flex-1 flex items-start gap-4">
                    <ExpandMap
                      ip={hop.ip}
                      location={hop.location}
                      coordinates={hop.coordinates}
                      className="flex-shrink-0"
                    />
                    <div className="pt-1 space-y-1">
                      <p className="text-xs font-semibold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{hop.location}</p>
                      <p className="text-xs font-mono text-slate-400">{hop.coordinates}</p>
                      {hop.target && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-xs font-mono px-2 py-0.5 rounded-sm text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/25 font-bold tracking-widest uppercase">Target VPN</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-sm text-[#10B981] bg-[#10B981]/8 border border-[#10B981]/20 tracking-widest uppercase">AUTH_SUCCESS</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Right column ──── col-span 4 */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Route summary */}
            <motion.div variants={cardV} className="p-5 rounded-sm border border-white/[0.06] bg-[#080C14]">
              <p className="text-xs font-mono text-slate-400 uppercase tracking-[0.18em] mb-3">Route Summary</p>
              {[
                { label: 'Hop Count',   value: '5',      color: '#F59E0B' },
                { label: 'Countries',   value: '5',      color: '#64748B' },
                { label: 'Final Target',value: 'SEA-VPN', color: '#DC2626' },
                { label: 'Pivoted',     value: 'YES',    color: '#DC2626' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-xs font-mono text-slate-400">{s.label}</span>
                  <span className="text-xs font-mono font-bold" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </motion.div>

            {/* Tamper test */}
            <motion.div variants={cardV} className="p-5 rounded-sm border border-white/[0.06] bg-[#080C14]">
              <p className="text-xs font-mono text-slate-400 uppercase tracking-[0.18em] mb-3">Ledger Integrity</p>
              <div className="flex flex-col gap-2">
                <EncryptButton text="SIMULATE TAMPER" variant="ghost" onClick={simulateTamper} className="w-full justify-center text-xs py-2.5" showIcon={false} />
                <EncryptButton text="VERIFY CHAIN" variant={tampered ? 'primary' : 'ghost'} onClick={verifyChain} className="w-full justify-center text-xs py-2.5" showIcon={false} />
              </div>
              {verified && tampered && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 rounded-sm border border-[#DC2626]/30 bg-[#DC2626]/8">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span className="text-xs font-mono text-[#DC2626] font-bold">Chain Compromised</span>
                  </div>
                  <p className="text-xs font-mono text-slate-300">Block #{tamperedIndex} hash mismatch detected. Record integrity cannot be guaranteed.</p>
                </motion.div>
              )}
              {verified && !tampered && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 rounded-sm border border-[#10B981]/30 bg-[#10B981]/8">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-xs font-mono text-[#10B981] font-bold">Chain Intact</span>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Intelligence & Interoperability */}
            <motion.div variants={cardV} className="p-5 rounded-sm border border-white/[0.06] bg-[#080C14]">
              <p className="text-xs font-mono text-slate-400 uppercase tracking-[0.18em] mb-3">Intelligence &amp; Interop</p>
              <button
                onClick={() => setIsRawModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm font-mono text-xs text-white transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Inspect STIX 2.1 &amp; Sentinel</span>
              </button>
            </motion.div>
          </div>

          {/* ── SHA-256 Hash Chain Visualization ── col-span 12 */}
          <motion.div variants={cardV} className="col-span-12 p-5 rounded-sm border border-white/[0.06] bg-[#080C14]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-mono text-slate-400 uppercase tracking-[0.18em]">SHA-256 Hash Chain</p>
                <p className="text-sm font-semibold text-white mt-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Audit Ledger — {LEDGER_BLOCKS.length} sealed blocks
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#10B981]" />
                <span className="text-xs font-mono text-[#10B981] tracking-widest">Cryptographic</span>
              </div>
            </div>

            <div className="space-y-2">
              {LEDGER_BLOCKS.map((block, i) => {
                const isTampered = tampered && i === tamperedIndex;
                const blockColor = isTampered ? '#DC2626' : TYPE_COLOR[block.type] ?? '#64748B';
                return (
                  <motion.div key={block.index}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="flex items-start gap-3 p-3 rounded-sm border transition-all duration-300"
                    style={{
                      borderColor: isTampered ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.05)',
                      background: isTampered ? 'rgba(220,38,38,0.06)' : '#0A0F1A',
                      boxShadow: isTampered ? '0 0 20px rgba(220,38,38,0.1)' : 'none',
                    }}
                  >
                    {/* Block index */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-sm border flex items-center justify-center"
                      style={{ borderColor: `${blockColor}30`, background: `${blockColor}12` }}>
                      <span className="text-xs font-mono font-bold" style={{ color: blockColor }}>{block.index}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded-sm tracking-widest"
                          style={{ color: blockColor, background: `${blockColor}14`, border: `1px solid ${blockColor}25` }}>
                          {block.type}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{block.actor}</span>
                        {isTampered && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="text-xs font-mono px-1.5 py-0.5 rounded-sm bg-[#DC2626]/20 border border-[#DC2626]/40 text-[#DC2626] font-bold">
                            TAMPERED
                          </motion.span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-1.5">{block.detail}</p>
                      <div className="flex items-center gap-2">
                        <Hash className="w-2.5 h-2.5 text-slate-700 flex-shrink-0" />
                        <span className="text-xs font-mono text-slate-700 truncate">{block.hash}</span>
                      </div>
                    </div>

                    {/* Chain connector */}
                    {i < LEDGER_BLOCKS.length - 1 && (
                      <div className="absolute left-[calc(1.25rem+8px)] mt-10 w-px h-6 bg-white/[0.04]" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

        </motion.div>
      </div>

      <RawEvidenceModal
        isOpen={isRawModalOpen}
        onClose={() => setIsRawModalOpen(false)}
        incident={FORENSICS_INCIDENT}
      />
      <CoreNav />
    </div>
  );
}
