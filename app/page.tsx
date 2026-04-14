'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Zap, Shield, Activity, BarChart2, ChevronDown, ExternalLink, Terminal, CircleDot, Check } from 'lucide-react';
import AlphaLogo from '../components/AlphaLogo';

// ── Animated terminal lines ──────────────────────────────────────────────────
const TERMINAL_LINES = [
  { delay: 0,    color: 'text-gray-500', text: '$ alphacatch init --chain solana --mode sniper' },
  { delay: 600,  color: 'text-neon-green', text: '✓ Connected to AVE.ai Cloud node' },
  { delay: 1200, color: 'text-gray-400', text: '→ Fetching OHLCV candles [50 / 1m]...' },
  { delay: 1900, color: 'text-yellow-400', text: '⚡ RSI(7): 28.4  VWAP: 0.00001024  BB: SQUEEZE' },
  { delay: 2600, color: 'text-gray-400', text: '→ Running scoring engine...' },
  { delay: 3200, color: 'text-neon-green', text: '★ Score: 8/10  Signal: BUY' },
  { delay: 3900, color: 'text-yellow-400', text: '→ Entry: 0.00001031  TP1: +25%  SL: -15%' },
  { delay: 4500, color: 'text-neon-green', text: '✓ Order dispatched via AVE Cloud SDK' },
];

function AnimatedTerminal() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    TERMINAL_LINES.forEach((line, i) => {
      setTimeout(() => setVisibleLines(prev => [...prev, i]), line.delay);
    });
    const cursorTimer = setInterval(() => setCursor(c => !c), 500);
    return () => clearInterval(cursorTimer);
  }, []);

  return (
    <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-black/40">
        <span className="w-3 h-3 rounded-full bg-red-500/70" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <span className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-3 text-[11px] text-gray-600 font-mono">alpha-catch — sniper-terminal</span>
      </div>
      <div className="p-5 font-mono text-[13px] leading-7 min-h-[240px]">
        {TERMINAL_LINES.map((line, i) => (
          <div
            key={i}
            className={`${line.color} transition-opacity duration-300 ${visibleLines.includes(i) ? 'opacity-100' : 'opacity-0'}`}
          >
            {line.text}
          </div>
        ))}
        {visibleLines.length === TERMINAL_LINES.length && (
          <span className={`inline-block w-2 h-4 bg-neon-green ml-0.5 align-middle ${cursor ? 'opacity-100' : 'opacity-0'}`} />
        )}
      </div>
    </div>
  );
}

// ── Stat counter ─────────────────────────────────────────────────────────────
function Stat({ value, label, suffix = '' }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-3xl font-black text-white tabular-nums">
        {value}<span className="text-neon-green">{suffix}</span>
      </span>
      <span className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const NAV = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Tech Stack', href: '#tech' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0B]/95 border-b border-gray-800/80 backdrop-blur-md' : ''}`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlphaLogo className="w-6 h-6 text-neon-green" />
          <span className="font-black text-white tracking-widest text-lg z-10">
            ALPHA<span className="text-neon-green">CATCH</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className="text-sm text-gray-400 hover:text-white transition-colors font-mono">
              {n.label}
            </a>
          ))}
        </div>
        <Link
          href="/sniper"
          className="flex items-center gap-2 bg-neon-green text-black text-sm font-bold px-5 py-2 rounded hover:opacity-90 transition-opacity uppercase tracking-widest"
        >
          Launch App <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </nav>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-36 pb-20 flex flex-col lg:flex-row items-start gap-16">
        <div className="flex-1">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-neon-green/30 bg-neon-green/5 rounded-full px-4 py-1.5 text-[11px] font-mono text-neon-green mb-6">
            <CircleDot className="w-3 h-3 animate-pulse" />
            Built for AVE Claw Hackathon 2026
          </div>

          <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-6">
            Snipe meme coins<br />
            <span className="text-neon-green">before they pump.</span>
          </h1>

          <p className="text-gray-400 text-lg leading-relaxed max-w-lg mb-8">
            Alpha Catch runs a real-time technical analysis engine across Solana, BSC, and Base — calculating RSI, VWAP, Bollinger Bands, and volume-spike patterns to score every token before you touch it.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-12">
            <Link
              href="/sniper"
              className="flex items-center gap-2 bg-neon-green text-black font-bold px-8 py-3.5 rounded hover:opacity-90 transition-opacity uppercase tracking-widest text-sm"
            >
              Open Terminal <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/AveCloud/ave-cloud-skill"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors font-mono"
            >
              <ExternalLink className="w-4 h-4" /> AVE Cloud Skills
            </a>
          </div>

          <div className="flex items-center gap-10 pt-8 border-t border-gray-800/60">
            <Stat value="3" suffix=" chains" label="Solana · BSC · Base" />
            <Stat value="5" suffix=" signals" label="Hacktown Indicators" />
            <Stat value="<50" suffix="ms" label="Score latency" />
          </div>
        </div>

        {/* Terminal preview */}
        <div className="w-full lg:w-[520px] shrink-0">
          <AnimatedTerminal />
          <p className="text-center text-[11px] text-gray-600 font-mono mt-3">
            live analysis pipeline — RSI → VWAP → BB → ROC → AVE execution
          </p>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="border-t border-gray-800/60 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <span className="text-[11px] font-mono text-neon-green tracking-widest uppercase">What it does</span>
            <h2 className="text-3xl font-black text-white mt-2">Built around one problem: entering early.</h2>
            <p className="text-gray-500 mt-3 max-w-xl text-sm leading-relaxed">
              Most sniper tools just give you a buy/sell button. Alpha Catch actually tells you <em className="text-gray-300 not-italic">why</em> a token is worth entering — with a scored, explainable 10-point system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <BarChart2 className="w-5 h-5 text-neon-green" />,
                title: 'Hacktown Framework Scoring',
                body: 'Every token gets a 0–10 score based on five hardcoded TA rules: volume spike ratio, RSI(7), VWAP crossover, Bollinger squeeze, and ROC momentum.',
                tags: ['10-point scale', 'Score ≥ 6 = BUY'],
              },
              {
                icon: <Zap className="w-5 h-5 text-yellow-400" />,
                title: 'Multi-chain Real-time Data',
                body: 'Pulls 50 live OHLCV candles from the AVE.ai Cloud API per request. Chain-specific routing appends the correct suffix automatically — no manual switching.',
                tags: ['Solana', 'BSC', 'Base'],
              },
              {
                icon: <Shield className="w-5 h-5 text-blue-400" />,
                title: 'Emergency Exit Guards',
                body: 'Two hardcoded shutdown triggers: volume collapse below 20% of average, or price dropping under VWAP with a 2× volume spike — both invalidate BUY signals instantly.',
                tags: ['Volume collapse', 'VWAP divergence'],
              },
              {
                icon: <Terminal className="w-5 h-5 text-purple-400" />,
                title: 'Self-custody Trade Execution',
                body: 'Connects to AVE Cloud Skills (Python SDK) to run unsigned swap transactions. Chain-wallet signing — private keys never leave your machine.',
                tags: ['Ave SDK', 'Free tier', 'Self-custody'],
              },
              {
                icon: <Activity className="w-5 h-5 text-orange-400" />,
                title: 'Rust + Next.js Architecture',
                body: 'The TA engine runs in Rust (Axum framework) for sub-millisecond indicator calculation. If Rust is offline, the Next.js proxy engine takes over seamlessly.',
                tags: ['Axum', 'Failover proxy', 'No downtime'],
              },
              {
                icon: <CircleDot className="w-5 h-5 text-neon-green" />,
                title: 'Live Token Ticker Details',
                body: 'Pulls token metadata — name, symbol, market cap, 24h change — from the AVE.ai token detail endpoint and overlays it directly on the price chart header.',
                tags: ['Symbol', 'MCAP', '24h Δ'],
              },
            ].map(card => (
              <div
                key={card.title}
                className="group bg-[#0d0d0d] border border-gray-800/70 rounded-xl p-6 hover:border-gray-700 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-black rounded-lg border border-gray-800 group-hover:border-gray-700 transition-colors">
                    {card.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white">{card.title}</h3>
                </div>
                <p className="text-gray-500 text-[13px] leading-relaxed mb-4">{card.body}</p>
                <div className="flex flex-wrap gap-2">
                  {card.tags.map(t => (
                    <span key={t} className="text-[10px] font-mono text-gray-600 border border-gray-800 px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-gray-800/60 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <span className="text-[11px] font-mono text-neon-green tracking-widest uppercase">The pipeline</span>
            <h2 className="text-3xl font-black text-white mt-2">From contract address to executed order.</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 relative">
            {/* connector line */}
            <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

            {[
              {
                step: '01',
                title: 'Paste Address',
                body: 'Enter any token contract on Solana, BSC, or Base. Select chain and timeframe (1m / 5m / 15m).',
              },
              {
                step: '02',
                title: 'Pull Live OHLCV',
                body: 'The engine fetches 50 candles from AVE.ai using your API key. Candles are sorted ascending for TA processing.',
              },
              {
                step: '03',
                title: 'Run Hacktown Score',
                body: 'Five indicators are calculated in sequence. Each one adds or subtracts points. Final score is compared against your threshold.',
              },
              {
                step: '04',
                title: 'Signal & Execute',
                body: 'Score ≥ 6 produces a BUY signal with entry price, two TP levels, and a stop-loss. With Auto ON, the AVE SDK fires immediately.',
              },
            ].map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center px-6">
                <div className="w-14 h-14 rounded-full bg-[#0d0d0d] border border-gray-700 flex items-center justify-center font-black text-sm text-neon-green mb-5 relative z-10">
                  {s.step}
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          {/* Score breakdown table */}
          <div className="mt-20 bg-[#0d0d0d] border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 bg-black/20">
              <h3 className="text-sm font-bold text-white">Hacktown Framework — Scoring Breakdown</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Entry valid only if Total ≥ 6 and no emergency exit triggered</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] font-mono">
                <thead>
                  <tr className="border-b border-gray-800/60 text-[10px] text-gray-600 uppercase tracking-widest">
                    <th className="px-6 py-3 font-normal">Indicator</th>
                    <th className="px-6 py-3 font-normal">Condition</th>
                    <th className="px-6 py-3 font-normal text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {[
                    ['Volume Spike', '> 5× average (10-candle)', '+3'],
                    ['Volume Spike', '3–5× average', '+2'],
                    ['Volume Spike', '2–3× average', '+1'],
                    ['RSI (period 7)', '< 30 or 50–65', '+2'],
                    ['RSI (period 7)', '30–50', '+1'],
                    ['VWAP', 'Price > VWAP by > 2%', '+2'],
                    ['Bollinger Bands (20,2)', 'Squeeze + breakout above upper', '+2'],
                    ['ROC (period 5)', '> 3% momentum', '+1'],
                    ['Emergency Exit', 'Vol collapse or VWAP divergence', 'VOID'],
                  ].map(([ind, cond, pts]) => (
                    <tr key={ind + cond} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3 text-gray-300">{ind}</td>
                      <td className="px-6 py-3 text-gray-500">{cond}</td>
                      <td className={`px-6 py-3 text-right font-bold ${pts === 'VOID' ? 'text-red-400' : 'text-neon-green'}`}>{pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── TECH STACK ───────────────────────────────────────────────────── */}
      <section id="tech" className="border-t border-gray-800/60 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <span className="text-[11px] font-mono text-neon-green tracking-widest uppercase">Architecture</span>
            <h2 className="text-3xl font-black text-white mt-2">Two engines. One fallback. Always on.</h2>
            <p className="text-gray-500 mt-3 max-w-xl text-sm leading-relaxed">
              The Rust backend handles the heavy TA math. The Next.js proxy acts as a live fallback so the dashboard never goes dark, even during backend downtime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-7">
              <div className="text-[10px] font-mono text-orange-400 tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" /> RUST BACKEND — PRIMARY ENGINE
              </div>
              <ul className="space-y-3">
                {[
                  'Axum REST API on port 8080',
                  'Tokio async runtime + Serde JSON parsing',
                  'Hardcoded TA functions — no external TA libs',
                  'RealAveClaw trait fetches live kline data',
                  'Query params: ?chain=solana&timeframe=5m',
                  'Returns full AnalysisResult + api_candles[]',
                ].map(l => (
                  <li key={l} className="flex items-start gap-3 text-[13px] text-gray-400">
                    <Check className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-7">
              <div className="text-[10px] font-mono text-blue-400 tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> NEXT.JS PROXY — FALLBACK ENGINE
              </div>
              <ul className="space-y-3">
                {[
                  'API Route: /api/analyze/[address]',
                  'Full TA engine replicated in TypeScript',
                  'Fetches klines + token detail from AVE.ai',
                  'Graceful fallback if Rust backend is offline',
                  'Trade bridge: /api/trade/quote → Ave SDK',
                  'Integrated with ave-cloud-skill Python scripts',
                ].map(l => (
                  <li key={l} className="flex items-start gap-3 text-[13px] text-gray-400">
                    <Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-7 md:col-span-2">
              <div className="text-[10px] font-mono text-neon-green tracking-widest mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-green" /> Dependencies
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Rust / Axum', 'Tokio', 'Reqwest', 'Serde',
                  'Next.js 16', 'React', 'Tailwind CSS', 'Recharts',
                  'AVE.ai Cloud API', 'ave-cloud-skill SDK', 'TypeScript', 'Python 3',
                  'eth-account', 'solders', 'lucide-react',
                ].map(d => (
                  <span key={d} className="text-[11px] font-mono text-gray-400 border border-gray-800 rounded px-3 py-1 bg-black">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-gray-800/60 py-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4">Ready to run the scan?</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Paste any token address, pick your chain, and click Analyze. The scoring engine runs in under a second.
          </p>
          <Link
            href="/sniper"
            className="inline-flex items-center gap-3 bg-neon-green text-black font-bold px-10 py-4 rounded hover:opacity-90 transition-opacity uppercase tracking-widest text-sm"
          >
            Open App <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-[11px] text-gray-600 mt-5 font-mono">
            free AVE.ai plan · no wallet required to scan · self-custody execution
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800/60 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-600 font-mono">
          <div className="flex items-center gap-2">
            <AlphaLogo className="w-4 h-4 text-neon-green" />
            <span>Alpha Catch — AVE Claw Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://cloud.ave.ai" target="_blank" className="hover:text-gray-400 transition-colors">AVE Cloud</a>
            <a href="https://github.com/AveCloud/ave-cloud-skill" target="_blank" className="hover:text-gray-400 transition-colors">GitHub</a>
            <Link href="/sniper" className="hover:text-neon-green transition-colors">Launch App →</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
