'use client';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface ExpandMapProps {
  location?: string;
  coordinates?: string;
  ip?: string;
  className?: string;
}

export function ExpandMap({ location = 'Unknown', coordinates = '0.0000, 0.0000', ip, className = '' }: ExpandMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-40, 40], [6, -6]);
  const rotateY = useTransform(mouseX, [-40, 40], [-6, 6]);
  const springX = useSpring(rotateX, { stiffness: 280, damping: 28 });
  const springY = useSpring(rotateY, { stiffness: 280, damping: 28 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - (r.left + r.width / 2));
    mouseY.set(e.clientY - (r.top + r.height / 2));
  };

  // Generate deterministic "grid lines" for the map feel
  const gridLines = Array.from({ length: 6 }, (_, i) => i);

  return (
    <motion.div
      ref={containerRef}
      className={`relative cursor-pointer select-none ${className}`}
      style={{ perspective: 900 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      onClick={() => setIsExpanded(v => !v)}
    >
      <motion.div
        className="relative overflow-hidden rounded-sm border border-white/8 bg-[#080C14]"
        style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d' }}
        animate={{ width: isExpanded ? 320 : 220, height: isExpanded ? 240 : 120 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        {/* Map grid background */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {gridLines.map(i => (
              <React.Fragment key={i}>
                <motion.line
                  x1="0%" y1={`${(i + 1) * 14}%`} x2="100%" y2={`${(i + 1) * 14}%`}
                  stroke="rgba(255,255,255,0.12)" strokeWidth="1"
                  initial={{ pathLength: 0 }} animate={{ pathLength: isExpanded ? 1 : 0.3 }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                />
                <motion.line
                  x1={`${(i + 1) * 14}%`} y1="0%" x2={`${(i + 1) * 14}%`} y2="100%"
                  stroke="rgba(255,255,255,0.08)" strokeWidth="1"
                  initial={{ pathLength: 0 }} animate={{ pathLength: isExpanded ? 1 : 0.3 }}
                  transition={{ duration: 0.6, delay: i * 0.05 + 0.1 }}
                />
              </React.Fragment>
            ))}
          </svg>
        </div>

        {/* Expanded: crosshair target */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Crosshair rings */}
              {[40, 70, 100].map((r, i) => (
                <motion.div key={r}
                  className="absolute rounded-full border border-[#DC2626]/30"
                  style={{ width: r, height: r }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 300 }}
                />
              ))}
              {/* Center pin */}
              <motion.div
                className="relative z-10"
                initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"
                  style={{ boxShadow: '0 0 12px rgba(220,38,38,0.8)' }} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info overlay */}
        <div className="relative z-10 h-full flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-white/5 border border-white/8">
              <div className="w-1 h-1 rounded-full bg-[#DC2626] animate-pulse" />
              <span className="text-xs font-mono text-slate-300 uppercase tracking-widest">Tracking</span>
            </div>
          </div>

          <div className="space-y-0.5">
            {ip && <p className="text-xs font-mono text-[#DC2626]">{ip}</p>}
            <p className="text-xs font-semibold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{location}</p>
            <AnimatePresence>
              {isExpanded && (
                <motion.p className="text-xs font-mono text-slate-400"
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {coordinates}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
