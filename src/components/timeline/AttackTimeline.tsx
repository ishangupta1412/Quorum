'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AuthEvent } from '@/types/auth-event';
import { Play, Pause, RotateCcw, FastForward, SkipForward, Clock, AlertTriangle, ShieldCheck, ShieldAlert, Zap } from 'lucide-react';

interface AttackTimelineProps {
  events: readonly AuthEvent[];
  currentTimeMs: number;
  onTimeChange: (newTimeMs: number) => void;
  onReset: () => void;
}

export function AttackTimeline({
  events,
  currentTimeMs,
  onTimeChange,
  onReset,
}: AttackTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  const currentTimeRef = useRef<number>(currentTimeMs);
  currentTimeRef.current = currentTimeMs;

  // Bounds
  const { minTimeMs, maxTimeMs, buckets, pivotTimeMs, sprayStartTimeMs } = useMemo(() => {
    if (events.length === 0) {
      const now = Date.now();
      return { minTimeMs: now - 3600000, maxTimeMs: now, buckets: [], pivotTimeMs: null, sprayStartTimeMs: null };
    }

    const times = events.map((e) => new Date(e.timestamp).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);

    // Find spray start and pivot times
    let pivotTime: number | null = null;
    let sprayStart: number | null = null;

    for (const e of events) {
      const t = new Date(e.timestamp).getTime();
      if (e.srcIp.startsWith('203.0.113.')) {
        if (sprayStart === null || t < sprayStart) sprayStart = t;
        if (e.eventOutcome === 'SUCCESS') pivotTime = t;
      }
    }

    // 40 bucket histogram
    const bucketCount = 40;
    const bucketSize = (max - min) / bucketCount;
    const bList = Array.from({ length: bucketCount }, (_, i) => ({
      index: i,
      startMs: min + i * bucketSize,
      endMs: min + (i + 1) * bucketSize,
      benignCount: 0,
      sprayCount: 0,
      pivotCount: 0,
    }));

    for (const e of events) {
      const t = new Date(e.timestamp).getTime();
      const bIdx = Math.min(bucketCount - 1, Math.floor((t - min) / bucketSize));
      if (bIdx >= 0 && bIdx < bucketCount) {
        if (e.srcIp.startsWith('203.0.113.')) {
          if (e.eventOutcome === 'SUCCESS') bList[bIdx].pivotCount++;
          else bList[bIdx].sprayCount++;
        } else {
          bList[bIdx].benignCount++;
        }
      }
    }

    return {
      minTimeMs: min,
      maxTimeMs: max,
      buckets: bList,
      pivotTimeMs: pivotTime,
      sprayStartTimeMs: sprayStart,
    };
  }, [events]);

  // Current progress %
  const progressPercent = useMemo(() => {
    if (maxTimeMs <= minTimeMs) return 0;
    const p = ((currentTimeMs - minTimeMs) / (maxTimeMs - minTimeMs)) * 100;
    return Math.min(100, Math.max(0, p));
  }, [currentTimeMs, minTimeMs, maxTimeMs]);

  // Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTickRef.current = Date.now();

    const tick = () => {
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      lastTickRef.current = now;

      // Scale virtual time: 72 hours (259200000 ms) in ~30 seconds at 1x
      const virtualAdvanceMs = deltaMs * (playbackSpeed * 10000);
      const next = currentTimeRef.current + virtualAdvanceMs;

      if (next >= maxTimeMs) {
        setIsPlaying(false);
        onTimeChange(maxTimeMs);
      } else {
        onTimeChange(next);
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, maxTimeMs, onTimeChange]);

  const formatHoursFromStart = (timeMs: number) => {
    const diffHours = ((timeMs - minTimeMs) / 3600000).toFixed(1);
    return `+${diffHours}h`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);
    const newTime = minTimeMs + (percent / 100) * (maxTimeMs - minTimeMs);
    onTimeChange(newTime);
  };

  const jumpToSpray = () => {
    if (sprayStartTimeMs) {
      onTimeChange(sprayStartTimeMs);
    }
  };

  const jumpToPivot = () => {
    if (pivotTimeMs) {
      onTimeChange(pivotTimeMs);
    }
  };

  // Determine current phase
  const currentPhase = useMemo(() => {
    if (pivotTimeMs && currentTimeMs >= pivotTimeMs) {
      return {
        label: 'PHASE 3: COMPROMISE PIVOT',
        color: 'text-rose-500',
        desc: 'Attacker verified stolen password from residential IP. Critical breach confirmed.',
      };
    }
    if (sprayStartTimeMs && currentTimeMs >= sprayStartTimeMs) {
      return {
        label: 'PHASE 2: DISTRIBUTED SPRAY',
        color: 'text-amber-400',
        desc: 'Low-and-slow spray active across 12 proxy IPs. Traditional SIEM threshold blind.',
      };
    }
    return {
      label: 'PHASE 1: BENIGN BASELINE',
      color: 'text-slate-400',
      desc: 'Routine corporate VPN authentications with organic 2.5% user credential typos.',
    };
  }, [currentTimeMs, sprayStartTimeMs, pivotTimeMs]);

  return (
    <div className="rounded-lg border border-white/10 bg-[#080C14] p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-rose-500" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Attack Timeline Scrubber & Live Playback
            </h3>
            <p className="text-xs text-slate-400">
              Stepping through enterprise authentication telemetry over the 72-hour observation window
            </p>
          </div>
        </div>

        {/* Phase Pill */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono px-2.5 py-1 rounded border border-white/10 bg-[#04070C] font-semibold ${currentPhase.color}`}>
            {currentPhase.label}
          </span>
        </div>
      </div>

      {/* Histogram Bar Chart */}
      <div className="space-y-1">
        <div className="flex items-end gap-1 h-14 w-full bg-[#04070C] p-2 rounded border border-white/5">
          {buckets.map((b) => {
            const total = b.benignCount + b.sprayCount + b.pivotCount;
            const isCurrent = currentTimeMs >= b.startMs && currentTimeMs <= b.endMs;
            const hasPivot = b.pivotCount > 0;
            const hasSpray = b.sprayCount > 0;

            const heightPct = Math.min(100, Math.max(12, total * 6));

            let barColor = 'bg-slate-700/60';
            if (hasPivot) barColor = 'bg-rose-600 animate-pulse';
            else if (hasSpray) barColor = 'bg-amber-500/80';

            return (
              <div
                key={b.index}
                className="flex-1 flex flex-col justify-end h-full relative group cursor-pointer"
                onClick={() => onTimeChange(b.startMs)}
                title={`Events: ${total} (Spray: ${b.sprayCount}, Pivot: ${b.pivotCount})`}
              >
                <div
                  className={`w-full rounded-t-sm transition-all ${barColor} ${isCurrent ? 'ring-1 ring-white' : ''}`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Scrubber slider */}
        <div className="relative pt-1">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progressPercent}
            onChange={handleSeek}
            className="w-full accent-rose-600 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs font-mono text-slate-300 mt-1">
            <span>T = 0.0h (Start)</span>
            {sprayStartTimeMs && (
              <span className="text-amber-400 cursor-pointer hover:underline" onClick={jumpToSpray}>
                Spray Active ({formatHoursFromStart(sprayStartTimeMs)})
              </span>
            )}
            {pivotTimeMs && (
              <span className="text-rose-400 font-bold cursor-pointer hover:underline" onClick={jumpToPivot}>
                Pivot Breach ({formatHoursFromStart(pivotTimeMs)})
              </span>
            )}
            <span>T = +72.0h (End)</span>
          </div>
        </div>
      </div>

      {/* Control Buttons & Timestamp readout */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded font-mono text-xs font-semibold transition"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause Simulation' : 'Play Live Simulation'}
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded font-mono text-xs text-slate-300 transition"
            title="Reset to Start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          {/* Speed Buttons */}
          <div className="flex rounded border border-white/10 bg-black p-0.5 text-xs font-mono">
            {[1, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-2 py-0.5 rounded transition ${playbackSpeed === s ? 'bg-white/20 text-white font-bold' : 'text-slate-300 hover:text-slate-300'}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Jump shortcuts */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={jumpToSpray}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-amber-400 transition"
          >
            <Zap className="w-3 h-3" />
            Jump to Spray (t=24h)
          </button>
          <button
            onClick={jumpToPivot}
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded text-rose-400 font-bold transition"
          >
            <ShieldAlert className="w-3 h-3" />
            Jump to Pivot Breach (t=28h)
          </button>
        </div>
      </div>
    </div>
  );
}
