'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type SimMode = 'BASELINE' | 'SPRAY' | 'PIVOT' | 'RESET';

interface DotConfig {
  mode: SimMode;
  color: string;
  label: string;
  description: string;
}

const DOTS: DotConfig[] = [
  { mode: 'BASELINE', color: '#10B981', label: 'Baseline', description: 'Benign enterprise traffic' },
  { mode: 'SPRAY',    color: '#F59E0B', label: 'Spray',    description: 'Bipartite password spray' },
  { mode: 'PIVOT',    color: '#DC2626', label: 'Pivot',    description: 'Credential pivot — breach' },
  { mode: 'RESET',    color: '#3B82F6', label: 'Reset',    description: 'Wipe engine state' },
];

interface ControlBarProps {
  currentMode?: SimMode | string | null;
  onModeChange?: (mode: SimMode) => void;
}

export function ControlBar({ currentMode, onModeChange }: ControlBarProps) {
  const [internalMode, setInternalMode] = useState<SimMode | null>(() => {
    if (currentMode && ['BASELINE', 'SPRAY', 'PIVOT'].includes(currentMode.toUpperCase())) {
      return currentMode.toUpperCase() as SimMode;
    }
    return null;
  });
  const [loading, setLoading] = useState<SimMode | null>(null);
  const [tooltip, setTooltip] = useState<SimMode | null>(null);
  const [lastResult, setLastResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Sync with upstream live state if changed
  useEffect(() => {
    if (currentMode) {
      const norm = currentMode.toUpperCase() as SimMode;
      if (['BASELINE', 'SPRAY', 'PIVOT'].includes(norm)) {
        setInternalMode(norm);
      } else if (norm === 'RESET') {
        setInternalMode(null);
      }
    }
  }, [currentMode]);

  const activeMode = internalMode;

  const trigger = useCallback(
    async (mode: SimMode) => {
      if (loading) return;
      setLoading(mode);
      setLastResult(null);
      try {
        const res = await fetch('/api/v1/live/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        });
        const json = await res.json();
        if (res.ok) {
          setInternalMode(mode === 'RESET' ? null : mode);
          setLastResult({ ok: true, msg: json.message ?? `${mode} activated` });
          onModeChange?.(mode);
        } else {
          setLastResult({ ok: false, msg: json.error ?? 'Trigger failed' });
        }
      } catch {
        setLastResult({ ok: false, msg: 'Network error' });
      } finally {
        setLoading(null);
        setTimeout(() => setLastResult(null), 3500);
      }
    },
    [loading, onModeChange]
  );

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      <AnimatePresence>
        {lastResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-1.5 rounded text-xs font-mono font-bold tracking-wider shadow-lg"
            style={{
              color: lastResult.ok ? '#10B981' : '#EF4444',
              background: lastResult.ok ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
              border: `1px solid ${lastResult.ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            }}
          >
            {lastResult.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-6 px-6 py-3.5 rounded-full border border-white/[0.14]"
        style={{
          background: 'rgba(8,12,20,0.92)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 12px 40px rgba(0,0,0,0.7)',
        }}
      >
        <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-[0.2em] select-none mr-0.5">
          SIM CTRL
        </span>
        <div className="w-px h-5 bg-white/[0.12]" />

        {DOTS.map(({ mode, color, label, description }) => {
          const isActive = activeMode === mode;
          const isLoading = loading === mode;

          return (
            <div
              key={mode}
              className="relative flex flex-col items-center"
              onMouseEnter={() => setTooltip(mode)}
              onMouseLeave={() => setTooltip(null)}
            >
              <AnimatePresence>
                {tooltip === mode && (
                  <motion.div
                    key={`tip-${mode}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-3 whitespace-nowrap"
                    style={{ pointerEvents: 'none', zIndex: 60 }}
                  >
                    <div
                      className="px-3 py-2 rounded text-xs font-mono border"
                      style={{
                        background: 'rgba(8,12,20,0.98)',
                        borderColor: `${color}50`,
                        boxShadow: `0 0 16px ${color}35`,
                      }}
                    >
                      <p className="font-bold text-xs" style={{ color }}>{label}</p>
                      <p className="text-slate-300 text-xs mt-0.5">{description}</p>
                    </div>
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-1.5 h-1.5 rotate-45 border-b border-r"
                      style={{ background: 'rgba(8,12,20,0.98)', borderColor: `${color}50` }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                onClick={() => trigger(mode)}
                disabled={!!loading}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                className="relative flex items-center justify-center rounded-full cursor-pointer disabled:cursor-not-allowed overflow-visible"
                style={{
                  width: 22,
                  height: 22,
                  background: isActive ? color : `${color}33`,
                  border: `2px solid ${color}${isActive ? 'ff' : '88'}`,
                  boxShadow: isActive
                    ? `0 0 16px ${color}bb, 0 0 32px ${color}55`
                    : `0 0 6px ${color}33`,
                  opacity: loading && !isLoading ? 0.35 : 1,
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}
                aria-label={`Trigger ${label} mode`}
                id={`ctrl-dot-${mode.toLowerCase()}`}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `2px solid ${color}`, scale: 1.6, opacity: 0 }}
                    animate={{ scale: [1.3, 2.1], opacity: [0.6, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
                {isLoading && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `2px solid ${color}`, borderTopColor: 'transparent' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.65, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </motion.button>

              <span
                className="text-xs font-mono font-bold mt-1.5 uppercase tracking-wider transition-colors duration-200 select-none"
                style={{ color: isActive ? color : '#CBD5E1' }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
