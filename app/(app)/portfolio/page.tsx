"use client";

import { useState, useEffect, useMemo } from 'react';
import { Briefcase, Wallet, RefreshCw, ArrowUpRight, ArrowDownRight, Activity, AlertTriangle, Zap, Server } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface Asset {
  symbol: string;
  name: string;
  balance: string;
  value: number;
  change: number;
  chain: string;
  address: string;
}

function isSolana(addr: string) {
  return !addr.startsWith('0x') && addr.length >= 32;
}

function AssetIcon({ asset }: { asset: Asset }) {
  const [imgError, setImgError] = useState(false);
  const dexChain = asset.chain === 'bsc' ? 'bsc' : asset.chain === 'base' ? 'base' : asset.chain;
  const imgSrc = `https://dd.dexscreener.com/ds-data/tokens/${dexChain}/${asset.address}.png`;
  return (
    <div className="w-8 h-8 rounded-full bg-black border border-gray-800 flex items-center justify-center overflow-hidden shrink-0">
      {imgError
        ? <Activity className="w-4 h-4 text-gray-500" />
        : <img src={imgSrc} alt={asset.symbol} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      }
    </div>
  );
}

// Desktop table row
function AssetRow({ asset, onSell }: { asset: Asset; onSell: (symbol: string) => void }) {
  return (
    <tr className="hover:bg-white/5 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <AssetIcon asset={asset} />
          <div>
            <div className="text-white font-bold text-sm flex items-center gap-2">
              {asset.symbol}
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-900 text-gray-500 uppercase">{asset.chain}</span>
            </div>
            <div className="text-[10px] text-gray-500">{asset.name}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-right text-gray-300 font-mono text-sm">{asset.balance}</td>
      <td className="px-6 py-4 text-right font-bold font-mono text-sm">
        {asset.value > 0
          ? <span className="text-white">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          : <span className="text-gray-600">—</span>}
      </td>
      <td className="px-6 py-4 text-right font-bold font-mono text-sm">
        {asset.change !== 0 ? (
          <span className={asset.change >= 0 ? 'text-neon-green' : 'text-neon-red'}>
            <span className="flex items-center justify-end gap-1">
              {asset.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {asset.change > 0 ? '+' : ''}{asset.change.toFixed(2)}%
            </span>
          </span>
        ) : <span className="text-gray-600">—</span>}
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Link href={`/sniper?address=${asset.address}&chain=${asset.chain}`}
            className="text-[10px] border border-gray-700 bg-black text-gray-300 hover:text-neon-green hover:border-neon-green px-2.5 py-1 rounded transition-colors uppercase tracking-widest">
            Snipe
          </Link>
          <button onClick={() => onSell(asset.symbol)}
            className="text-[10px] border border-gray-700 bg-black text-gray-300 hover:text-neon-red hover:border-neon-red px-2.5 py-1 rounded transition-colors uppercase tracking-widest">
            Sell
          </button>
        </div>
      </td>
    </tr>
  );
}

// Mobile card
function AssetCard({ asset, onSell }: { asset: Asset; onSell: (symbol: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-800/50 last:border-0">
      <AssetIcon asset={asset} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-white font-bold text-sm">{asset.symbol}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-900 text-gray-500 uppercase">{asset.chain}</span>
        </div>
        <div className="text-[10px] text-gray-500 truncate">{asset.balance}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-bold font-mono text-white">
          {asset.value > 0 ? `$${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
        </div>
        {asset.change !== 0 && (
          <div className={`text-[10px] font-mono flex items-center justify-end gap-0.5 ${asset.change >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
            {asset.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {asset.change > 0 ? '+' : ''}{asset.change.toFixed(2)}%
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 shrink-0 ml-1">
        <Link href={`/sniper?address=${asset.address}&chain=${asset.chain}`}
          className="text-[10px] border border-gray-700 bg-black text-gray-300 hover:text-neon-green hover:border-neon-green px-2 py-1 rounded transition-colors uppercase tracking-widest text-center">
          Snipe
        </Link>
        <button onClick={() => onSell(asset.symbol)}
          className="text-[10px] border border-gray-700 bg-black text-gray-300 hover:text-neon-red hover:border-neon-red px-2 py-1 rounded transition-colors uppercase tracking-widest">
          Sell
        </button>
      </div>
    </div>
  );
}

export default function PortfolioDashboard() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // For EVM multi-chain selection
  const [evmChain, setEvmChain] = useState<'ethereum' | 'bsc' | 'base'>('ethereum');

  const totalValue = assets.reduce((a, b) => a + b.value, 0);

  const mockHistory = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      time: i,
      value: Math.max(totalValue * 0.8 + seededRandom(i) * totalValue * 0.3 + i * 100, 1),
    })),
    [totalValue]
  );

  const loadPortfolio = async (wallet: string, chain?: string) => {
    setLoading(true);
    setError(null);
    try {
      const type = isSolana(wallet) ? 'solana' : 'evm';
      const chainQ = type === 'evm' ? `&chain=${chain ?? evmChain}` : '';
      const res = await fetch(`/api/portfolio?wallet=${encodeURIComponent(wallet)}&type=${type}${chainQ}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to fetch portfolio');
        setAssets([]);
      } else {
        setAssets(data.assets ?? []);
        if ((data.assets ?? []).length === 0) {
          setError('No tokens with balance found in this wallet.');
        }
      }
    } catch (e: any) {
      setError('Could not connect to portfolio API.');
      setAssets([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const w = localStorage.getItem('alphacatch_wallet');
    setWalletAddress(w);
    if (w) {
      loadPortfolio(w);
    } else {
      setLoading(false);
    }
  }, []);

  const handleSell = (symbol: string) => {
    setNotice(`To sell ${symbol}, use the Sniper tab with your wallet connected.`);
    setTimeout(() => setNotice(null), 4000);
  };

  const walletType = walletAddress ? (isSolana(walletAddress) ? 'Solana' : 'EVM') : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <header className="relative z-10 flex justify-between items-center pb-3 bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-gray-800/80">
        <div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-3">
            <Briefcase className="text-neon-green" /> Treasury & Portfolio
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          {walletAddress ? (
            <div className="bg-neon-green/10 border border-neon-green/30 text-neon-green px-3 py-1.5 rounded flex items-center gap-2 font-mono">
              <Wallet className="w-3 h-3" />
              {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              <span className="text-gray-500 border-l border-neon-green/20 pl-2">{walletType}</span>
            </div>
          ) : (
            <Link href="/settings" className="bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 px-3 py-1.5 rounded flex items-center gap-2 transition-colors">
              <Wallet className="w-3 h-3" /> Connect Wallet
            </Link>
          )}
          <div className="bg-black border border-gray-800 px-3 py-1.5 rounded flex items-center gap-2">
            <Server className="w-3 h-3 text-blue-500" />
            <span className="text-gray-400">NETWORK:</span>
            <span className="text-white font-bold uppercase">{walletType ?? 'Multi-chain'}</span>
          </div>
        </div>
      </header>

      {/* Notice */}
      {notice && (
        <div className="relative z-10 bg-yellow-950/30 border border-yellow-500/30 text-yellow-400 text-xs font-mono px-4 py-2 rounded-lg">
          {notice}
        </div>
      )}

      {/* No wallet */}
      {!walletAddress && !loading && (
        <div className="flex flex-col items-center justify-center p-20 gap-4 bg-[#0A0A0B] rounded-xl border border-gray-800/80">
          <Wallet className="w-10 h-10 text-gray-700" />
          <p className="text-gray-500 font-mono text-sm text-center">
            No wallet connected.<br />
            Use the <span className="text-neon-green">Connect Wallet</span> button in the top bar.
          </p>
        </div>
      )}

      {walletAddress && (
        <>
          {/* EVM chain selector */}
          {!isSolana(walletAddress) && (
            <div className="relative z-10 flex items-center gap-3 text-[10px]">
              <span className="text-gray-500 uppercase tracking-widest font-mono">Chain:</span>
              {(['ethereum', 'bsc', 'base'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => { setEvmChain(c); loadPortfolio(walletAddress, c); }}
                  className={`px-3 py-1.5 rounded border uppercase tracking-widest font-mono transition-colors ${evmChain === c ? 'border-neon-green text-neon-green bg-neon-green/5' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">
            {/* Balance card */}
            <div className="bg-[#0A0A0B] rounded-xl border border-gray-800/80 shadow-lg p-6 lg:col-span-2 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 text-gray-800/20 group-hover:text-neon-green/5 transition-colors">
                <Wallet className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Net Treasury Value</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
                  <div>
                    {loading ? (
                      <div className="flex items-center gap-3 text-gray-500 font-mono text-sm animate-pulse">
                        <Activity className="w-4 h-4 animate-spin" /> Fetching on-chain balances...
                      </div>
                    ) : (
                      <>
                        <div className="text-5xl font-black text-white font-mono tracking-tighter mb-1">
                          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-xs text-gray-500 font-mono">{assets.length} asset{assets.length !== 1 ? 's' : ''} found</span>
                      </>
                    )}
                  </div>
                  {!loading && totalValue > 0 && (
                    <div className="w-full sm:w-48 h-16 ml-auto opacity-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockHistory}>
                          <defs>
                            <linearGradient id="colorValueP" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorValueP)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => loadPortfolio(walletAddress, evmChain)}
                  disabled={loading}
                  className="flex items-center gap-2 bg-black border border-gray-700 text-white px-6 py-2.5 rounded font-bold text-sm tracking-widest uppercase hover:border-gray-500 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Wallet
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-[#0A0A0B] rounded-xl border border-gray-800/80 shadow-lg p-6 flex flex-col justify-center gap-6">
              <div>
                <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">Active Positions</div>
                <div className="text-2xl font-bold text-white font-mono">{loading ? '—' : assets.length}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">Wallet</div>
                <div className="text-xs font-bold text-neon-green font-mono break-all">
                  {walletAddress.slice(0, 10)}…{walletAddress.slice(-6)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">Network</div>
                <div className="text-lg font-bold text-blue-400 font-mono flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  {walletType}
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && !loading && (
            <div className="relative z-10 bg-yellow-950/20 border border-yellow-500/30 text-yellow-400 text-xs font-mono px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="bg-[#0A0A0B] rounded-xl border border-gray-800/80 shadow-lg relative z-10 overflow-hidden">
              <div className="bg-[#111] px-6 py-4 border-b border-gray-800">
                <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
              </div>
              <div className="p-6 flex flex-col gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-800 shrink-0" />
                    <div className="flex-1 h-4 bg-gray-800 rounded" />
                    <div className="w-24 h-4 bg-gray-800 rounded" />
                    <div className="w-20 h-4 bg-gray-800 rounded" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assets — cards on mobile, table on desktop */}
          {!loading && assets.length > 0 && (
            <div className="bg-[#0A0A0B] rounded-xl border border-gray-800/80 shadow-lg relative z-10 overflow-hidden">
              <div className="bg-[#111] px-4 md:px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-sm text-white uppercase tracking-widest font-bold">Asset Breakdown</h3>
                <span className="text-[10px] text-gray-500 font-mono">{assets.length} token{assets.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden">
                {assets.map(asset => (
                  <AssetCard key={`${asset.chain}-${asset.address}`} asset={asset} onSell={handleSell} />
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm font-mono">
                  <thead>
                    <tr className="border-b border-gray-800/50 text-[10px] text-gray-500 uppercase tracking-widest bg-black/40">
                      <th className="px-6 py-4 font-normal">Asset</th>
                      <th className="px-6 py-4 font-normal text-right">Balance</th>
                      <th className="px-6 py-4 font-normal text-right">Value (USD)</th>
                      <th className="px-6 py-4 font-normal text-right">24h Change</th>
                      <th className="px-6 py-4 font-normal text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/30">
                    {assets.map(asset => (
                      <AssetRow key={`${asset.chain}-${asset.address}`} asset={asset} onSell={handleSell} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
