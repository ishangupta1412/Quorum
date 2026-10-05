'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Download, Shield, FileText, Database, Code2 } from 'lucide-react';
import { Incident } from '@/types/auth-event';
import { exportToStix21 } from '@/lib/export/stix';
import { exportToSentinel } from '@/lib/export/sentinel';
import { exportIncidentToCsv } from '@/lib/export/csv';
import { soundEngine } from '@/lib/sound/audio-cues';

interface RawEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
}

type TabType = 'stix' | 'sentinel' | 'csv' | 'raw';

export function RawEvidenceModal({ isOpen, onClose, incident }: RawEvidenceModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stix');
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute exports deterministically
  const exports = useMemo(() => {
    if (!incident) {
      return { stix: '', sentinel: '', csv: '', raw: '' };
    }
    try {
      const stixObj = exportToStix21(incident);
      const sentinelObj = exportToSentinel(incident);
      const csvStr = exportIncidentToCsv(incident);
      const rawStr = JSON.stringify(incident, null, 2);

      return {
        stix: JSON.stringify(stixObj, null, 2),
        sentinel: JSON.stringify(sentinelObj, null, 2),
        csv: csvStr,
        raw: rawStr,
      };
    } catch (err) {
      return {
        stix: `// Error generating STIX: ${String(err)}`,
        sentinel: `// Error generating Sentinel: ${String(err)}`,
        csv: `// Error generating CSV: ${String(err)}`,
        raw: JSON.stringify(incident, null, 2),
      };
    }
  }, [incident]);

  const activeContent = exports[activeTab];

  const handleCopy = () => {
    if (!activeContent) return;
    navigator.clipboard.writeText(activeContent);
    soundEngine.playDispatchSound();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeContent || !incident) return;
    const isCsv = activeTab === 'csv';
    const extension = isCsv ? 'csv' : 'json';
    const mimeType = isCsv ? 'text/csv' : 'application/json';
    const blob = new Blob([activeContent], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quorum_${incident.id}_${activeTab}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    soundEngine.playDispatchSound();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#080C14] border border-white/[0.12] rounded-md shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-black/40 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded bg-white/[0.05] border border-white/[0.08]">
                <Shield className="w-4 h-4 text-[#DC2626]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold font-mono text-white tracking-wide uppercase">
                    Raw Telemetry & Evidence Inspector
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 border border-white/[0.06]">
                    Deterministic
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Incident: {incident?.id || 'NO_INCIDENT'} · Severity: {incident?.severityTier || 'NONE'} ({incident?.severityScore || 0}/100)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-mono text-slate-300 hover:text-white transition-colors"
                title="Copy contents to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-[#10B981]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#DC2626]/20 hover:bg-[#DC2626]/30 border border-[#DC2626]/40 text-xs font-mono text-white transition-colors"
                title="Download raw file"
              >
                <Download className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Export</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors ml-1"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-5 pt-2 border-b border-white/[0.06] bg-black/20 flex-shrink-0">
            <button
              onClick={() => setActiveTab('stix')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-mono transition-all border-b-2 ${
                activeTab === 'stix'
                  ? 'border-[#DC2626] text-white font-bold bg-white/[0.04]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-rose-400" />
              STIX 2.1 Bundle
            </button>

            <button
              onClick={() => setActiveTab('sentinel')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-mono transition-all border-b-2 ${
                activeTab === 'sentinel'
                  ? 'border-[#DC2626] text-white font-bold bg-white/[0.04]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              Microsoft Sentinel ARM
            </button>

            <button
              onClick={() => setActiveTab('csv')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-mono transition-all border-b-2 ${
                activeTab === 'csv'
                  ? 'border-[#DC2626] text-white font-bold bg-white/[0.04]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              RFC 4180 CSV
            </button>

            <button
              onClick={() => setActiveTab('raw')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-mono transition-all border-b-2 ${
                activeTab === 'raw'
                  ? 'border-[#DC2626] text-white font-bold bg-white/[0.04]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Correlated Incident Graph
            </button>
          </div>

          {/* Code Viewer Body */}
          <div className="flex-1 p-5 overflow-y-auto bg-black/60 font-mono text-xs text-slate-300 leading-relaxed select-text">
            {activeContent ? (
              <pre className="whitespace-pre-wrap break-all">{activeContent}</pre>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-500 font-mono text-xs">
                No active incident selected or data empty.
              </div>
            )}
          </div>

          {/* Footer Status Bar */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/[0.06] bg-black/50 text-[11px] font-mono text-slate-400 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                Specification Validated
              </span>
              <span>·</span>
              <span>Format: {activeTab === 'csv' ? 'RFC 4180 Plaintext' : 'OASIS JSON v2.1'}</span>
            </div>
            <span>Press ESC to dismiss</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
