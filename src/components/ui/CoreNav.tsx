'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Globe2, BarChart2, Search, ChevronLeft } from 'lucide-react';

const LAYERS = [
  { href: '/core/nexus',    icon: Globe2,    label: 'Nexus',     sub: 'God View' },
  { href: '/core/analysis', icon: BarChart2, label: 'Analysis',  sub: 'Triage' },
  { href: '/core/forensics',icon: Search,    label: 'Forensics', sub: 'Truth View' },
];

export function CoreNav() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 24 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div
        className="flex items-center gap-1 p-1.5 rounded-sm border border-white/[0.08]"
        style={{ background: 'rgba(8,12,20,0.92)', backdropFilter: 'blur(20px)' }}
      >
        {/* Back to home */}
        <Link href="/"
          className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all"
          title="Back to Home"
        >
          <ChevronLeft className="w-3 h-3" />
          <span className="text-[9px] font-mono tracking-widest uppercase hidden sm:block">Home</span>
        </Link>

        <div className="w-px h-6 bg-white/[0.06] mx-1" />

        {LAYERS.map(layer => {
          const active = pathname === layer.href || pathname.startsWith(layer.href + '/');
          const Icon = layer.icon;
          return (
            <Link key={layer.href} href={layer.href}
              className="relative flex items-center gap-2 px-4 py-2 rounded-sm transition-all duration-200"
              style={{
                background: active ? 'rgba(220,38,38,0.12)' : 'transparent',
                color: active ? '#DC2626' : '#64748B',
              }}
            >
              {active && (
                <motion.div
                  layoutId="core-nav-pill"
                  className="absolute inset-0 rounded-sm border border-[#DC2626]/30"
                  style={{ background: 'rgba(220,38,38,0.08)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <div className="relative z-10 hidden sm:block">
                <p className="text-[10px] font-mono font-semibold tracking-widest uppercase" style={{ lineHeight: 1 }}>{layer.label}</p>
                <p className="text-[8px] font-mono tracking-widest" style={{ color: active ? 'rgba(220,38,38,0.6)' : '#334155' }}>{layer.sub}</p>
              </div>
            </Link>
          );
        })}

        <div className="w-px h-6 bg-white/[0.06] mx-1" />

        {/* Legacy Core link */}
        <Link href="/core"
          className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all"
          title="Full Dashboard"
        >
          <span className="text-[9px] font-mono tracking-widest uppercase hidden sm:block">Dashboard</span>
        </Link>
      </div>
    </motion.nav>
  );
}
