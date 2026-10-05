'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Globe2, BarChart2, Search, LayoutDashboard, Shield, Home } from 'lucide-react';
import { AudioControl } from './AudioControl';

const NAV_W = 72; // px — wide enough for 9-char labels at text-[9px] tracking-tight

const LAYERS = [
  { href: '/core/nexus',     icon: Globe2,          label: 'Nexus',     sub: 'God View'   },
  { href: '/core/analysis',  icon: BarChart2,        label: 'Analysis',  sub: 'Triage'     },
  { href: '/core/forensics', icon: Search,           label: 'Forensics', sub: 'Truth View' },
  { href: '/core',           icon: LayoutDashboard,  label: 'Dashboard', sub: 'Overview'   },
];

export function CoreNav() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ x: -NAV_W, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 24 }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col"
      style={{ width: NAV_W }}
      aria-label="Core Navigation"
    >
      {/* Sidebar strip */}
      <div
        className="flex flex-col items-center h-full border-r border-white/[0.12] w-full"
        style={{ background: 'rgba(8,12,20,0.95)', backdropFilter: 'blur(20px)' }}
      >
        {/* Top Brand Mark (h-14 aligns with header border) */}
        <Link
          href="/"
          title="Quorum Core — Return to Home"
          className="flex items-center justify-center w-full h-14 border-b border-white/[0.1] hover:bg-white/[0.05] transition-colors group flex-shrink-0"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded bg-white/[0.05] border border-white/[0.12] group-hover:border-[#DC2626]/60 transition-colors">
            <Shield className="w-4.5 h-4.5 text-[#DC2626]" />
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          </div>
        </Link>

        {/* Nav items */}
        <div className="flex flex-col items-center py-4 gap-2 flex-1 w-full px-1.5">
          {LAYERS.map((layer) => {
            const active = pathname === layer.href || (layer.href !== '/core' && pathname.startsWith(layer.href + '/'));
            const Icon   = layer.icon;
            return (
              <Link
                key={layer.href}
                href={layer.href}
                title={`${layer.label} — ${layer.sub}`}
                className="relative flex flex-col items-center justify-center w-full py-2.5 rounded transition-all duration-150 group overflow-hidden"
                style={{
                  background: active ? 'rgba(220,38,38,0.18)' : 'transparent',
                  border:     active ? '1px solid rgba(220,38,38,0.35)' : '1px solid transparent',
                  color:      active ? '#FFFFFF' : '#CBD5E1',
                }}
              >
                {/* Active indicator bar */}
                {active && (
                  <motion.div
                    layoutId="core-nav-active"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#DC2626]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <Icon
                  className="w-5 h-5 relative z-10 transition-colors duration-150 flex-shrink-0"
                  style={{ color: active ? '#EF4444' : '#94A3B8' }}
                />
                {/* Label — text-[9px] + tracking-tight keeps all 9-char words inside the 72px rail */}
                <span
                  className="text-[9px] font-mono font-bold tracking-tight uppercase mt-1 relative z-10 transition-colors duration-150 w-full text-center leading-tight select-none"
                  style={{ color: active ? '#FFFFFF' : '#94A3B8' }}
                >
                  {layer.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Bottom controls: Audio toggle & home */}
        <div className="flex flex-col items-center py-2.5 w-full border-t border-white/[0.08] flex-shrink-0 px-1.5 gap-2">
          {/* Audio toggle button */}
          <div className="w-full flex flex-col items-center py-1 rounded hover:bg-white/[0.05] transition-colors">
            <AudioControl />
            <span className="text-[8px] font-mono text-slate-400 uppercase mt-0.5 select-none">
              Audio
            </span>
          </div>

          <Link
            href="/"
            title="Quorum Home"
            className="flex flex-col items-center justify-center w-full py-2 rounded text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all group overflow-hidden"
          >
            <Home className="w-4.5 h-4.5 flex-shrink-0" />
            <span className="text-[9px] font-mono font-bold tracking-tight uppercase mt-1 text-slate-300 group-hover:text-white w-full text-center leading-tight select-none">
              Home
            </span>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
