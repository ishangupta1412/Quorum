'use client';

import React, { useState } from 'react';
import { generateSyntheticCorpus } from '@/data/generator';
import { normalizeAuthEvent } from '@/normalize/normalizer';
import { AuthEvent } from '@/types/auth-event';
import { Database, FileText, Upload, Sparkles, Check } from 'lucide-react';

interface ScenarioSwitcherProps {
  currentPack: 'A' | 'B' | 'C' | 'CUSTOM';
  onSelectScenario: (pack: 'A' | 'B' | 'C' | 'CUSTOM', customEvents?: AuthEvent[]) => void;
  totalEvents: number;
}

export function ScenarioSwitcher({
  currentPack,
  onSelectScenario,
  totalEvents,
}: ScenarioSwitcherProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  const handleCustomIngest = () => {
    setCustomError(null);
    if (!customInput.trim()) {
      setCustomError('Please paste raw VPN telemetry lines or a JSON array.');
      return;
    }

    try {
      const parsedEvents: AuthEvent[] = [];

      // Check if JSON array
      if (customInput.trim().startsWith('[')) {
        const jsonList = JSON.parse(customInput.trim());
        if (!Array.isArray(jsonList)) throw new Error('Input must be a JSON array of objects.');

        for (const item of jsonList) {
          const norm = normalizeAuthEvent({
            rawTimestamp: item.timestamp || item.TimeGenerated || new Date().toISOString(),
            rawUser: item.user || item.userName || item.UserPrincipalName || 'unknown_user',
            rawIp: item.ip || item.srcIp || item.IPAddress || '198.51.100.1',
            rawOutcome: item.outcome || item.ResultType === '0' ? 'SUCCESS' : 'FAILURE_BAD_CREDENTIALS',
            sourceSystem: item.source || 'CustomIngest',
          });
          if (norm.event) parsedEvents.push(norm.event);
        }
      } else {
        // Line-by-line parsing (JSONL or CSV)
        const lines = customInput.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('{')) {
            const item = JSON.parse(trimmed);
            const norm = normalizeAuthEvent({
              rawTimestamp: item.timestamp || new Date().toISOString(),
              rawUser: item.user || item.userName || 'unknown',
              rawIp: item.ip || item.srcIp || '198.51.100.1',
              rawOutcome: item.outcome || 'FAILURE_BAD_CREDENTIALS',
              sourceSystem: 'CustomIngest',
            });
            if (norm.event) parsedEvents.push(norm.event);
          } else {
            // Simple CSV: timestamp,user,ip,outcome
            const parts = trimmed.split(',');
            if (parts.length >= 3) {
              const norm = normalizeAuthEvent({
                rawTimestamp: parts[0] || new Date().toISOString(),
                rawUser: parts[1] || 'user_demo',
                rawIp: parts[2] || '198.51.100.1',
                rawOutcome: parts[3] === 'SUCCESS' ? 'SUCCESS' : 'FAILURE_BAD_CREDENTIALS',
                sourceSystem: 'CustomCSV',
              });
              if (norm.event) parsedEvents.push(norm.event);
            }
          }
        }
      }

      if (parsedEvents.length === 0) {
        throw new Error('No valid authentication events could be parsed.');
      }

      onSelectScenario('CUSTOM' as any, parsedEvents);
      setIsCustomOpen(false);
    } catch (err: unknown) {
      setCustomError(err instanceof Error ? err.message : 'Invalid telemetry format.');
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[#080C14] p-4 space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Telemetry Corpus & Attack Scenario Selector
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Loaded Corpus: <strong className="text-white">{totalEvents} events</strong>
        </span>
      </div>

      {/* Scenario Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono">
        {/* Pack B */}
        <button
          onClick={() => onSelectScenario('B')}
          className={`p-3 rounded-lg border text-left transition ${
            currentPack === 'B'
              ? 'border-rose-500/60 bg-rose-950/20 ring-1 ring-rose-500/40'
              : 'border-white/10 bg-black/40 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-400">Pack B (Flagship)</span>
            {currentPack === 'B' && <Check className="w-3.5 h-3.5 text-rose-400" />}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Midnight Blizzard spray (12 IPs / 35 accounts) + post-spray pivot breach on user_0001.
          </p>
        </button>

        {/* Pack A */}
        <button
          onClick={() => onSelectScenario('A')}
          className={`p-3 rounded-lg border text-left transition ${
            currentPack === 'A'
              ? 'border-emerald-500/60 bg-emerald-950/20 ring-1 ring-emerald-500/40'
              : 'border-white/10 bg-black/40 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400">Pack A (Baseline)</span>
            {currentPack === 'A' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            100% benign enterprise traffic. Verifies ZERO false positives on Quorum engine.
          </p>
        </button>

        {/* Pack C */}
        <button
          onClick={() => onSelectScenario('C')}
          className={`p-3 rounded-lg border text-left transition ${
            currentPack === 'C'
              ? 'border-amber-500/60 bg-amber-950/20 ring-1 ring-amber-500/40'
              : 'border-white/10 bg-black/40 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400">Pack C (Multi-Vector)</span>
            {currentPack === 'C' && <Check className="w-3.5 h-3.5 text-amber-400" />}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Loud single-IP brute force decoy running simultaneously with a covert stealth spray.
          </p>
        </button>

        {/* Custom Ingest */}
        <button
          onClick={() => setIsCustomOpen(!isCustomOpen)}
          className={`p-3 rounded-lg border text-left transition ${
            currentPack === 'CUSTOM'
              ? 'border-cyan-500/60 bg-cyan-950/20 ring-1 ring-cyan-500/40'
              : 'border-white/10 bg-black/40 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-400 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              Custom Telemetry
            </span>
            {currentPack === 'CUSTOM' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Paste raw VPN auth JSON / CSV to test detection on your own live infrastructure logs.
          </p>
        </button>
      </div>

      {/* Custom Ingestion Modal / Drawer */}
      {isCustomOpen && (
        <div className="p-4 rounded-lg border border-cyan-500/30 bg-[#04070C] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold uppercase">Paste Raw Authentication Logs</span>
            <button onClick={() => setIsCustomOpen(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <textarea
            rows={5}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={`[
  { "timestamp": "2026-09-28T10:00:00Z", "user": "alice", "ip": "203.0.113.1", "outcome": "FAILURE_BAD_CREDENTIALS" },
  { "timestamp": "2026-09-28T10:05:00Z", "user": "bob", "ip": "203.0.113.2", "outcome": "FAILURE_BAD_CREDENTIALS" }
]`}
            className="w-full bg-black border border-white/10 rounded p-2 text-slate-200 placeholder:text-slate-700 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
          />
          {customError && <p className="text-rose-400 text-[11px]">{customError}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsCustomOpen(false)}
              className="px-3 py-1.5 rounded border border-white/10 bg-white/5 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomIngest}
              className="px-4 py-1.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-bold"
            >
              Normalize & Ingest Custom Telemetry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
