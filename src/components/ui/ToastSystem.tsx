'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Zap, Shield, Radio } from 'lucide-react';
import { create } from 'zustand';
import { soundEngine } from '@/lib/sound/audio-cues';

export type ToastSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';

export interface QuorumToast {
  id: string;
  severity: ToastSeverity;
  title: string;
  detail: string;
  equation?: string;
  timestamp: string;
  autoDismiss?: number; // ms
}

interface ToastStore {
  toasts: QuorumToast[];
  push: (t: Omit<QuorumToast, 'id' | 'timestamp'>) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) =>
    set((s) => ({
      toasts: [
        ...s.toasts.slice(-4), // Keep max 5
        {
          ...t,
          id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
        },
      ],
    })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clearAll: () => set({ toasts: [] }),
}));

// Programmatic push helper (call from anywhere)
export const pushToast = (t: Omit<QuorumToast, 'id' | 'timestamp'>) =>
  useToastStore.getState().push(t);

// ────────────────────────────────────────────────────────────────────────────
// Individual Toast Card
// ────────────────────────────────────────────────────────────────────────────

const SEV_CONFIG: Record<
  ToastSeverity,
  { color: string; bg: string; border: string; Icon: React.ElementType; label: string }
> = {
  CRITICAL: {
    color: '#DC2626',
    bg: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.35)',
    Icon: AlertTriangle,
    label: 'CRITICAL INCIDENT',
  },
  HIGH: {
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.07)',
    border: 'rgba(239,68,68,0.28)',
    Icon: Zap,
    label: 'HIGH SEVERITY',
  },
  MEDIUM: {
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.25)',
    Icon: Radio,
    label: 'MEDIUM',
  },
  INFO: {
    color: '#64748B',
    bg: 'rgba(100,116,139,0.06)',
    border: 'rgba(100,116,139,0.2)',
    Icon: Shield,
    label: 'INFO',
  },
};

function ToastCard({ toast }: { toast: QuorumToast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const cfg = SEV_CONFIG[toast.severity];
  const { Icon } = cfg;

  // Auto-dismiss
  useEffect(() => {
    const ms = toast.autoDismiss ?? (toast.severity === 'CRITICAL' ? 12000 : 7000);
    const t = setTimeout(() => dismiss(toast.id), ms);
    return () => clearTimeout(t);
  }, [toast.id, toast.severity, toast.autoDismiss, dismiss]);

  return (
    <motion.div
      layout
      initial={{ x: 420, opacity: 0, scale: 0.92 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 420, opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      className="relative w-[340px] rounded-sm overflow-hidden"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Left severity bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: cfg.color }}
      />

      {/* Scan-line shimmer for CRITICAL */}
      {toast.severity === 'CRITICAL' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${cfg.color}0A 50%, transparent 100%)`,
          }}
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <div className="pl-4 pr-3 py-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.color }} />
            <span
              className="text-xs font-mono font-bold tracking-[0.15em] uppercase"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              {new Date(toast.timestamp).toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-slate-700 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Title */}
        <p
          className="text-xs font-semibold text-white leading-snug"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          {toast.title}
        </p>

        {/* Detail */}
        <p className="text-xs font-mono text-slate-400 mt-0.5 leading-relaxed">
          {toast.detail}
        </p>

        {/* Equation chip */}
        {toast.equation && (
          <div
            className="mt-2 px-2 py-1 rounded-sm text-xs font-mono leading-relaxed"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: cfg.color,
            }}
          >
            {toast.equation}
          </div>
        )}

        {/* Progress drain bar */}
        <div className="mt-2.5 h-[2px] bg-white/[0.05] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: cfg.color, transformOrigin: 'left' }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{
              duration: (toast.autoDismiss ?? (toast.severity === 'CRITICAL' ? 12000 : 7000)) / 1000,
              ease: 'linear',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sound Design Hook (Web Audio API — no external assets)
// ────────────────────────────────────────────────────────────────────────────
export function useQuorumSound() {
  const playAlert = useCallback((severity: ToastSeverity) => {
    if (soundEngine.isMuted()) return;
    if (severity === 'CRITICAL') {
      soundEngine.playPivotChime();
    } else if (severity === 'HIGH') {
      soundEngine.playThreatAlert();
    } else {
      soundEngine.playDispatchSound();
    }
  }, []);

  return { playAlert };
}

// ────────────────────────────────────────────────────────────────────────────
// Toast Container (mount in layout or top-level page)
// ────────────────────────────────────────────────────────────────────────────
export function QuorumToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none"
      style={{ maxWidth: '340px' }}
    >
      <AnimatePresence mode="sync">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
