'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const CyberMatrixHero = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!isClient || !gridRef.current) return;
    const grid = gridRef.current;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/?;:[]{}\\|!@#$%^&*()_+-=';

    const createGrid = () => {
      grid.innerHTML = '';
      const size = 60;
      const columns = Math.floor(window.innerWidth / size);
      const rows = Math.floor(window.innerHeight / size);
      grid.style.setProperty('--columns', String(columns));
      grid.style.setProperty('--rows', String(rows));

      for (let i = 0; i < columns * rows; i++) {
        const tile = document.createElement('div');
        tile.classList.add('cmh-tile');
        tile.textContent = chars[Math.floor(Math.random() * chars.length)];
        tile.style.setProperty('--intensity', '0');
        grid.appendChild(tile);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const radius = window.innerWidth / 4;
      Array.from(grid.children).forEach((child) => {
        const tile = child as HTMLElement;
        const rect = tile.getBoundingClientRect();
        const tileX = rect.left + rect.width / 2;
        const tileY = rect.top + rect.height / 2;
        const dist = Math.sqrt(Math.pow(e.clientX - tileX, 2) + Math.pow(e.clientY - tileY, 2));
        tile.style.setProperty('--intensity', String(Math.max(0, 1 - dist / radius)));
      });
    };

    window.addEventListener('resize', createGrid);
    window.addEventListener('mousemove', handleMouseMove);
    createGrid();
    return () => {
      window.removeEventListener('resize', createGrid);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isClient]);

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.18 + 0.4, duration: 0.75, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
  };

  return (
    <div className="relative h-screen w-full bg-black flex items-center justify-center overflow-hidden">
      <div ref={gridRef} className="cmh-grid" />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)' }} />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-white/10 bg-black/60 backdrop-blur-md text-xs font-mono text-slate-300 tracking-widest uppercase mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" />
          Campaign-Correlation Detection Active
        </motion.div>

        <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="font-bold tracking-tighter text-white leading-none mb-6"
          style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(3.5rem,10vw,8rem)' }}>
          QUORUM
        </motion.h1>

        <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="max-w-xl mx-auto text-slate-400 leading-relaxed mb-10"
          style={{ fontSize: 'clamp(0.9rem,2vw,1.1rem)' }}>
          Bipartite graph clustering that catches distributed password sprays
          missed by every SIEM volume rule.
        </motion.p>
      </div>
    </div>
  );
};

export default CyberMatrixHero;
