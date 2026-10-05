'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { LiveGraphNode, LiveGraphLink } from '@/lib/live/state';

interface Props {
  nodes: LiveGraphNode[];
  links: LiveGraphLink[];
  width?: number;
  height?: number;
  className?: string;
}

// ── Colour palette ──────────────────────────────────────────────────────────
const NODE_COLORS = {
  ip: {
    normal:  { fill: '#1E3A5F', stroke: 'rgba(100,116,139,0.4)', glow: 'rgba(100,116,139,0.0)' },
    spray:   { fill: '#7C1010', stroke: '#EF4444',               glow: 'rgba(239,68,68,0.5)'   },
    pivot:   { fill: '#5C0A0A', stroke: '#DC2626',               glow: 'rgba(220,38,38,0.7)'   },
  },
  user: {
    normal:  { fill: '#0D1220', stroke: 'rgba(100,116,139,0.3)', glow: 'rgba(100,116,139,0.0)' },
    spray:   { fill: '#714208', stroke: '#F59E0B',               glow: 'rgba(245,158,11,0.5)'  },
    pivot:   { fill: '#5C0A0A', stroke: '#DC2626',               glow: 'rgba(220,38,38,0.8)'   },
  },
};

const LINK_COLORS = {
  FAILURE: 'rgba(239,68,68,0.25)',
  SUCCESS: 'rgba(16,185,129,0.3)',
};

// ── Simple force-simulation (no D3 dependency) ─────────────────────────────
interface SimNode extends LiveGraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

function initSim(nodes: LiveGraphNode[], w: number, h: number): SimNode[] {
  return nodes.map((n) => ({
    ...n,
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    r: n.type === 'ip' ? Math.min(6 + n.degree * 0.7, 18) : Math.min(5 + n.degree * 0.5, 14),
  }));
}

function tickSim(sim: SimNode[], links: LiveGraphLink[], w: number, h: number) {
  const alpha = 0.04;
  const cx = w / 2;
  const cy = h / 2;
  const byId = new Map<string, SimNode>(sim.map((n) => [n.id, n]));

  // Link attraction
  for (const link of links) {
    const s = byId.get(link.source);
    const t = byId.get(link.target);
    if (!s || !t) continue;
    const dx = t.x - s.x;
    const dy = t.y - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const target = 80;
    const force = ((dist - target) / dist) * alpha * 0.6;
    s.vx += dx * force;
    s.vy += dy * force;
    t.vx -= dx * force;
    t.vy -= dy * force;
  }

  // Node repulsion
  for (let i = 0; i < sim.length; i++) {
    for (let j = i + 1; j < sim.length; j++) {
      const a = sim[i];
      const b = sim[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist2 = dx * dx + dy * dy || 1;
      const minDist = (a.r + b.r) * 3;
      if (dist2 < minDist * minDist) {
        const dist = Math.sqrt(dist2);
        const force = (minDist - dist) / dist * 0.5;
        a.vx -= dx * force * alpha;
        a.vy -= dy * force * alpha;
        b.vx += dx * force * alpha;
        b.vy += dy * force * alpha;
      }
    }
  }

  // Gravity to centre
  for (const n of sim) {
    n.vx += (cx - n.x) * alpha * 0.03;
    n.vy += (cy - n.y) * alpha * 0.03;

    // IP nodes left, user nodes right
    const targetX = n.type === 'ip' ? w * 0.35 : w * 0.65;
    n.vx += (targetX - n.x) * alpha * 0.04;

    // Damping
    n.vx *= 0.88;
    n.vy *= 0.88;

    n.x += n.vx;
    n.y += n.vy;

    // Boundary
    n.x = Math.max(n.r + 4, Math.min(w - n.r - 4, n.x));
    n.y = Math.max(n.r + 4, Math.min(h - n.r - 4, n.y));
  }
}

// ── Render ──────────────────────────────────────────────────────────────────
export function LiveBipartiteCanvas({ nodes, links, width = 600, height = 420, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<SimNode[]>([]);
  const rafRef = useRef<number>(0);
  const nodesRef = useRef(nodes);
  const linksRef = useRef(links);

  nodesRef.current = nodes;
  linksRef.current = links;

  // Sync sim nodes when upstream list changes
  useEffect(() => {
    const existing = new Map<string, SimNode>(simRef.current.map((n) => [n.id, n]));
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : width;
    const h = canvas ? canvas.height : height;

    simRef.current = nodes.map((n) => {
      const ex = existing.get(n.id);
      if (ex) {
        // Update status/degree but keep position
        return { ...ex, status: n.status, degree: n.degree, r: n.type === 'ip' ? Math.min(6 + n.degree * 0.7, 18) : Math.min(5 + n.degree * 0.5, 14) };
      }
      return {
        ...n,
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        r: n.type === 'ip' ? Math.min(6 + n.degree * 0.7, 18) : Math.min(5 + n.degree * 0.5, 14),
      };
    });
  }, [nodes, width, height]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const sim = simRef.current;
    const lks = linksRef.current;

    // Tick physics
    tickSim(sim, lks, w, h);

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Faint column separators
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Column labels
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(100,116,139,0.35)';
    ctx.textAlign = 'center';
    ctx.fillText('SOURCE IPs', w * 0.25, 16);
    ctx.fillText('TARGET ACCOUNTS', w * 0.75, 16);
    ctx.textAlign = 'left';

    const byId = new Map<string, SimNode>(sim.map((n) => [n.id, n]));

    // Draw links
    for (const link of lks) {
      const s = byId.get(link.source);
      const t = byId.get(link.target);
      if (!s || !t) continue;

      ctx.strokeStyle = LINK_COLORS[link.outcome];
      ctx.lineWidth = link.outcome === 'SUCCESS' ? 1.5 : 0.8;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);

      // Curved line
      const mx = (s.x + t.x) / 2;
      const my = (s.y + t.y) / 2 - 20;
      ctx.quadraticCurveTo(mx, my, t.x, t.y);
      ctx.stroke();
    }

    // Draw nodes
    for (const n of sim) {
      const palette = NODE_COLORS[n.type][n.status];

      // Glow for threat nodes
      if (n.status !== 'normal') {
        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
        gradient.addColorStop(0, palette.glow);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node body
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = palette.fill;
      ctx.fill();
      ctx.strokeStyle = palette.stroke;
      ctx.lineWidth = n.status === 'pivot' ? 2 : 1;
      ctx.stroke();

      // Shape indicator: IP = circle (done), User = square
      if (n.type === 'user') {
        const s = n.r * 0.7;
        ctx.strokeStyle = palette.stroke;
        ctx.lineWidth = 1;
        ctx.strokeRect(n.x - s, n.y - s, s * 2, s * 2);
      }

      // Label on hover-sized nodes
      if (n.r > 9) {
        ctx.font = `${Math.min(n.r * 0.7, 8)}px JetBrains Mono, monospace`;
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.textAlign = 'center';
        const label = n.label.length > 12 ? n.label.slice(0, 11) + '…' : n.label;
        ctx.fillText(label, n.x, n.y + n.r + 10);
        ctx.textAlign = 'left';
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
