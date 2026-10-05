'use client';

import React, { useState, useMemo } from 'react';
import { AuthEvent, Incident } from '@/types/auth-event';
import { Network, ZoomIn, ZoomOut, RotateCcw, ShieldAlert, User, Globe, Activity } from 'lucide-react';

interface BipartiteGraphProps {
  events: readonly AuthEvent[];
  incident: Incident | null;
  selectedTimeMs?: number | null;
}

interface NodeInfo {
  id: string;
  type: 'ip' | 'user';
  label: string;
  isSprayIp: boolean;
  isPivotIp: boolean;
  isTargetedUser: boolean;
  isCompromisedUser: boolean;
  degree: number;
  eventsCount: number;
  successCount: number;
  failureCount: number;
}

interface EdgeInfo {
  id: string;
  source: string;
  target: string;
  isPivot: boolean;
  isAttack: boolean;
  timestamp: string;
}

export function BipartiteGraph({ events, incident, selectedTimeMs }: BipartiteGraphProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'attack' | 'pivot'>('attack');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Filter events based on scrubber time if provided
  const activeEvents = useMemo(() => {
    if (!selectedTimeMs) return events;
    return events.filter((e) => new Date(e.timestamp).getTime() <= selectedTimeMs);
  }, [events, selectedTimeMs]);

  const { nodes, edges, metrics } = useMemo(() => {
    const sprayIps = new Set(incident?.contributingIps || []);
    const targetedUsers = new Set(incident?.targetedAccounts || []);
    const compromisedUsers = new Set(incident?.compromisedAccounts || []);
    const pivotIps = new Set<string>();

    // Identify pivot IP from incident
    for (const e of activeEvents) {
      if (e.eventOutcome === 'SUCCESS' && compromisedUsers.has(e.userName) && sprayIps.has(e.srcIp)) {
        pivotIps.add(e.srcIp);
      }
    }

    const ipMap = new Map<string, NodeInfo>();
    const userMap = new Map<string, NodeInfo>();
    const edgeList: EdgeInfo[] = [];

    for (const e of activeEvents) {
      const isSpray = sprayIps.has(e.srcIp);
      const isTarget = targetedUsers.has(e.userName);
      const isCompromised = compromisedUsers.has(e.userName);
      const isPivot = e.eventOutcome === 'SUCCESS' && isCompromised && isSpray;
      const isAttack = isSpray || isTarget;

      // Filter check
      if (filterMode === 'attack' && !isAttack) continue;
      if (filterMode === 'pivot' && !isPivot && !isCompromised && !pivotIps.has(e.srcIp)) continue;

      // Add/update IP node
      if (!ipMap.has(e.srcIp)) {
        ipMap.set(e.srcIp, {
          id: e.srcIp,
          type: 'ip',
          label: e.srcIp,
          isSprayIp: isSpray,
          isPivotIp: pivotIps.has(e.srcIp),
          isTargetedUser: false,
          isCompromisedUser: false,
          degree: 0,
          eventsCount: 0,
          successCount: 0,
          failureCount: 0,
        });
      }
      const ipNode = ipMap.get(e.srcIp)!;
      ipNode.eventsCount++;
      if (e.eventOutcome === 'SUCCESS') ipNode.successCount++;
      else ipNode.failureCount++;

      // Add/update User node
      if (!userMap.has(e.userName)) {
        userMap.set(e.userName, {
          id: e.userName,
          type: 'user',
          label: e.userName,
          isSprayIp: false,
          isPivotIp: false,
          isTargetedUser: isTarget,
          isCompromisedUser: isCompromised,
          degree: 0,
          eventsCount: 0,
          successCount: 0,
          failureCount: 0,
        });
      }
      const userNode = userMap.get(e.userName)!;
      userNode.eventsCount++;
      if (e.eventOutcome === 'SUCCESS') userNode.successCount++;
      else userNode.failureCount++;

      // Connect edge
      const edgeId = `${e.srcIp}->${e.userName}-${e.timestamp}`;
      edgeList.push({
        id: edgeId,
        source: e.srcIp,
        target: e.userName,
        isPivot,
        isAttack,
        timestamp: e.timestamp,
      });

      ipNode.degree++;
      userNode.degree++;
    }

    const ipNodes = Array.from(ipMap.values());
    const userNodes = Array.from(userMap.values());

    // Sort: attack/compromised nodes at top
    ipNodes.sort((a, b) => (b.isPivotIp ? 1 : 0) - (a.isPivotIp ? 1 : 0) || b.degree - a.degree);
    userNodes.sort((a, b) => (b.isCompromisedUser ? 1 : 0) - (a.isCompromisedUser ? 1 : 0) || b.degree - a.degree);

    // Bipartite density ratio
    const totalPossibleEdges = ipNodes.length * userNodes.length;
    const densityRatio = totalPossibleEdges > 0 ? (edgeList.length / totalPossibleEdges).toFixed(3) : '0.000';

    return {
      nodes: { ips: ipNodes, users: userNodes },
      edges: edgeList,
      metrics: {
        totalIps: ipNodes.length,
        totalUsers: userNodes.length,
        totalEdges: edgeList.length,
        densityRatio,
        attackIps: ipNodes.filter((n) => n.isSprayIp).length,
        compromisedUsers: userNodes.filter((n) => n.isCompromisedUser).length,
      },
    };
  }, [activeEvents, incident, filterMode]);

  // Selected node details
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return (
      nodes.ips.find((n) => n.id === selectedNodeId) ||
      nodes.users.find((n) => n.id === selectedNodeId) ||
      null
    );
  }, [selectedNodeId, nodes]);

  // Layout calculations: SVG coordinates
  const svgWidth = 920;
  const itemHeight = 36;
  const maxRows = Math.max(nodes.ips.length, nodes.users.length, 6);
  const svgHeight = Math.max(340, Math.min(680, maxRows * itemHeight + 60));

  const ipX = 140;
  const userX = svgWidth - 140;

  const nodePositions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>();
    const ipStep = (svgHeight - 60) / Math.max(nodes.ips.length, 1);
    nodes.ips.forEach((ip, idx) => {
      pos.set(ip.id, { x: ipX, y: 30 + idx * ipStep + ipStep / 2 });
    });

    const userStep = (svgHeight - 60) / Math.max(nodes.users.length, 1);
    nodes.users.forEach((user, idx) => {
      pos.set(user.id, { x: userX, y: 30 + idx * userStep + userStep / 2 });
    });

    return pos;
  }, [nodes, svgHeight, ipX, userX]);

  return (
    <div className="rounded-lg border border-white/10 bg-[#080C14] p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              Bipartite Campaign Graph Canvas
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                Union-Find Clustering
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlating residential proxy IPs to sprayed enterprise identities across time
            </p>
          </div>
        </div>

        {/* View Filter Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex rounded border border-white/10 bg-black/40 p-0.5 text-xs font-mono">
            <button
              onClick={() => setFilterMode('attack')}
              className={`px-3 py-1 rounded transition ${filterMode === 'attack' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              Attack Cluster ({metrics.attackIps} IPs)
            </button>
            <button
              onClick={() => setFilterMode('pivot')}
              className={`px-3 py-1 rounded transition ${filterMode === 'pivot' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Pivot Only ({metrics.compromisedUsers} Breach)
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded transition ${filterMode === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              All Telemetry
            </button>
          </div>

          <div className="flex items-center gap-1 border border-white/10 rounded px-1.5 py-1 bg-black/40">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-slate-300 px-1">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 text-slate-400 hover:text-white border-l border-white/10 pl-1.5"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Graph Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-2.5 rounded border border-white/5 bg-[#04070C]">
          <span className="text-slate-400 block text-xs">GRAPH DENSITY RATIO</span>
          <span className="text-slate-200 font-bold text-sm">{metrics.densityRatio}</span>
        </div>
        <div className="p-2.5 rounded border border-white/5 bg-[#04070C]">
          <span className="text-slate-400 block text-xs">RESIDENTIAL PROXIES (IPs)</span>
          <span className="text-rose-400 font-bold text-sm">{metrics.totalIps} nodes</span>
        </div>
        <div className="p-2.5 rounded border border-white/5 bg-[#04070C]">
          <span className="text-slate-400 block text-xs">DIRECTORY IDENTITIES</span>
          <span className="text-slate-200 font-bold text-sm">{metrics.totalUsers} targets</span>
        </div>
        <div className="p-2.5 rounded border border-white/5 bg-[#04070C]">
          <span className="text-slate-400 block text-xs">BIPARTITE ATTEMPT EDGES</span>
          <span className="text-amber-400 font-bold text-sm">{metrics.totalEdges} edges</span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative border border-white/5 rounded-lg bg-black overflow-hidden">
        <div
          className="w-full overflow-x-auto transition-transform duration-150 origin-top"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[760px] h-auto select-none"
            style={{ maxHeight: '540px' }}
          >
            {/* Background grid lines */}
            <defs>
              <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="pivotGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#dc2626" stopOpacity="1" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Column Label Headers */}
            <text x={ipX} y={20} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              [ RESIDENTIAL PROXY EGRESS (IP) ]
            </text>
            <text x={userX} y={20} fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              [ TARGET DIRECTORY ACCOUNTS ]
            </text>

            {/* Edges */}
            <g className="edges">
              {edges.map((edge) => {
                const srcPos = nodePositions.get(edge.source);
                const tgtPos = nodePositions.get(edge.target);
                if (!srcPos || !tgtPos) return null;

                const isConnectedToSelected =
                  selectedNodeId &&
                  (edge.source === selectedNodeId || edge.target === selectedNodeId);

                const strokeColor = edge.isPivot
                  ? 'url(#pivotGradient)'
                  : isConnectedToSelected
                    ? '#f59e0b'
                    : 'rgba(255, 255, 255, 0.12)';
                const strokeWidth = edge.isPivot ? 3 : isConnectedToSelected ? 2 : 1;
                const strokeOpacity = selectedNodeId && !isConnectedToSelected && !edge.isPivot ? 0.15 : 0.8;

                // Curved bezier path
                const midX = (srcPos.x + tgtPos.x) / 2;
                const d = `M ${srcPos.x + 8} ${srcPos.y} C ${midX} ${srcPos.y}, ${midX} ${tgtPos.y}, ${tgtPos.x - 8} ${tgtPos.y}`;

                return (
                  <path
                    key={edge.id}
                    d={d}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    className="transition-all duration-200"
                  />
                );
              })}
            </g>

            {/* IP Nodes */}
            <g className="ip-nodes">
              {nodes.ips.map((ip) => {
                const pos = nodePositions.get(ip.id);
                if (!pos) return null;
                const isSelected = selectedNodeId === ip.id;

                let fill = '#0f172a';
                let stroke = 'rgba(255, 255, 255, 0.2)';
                if (ip.isPivotIp) {
                  fill = '#dc2626';
                  stroke = '#ef4444';
                } else if (ip.isSprayIp) {
                  fill = '#881337';
                  stroke = '#f43f5e';
                }

                return (
                  <g
                    key={ip.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer group"
                    onClick={() => setSelectedNodeId(isSelected ? null : ip.id)}
                  >
                    {/* Pulsing ring for pivot */}
                    {ip.isPivotIp && (
                      <circle r="14" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.6" className="animate-ping" />
                    )}

                    <circle
                      r={isSelected ? 9 : 7}
                      fill={fill}
                      stroke={isSelected ? '#38bdf8' : stroke}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="transition-all"
                    />

                    {/* Text Label */}
                    <text
                      x={-14}
                      y={4}
                      fill={ip.isPivotIp ? '#fca5a5' : isSelected ? '#38bdf8' : '#cbd5e1'}
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="end"
                      fontWeight={ip.isPivotIp || isSelected ? 'bold' : 'normal'}
                    >
                      {ip.label}
                      {ip.isPivotIp && ' [PIVOT]'}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* User Nodes */}
            <g className="user-nodes">
              {nodes.users.map((user) => {
                const pos = nodePositions.get(user.id);
                if (!pos) return null;
                const isSelected = selectedNodeId === user.id;

                let fill = '#0f172a';
                let stroke = 'rgba(255, 255, 255, 0.2)';
                if (user.isCompromisedUser) {
                  fill = '#dc2626';
                  stroke = '#ef4444';
                } else if (user.isTargetedUser) {
                  fill = '#78350f';
                  stroke = '#d97706';
                }

                return (
                  <g
                    key={user.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer group"
                    onClick={() => setSelectedNodeId(isSelected ? null : user.id)}
                  >
                    {user.isCompromisedUser && (
                      <circle r="14" fill="none" stroke="#dc2626" strokeWidth="2" opacity="0.7" className="animate-ping" />
                    )}

                    <circle
                      r={isSelected ? 9 : 7}
                      fill={fill}
                      stroke={isSelected ? '#38bdf8' : stroke}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="transition-all"
                    />

                    <text
                      x={14}
                      y={4}
                      fill={user.isCompromisedUser ? '#fca5a5' : isSelected ? '#38bdf8' : '#cbd5e1'}
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="start"
                      fontWeight={user.isCompromisedUser || isSelected ? 'bold' : 'normal'}
                    >
                      {user.label}
                      {user.isCompromisedUser && ' [BREACH]'}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Selected Node Telemetry Drawer */}
        {selectedNode && (
          <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-80 p-3.5 rounded-lg border border-white/20 bg-[#080C14]/95 backdrop-blur shadow-2xl text-xs font-mono space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                {selectedNode.type === 'ip' ? (
                  <Globe className="w-4 h-4 text-rose-400" />
                ) : (
                  <User className="w-4 h-4 text-amber-400" />
                )}
                <span className="font-bold text-white uppercase">{selectedNode.type}: {selectedNode.label}</span>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-slate-400 hover:text-white px-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-300 block">STATUS</span>
                <span className={selectedNode.isCompromisedUser || selectedNode.isPivotIp ? 'text-rose-400 font-bold' : selectedNode.isSprayIp ? 'text-amber-400' : 'text-slate-300'}>
                  {selectedNode.isCompromisedUser
                    ? 'COMPROMISED'
                    : selectedNode.isPivotIp
                      ? 'PIVOT SOURCE'
                      : selectedNode.isSprayIp
                        ? 'RESIDENTIAL PROXY'
                        : 'BENIGN / NOISE'}
                </span>
              </div>
              <div>
                <span className="text-slate-300 block">DEGREE CENTRALITY</span>
                <span className="text-slate-200">{selectedNode.degree} links</span>
              </div>
              <div>
                <span className="text-slate-300 block">AUTH FAILURES</span>
                <span className="text-rose-400 font-semibold">{selectedNode.failureCount}</span>
              </div>
              <div>
                <span className="text-slate-300 block">AUTH SUCCESSES</span>
                <span className={selectedNode.successCount > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {selectedNode.successCount}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
