"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap, Activity } from 'lucide-react';

interface Metric {
  label: string;
  value: number;
  target: number;
  color: string;
  description: string;
  icon: React.ReactNode;
}

const INITIAL_METRICS: Metric[] = [
  {
    label: "Naive Volume Rule",
    value: 0,
    target: 0,
    color: "text-slate-300",
    description: "Standard per-IP volume thresholds",
    icon: <Activity className="w-4 h-4" />,
  },
  {
    label: "Loosened Threshold",
    value: 0,
    target: 97,
    color: "text-amber-500",
    description: "Broadened rules to capture spray",
    icon: <ShieldAlert className="w-4 h-4" />,
  },
  {
    label: "Quorum Consensus",
    value: 0,
    target: 1,
    color: "text-severity-critical",
    description: "Graph + Pivot independent agreement",
    icon: <Zap className="w-4 h-4" />,
  },
];

export const ContrastHero = () => {
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [isRunning, setIsRunning] = useState(false);

  const runDetection = async () => {
    setIsRunning(true);

    // Reset values first
    setMetrics(INITIAL_METRICS.map(m => ({ ...m, value: 0 })));

    // Animate each metric with a slight delay for dramatic effect
    for (let i = 0; i < metrics.length; i++) {
      await animateValue(i);
    }

    setIsRunning(false);
  };

  const animateValue = (index: number) => {
    return new Promise<void>((resolve) => {
      let current = 0;
      const target = metrics[index].target;
      const duration = index === 2 ? 1200 : 800; // Quorum takes longer for "calculated" feel
      const increment = target === 0 ? 0 : Math.ceil(target / (duration / 16));

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setMetrics(prev => {
            const next = [...prev];
            next[index].value = target;
            return next;
          });
          clearInterval(timer);
          resolve();
        } else {
          setMetrics(prev => {
            const next = [...prev];
            next[index].value = current;
            return next;
          });
        }
      }, 16);
    });
  };

  return (
    <div className="w-full py-16 px-6 bg-base text-white font-sans selection:bg-severity-critical/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tighter mb-4 text-white"
          >
            Detection Contrast
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-300 font-mono text-sm uppercase tracking-widest"
          >
            Scenario: Distributed Botnet Spray <span className="text-slate-700 mx-2">|</span> 1,180 Accounts <span className="text-slate-700 mx-2">|</span> 312 IPs
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {metrics.map((metric, idx) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="relative p-8 bg-surface border border-border-subtle rounded-sm overflow-hidden group transition-all duration-500 hover:border-border-bold"
            >
              {/* Critical Highlight Glow */}
              <AnimatePresence>
                {idx === 2 && metric.value === metric.target && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-severity-critical/10 blur-3xl pointer-events-none"
                  />
                )}
              </AnimatePresence>

              <div className="flex items-center gap-3 mb-6 text-slate-300">
                <span className="p-1.5 rounded-sm bg-base border border-border-subtle">
                  {metric.icon}
                </span>
                <span className="text-xs font-mono uppercase tracking-widest font-medium">{metric.label}</span>
              </div>

              <div className="flex items-baseline gap-3 mb-4">
                <span className={`text-7xl font-bold font-mono tabular-nums transition-colors duration-500 ${metric.color}`}>
                  {metric.value}
                </span>
                <span className="text-slate-400 font-mono text-sm uppercase">Incidents</span>
              </div>

              <p className="text-sm text-slate-300 font-mono leading-relaxed border-t border-border-subtle pt-4">
                {metric.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={runDetection}
            disabled={isRunning}
            className={`
              px-12 py-4 font-mono text-sm uppercase tracking-widest transition-all duration-300
              ${isRunning
                ? "bg-slate-800 text-slate-300 cursor-not-allowed border-slate-700"
                : "bg-white text-black hover:bg-severity-critical hover:text-white border-white"
              }
              border rounded-sm shadow-2xl
            `}
          >
            {isRunning ? "Computing Consensus..." : "Run Live Detection"}
          </motion.button>

          <div className="mt-8">
            <div className="px-6 py-3 bg-surface border border-border-subtle rounded-sm shadow-inner">
              <p className="text-xs font-mono text-slate-300 flex items-center gap-3">
                <span className="w-1 h-1 rounded-full bg-severity-critical animate-pulse" />
                Thesis: <span className="text-slate-300 italic">&quot;Every alert needs evidence. Every incident needs independent agreement.&quot;</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
