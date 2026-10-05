'use client';

import React, { useState } from 'react';
import { Incident } from '@/types/auth-event';
import { exportToSentinel, SentinelIncidentPayload } from '@/lib/export/sentinel';
import { exportToStix21 } from '@/lib/export/stix';
import { exportIncidentsToCsv } from '@/lib/export/csv';
import { Send, CheckCircle2, ShieldCheck, Download, Code, ExternalLink, RefreshCw } from 'lucide-react';
import { soundEngine } from '@/lib/sound/audio-cues';

interface SentinelDispatcherProps {
  incident: Incident | null;
  onDispatched?: (receipt: any) => void;
}

export function SentinelDispatcher({ incident, onDispatched }: SentinelDispatcherProps) {
  const [isDispatching, setIsDispatching] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);
  const [previewTab, setPreviewTab] = useState<'sentinel' | 'stix' | 'csv'>('sentinel');

  if (!incident) return null;

  const sentinelPayload = exportToSentinel(incident);
  const stixBundle = exportToStix21(incident);
  const csvData = exportIncidentsToCsv([incident]);

  const handleLiveDispatch = async () => {
    setIsDispatching(true);
    try {
      const res = await fetch('/api/v1/sentinel/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sentinelPayload),
      });

      const data = await res.json();
      if (data.success && data.receipt) {
        soundEngine.playDispatchSound();
        setLastReceipt(data.receipt);
        if (onDispatched) onDispatched(data.receipt);
      }
    } catch (err) {
      console.error('Dispatch failed', err);
    } finally {
      setIsDispatching(false);
    }
  };

  const downloadJson = (filename: string, content: object) => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[#080C14] p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            Microsoft Sentinel & SOAR Automated Dispatch
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-cyan-400">
              REST / ARM
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Streaming correlated incident telemetry directly to Azure SecurityInsights / Entra ID
          </p>
        </div>

        {/* Live Dispatch Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLiveDispatch}
            disabled={isDispatching}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white rounded font-mono text-xs font-bold transition shadow-lg shadow-cyan-950/40"
          >
            {isDispatching ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {isDispatching ? 'Streaming to Sentinel...' : 'Live Dispatch to Sentinel Webhook'}
          </button>
        </div>
      </div>

      {/* Dispatch Receipt Alert */}
      {lastReceipt && (
        <div className="p-3.5 rounded-lg border border-emerald-500/40 bg-emerald-950/20 font-mono text-xs text-emerald-300 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              SENTINEL WEBHOOK RECEIPT CONFIRMED
            </span>
            <span className="text-xs text-emerald-400">{lastReceipt.timestamp}</span>
          </div>
          <div className="text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
            <div>RECEIPT ID: <span className="text-white font-bold">{lastReceipt.receiptId}</span></div>
            <div>STATUS: <span className="text-emerald-400 font-bold">{lastReceipt.status}</span></div>
            <div>SIGNATURE: <span className="text-slate-400 truncate block">{lastReceipt.signature}</span></div>
            <div>ENTRA ID ACTION: <span className="text-rose-400 font-semibold">Flagged for Token Revocation</span></div>
          </div>
        </div>
      )}

      {/* Interoperability Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex rounded border border-white/10 bg-black p-0.5 text-xs font-mono">
            <button
              onClick={() => setPreviewTab('sentinel')}
              className={`px-3 py-1 rounded transition ${previewTab === 'sentinel' ? 'bg-white/20 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              ARM Incident JSON
            </button>
            <button
              onClick={() => setPreviewTab('stix')}
              className={`px-3 py-1 rounded transition ${previewTab === 'stix' ? 'bg-white/20 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              STIX 2.1 Intel Bundle
            </button>
            <button
              onClick={() => setPreviewTab('csv')}
              className={`px-3 py-1 rounded transition ${previewTab === 'csv' ? 'bg-white/20 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              RFC 4180 CSV
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (previewTab === 'sentinel') downloadJson(`sentinel-${incident.id}.json`, sentinelPayload);
                else if (previewTab === 'stix') downloadJson(`stix-${incident.id}.json`, stixBundle);
                else {
                  const blob = new Blob([csvData], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `quorum-incidents.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-mono text-slate-300 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download {previewTab.toUpperCase()}
            </button>
          </div>
        </div>

        {/* Code Preview Box */}
        <pre className="p-3.5 rounded-lg border border-white/5 bg-black text-xs font-mono text-slate-300 max-h-56 overflow-y-auto overflow-x-auto leading-relaxed">
          {previewTab === 'sentinel' && JSON.stringify(sentinelPayload, null, 2)}
          {previewTab === 'stix' && JSON.stringify(stixBundle, null, 2)}
          {previewTab === 'csv' && csvData}
        </pre>
      </div>
    </div>
  );
}
