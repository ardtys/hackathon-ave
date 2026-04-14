'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Target, Flame, Briefcase, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import AlphaLogo from './AlphaLogo';

const LINKS = [
  { name: 'SNIPER',    href: '/sniper',    icon: Target   },
  { name: 'TRENDING',  href: '/trending',  icon: Flame    },
  { name: 'PORTFOLIO', href: '/portfolio', icon: Briefcase },
  { name: 'SETTINGS',  href: '/settings',  icon: Settings  },
];

type NodeStatus = 'checking' | 'online' | 'offline';

export default function Sidebar() {
  const pathname = usePathname();
  const [nodeStatus, setNodeStatus] = useState<NodeStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch('http://localhost:8080/health', {
          signal: ctrl.signal,
        }).catch(() => null);
        clearTimeout(timer);
        if (!cancelled) setNodeStatus(res ? 'online' : 'offline');
      } catch {
        if (!cancelled) setNodeStatus('offline');
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const statusColor = {
    checking: 'bg-yellow-400 animate-pulse',
    online:   'bg-green-500 shadow-[0_0_5px_#22c55e]',
    offline:  'bg-red-500',
  }[nodeStatus];

  const statusLabel = { checking: 'CHECKING...', online: 'CONNECTED', offline: 'OFFLINE' }[nodeStatus];
  const statusTextColor = { checking: 'text-yellow-400', online: 'text-gray-400', offline: 'text-red-400' }[nodeStatus];

  return (
    <>
      {/* ── Desktop / tablet sidebar ── */}
      <aside className="hidden sm:flex w-20 md:w-64 h-full bg-[#050505]/90 border-r border-gray-800/80 flex-col p-4 z-20 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 mb-8 md:px-2">
          <AlphaLogo className="text-neon-green shrink-0 w-8 h-8" />
          <div className="hidden md:block">
            <h1 className="text-xl font-black tracking-widest uppercase text-white">
              ALPHA<span className="text-neon-green">CATCH</span>
            </h1>
            <p className="text-[9px] text-gray-500 tracking-widest uppercase truncate">Protocol v2.4</p>
          </div>
        </div>

        <nav className="flex flex-col gap-4">
          {LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative flex items-center gap-4 px-2 md:px-4 py-3 rounded uppercase text-xs font-bold tracking-widest transition-all overflow-hidden ${
                  isActive
                    ? 'bg-neon-green/10 text-neon-green border-l-2 border-neon-green'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden md:inline">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden md:block border-t border-gray-800/50 pt-4 px-2">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
            <span className={`text-[10px] font-mono ${statusTextColor}`}>NODE: {statusLabel}</span>
          </div>
          <div className="text-[10px] text-gray-600 font-mono truncate">API: AVE.AI CLOUD</div>
        </div>
      </aside>

      {/* ── Mobile bottom navigation ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050505]/95 border-t border-gray-800/80 backdrop-blur-md">
        <div className="flex items-center justify-around px-1 py-2">
          {LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition-all ${
                  isActive ? 'text-neon-green' : 'text-gray-500 active:text-gray-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_4px_var(--color-neon-green)]' : ''}`} />
                <span className="text-[9px] font-bold tracking-widest uppercase">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
