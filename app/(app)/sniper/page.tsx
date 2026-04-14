"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, AreaChart, Area, ComposedChart } from "recharts";
import { Play, Activity, AlertTriangle, ShieldCheck, Crosshair, Zap, Cpu, Database, Eye, Wallet } from "lucide-react";
import { loadSettings, RISK_PRESETS, DEFAULT_SETTINGS, type AppSettings } from '../settings/page';

// Advanced mock data generator with more indicators for visual complexity
const generateMockData = () => {
  const data = [];
  let price = 0.0001;
  for (let i = 0; i < 40; i++) {
    const volatility = (Math.random() - 0.5) * 0.000015;
    price += volatility;
    
    // Calculate Bollinger Bands mock
    const stdDev = 0.000008 + (Math.random() * 0.000002);
    const upperBB = price + (stdDev * 2);
    const lowerBB = price - (stdDev * 2);

    data.push({
      time: i,
      formattedTime: `10:${i < 10 ? '0'+i : i}:00`,
      price: Number(price.toFixed(8)),
      volume: Math.floor(Math.random() * 2000000) + 500000,
      rsi: Number((30 + Math.random() * 45).toFixed(1)),
      vwap: Number((price * (1 + (Math.random() - 0.5) * 0.005)).toFixed(8)),
      upperBB: Number(upperBB.toFixed(8)),
      lowerBB: Number(lowerBB.toFixed(8)),
      momentum: Number(((Math.random() - 0.4) * 10).toFixed(2))
    });
  }
  return data;
};

function SniperContent() {
  const searchParams = useSearchParams();
  const initAddress = searchParams.get('address') || "0XDEED...A1B2";
  const initChain = searchParams.get('chain') || "solana";

  const [address, setAddress] = useState(initAddress.trim());
  const [timeframe, setTimeframe] = useState("1m");
  const [chain, setChain] = useState(initChain);
  const [autoTrade, setAutoTrade] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [status, setStatus] = useState("MONITORING");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [offchainData, setOffchainData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>(generateMockData());
  const [logs, setLogs] = useState<string[]>([
    `Ready. Paste a contract address and click Analyze.`
  ]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Load settings and wallet from localStorage on mount
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setAutoTrade(s.autoTradeEnabled);
    const w = localStorage.getItem('alphacatch_wallet');
    setWalletAddress(w);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleAutoTradeToggle = () => {
    if (!walletAddress && !autoTrade) {
      addLog('No wallet connected — go to Settings to connect a wallet first.', 'WARN');
      return;
    }
    const newVal = !autoTrade;
    setAutoTrade(newVal);
    const newSettings = { ...settings, autoTradeEnabled: newVal };
    setSettings(newSettings);
    localStorage.setItem('alphacatch_settings', JSON.stringify(newSettings));
    addLog(`Auto-trade ${newVal ? 'ENABLED' : 'DISABLED'}.`, 'INFO');
  };

  const addLog = (msg: string, type: 'INFO' | 'WARN' | 'EXEC' | 'ERR' = 'INFO') => {
    const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);
    setLogs(prev => [...prev.slice(-40), `[${timestamp}][${type}] ${msg}`]);
  };

  const onAnalyze = async () => {
    if (!address) {
      addLog("NULL_PTR_EXCEPTION: Token address missing.", 'ERR');
      return;
    }
    setStatus("COMPUTING");
    addLog(`Fetching data for ${address}...`, 'EXEC');
    addLog(`Running scoring engine...`, 'INFO');

    // Fetch offchain data in parallel
    fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`)
      .then(res => res.json())
      .then(dex => {
         if (dex && dex.pairs && dex.pairs.length > 0) {
            const pair = dex.pairs[0];
            setOffchainData({
               image: pair.info?.imageUrl,
               websites: pair.info?.websites || [],
               socials: pair.info?.socials || []
            });
            addLog(`Token metadata loaded from DexScreener.`, 'INFO');
         } else {
            setOffchainData(null);
         }
      })
      .catch(() => addLog(`DexScreener metadata unavailable.`, 'WARN'));

    try {
      let res;
      let data;
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        try {
          // Local dev: coba Rust backend dulu (timeout 5 detik)
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 5000);
          res = await fetch(`http://localhost:8080/api/analyze/${address}?timeframe=${timeframe}&chain=${chain}`, { signal: ctrl.signal });
          clearTimeout(timer);
          if (!res.ok) throw new Error("Rust API failed");
          data = await res.json();
          addLog(`Connected to Rust engine.`, 'INFO');
        } catch {
          addLog(`Rust engine offline — using Next.js API route.`, 'WARN');
          res = await fetch(`/api/analyze/${address}?timeframe=${timeframe}&chain=${chain}`);
          if (!res.ok) throw new Error("API Route failed");
          data = await res.json();
        }
      } else {
        // Production: langsung pakai Next.js API route
        res = await fetch(`/api/analyze/${address}?timeframe=${timeframe}&chain=${chain}`);
        if (!res.ok) throw new Error("API Route failed");
        data = await res.json();
      }
      
      
      setAnalysisResult(data);
      addLog(`Score: ${data.total_score} — Signal: ${data.signal}`, 'EXEC');
      addLog(`Stop-loss set at ${data.initial_sl.toFixed(8)}`, 'WARN');
      
      // Update chart data with real candles — compute per-candle indicators
      if (data.api_candles && data.api_candles.length > 0) {
        const candles: any[] = data.api_candles;
        const closes = candles.map((c: any) => c.c ?? c.close ?? 0);
        const highs  = candles.map((c: any) => c.h ?? c.high  ?? 0);
        const lows   = candles.map((c: any) => c.l ?? c.low   ?? 0);
        const vols   = candles.map((c: any) => c.v ?? c.volume ?? 0);

        const newChartData = candles.map((_c: any, i: number) => {
          const slice = closes.slice(0, i + 1);

          // Per-candle RSI (period 7) — needs at least 8 data points
          let rsiVal: number | null = null;
          if (slice.length > 7) {
            let gains = 0, losses = 0;
            for (let j = 1; j <= 7; j++) {
              const d = slice[j] - slice[j - 1];
              if (d > 0) gains += d; else losses -= d;
            }
            let ag = gains / 7, al = losses / 7;
            for (let j = 8; j < slice.length; j++) {
              const d = slice[j] - slice[j - 1];
              ag = ((ag * 6) + (d > 0 ? d : 0)) / 7;
              al = ((al * 6) + (d < 0 ? -d : 0)) / 7;
            }
            rsiVal = al === 0 ? 100 : 100 - (100 / (1 + ag / al));
          }

          // Per-candle Bollinger Bands (period 20)
          let upperBB: number | null = null;
          let lowerBB: number | null = null;
          if (slice.length >= 20) {
            const window = slice.slice(-20);
            const sma = window.reduce((a: number, b: number) => a + b, 0) / 20;
            const std = Math.sqrt(window.reduce((a: number, b: number) => a + Math.pow(b - sma, 2), 0) / 20);
            upperBB = sma + 2 * std;
            lowerBB = sma - 2 * std;
          }

          // Cumulative VWAP up to this candle
          let vwapVal: number | null = null;
          let tpVol = 0, totalVol = 0;
          for (let j = 0; j <= i; j++) {
            const tp = (highs[j] + lows[j] + closes[j]) / 3;
            tpVol += tp * vols[j];
            totalVol += vols[j];
          }
          if (totalVol > 0) vwapVal = tpVol / totalVol;

          return {
            time: i,
            price: closes[i],
            volume: vols[i],
            rsi: rsiVal !== null ? Number(rsiVal.toFixed(2)) : null,
            vwap: vwapVal !== null ? Number(vwapVal.toFixed(8)) : null,
            upperBB: upperBB !== null ? Number(upperBB.toFixed(8)) : null,
            lowerBB: lowerBB !== null ? Number(lowerBB.toFixed(8)) : null,
          };
        });
        setChartData(newChartData);
      }
      
      setStatus("EXECUTION_READY");

      if (autoTrade && data.signal === "BUY" && data.total_score >= settings.scoreThreshold) {
        addLog(`Auto-trade: BUY signal confirmed (score ${data.total_score} >= ${settings.scoreThreshold}), sending $${settings.tradeAmountUsd} via AVE Cloud SDK...`, 'WARN');
        try {
          const tradeRes = await fetch('/api/trade/quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chain: chain,
              inToken: chain === 'solana' ? 'sol' : '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              outToken: address,
              amount: String(settings.tradeAmountUsd),
              swapType: 'buy'
            })
          });
          const tradeData = await tradeRes.json();
          if (tradeData.success) {
            addLog(`Trade executed: ${tradeData.output.replace(/\n/g, ' ')}`, 'EXEC');
          } else {
            addLog(`Trade failed: ${tradeData.error}`, 'ERR');
          }
        } catch (err) {
          addLog(`Failed to reach AVE SDK trade endpoint.`, 'ERR');
        }
      }

    } catch (e) {
      addLog(`Error: could not reach AVE API.`, 'ERR');
      setStatus("MONITORING");
    }
  };

  const getSignalColor = (signal: string) => {
    if (signal === "BUY") return "text-[var(--color-neon-green)] border-[var(--color-neon-green)] glow-green bg-green-950/20";
    if (signal === "AVOID") return "text-[var(--color-neon-red)] border-[var(--color-neon-red)] glow-red bg-red-950/20";
    return "text-yellow-400 border-yellow-400 bg-yellow-950/20";
  };

  // Custom Tooltip syntax
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-gray-700 p-3 font-mono text-xs backdrop-blur-md">
          <p className="text-gray-400 mb-1 border-b border-gray-800 pb-1">Candle {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name.toUpperCase()}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <header className="relative z-10 flex justify-between items-center pb-3 bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-gray-800/80">
        <div>
           <h2 className="text-xl font-bold text-white tracking-tight">Token Scanner</h2>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] sm:text-xs">
          <div className="flex items-center gap-2 border border-gray-800 px-3 py-1 rounded bg-black/50 overflow-hidden relative group">
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-neon-green)] to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className={`w-2.5 h-2.5 rounded-full ${status === 'MONITORING' || status === 'EXECUTION_READY' ? 'bg-neon-green' : 'bg-yellow-400 animate-bounce'}`}></div>
            <span className="text-gray-400 text-[10px]">Status: <span className="text-white font-semibold">{status}</span></span>
          </div>
        </div>
      </header>

      {/* Target Acquisition Bar */}
      <section className="relative z-10 flex flex-col md:flex-row gap-3 bg-[var(--color-panel-bg)]/80 backdrop-blur-md p-4 rounded-xl border border-gray-800 shadow-2xl">
        <div className="flex-1 relative flex items-center group">
          <Crosshair className="absolute left-3 w-5 h-5 text-gray-500 group-focus-within:text-[var(--color-neon-green)] transition-colors" />
          <input 
            type="text" 
            placeholder="Paste contract address..."
            className="w-full bg-[#050505] border border-gray-800 p-3 pl-10 rounded font-mono text-sm focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all shadow-inner text-neon-green"
            value={address}
            onChange={(e) => setAddress(e.target.value.trim())}
          />
        </div>
        <select 
          className="bg-[#050505] border border-gray-800 p-3 rounded text-sm focus:outline-none focus:border-[var(--color-neon-green)] font-mono hover:bg-[#111] transition-colors"
          value={chain}
          onChange={(e) => setChain(e.target.value)}
        >
          <option value="solana">Solana</option>
          <option value="base">Base</option>
          <option value="bsc">BSC</option>
        </select>
        <select 
          className="bg-[#050505] border border-gray-800 p-3 rounded text-sm focus:outline-none focus:border-[var(--color-neon-green)] font-mono hover:bg-[#111] transition-colors"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
        >
          <option value="1m">1 min</option>
          <option value="5m">5 min</option>
          <option value="15m">15 min</option>
        </select>
        <button 
          onClick={onAnalyze}
          disabled={status === "COMPUTING"}
          className="relative overflow-hidden bg-[#050505] text-neon-green border border-neon-green px-10 py-3 rounded font-bold tracking-widest uppercase transition-all flex items-center gap-3 group hover:bg-neon-green/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-[var(--color-neon-green)] opacity-0 group-hover:opacity-10 transition-opacity"></div>
          {status === "COMPUTING" ? <ShieldCheck className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />}
          {status === "COMPUTING" ? "Analyzing..." : "Analyze"}
        </button>
        <button
          onClick={handleAutoTradeToggle}
          title={!walletAddress && !autoTrade ? 'Connect wallet in Settings first' : undefined}
          className={`px-4 py-3 border rounded flex items-center gap-2 font-semibold transition-all uppercase text-xs ${autoTrade ? 'border-neon-green text-neon-green bg-neon-green/5' : !walletAddress ? 'border-gray-800 text-gray-700 bg-black cursor-not-allowed' : 'border-gray-800 text-gray-500 hover:border-gray-600 bg-black'}`}
        >
          {autoTrade ? <Zap className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
          {autoTrade ? 'Auto: On' : !walletAddress ? 'No Wallet' : 'Auto: Off'}
        </button>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 flex-1 relative z-10">
        
        {/* Main Analytics View */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          
          {/* Signal Assessment Matrix */}
          {analysisResult && (
            <div className={`relative overflow-hidden border p-6 rounded-xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-500 ease-out ${getSignalColor(analysisResult.signal)}`}>
              {/* Decorative scanline */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 animate-[scan_3s_linear_infinite] pointer-events-none"></div>

              <div className="flex flex-col items-center md:items-start z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-current animate-ping"></div>
                  <span className="text-xs font-medium text-white/50">Signal</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-black tracking-tighter drop-shadow-lg">{analysisResult.signal}</span>
                  <span className="text-xl font-bold opacity-80 border-l-2 pl-4 border-current">SCORE: {analysisResult.total_score}/10</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center md:text-left z-10 w-full md:w-auto">
                <div className="bg-black/50 p-4 rounded-lg border border-white/10 flex flex-col hover:border-white/30 transition-colors">
                  <span className="text-[10px] text-gray-500 tracking-wider mb-1 flex items-center gap-1 justify-center md:justify-start"><Eye className="w-3 h-3"/> ENTRY POINT</span>
                  <span className="text-xl font-mono font-bold text-white shadow-black drop-shadow-md">{analysisResult.entry_price?.toFixed(8)}</span>
                </div>
                <div className="bg-[var(--color-neon-green)]/10 p-4 rounded-lg border border-[var(--color-neon-green)]/30 flex flex-col hover:bg-[var(--color-neon-green)]/20 transition-colors">
                  <span className="text-[10px] text-[var(--color-neon-green)] tracking-wider mb-1">Take Profit</span>
                  <span className="text-xl font-mono font-bold text-[var(--color-neon-green)] drop-shadow-md">{analysisResult.tp1?.toFixed(8)}</span>
                  <span className="text-xs font-mono text-white/60">TP2: {analysisResult.tp2?.toFixed(8)}</span>
                </div>
                <div className="bg-[var(--color-neon-red)]/10 p-4 rounded-lg border border-[var(--color-neon-red)]/30 flex flex-col hover:bg-[var(--color-neon-red)]/20 transition-colors">
                  <span className="text-[10px] text-[var(--color-neon-red)] tracking-wider mb-1 flex items-center gap-1 justify-center md:justify-start"><AlertTriangle className="w-3 h-3"/> STOP LOSS</span>
                  <span className="text-xl font-mono font-bold text-[var(--color-neon-red)] drop-shadow-md">{analysisResult.initial_sl?.toFixed(8)}</span>
                  <span className="text-[10px] text-white/40 uppercase mt-1">Trail SL @ BE after TP1</span>
                </div>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Primary Price Action Context */}
            <div className="bg-[#0A0A0B] p-5 rounded-xl border border-gray-800/80 shadow-lg relative group overflow-hidden">
              {analysisResult?.token_info ? (
                <div className="absolute top-0 right-0 bg-gray-800/80 px-3 py-1.5 text-[10px] text-[var(--color-neon-green)] font-bold rounded-bl-lg flex items-center gap-3 z-10 backdrop-blur-sm border-b border-l border-gray-700">
                   {offchainData?.image && <img src={offchainData.image} alt="Token" className="w-4 h-4 rounded-full" />}
                   <span>{analysisResult.token_info.symbol || 'TICKER'}</span>
                   <span className="text-gray-400 font-normal">{analysisResult.token_info.name || ''}</span>
                   {analysisResult.token_info.market_cap && <span>${(Number(analysisResult.token_info.market_cap)/1000000).toFixed(2)}M MCAP</span>}
                   
                   {/* Social Links from Offchain */}
                   <div className="flex items-center gap-2 ml-2 border-l border-gray-600 pl-2">
                     {offchainData?.websites?.[0] && <a href={offchainData.websites[0].url} target="_blank" className="hover:text-white transition-colors">WEB</a>}
                     {offchainData?.socials?.find((s:any) => s.type === 'twitter') && <a href={offchainData.socials.find((s:any) => s.type === 'twitter').url} target="_blank" className="hover:text-blue-400 transition-colors">X</a>}
                     {offchainData?.socials?.find((s:any) => s.type === 'telegram') && <a href={offchainData.socials.find((s:any) => s.type === 'telegram').url} target="_blank" className="hover:text-blue-400 transition-colors">TG</a>}
                   </div>
                </div>
              ) : (
                <div className="absolute top-0 right-0 bg-gray-800/50 px-2 py-1 text-[9px] rounded-bl-lg rounded-tr-xl text-gray-500">Price Chart</div>
              )}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xs text-white font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" /> Price & VWAP
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-1">Bollinger Bands (20,2) Integration</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white font-mono flex items-center gap-2 justify-end">
                     {analysisResult ? chartData[chartData.length-1].price : '---'}
                     {analysisResult?.token_info?.price_change_24h && (
                       <span className={`text-[10px] ${analysisResult.token_info.price_change_24h >= 0 ? 'text-[var(--color-neon-green)]' : 'text-[var(--color-neon-red)]'}`}>
                         {analysisResult.token_info.price_change_24h > 0 ? '+' : ''}{Number(analysisResult.token_info.price_change_24h).toFixed(2)}%
                       </span>
                     )}
                  </div>
                  <div className="text-[10px] text-blue-400 font-mono mt-1">VWAP: {analysisResult?.vwap?.toFixed(8) || '---'}</div>
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#666'}} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#333', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="upperBB" stroke="none" fill="#ffffff" fillOpacity={0.02} />
                    <Area type="monotone" dataKey="lowerBB" stroke="none" fill="#000000" fillOpacity={0.5} />
                    <Line type="monotone" dataKey="price" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="vwap" stroke="#4db8ff" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                    <Line type="monotone" dataKey="upperBB" stroke="#666" strokeWidth={1} dot={false} strokeOpacity={0.5} />
                    <Line type="monotone" dataKey="lowerBB" stroke="#666" strokeWidth={1} dot={false} strokeOpacity={0.5} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Momentum & RSI Node */}
            <div className="bg-[#0A0A0B] p-5 rounded-xl border border-gray-800/80 shadow-lg relative">
              <div className="absolute top-0 right-0 bg-gray-800/50 px-2 py-1 text-[9px] rounded-bl-lg rounded-tr-xl text-gray-500">RSI (7)</div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xs text-white font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" /> RSI
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-1">Relative Strength Index (7)</p>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold font-mono ${analysisResult?.rsi < 30 ? 'text-[var(--color-neon-green)]' : analysisResult?.rsi > 70 ? 'text-[var(--color-neon-red)]' : 'text-gray-300'}`}>
                    {analysisResult?.rsi?.toFixed(2) || '---'}
                  </div>
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRsi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 100]} ticks={[30, 50, 70]} tick={{fontSize: 10, fill: '#666'}} axisLine={false} tickLine={false} />
                    <ReferenceLine y={70} stroke="#f87171" strokeDasharray="3 3" opacity={0.5} />
                    <ReferenceLine y={50} stroke="#444" strokeDasharray="2 2" />
                    <ReferenceLine y={30} stroke="#38bdf8" strokeDasharray="3 3" opacity={0.5} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#333' }} />
                    <Area type="monotone" dataKey="rsi" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorRsi)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Volume Spike Detector */}
            <div className="bg-[#0A0A0B] p-5 rounded-xl border border-gray-800/80 shadow-lg md:col-span-2 relative mt-2">
              <div className="absolute top-0 right-0 bg-gray-800/50 px-2 py-1 text-[9px] rounded-bl-lg rounded-tr-xl text-gray-500">Volume</div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xs text-white font-semibold flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" /> Volume
                  </h3>
                  <div className="mt-2 flex gap-3 text-[10px]">
                    <span className="bg-gray-900 px-2 py-1 rounded text-gray-400">STATUS: {analysisResult?.volume_status || 'AWAITING DATA'}</span>
                    <span className="bg-gray-900 px-2 py-1 rounded text-gray-400">BB: {analysisResult?.bb_status || 'NORMAL'}</span>
                  </div>
                </div>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="time" hide />
                    <Tooltip cursor={{fill: '#111'}} contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                    <Bar dataKey="volume" fill="#222" radius={[2, 2, 0, 0]}>
                      {
                        chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.volume > 1500000 ? '#38bdf8' : entry.volume > 1000000 ? '#818cf8' : '#333'} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Console / Terminal Section */}
        <div className="bg-[#050505] p-1 rounded-xl border border-gray-800 shadow-2xl flex flex-col h-[700px] xl:h-[calc(100vh-140px)] relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none"></div>
          
          <div className="bg-[#111] px-4 py-3 rounded-t-lg border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-[10px] text-gray-400 font-semibold flex items-center gap-2">
              <Cpu className="w-3 h-3 text-[var(--color-neon-green)]" /> Activity Log
            </h3>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
              <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto font-mono text-[11px] p-4 custom-scrollbar">
            {logs.map((log, idx) => {
              let config = { color: "text-gray-500", icon: "→" };
              
              if (log.includes("[ERR]") || log.includes("EXCEPTION")) config = { color: "text-[var(--color-neon-red)]", icon: "×" };
              else if (log.includes("[EXEC]")) config = { color: "text-[var(--color-neon-green)]", icon: "✓" };
              else if (log.includes("[WARN]")) config = { color: "text-yellow-400", icon: "!" };
              else if (log.includes("[SYS_INIT]") || log.includes("OK")) config = { color: "text-blue-400", icon: "⚡" };
              
              return (
                <div key={idx} className={`mb-2.5 break-words flex gap-2 ${config.color} leading-relaxed hover:bg-white/5 p-1 rounded transition-colors`}>
                  <span className="opacity-50 select-none">{config.icon}</span>
                  <span className="flex-1">
                    {log}
                  </span>
                </div>
              );
            })}
            {status === "COMPUTING" && (
              <div className="flex gap-2 text-neon-green animate-pulse p-1">
                <span>_</span>
                <span>Analyzing...</span>
              </div>
            )}
            <div ref={logEndRef} className="h-4" />
          </div>
          
          <div className="bg-[#0A0A0A] p-3 rounded-b-lg border-t border-gray-800">
            <h4 className="text-[9px] text-gray-600 uppercase tracking-widest mb-2 font-semibold">Parameters</h4>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex justify-between items-center bg-black px-2 py-1.5 rounded border border-gray-900">
                <span className="text-gray-500">Wallet</span>
                {walletAddress
                  ? <span className="text-neon-green font-mono font-medium">{walletAddress.slice(0,4)}…{walletAddress.slice(-3)}</span>
                  : <span className="text-gray-700 font-medium">None</span>
                }
              </div>
              <div className="flex justify-between items-center bg-black px-2 py-1.5 rounded border border-gray-900">
                <span className="text-gray-500">Risk</span>
                <span className={`font-medium capitalize ${settings.riskProfile === 'aggressive' ? 'text-orange-400' : settings.riskProfile === 'conservative' ? 'text-blue-400' : 'text-neon-green'}`}>
                  {settings.riskProfile}
                </span>
              </div>
              <div className="flex justify-between items-center bg-black px-2 py-1.5 rounded border border-gray-900">
                <span className="text-gray-500">Min Score</span>
                <span className="text-white font-medium">&ge; {settings.scoreThreshold}</span>
              </div>
              <div className="flex justify-between items-center bg-black px-2 py-1.5 rounded border border-gray-900">
                <span className="text-gray-500">Trade Amt</span>
                <span className="text-neon-green font-medium">${settings.tradeAmountUsd}</span>
              </div>
              <div className="flex justify-between items-center bg-black px-2 py-1.5 rounded border border-gray-900">
                <span className="text-gray-500">SL / TP</span>
                <span className="font-medium font-mono"><span className="text-neon-red">{settings.baseSL}%</span> / <span className="text-neon-green">{settings.baseTP}%</span></span>
              </div>
              <div className={`flex justify-between items-center px-2 py-1.5 rounded border ${autoTrade ? 'border-neon-green/30 bg-neon-green/5' : 'border-gray-800 bg-black'}`}>
                <span className={autoTrade ? 'text-neon-green' : 'text-gray-500'}>Auto Trade</span>
                <span className={`font-medium ${autoTrade ? 'text-neon-green' : 'text-gray-600'}`}>
                  {autoTrade ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlphaCatchDashboard() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-mono text-gray-500">Loading...</div>}>
      <SniperContent />
    </Suspense>
  );
}
