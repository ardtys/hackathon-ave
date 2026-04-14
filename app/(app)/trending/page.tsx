"use client";

import React, { useState, useEffect } from 'react';
import { Flame, ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Target, Copy, ExternalLink, Activity } from 'lucide-react';
import Link from 'next/link';

export default function TrendingDashboard() {
  const [gainers, setGainers] = useState<any[]>([]);
  const [losers, setLosers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMarket() {
      try {
        const res = await fetch('/api/market?action=ranks');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
          setGainers(data.gainers || []);
          setLosers(data.losers || []);
        }
      } catch (err) {
        console.error("Market fetch failed", err);
      }
      setLoading(false);
    }
    fetchMarket();
  }, []);

  const TokenRow = ({ token, type }: { token: any, type: 'gain' | 'loss' }) => {
    const isGain = type === 'gain';
    const numChange = parseFloat(token.price_change_24h || "0");
    const formattedChange = numChange.toFixed(2) + "%";
    
    const [imgError, setImgError] = useState(false);
    
    // Some endpoints return the token address in token_id format (addr-chain)
    const splitAddr = token.token_id ? token.token_id.split('-') : [token.address, token.chain];
    const cleanAddress = splitAddr[0];
    const chain = splitAddr[1] || 'bsc';
    
    // Attempt to use Ave logo, fallback to Dexscreener CDN
    const dexChain = chain === 'bsc' ? 'bsc' : chain;
    const imgSrc = token.logo || `https://dd.dexscreener.com/ds-data/tokens/${dexChain}/${cleanAddress}.png`;

    return (
      <div className="flex items-center justify-between p-3 border-b border-gray-800/50 hover:bg-white/5 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-black border border-gray-800 flex items-center justify-center relative overflow-hidden group-hover:border-gray-600 shrink-0">
            {!imgError ? (
               <img 
                 src={imgSrc} 
                 alt={token.symbol} 
                 className="w-full h-full object-cover" 
                 onError={() => setImgError(true)} 
               />
            ) : (
               <Activity className="w-4 h-4 text-gray-500" />
            )}
          </div>
          <div>
            <h4 className="text-white font-bold text-sm leading-tight flex items-center gap-2">
              {token.symbol}
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-900 text-gray-500 uppercase">{chain}</span>
            </h4>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate w-24 sm:w-auto">{cleanAddress}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-sm font-bold font-mono flex items-center justify-end gap-1 ${isGain ? 'text-[var(--color-neon-green)]' : 'text-[var(--color-neon-red)]'}`}>
            {isGain ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {isGain ? '+' : ''}{formattedChange}
          </div>
          <div className="text-[10px] text-gray-400 font-mono mt-0.5">${parseFloat(token.price || "0").toFixed(6)}</div>
        </div>
        
        <div className="hidden sm:flex items-center gap-2">
           <Link
             href={`/sniper?address=${cleanAddress}&chain=${chain}`}
             className="p-2 border border-gray-800 rounded bg-black text-gray-400 hover:text-[var(--color-neon-green)] hover:border-[var(--color-neon-green)] transition-all group/btn"
             title="Send to Sniper"
           >
             <Target className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
           </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="relative z-10 flex justify-between items-center pb-3 bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-gray-800/80">
        <div>
           <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-3">
             <Flame className="text-orange-500 animate-pulse" /> Market Pulse
           </h2>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] sm:text-xs">
           <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded border border-orange-500/30 uppercase tracking-widest">
             Top Gainers / Losers
           </span>
        </div>
      </header>
      
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-20 gap-4">
           <Activity className="w-8 h-8 text-[var(--color-neon-green)] animate-spin" />
           <span className="text-gray-500 font-mono text-xs tracking-widest uppercase mb-1">Scanning Market Matrix...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 relative z-10">
          {/* GAINERS */}
          <div className="bg-[#0A0A0B] rounded-xl border border-gray-800/80 shadow-lg relative overflow-hidden flex flex-col">
            <div className="bg-[#111] px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm text-white uppercase tracking-widest font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--color-neon-green)]" /> Top Gainers
              </h3>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Last 24h</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
               {gainers.length > 0 ? (
                 gainers.map((t, i) => <TokenRow key={`g-${i}`} token={t} type="gain" />)
               ) : (
                 <div className="p-8 text-center text-gray-500 font-mono text-xs">NO DATA AVAILABLE</div>
               )}
            </div>
          </div>

          {/* LOSERS */}
          <div className="bg-[#0A0A0B] rounded-xl border border-gray-800/80 shadow-lg relative overflow-hidden flex flex-col mt-4 lg:mt-0">
            <div className="bg-[#111] px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm text-white uppercase tracking-widest font-bold flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[var(--color-neon-red)]" /> Top Losers
              </h3>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Last 24h</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
               {losers.length > 0 ? (
                 losers.map((t, i) => <TokenRow key={`l-${i}`} token={t} type="loss" />)
               ) : (
                 <div className="p-8 text-center text-gray-500 font-mono text-xs">NO DATA AVAILABLE</div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
