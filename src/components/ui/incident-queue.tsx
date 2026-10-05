"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  MoreHorizontal,
  Search,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';

// Types based on PRD Section 9
type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

interface Incident {
  id: string;
  fingerprint: string;
  severity: Severity;
  quorumCount: number;
  status: 'Open' | 'Staged' | 'Resolved';
  lastSeen: string;
  rationale: string;
}

const MOCK_INCIDENTS: Incident[] = [
  {
    id: "INC-2026-001",
    fingerprint: "f2a1...c8d9",
    severity: "Critical",
    quorumCount: 3,
    status: "Open",
    lastSeen: "2 mins ago",
    rationale: "Base 100 (Pivot) × 1.00 (Graph + Pivot) + 15 → 100 [CRITICAL]",
  },
  {
    id: "INC-2026-002",
    fingerprint: "a8b3...e1f2",
    severity: "High",
    quorumCount: 2,
    status: "Open",
    lastSeen: "14 mins ago",
    rationale: "Base 70 (Campaign Graph) × 1.25 (Graph + Rule) + 10 → 97 [HIGH]",
  },
  {
    id: "INC-2026-003",
    fingerprint: "d4e5...a6b7",
    severity: "Medium",
    quorumCount: 1,
    status: "Staged",
    lastSeen: "1 hour ago",
    rationale: "Base 40 (Spray) × 0.75 (Rule) - 5 → 25 [MEDIUM]",
  },
  {
    id: "INC-2026-004",
    fingerprint: "c1d2...e3f4",
    severity: "Low",
    quorumCount: 1,
    status: "Resolved",
    lastSeen: "4 hours ago",
    rationale: "Base 20 (Brute Force) × 0.75 (Rule) → 15 [LOW]",
  },
];

const SEVERITY_COLORS: Record<Severity, string> = {
  Low: "text-severity-low bg-severity-low/10 border-severity-low/20",
  Medium: "text-severity-medium bg-severity-medium/10 border-severity-medium/20",
  High: "text-severity-high bg-severity-high/10 border-severity-high/20",
  Critical: "text-severity-critical bg-severity-critical/10 border-severity-critical/20",
};

export const IncidentQueue = ({ onSelectIncident }: { onSelectIncident: (id: string) => void }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredIncidents, setFilteredIncidents] = useState(MOCK_INCIDENTS);

  useEffect(() => {
    const filtered = MOCK_INCIDENTS.filter(inc =>
      inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.fingerprint.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredIncidents(filtered);
  }, [searchQuery]);

  return (
    <div className="w-full h-full flex flex-col bg-base text-white font-sans">
      {/* Queue Header - Metrics Bar */}
      <div className="flex items-center justify-between p-4 bg-surface border-b border-border-subtle">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-severity-critical" />
            <span className="text-xs font-mono text-slate-400 uppercase tracking-tighter">Queue Health:</span>
            <span className="text-xs font-mono text-white font-bold">A2TP 1.5 : 1</span>
          </div>
          <div className="flex items-center gap-2 border-l border-border-subtle pl-6">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-mono text-slate-400 uppercase tracking-tighter">Active Windows:</span>
            <span className="text-xs font-mono text-white font-bold">7 Days</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search fingerprint..."
              className="bg-base border border-border-subtle pl-9 pr-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-border-bold transition-colors w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="p-2 bg-surface border border-border-subtle hover:border-border-bold transition-colors rounded-sm">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse font-mono">
          <thead className="sticky top-0 bg-surface z-10 text-[10px] uppercase tracking-widest text-slate-500 border-b border-border-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">Incident ID</th>
              <th className="px-4 py-3 font-medium">Fingerprint</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium text-center">Quorum</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last Seen</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            <AnimatePresence>
              {filteredIncidents.map((incident) => (
                <motion.tr
                  key={incident.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => onSelectIncident(incident.id)}
                  className="group cursor-pointer hover:bg-surface/50 transition-colors"
                >
                  <td className="px-4 py-3 text-xs font-medium text-slate-300 group-hover:text-white">
                    {incident.id}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono group-hover:text-slate-300">
                    {incident.fingerprint}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${SEVERITY_COLORS[incident.severity]}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-mono text-slate-400">
                    {incident.quorumCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      {incident.status === 'Resolved' ? <CheckCircle2 className="w-3 h-3 text-status-resolved" /> : <AlertCircle className="w-3 h-3 text-severity-medium" />}
                      {incident.status}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                    {incident.lastSeen}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {filteredIncidents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600 font-mono text-sm">
            <Search className="w-8 h-8 mb-4 opacity-20" />
            <p>No incidents match your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
