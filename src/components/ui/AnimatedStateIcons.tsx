'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, Loader2, ShieldAlert, XCircle } from 'lucide-react';

export type IncidentState = 'critical' | 'open' | 'staged' | 'analyzing' | 'resolved' | 'closed';

const STATE_CONFIG: Record<IncidentState, {
  icon: React.ElementType;
  color: string;
  label: string;
  pulse: boolean;
}> = {
  critical:  { icon: ShieldAlert,   color: '#DC2626', label: 'CRITICAL',  pulse: true  },
  open:      { icon: AlertTriangle, color: '#EF4444', label: 'OPEN',      pulse: true  },
  staged:    { icon: Clock,         color: '#F59E0B', label: 'STAGED',    pulse: false },
  analyzing: { icon: Loader2,       color: '#64748B', label: 'ANALYZING', pulse: false },
  resolved:  { icon: CheckCircle2,  color: '#10B981', label: 'RESOLVED',  pulse: false },
  closed:    { icon: XCircle,       color: '#334155', label: 'CLOSED',    pulse: false },
};

export function AnimatedStateIcon({
  state,
  showLabel = false,
  size = 16,
}: {
  state: IncidentState;
  showLabel?: boolean;
  size?: number;
}) {
  const cfg = STATE_CONFIG[state];
  const Icon = cfg.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        exit={{   scale: 0.6, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className="flex items-center gap-1.5"
      >
        <div className="relative flex items-center justify-center" style={{ width: size + 12, height: size + 12 }}>
          {cfg.pulse && (
            <motion.div
              className="absolute rounded-full"
              style={{ background: cfg.color, width: size + 10, height: size + 10 }}
              animate={{ scale: [1, 1.7, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <Icon
            style={{ color: cfg.color, width: size, height: size }}
            className={`relative z-10 ${state === 'analyzing' ? 'animate-spin' : ''}`}
          />
        </div>
        {showLabel && (
          <span
            className="text-[9px] font-mono font-bold tracking-widest"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Composite animated icons (success spinner, lock toggle) ── */
export function SuccessIcon({ size = 40, color = '#10B981' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: size, height: size }}>
      <circle cx="20" cy="20" r="16" stroke={color} strokeWidth={2} opacity={0.3} />
      <motion.circle cx="20" cy="20" r="16" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeDasharray="80 20"
        animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '20px 20px' }}
      />
      <motion.path d="M12 20l6 6 10-12" stroke={color} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
    </svg>
  );
}
