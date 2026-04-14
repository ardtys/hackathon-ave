"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Flame, ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Target, RefreshCw, Activity } from 'lucide-react';
import Link from 'next/link';

// ── Letter avatar fallback ────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#f97316', '#ec4899',
  '#10b981', '#eab308', '#06b6d4', '#ef4444',
];

function avatarColor(symbol: string) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function TokenImage({ logoUrl, symbol, chain, address }: {
  logoUrl: string;
  symbol: string;
  chain: string;
  address: string;
}) {
  // 0 = try logoUrl, 1 = try dexscreener, 2 = show avatar
  const [stage, setStage] = useState(0);

  const dexChain = chain === 'bsc' ? 'bsc' : chain === 'base' ? 'base' : 'solana';
  const dexUrl = `https://dd.dexscreener.com/ds-data/tokens/${dexChain}/${address}.png`;

  const src = stage === 0 ? logoUrl : dexUrl;

  if (stage >= 2 || (!logoUrl && stage === 0)) {
    return (
      <div
        className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-xs"
        style={{ backgroundColor: avatarColor(symbol) }}
      >
        {(symbol || '?').charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={symbol}
      className="w-full h-full object-cover rounded-full"
      onError={() => setStage(s => s + 1)}
    />
  );
}

// ── Token row ─────────────────────────────────────────────────────────────────
function TokenRow({ token, rank, type }: { token: any; rank: number; type: 'gain' | 'loss' }) {
  const isGain = type === 'gain';

  const splitAddr = token.token_id
    ? token.token_id.split('-')
    : [token.token || token.address, token.chain];
  const cleanAddress = splitAddr[0];
  const chain = splitAddr[1] || token.chain || 'solana';

  // price_change_24h from AVE is already a percentage value
  const change24h = parseFloat(token.price_change_24h || token.token_price_change_24h || '0');
  const change1h  = parseFloat(token.token_price_change_1h || '0');
  const price     = parseFloat(token.current_price_usd || token.price || '0');
  const volume    = parseFloat(token.token_tx_volume_usd_24h || token.tx_volume_u_24h || '0');
  const mcap      = parseFloat(token.market_cap || '0');
  const logoUrl   = token.logo_url || token.logo || '';
  const symbol    = token.symbol || '—';
  const name      = token.name  || '';

  const fmtChange = (v: number) => {
    if (Math.abs(v) > 99999) return `>${v > 0 ? '' : '-'}99,999%`;
    return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
  };

  const fmtUsd = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  return (
    <div className="group flex items-center gap-3 px-4 py-3 border-b border-gray-800/40 hover:bg-white/3 transition-colors">
      {/* Rank */}
      <span className="text-[11px] font-mono text-gray-700 w-5 shrink-0 text-right">{rank}</span>

      {/* Logo */}
      <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 overflow-hidden shrink-0 group-hover:border-gray-600 transition-colors">
        <TokenImage logoUrl={logoUrl} symbol={symbol} chain={chain} address={cleanAddress} />
      </div>

      {/* Name + address */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-white font-bold text-sm truncate max-w-30 sm:max-w-none">{symbol}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-900 text-gray-500 uppercase shrink-0">{chain}</span>
        </div>
        <p className="text-[10px] text-gray-600 font-mono mt-0.5 truncate">
          {name || `${cleanAddress.slice(0, 8)}…${cleanAddress.slice(-4)}`}
        </p>
      </div>

      {/* Price + changes */}
      <div className="text-right shrink-0">
        <div className={`text-sm font-bold font-mono flex items-center justify-end gap-0.5 ${isGain ? 'text-neon-green' : 'text-neon-red'}`}>
          {isGain ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {fmtChange(change24h)}
        </div>
        <div className="text-[10px] text-gray-500 font-mono">
          {price > 0 ? `$${price < 0.0001 ? price.toExponential(2) : price.toFixed(price < 0.01 ? 6 : 4)}` : '—'}
        </div>
      </div>

      {/* Extra stats — hidden on small screens */}
      <div className="hidden lg:flex flex-col items-end text-[10px] font-mono text-gray-600 shrink-0 w-20">
        <span className={change1h >= 0 ? 'text-gray-400' : 'text-neon-red'}>
          1h: {change1h >= 0 ? '+' : ''}{change1h.toFixed(2)}%
        </span>
        <span>{volume > 0 ? fmtUsd(volume) : '—'}</span>
      </div>

      {/* Snipe button */}
      <Link
        href={`/sniper?address=${cleanAddress}&chain=${chain}`}
        className="shrink-0 p-2 border border-gray-800 rounded bg-black text-gray-500 hover:text-neon-green hover:border-neon-green transition-all group/btn"
        title="Snipe this token"
      >
        <Target className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
      </Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TrendingDashboard() {
  const [gainers, setGainers] = useState<any[]>([]);
  const [losers, setLosers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMarket = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/market?action=ranks');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setGainers(data.gainers || []);
        setLosers(data.losers  || []);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error(data.error || 'API error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch market data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch + auto-refresh every 30 s
  useEffect(() => {
    fetchMarket();
    const interval = setInterval(() => fetchMarket(false), 30_000);
    return () => clearInterval(interval);
  }, [fetchMarket]);

  const timeAgo = lastUpdated
    ? `${Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago`
    : null;

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-gray-800/80">
        <div className="flex items-center gap-3">
          <Flame className="text-orange-500 w-5 h-5 animate-pulse shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Market Pulse</h2>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">Top Gainers & Losers · auto-refreshes every 30s</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500">
            <span className={`w-1.5 h-1.5 rounded-full ${refreshing ? 'bg-yellow-400 animate-pulse' : 'bg-neon-green'}`} />
            {refreshing ? 'Refreshing...' : timeAgo ? `Updated ${timeAgo}` : 'Live'}
          </div>

          {/* Manual refresh */}
          <button
            onClick={() => fetchMarket(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 hover:text-white border border-gray-800 hover:border-gray-600 px-3 py-1.5 rounded transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-950/20 border border-red-800/30 text-red-400 text-xs font-mono px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-20 gap-4">
          <Activity className="w-8 h-8 text-neon-green animate-spin" />
          <span className="text-gray-500 font-mono text-xs tracking-widest uppercase">Scanning Market...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* GAINERS */}
          <div className="bg-[#0A0A0B] rounded-xl border border-gray-800/80 shadow-lg overflow-hidden flex flex-col">
            <div className="bg-[#111] px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-xs text-white uppercase tracking-widest font-bold flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-neon-green" /> Top Gainers
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-gray-600 font-mono">
                <span className="hidden lg:inline">1h Chg · Vol 24h</span>
                <span>24h</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {gainers.length > 0
                ? gainers.map((t, i) => <TokenRow key={`g-${i}`} token={t} rank={i + 1} type="gain" />)
                : <div className="p-8 text-center text-gray-600 font-mono text-xs">No data available</div>
              }
            </div>
          </div>

          {/* LOSERS */}
          <div className="bg-[#0A0A0B] rounded-xl border border-gray-800/80 shadow-lg overflow-hidden flex flex-col">
            <div className="bg-[#111] px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-xs text-white uppercase tracking-widest font-bold flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-neon-red" /> Top Losers
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-gray-600 font-mono">
                <span className="hidden lg:inline">1h Chg · Vol 24h</span>
                <span>24h</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {losers.length > 0
                ? losers.map((t, i) => <TokenRow key={`l-${i}`} token={t} rank={i + 1} type="loss" />)
                : <div className="p-8 text-center text-gray-600 font-mono text-xs">No data available</div>
              }
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
