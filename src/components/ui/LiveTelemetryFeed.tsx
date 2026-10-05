'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AuthEvent } from '@/types/auth-event';

interface Props {
  events: AuthEvent[];
  maxVisible?: number;
  className?: string;
}

function outcomeColor(o: string) {
  return o === 'SUCCESS' ? '#10B981' : '#EF4444';
}

function timeFmt(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return ts.slice(11, 19);
  }
}

function ipAnon(ip: string) {
  // Last octet redacted for display
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  return ip;
}

export function LiveTelemetryFeed({ events, maxVisible = 40, className }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  // Auto-scroll when new events arrive, only if already at bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !atBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [events.length]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const visible = events.slice(-maxVisible);

  return (
    <div className={`flex flex-col overflow-hidden ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.15em]">
            Live Telemetry Feed
          </span>
        </div>
        <span className="text-[9px] font-mono text-slate-700">
          {events.length} events
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[72px_110px_130px_64px] gap-x-2 px-3 py-1.5 border-b border-white/[0.04] flex-shrink-0">
        {['TIME', 'SRC IP', 'ACCOUNT', 'OUTCOME'].map((h) => (
          <span key={h} className="text-[8px] font-mono text-slate-700 uppercase tracking-widest">
            {h}
          </span>
        ))}
      </div>

      {/* Scroll body */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        <AnimatePresence initial={false}>
          {visible.map((e, i) => {
            const color = outcomeColor(e.eventOutcome);
            const isNew = i === visible.length - 1;
            return (
              <motion.div
                key={e.eventHash ?? `${e.timestamp}_${i}`}
                initial={isNew ? { opacity: 0, y: -6 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-[72px_110px_130px_64px] gap-x-2 px-3 py-[5px] border-b border-white/[0.025] hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-[9px] font-mono text-slate-600 tabular-nums">
                  {timeFmt(e.timestamp)}
                </span>
                <span className="text-[9px] font-mono text-slate-400 truncate">
                  {ipAnon(e.srcIp)}
                </span>
                <span className="text-[9px] font-mono text-slate-400 truncate">
                  {e.userName}
                </span>
                <span
                  className="text-[9px] font-mono font-bold tracking-wider"
                  style={{ color }}
                >
                  {e.eventOutcome === 'SUCCESS' ? 'OK' : 'FAIL'}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {visible.length === 0 && (
          <div className="flex items-center justify-center h-24">
            <span className="text-[10px] font-mono text-slate-700">
              Awaiting telemetry stream…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
