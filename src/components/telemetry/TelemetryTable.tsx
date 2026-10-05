'use client';

import React, { useState, useMemo } from 'react';
import { AuthEvent } from '@/types/auth-event';
import { Table, Search, Filter, ShieldAlert, CheckCircle, XCircle, ArrowUpDown } from 'lucide-react';

interface TelemetryTableProps {
  events: readonly AuthEvent[];
  sprayIps: readonly string[];
  compromisedAccounts: readonly string[];
}

export function TelemetryTable({ events, sprayIps, compromisedAccounts }: TelemetryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'SUCCESS' | 'FAILURE'>('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const spraySet = useMemo(() => new Set(sprayIps), [sprayIps]);
  const compromisedSet = useMemo(() => new Set(compromisedAccounts), [compromisedAccounts]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (outcomeFilter === 'SUCCESS' && e.eventOutcome !== 'SUCCESS') return false;
      if (outcomeFilter === 'FAILURE' && e.eventOutcome === 'SUCCESS') return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          e.userName.toLowerCase().includes(term) ||
          e.srcIp.toLowerCase().includes(term) ||
          e.sourceSystem.toLowerCase().includes(term) ||
          e.eventHash.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [events, outcomeFilter, searchTerm]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const currentRows = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="rounded-lg border border-white/10 bg-[#080C14] p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            Canonical Authentication Telemetry
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-slate-400">
              Canonical Normalizer
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Parsed and standardized VPN telemetry stream ({filtered.length} matching events)
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-300 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              placeholder="Search IP, User, Hash..."
              className="w-full bg-black border border-white/10 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-rose-500/50"
            />
          </div>

          <div className="flex rounded border border-white/10 bg-black p-0.5 text-xs font-mono">
            <button
              onClick={() => { setOutcomeFilter('ALL'); setPage(0); }}
              className={`px-2 py-1 rounded transition ${outcomeFilter === 'ALL' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => { setOutcomeFilter('FAILURE'); setPage(0); }}
              className={`px-2 py-1 rounded transition ${outcomeFilter === 'FAILURE' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'}`}
            >
              Failures
            </button>
            <button
              onClick={() => { setOutcomeFilter('SUCCESS'); setPage(0); }}
              className={`px-2 py-1 rounded transition ${outcomeFilter === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'}`}
            >
              Success
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded border border-white/5 bg-black">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[#04070C] text-xs text-slate-300 uppercase border-b border-white/10">
            <tr>
              <th className="p-2.5">Timestamp (UTC)</th>
              <th className="p-2.5">Source IP</th>
              <th className="p-2.5">User Identity</th>
              <th className="p-2.5">Outcome</th>
              <th className="p-2.5">Gateway</th>
              <th className="p-2.5">Event SHA-256 Digest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {currentRows.map((e) => {
              const isSpray = spraySet.has(e.srcIp);
              const isCompromised = compromisedSet.has(e.userName);
              const isPivot = e.eventOutcome === 'SUCCESS' && isCompromised && isSpray;

              let rowClass = 'hover:bg-white/5';
              if (isPivot) rowClass = 'bg-rose-950/40 text-rose-200 hover:bg-rose-950/60 font-bold';
              else if (isSpray) rowClass = 'bg-amber-950/20 text-amber-200 hover:bg-amber-950/40';

              return (
                <tr key={e.eventHash} className={rowClass}>
                  <td className="p-2.5 text-slate-400 whitespace-nowrap">{e.timestamp}</td>
                  <td className="p-2.5 whitespace-nowrap">
                    <span className={isSpray ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                      {e.srcIp}
                    </span>
                    {isSpray && <span className="ml-1 text-xs px-1 py-0.5 rounded bg-rose-500/20 text-rose-300">PROXY</span>}
                  </td>
                  <td className="p-2.5 whitespace-nowrap">
                    <span className={isCompromised ? 'text-rose-400 font-bold underline' : 'text-slate-200'}>
                      {e.userName}
                    </span>
                    {isPivot && <span className="ml-1 text-xs px-1 py-0.5 rounded bg-rose-600 text-white font-bold">BREACH</span>}
                  </td>
                  <td className="p-2.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        e.eventOutcome === 'SUCCESS'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      }`}
                    >
                      {e.eventOutcome}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-400 whitespace-nowrap">{e.sourceSystem}</td>
                  <td className="p-2.5 text-slate-400 truncate max-w-[140px] text-xs">{e.eventHash}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2">
        <span>
          Showing {filtered.length === 0 ? 0 : page * pageSize + 1}–{Math.min(filtered.length, (page + 1) * pageSize)} of {filtered.length} events
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2.5 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30"
          >
            Previous
          </button>
          <span className="px-2 py-1 text-slate-200">
            {page + 1} / {Math.max(1, pageCount)}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            className="px-2.5 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
