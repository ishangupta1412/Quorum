'use client';

import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import type { SeverityTier } from '@/types/auth-event';

interface Props {
  score: number;          // 0–100
  tier: SeverityTier;
  equation?: string;
  status: 'BASELINE' | 'SPRAY' | 'PIVOT';
  className?: string;
}

const TIER_COLOR: Record<SeverityTier, string> = {
  LOW:      '#64748B',
  MEDIUM:   '#F59E0B',
  HIGH:     '#EF4444',
  CRITICAL: '#DC2626',
};

const STATUS_LABEL: Record<string, string> = {
  BASELINE: 'BASELINE',
  SPRAY:    'SPRAY DETECTED',
  PIVOT:    'PIVOT CONFIRMED',
};

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polarToCartesian(cx, cy, r, startDeg);
  const e = polarToCartesian(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function ConsensusMeter({ score, tier, equation, status, className }: Props) {
  const color = TIER_COLOR[tier] ?? '#64748B';

  // Spring-animate the score
  const springScore = useSpring(score, { stiffness: 60, damping: 18 });
  const deg = useTransform(springScore, [0, 100], [0, 270]);

  const cx = 100;
  const cy = 100;
  const r = 72;
  const startDeg = -135;
  const endDeg = 135;

  // Canvas tick marks
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 200, 200);

    // Tick marks
    for (let i = 0; i <= 10; i++) {
      const tickDeg = -135 + (270 / 10) * i;
      const rad = ((tickDeg - 90) * Math.PI) / 180;
      const r1 = 82;
      const r2 = i % 5 === 0 ? 90 : 86;
      ctx.beginPath();
      ctx.moveTo(cx + r1 * Math.cos(rad), cy + r1 * Math.sin(rad));
      ctx.lineTo(cx + r2 * Math.cos(rad), cy + r2 * Math.sin(rad));
      ctx.strokeStyle = i % 5 === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)';
      ctx.lineWidth = i % 5 === 0 ? 1.5 : 1;
      ctx.stroke();
    }
  }, []);

  return (
    <div className={`flex flex-col items-center gap-2 ${className ?? ''}`}>
      <div className="relative" style={{ width: 200, height: 200 }}>
        {/* Canvas for tick marks */}
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          className="absolute inset-0"
        />

        {/* SVG arcs */}
        <svg width={200} height={200} className="absolute inset-0">
          {/* Track */}
          <path
            d={arcPath(cx, cy, r, startDeg, endDeg)}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={8}
            strokeLinecap="round"
          />

          {/* Danger zone highlight (80–100 → 216–270 deg of the 270° arc) */}
          <path
            d={arcPath(cx, cy, r, startDeg + (270 * 0.8), endDeg)}
            fill="none"
            stroke="rgba(220,38,38,0.12)"
            strokeWidth={8}
            strokeLinecap="round"
          />
        </svg>

        {/* Animated fill arc */}
        <svg width={200} height={200} className="absolute inset-0">
          <motion.path
            d={arcPath(cx, cy, r, startDeg, endDeg)}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray="339.29"
            style={{
              pathLength: useTransform(springScore, [0, 100], [0, 1]),
              filter: `drop-shadow(0 0 6px ${color}80)`,
            }}
          />
        </svg>

        {/* Needle */}
        <svg width={200} height={200} className="absolute inset-0">
          <motion.line
            style={{
              rotate: useTransform(deg, (d) => `${d - 135}deg`),
              transformOrigin: '100px 100px',
            }}
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - 58}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* Needle centre dot */}
          <circle cx={cx} cy={cy} r={5} fill={color} />
        </svg>

        {/* Centre readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold font-mono tabular-nums"
            style={{ color, fontFamily: 'JetBrains Mono, monospace' }}
          >
            {Math.round(score)}
          </motion.span>
          <span
            className="text-[9px] font-mono tracking-[0.2em] uppercase mt-0.5"
            style={{ color }}
          >
            {tier}
          </span>
        </div>
      </div>

      {/* Status badge */}
      <div
        className="px-3 py-1 rounded-sm text-[9px] font-mono font-bold tracking-[0.15em] uppercase"
        style={{
          color,
          background: `${color}14`,
          border: `1px solid ${color}40`,
        }}
      >
        {STATUS_LABEL[status] ?? status}
      </div>

      {/* Equation */}
      {equation && (
        <div
          className="w-full px-3 py-2 rounded-sm text-[9px] font-mono leading-relaxed text-center"
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          {equation}
        </div>
      )}
    </div>
  );
}
