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
        // Coba Rust backend dulu (port 8080), fallback Next.js API route
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch('http://localhost:8080/health', {
          signal: ctrl.signal,
        }).catch(() => null);
        clearTimeout(timer);

        if (!cancelled) {
          // Rust backend merespons = online; apapun status code-nya dianggap online
          setNodeStatus(res ? 'online' : 'offline');
        }
      } catch {
        if (!cancelled) setNodeStatus('offline');
      }
    }

    checkHealth();
    // Re-check setiap 30 detik
    const interval = setInterval(checkHealth, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const statusColor = {
    checking: 'bg-yellow-400 animate-pulse',
    online:   'bg-green-500 shadow-[0_0_5px_#22c55e]',
    offline:  'bg-red-500',
  }[nodeStatus];

  const statusLabel = {
    checking: 'CHECKING...',
    online:   'CONNECTED',
    offline:  'OFFLINE',
  }[nodeStatus];

  const statusTextColor = {
    checking: 'text-yellow-400',
    online:   'text-gray-400',
    offline:  'text-red-400',
  }[nodeStatus];

  return (
    <aside className="w-20 md:w-64 h-full bg-[#050505]/90 border-r border-gray-800/80 flex flex-col p-4 z-20 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-8 md:px-2">
        <AlphaLogo className="text-[var(--color-neon-green)] shrink-0 w-8 h-8" />
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
          <span className={`text-[10px] font-mono ${statusTextColor}`}>
            NODE: {statusLabel}
          </span>
        </div>
        <div className="text-[10px] text-gray-600 font-mono truncate">API: AVE.AI CLOUD</div>
      </div>
    </aside>
  );
}
