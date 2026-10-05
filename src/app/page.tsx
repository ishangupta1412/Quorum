'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Shield, GitBranch, Activity, Layers, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import CyberMatrixHero from '@/components/ui/CyberMatrixHero';
import { EncryptButton } from '@/components/ui/EncryptButton';

/* ── Reveal hook ─────────────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('revealed'); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Animated counter ────────────────────────────────────────────────── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = React.useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let current = 0;
      const step = target / 55;
      const id = setInterval(() => {
        current += step;
        if (current >= target) { setVal(target); clearInterval(id); }
        else setVal(Math.floor(current));
      }, 20);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── Stagger variants ────────────────────────────────────────────────── */
const containerV = { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 1.2 } } };
const itemV = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

/* ── Phase data ──────────────────────────────────────────────────────── */
const phases = [
  { id: 'brute-force',      color: '#64748B', Icon: Shield,     label: 'Brute Force',     desc: 'Single-source volume burst detector. Triggers on > 20 failures from one IP in 5 min.' },
  { id: 'campaign-graph',   color: '#F59E0B', Icon: GitBranch,  label: 'Campaign Graph',  desc: 'Union-Find bipartite clustering. Correlates IP-to-Account edges across proxy legs.' },
  { id: 'pivot-detector',   color: '#EF4444', Icon: Activity,   label: 'Pivot Detector',  desc: 'Post-spray auth success from campaign IP within 4h. Confirms credential compromise.' },
  { id: 'consensus-engine', color: '#DC2626', Icon: Layers,     label: 'Consensus Engine', desc: 'Multi-family arithmetic. Score = Base × Multiplier + Bonus. Zero black boxes.' },
];

/* ── Contrast data ───────────────────────────────────────────────────── */
const contrasts = [
  { label: 'Naive Volume Rule',       desc: 'Threshold: ≥ 5 failures per IP in 15 min',  value: 0,  color: '#64748B', verdict: '0 Alerts — Attack Invisible', sub: 'Attackers capped each proxy at 3 attempts. The rule never fires. The campaign runs for 72 hours.' },
  { label: 'Loosened Threshold Rule', desc: 'Lowered to: ≥ 2 accounts per IP in 24h',    value: 97, color: '#F59E0B', verdict: '97 Alerts — SOC Alert Fatigue', sub: 'Organic login noise floods the queue. Analysts triage false positives while the real campaign hides.' },
  { label: 'Quorum Consensus Engine', desc: 'Bipartite graph + multi-family arithmetic', value: 1,  color: '#DC2626', verdict: '1 Correlated Critical Incident', sub: 'Base 100 × 1.00 (Graph+Pivot) + 15 → 100 [CRITICAL]. All proxy legs merged into one actionable incident.', winner: true },
];

/* ═══════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const contrastRef = useReveal();
  const archRef = useReveal();
  const statsRef = useReveal();
  const ctaRef = useReveal();

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05]"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-mono font-black text-white tracking-widest text-base">QUORUM</span>
          <div className="flex items-center gap-8">
            {['#contrast', '#architecture'].map(href => (
              <a key={href} href={href} className="text-sm font-mono text-slate-200 hover:text-white transition-colors tracking-widest uppercase font-semibold">
                {href.slice(1)}
              </a>
            ))}
            <Link href="/core" className="text-sm font-mono text-white hover:text-severity-critical transition-colors tracking-widest uppercase font-bold border border-white/10 px-3.5 py-1.5 rounded-sm bg-white/5 hover:border-severity-critical/50">
              The Core
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO — CyberMatrixHero + overlay CTA ────────────────────── */}
      <section className="relative">
        <CyberMatrixHero />
        {/* CTA floats over the hero */}
        <motion.div
          variants={containerV} initial="hidden" animate="visible"
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4"
        >
          <motion.div variants={itemV}>
            <Link href="/core">
              <EncryptButton text="ENTER THE CORE" variant="primary" className="px-12 py-4 text-sm font-bold tracking-wider" />
            </Link>
          </motion.div>
          <motion.a variants={itemV} href="#contrast"
            className="text-sm font-mono text-slate-200 hover:text-white transition-colors tracking-widest uppercase flex items-center gap-1.5 font-semibold">
            See the contrast
            <ChevronRight className="w-4 h-4" />
          </motion.a>
        </motion.div>
      </section>

      {/* ── THE CONTRAST ────────────────────────────────────────────── */}
      <section id="contrast" className="py-28 px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div ref={contrastRef} className="reveal text-center mb-16 space-y-3">
            <p className="text-sm font-mono text-slate-300 uppercase tracking-[0.2em] font-semibold">The Contrast</p>
            <h2 className="font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(2rem,4.8vw,3.4rem)' }}>
              Same Attack. <span style={{ color: '#DC2626' }}>Three Outcomes.</span>
            </h2>
            <p className="text-slate-200 text-base max-w-xl mx-auto">
              Midnight Blizzard-style spray across 12 residential proxy IPs, 47 target accounts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {contrasts.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: i * 0.12, ease: [0.22,1,0.36,1] }}
                viewport={{ once: true }}
                className="relative p-6 rounded-sm border bg-[#080C14] flex flex-col gap-5"
                style={{
                  borderColor: c.winner ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.06)',
                  boxShadow: c.winner ? '0 0 40px rgba(220,38,38,0.08)' : 'none',
                }}
              >
                {c.winner && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-mono font-bold px-3.5 py-1 rounded-sm bg-[#DC2626] text-white tracking-[0.15em] uppercase">
                    Flagship
                  </span>
                )}
                <div>
                  <p className="text-sm font-mono text-slate-200 uppercase tracking-[0.18em] mb-1 font-bold">{c.label}</p>
                  <p className="text-sm text-slate-300 font-medium">{c.desc}</p>
                </div>
                <div className="font-mono font-bold" style={{ color: c.color, fontSize: 'clamp(2.8rem,6vw,4.5rem)', lineHeight: 1 }}>
                  <Counter target={c.value} />
                </div>
                <div className="px-3.5 py-2.5 rounded-sm text-sm font-mono font-bold"
                  style={{ color: c.color, background: `${c.color}14`, border: `1px solid ${c.color}30` }}>
                  {c.verdict}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{c.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Equation strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }} viewport={{ once: true }}
            className="mt-10 border border-white/[0.08] bg-[#080C14] p-6 rounded-sm text-center space-y-4"
          >
            <p className="font-mono text-sm text-slate-200 uppercase tracking-[0.2em] font-bold">Quorum Consensus Equation</p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 font-mono text-base">
              {[
                { text: 'Base 100',      style: { background: 'rgba(220,38,38,0.14)', border: '1px solid rgba(220,38,38,0.3)', color: '#fff', fontWeight: 600 } },
                { text: '(Pivot)',        style: { color: '#94A3B8' } },
                { text: '×',             style: { color: '#64748B', fontSize: '1.2em' } },
                { text: '1.00',          style: { background: 'rgba(245,158,11,0.12)',  border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B', fontWeight: 600 } },
                { text: '(Graph+Pivot)', style: { color: '#94A3B8' } },
                { text: '+',             style: { color: '#64748B' } },
                { text: '15',            style: { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontWeight: 600 } },
                { text: '→',             style: { color: '#64748B' } },
                { text: '100 [CRITICAL]', style: { color: '#DC2626', fontWeight: 700, fontSize: '1.15em', textShadow: '0 0 20px rgba(220,38,38,0.5)' } },
              ].map((t, i) => (
                <span key={i} className="px-3 py-1.5 rounded-sm" style={t.style}>{t.text}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── ARCHITECTURE ─────────────────────────────────────────────── */}
      <section id="architecture" className="py-28 px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div ref={archRef} className="reveal text-center mb-16 space-y-3">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-[0.2em]">Detection Pipeline</p>
            <h2 className="font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(1.9rem,4.5vw,3.2rem)' }}>
              Four-Phase <span style={{ color: '#F59E0B' }}>Detection Plane</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.25),rgba(220,38,38,0.5),rgba(220,38,38,0.6),transparent)' }} />
            {phases.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22,1,0.36,1] }} viewport={{ once: true }}
                className="relative p-5 rounded-sm border bg-[#080C14] flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: `${p.color}20` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300 tracking-widest">{String(i + 1).padStart(2,'0')} / 04</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-sm tracking-widest"
                    style={{ color: p.color, background: `${p.color}14`, border: `1px solid ${p.color}28` }}>
                    {p.id}
                  </span>
                </div>
                <p.Icon className="w-5 h-5" style={{ color: p.color }} />
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{p.label}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bipartite graph preview */}
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }} viewport={{ once: true }}
            className="mt-10 p-6 border border-white/[0.05] bg-[#080C14] rounded-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-[0.18em]">Bipartite Graph</span>
              <div className="flex-1 h-px bg-white/[0.04]" />
              <span className="text-xs font-mono text-slate-300">Union-Find O(n·α(n))</span>
            </div>
            <div className="flex items-center justify-between gap-4 overflow-x-auto">
              <div className="space-y-1.5 shrink-0">
                <p className="text-xs font-mono text-slate-400 uppercase text-center mb-2">Proxy IPs</p>
                {['10.0.4.1','10.0.4.7','10.0.4.12','10.0.4.19','10.0.4.23'].map(ip => (
                  <div key={ip} className="text-xs font-mono px-2.5 py-1 rounded-sm bg-[#DC2626]/8 border border-[#DC2626]/20 text-red-400">{ip}</div>
                ))}
                <div className="text-xs font-mono text-slate-300 text-center">+7 more</div>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-20 h-px" style={{ background: `linear-gradient(90deg, rgba(220,38,38,${0.3+i*0.06}), rgba(245,158,11,${0.3+i*0.06}))` }} />
                ))}
                <p className="text-xs font-mono text-slate-700 mt-1">correlation edges</p>
              </div>
              <div className="space-y-1.5 shrink-0">
                <p className="text-xs font-mono text-slate-400 uppercase text-center mb-2">Target Accounts</p>
                {['user_0012','user_0034','user_0067','user_0089','user_0099'].map(u => (
                  <div key={u} className="text-xs font-mono px-2.5 py-1 rounded-sm bg-[#F59E0B]/8 border border-[#F59E0B]/20 text-amber-400">{u}</div>
                ))}
                <div className="text-xs font-mono text-slate-300 text-center">+42 more</div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.03]" />
              <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">Cluster: 12 IPs · 47 Accounts · 1 Incident</span>
              <div className="flex-1 h-px bg-white/[0.03]" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/[0.04]">
        <div ref={statsRef} className="reveal max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { target: 54,   suffix: '',   label: 'Tests Passing',           color: '#10B981' },
              { target: 1200, suffix: '+',  label: 'Events per Corpus Pack',  color: '#F59E0B' },
              { target: 100,  suffix: '%',  label: 'Explainable Arithmetic',  color: '#DC2626' },
              { target: 0,    suffix: '',   label: 'False Positives',         color: '#64748B' },
            ].map(s => (
              <div key={s.label} className="text-center space-y-2">
                <div className="font-mono font-bold" style={{ color: s.color, fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: 1 }}>
                  <Counter target={s.target} suffix={s.suffix} />
                </div>
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST PILLARS ────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { Icon: Lock,          color: '#10B981', title: 'SHA-256 Hash Chain',     desc: 'Every pipeline run sealed in a cryptographic ledger. Each block commits to the prior block\'s SHA-256 digest.' },
            { Icon: AlertTriangle, color: '#F59E0B', title: 'Tamper Detection',       desc: 'Simulate a database tamper in The Core. The verifier immediately pinpoints the corrupted record index.' },
            { Icon: CheckCircle2,  color: '#DC2626', title: 'Zero Black Boxes',       desc: 'Every severity score is a readable algebraic equation. No LLMs. No AI guesswork. Pure deterministic logic.' },
          ].map(c => (
            <motion.div key={c.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }} viewport={{ once: true }}
              className="p-5 rounded-sm border border-white/[0.05] bg-[#080C14] flex flex-col gap-3"
            >
              <c.Icon className="w-5 h-5" style={{ color: c.color }} />
              <h3 className="text-white text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{c.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="py-36 px-6 border-t border-white/[0.04]">
        <div ref={ctaRef} className="reveal max-w-2xl mx-auto text-center space-y-8">
          <h2 className="font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(2rem,5vw,3.5rem)' }}>
            Enter <span style={{ color: '#DC2626', textShadow: '0 0 40px rgba(220,38,38,0.4)' }}>The Core</span>
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Run the detection pipeline, scrub the 72-hour attack timeline, inspect the
            cryptographic audit ledger, and export Sentinel and STIX 2.1 bundles.
          </p>
          <Link href="/core">
            <EncryptButton text="ENTER THE CORE" variant="primary" className="px-12 py-4 text-xs" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono text-xs text-slate-300 uppercase tracking-[0.18em]">Quorum — Campaign-Correlation Detection</span>
          <div className="flex items-center gap-8">
            <Link href="/core" className="font-mono text-xs text-slate-300 hover:text-white transition-colors uppercase tracking-widest">The Core</Link>
            <a href="#architecture" className="font-mono text-xs text-slate-300 hover:text-white transition-colors uppercase tracking-widest">Architecture</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
