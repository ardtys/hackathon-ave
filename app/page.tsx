'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Zap, Shield, Activity, BarChart2, Menu, X, CircleDot, Check, ChevronRight } from 'lucide-react';
import AlphaLogo from '../components/AlphaLogo';

// ─── Animated terminal ────────────────────────────────────────────────────────
const TERMINAL_LINES = [
  { delay: 0,    color: 'text-gray-500', text: '$ alphacatch scan --chain solana' },
  { delay: 700,  color: 'text-blue-400', text: '  ↳ fetching 50 candles [1m]...' },
  { delay: 1400, color: 'text-gray-400', text: '  ↳ RSI(7): 28.4    VWAP: below price' },
  { delay: 2000, color: 'text-gray-400', text: '  ↳ BB: SQUEEZE     Vol: 4.2× avg' },
  { delay: 2700, color: 'text-yellow-400', text: '  ↳ ROC(5): +6.8%   scoring...' },
  { delay: 3300, color: 'text-neon-green', text: '' },
  { delay: 3300, color: 'text-neon-green', text: '  ★ SCORE  8 / 10  →  BUY' },
  { delay: 4000, color: 'text-gray-400', text: '  ↳ Entry  0.00001031' },
  { delay: 4400, color: 'text-neon-green', text: '  ↳ TP1 +25%  TP2 +50%  TP3 +100%' },
  { delay: 4900, color: 'text-neon-red',   text: '  ↳ SL  −15%' },
  { delay: 5500, color: 'text-neon-green', text: '  ✓ order sent via AVE Cloud' },
];

function AnimatedTerminal() {
  const [visible, setVisible] = useState<number[]>([]);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const timers = TERMINAL_LINES.map((line, i) =>
      setTimeout(() => setVisible(prev => [...prev, i]), line.delay)
    );
    const blink = setInterval(() => setCursor(c => !c), 530);
    return () => { timers.forEach(clearTimeout); clearInterval(blink); };
  }, []);

  return (
    <div className="bg-[#0a0a0b] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800/80 bg-black/30">
        <span className="w-3 h-3 rounded-full bg-red-500/60" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <span className="w-3 h-3 rounded-full bg-green-500/60" />
        <span className="ml-3 text-[11px] text-gray-600 font-mono tracking-wide">alphacatch — live scan</span>
      </div>
      <div className="p-5 font-mono text-[12px] sm:text-[13px] leading-[1.8] min-h-[260px]">
        {TERMINAL_LINES.map((line, i) => (
          <div
            key={i}
            className={`${line.color} transition-all duration-200 ${visible.includes(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
          >
            {line.text || <br />}
          </div>
        ))}
        {visible.length === TERMINAL_LINES.length && (
          <span className={`inline-block w-[7px] h-[14px] bg-neon-green align-middle ml-0.5 ${cursor ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
        )}
      </div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how' },
    { label: 'Scoring', href: '#scoring' },
  ];

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0B]/95 border-b border-gray-800/80 backdrop-blur-md' : ''}`}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AlphaLogo className="w-6 h-6 text-neon-green" />
          <span className="font-black text-white tracking-widest text-base sm:text-lg">
            ALPHA<span className="text-neon-green">CATCH</span>
          </span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors font-mono tracking-wide">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sniper"
            className="flex items-center gap-1.5 bg-neon-green text-black text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded hover:opacity-90 transition-opacity uppercase tracking-widest"
          >
            Launch <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button className="md:hidden p-2 text-gray-400 hover:text-white" onClick={() => setOpen(v => !v)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0a0a0b] border-b border-gray-800 px-5 pb-4 flex flex-col gap-4">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="text-sm text-gray-400 hover:text-white transition-colors font-mono py-1">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── Score ring (visual element) ─────────────────────────────────────────────
function ScoreRing({ score, max = 10 }: { score: number; max?: number }) {
  const pct = score / max;
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#1a1a1a" strokeWidth="6" />
        <circle cx="44" cy="44" r={r} fill="none" stroke="#38bdf8" strokeWidth="6"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="text-center z-10">
        <div className="text-2xl font-black text-neon-green leading-none">{score}</div>
        <div className="text-[9px] text-gray-500 font-mono">/{max}</div>
      </div>
    </div>
  );
}

// ─── Landing page ────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <Nav />

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-28 sm:pt-36 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <div>
          <div className="inline-flex items-center gap-2 border border-neon-green/25 bg-neon-green/[0.06] rounded-full px-3.5 py-1.5 text-[11px] font-mono text-neon-green mb-7">
            <CircleDot className="w-2.5 h-2.5 animate-pulse" />
            AVE Claw Hackathon 2026
          </div>

          <h1 className="text-[2.6rem] sm:text-5xl lg:text-[3.5rem] font-black leading-[1.06] tracking-tight mb-6">
            Know <span className="text-neon-green">exactly</span> when<br className="hidden sm:block" /> to enter.
          </h1>

          <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-md mb-4">
            AlphaCatch scans any token on Solana, BSC, or Base and gives it a score — not a chart, not vibes. A number. Based on five technical indicators that run every time you paste an address.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed max-w-md mb-10">
            Score 6+ means enter. Score 3–5 means watch. Anything below means skip. That's the whole system.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/sniper"
              className="flex items-center gap-2 bg-neon-green text-black font-bold px-7 py-3 rounded hover:opacity-90 transition-opacity uppercase tracking-widest text-sm"
            >
              Open Scanner <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#scoring"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors font-mono border border-gray-800 px-5 py-3 rounded hover:border-gray-600">
              See the scoring rules
            </a>
          </div>

          {/* Subtle trust signals — not flashy */}
          <div className="flex items-center gap-6 mt-10 pt-8 border-t border-gray-800/50 text-[11px] font-mono text-gray-600">
            <span>Solana · BSC · Base</span>
            <span className="text-gray-800">|</span>
            <span>AVE Cloud API</span>
            <span className="text-gray-800">|</span>
            <span>Self-custody</span>
          </div>
        </div>

        <div className="w-full">
          <AnimatedTerminal />
          <p className="text-[11px] text-gray-700 font-mono mt-3 ml-1">
            ↑ actual output from the scoring engine
          </p>
        </div>
      </section>

      {/* ── WHAT MAKES THIS DIFFERENT ──────────────────────────────────────── */}
      <section id="features" className="border-t border-gray-800/40 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-14">
            <p className="text-[11px] font-mono text-neon-green tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Not another scanner that shows you a chart.
            </h2>
            <p className="text-gray-500 mt-4 text-sm leading-relaxed">
              Most tools push data at you and leave the decision to you. AlphaCatch collapses five indicators into one actionable score. You still decide — but you know why.
            </p>
          </div>

          {/* Bento-style grid — intentionally asymmetric */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Big card */}
            <div className="sm:col-span-2 bg-[#0d0d0d] border border-gray-800/70 rounded-2xl p-7 group hover:border-gray-700 transition-all">
              <div className="flex items-start justify-between mb-5">
                <div className="p-2 bg-black rounded-xl border border-gray-800 group-hover:border-gray-700 transition-colors">
                  <BarChart2 className="w-5 h-5 text-neon-green" />
                </div>
                <ScoreRing score={8} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">A score, not a signal</h3>
              <p className="text-gray-500 text-[13px] leading-relaxed">
                Five hardcoded rules from the Hacktown Framework — volume spike ratio, RSI(7), VWAP position, Bollinger squeeze, and ROC momentum — each add or subtract points. The total is your answer. Score ≥ 8 means aggressive entry with three TP levels. Score ≥ 6 means half-size. Under that, you wait.
              </p>
              <div className="flex gap-2 mt-4">
                {['BUY ≥ 6', 'WATCHLIST 3–5', 'SKIP < 3'].map(t => (
                  <span key={t} className="text-[10px] font-mono text-gray-600 border border-gray-800 px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            </div>

            {/* Security card */}
            <div className="bg-[#0d0d0d] border border-gray-800/70 rounded-2xl p-7 group hover:border-gray-700 transition-all">
              <div className="p-2 bg-black rounded-xl border border-gray-800 group-hover:border-gray-700 transition-colors inline-block mb-5">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Security scan built in</h3>
              <p className="text-gray-500 text-[13px] leading-relaxed">
                Every token gets a GoPlus security check — honeypot detection, buy/sell tax, liquidity lock status, and top holder concentration. Before you even look at the chart.
              </p>
            </div>

            {/* Chain card */}
            <div className="bg-[#0d0d0d] border border-gray-800/70 rounded-2xl p-7 group hover:border-gray-700 transition-all">
              <div className="p-2 bg-black rounded-xl border border-gray-800 group-hover:border-gray-700 transition-colors inline-block mb-5">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Three chains, one interface</h3>
              <p className="text-gray-500 text-[13px] leading-relaxed">
                Switch between Solana, BSC, and Base without leaving the page. Live OHLCV data pulls from AVE.ai on every scan — no stale snapshots.
              </p>
            </div>

            {/* Emergency exit */}
            <div className="bg-[#0d0d0d] border border-red-900/30 rounded-2xl p-7 group hover:border-red-800/40 transition-all">
              <div className="p-2 bg-black rounded-xl border border-red-900/30 group-hover:border-red-800/40 transition-colors inline-block mb-5">
                <Activity className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Hard stops that actually fire</h3>
              <p className="text-gray-500 text-[13px] leading-relaxed">
                Volume collapse below 20% of the 10-candle average, or price dropping under VWAP during a spike — either one forces the signal to AVOID, overriding the score.
              </p>
            </div>

            {/* Auto trade */}
            <div className="bg-[#0d0d0d] border border-gray-800/70 rounded-2xl p-7 group hover:border-neon-green/20 transition-all">
              <div className="flex items-center justify-between mb-5">
                <div className="p-2 bg-black rounded-xl border border-gray-800 inline-block">
                  <CircleDot className="w-5 h-5 text-neon-green" />
                </div>
                <span className="text-[10px] font-mono text-neon-green bg-neon-green/10 border border-neon-green/20 px-2 py-1 rounded">
                  AUTO: ON
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Auto-execute on BUY</h3>
              <p className="text-gray-500 text-[13px] leading-relaxed">
                Connect your wallet, set a score threshold, flip the toggle. When the engine hits your number, it fires through AVE Cloud without you clicking anything.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how" className="border-t border-gray-800/40 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-14">
            <p className="text-[11px] font-mono text-neon-green tracking-widest uppercase mb-3">The pipeline</p>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">Paste. Score. Decide.</h2>
            <p className="text-gray-500 mt-4 text-sm leading-relaxed">
              Four steps from contract address to a verdict. The whole thing runs in under a second on the first click.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                n: '01',
                title: 'Paste any contract address',
                body: 'Solana mint, EVM address — doesn\'t matter. Pick your chain (SOL / BSC / Base) and timeframe (1m, 5m, 15m). Hit Analyze.',
                color: 'text-neon-green',
              },
              {
                n: '02',
                title: 'Live candle data loads',
                body: '50 OHLCV candles pull in from AVE.ai. Token metadata — name, symbol, market cap — overlays directly on the chart header.',
                color: 'text-blue-400',
              },
              {
                n: '03',
                title: 'Five indicators run in sequence',
                body: 'Volume spike, RSI(7), VWAP position, Bollinger Bands squeeze, ROC momentum. Each one scores independently. Emergency checks run last.',
                color: 'text-yellow-400',
              },
              {
                n: '04',
                title: 'You get a verdict',
                body: 'BUY with tiered TP/SL levels, WATCHLIST to wait for a better setup, SKIP to move on, or AVOID if the emergency triggers fire.',
                color: 'text-orange-400',
              },
            ].map(s => (
              <div key={s.n} className="bg-[#0d0d0d] border border-gray-800/60 rounded-2xl p-7 flex gap-5">
                <span className={`font-black text-3xl ${s.color} opacity-40 leading-none shrink-0 tabular-nums`}>{s.n}</span>
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCORING BREAKDOWN ──────────────────────────────────────────────── */}
      <section id="scoring" className="border-t border-gray-800/40 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-12">
            <p className="text-[11px] font-mono text-neon-green tracking-widest uppercase mb-3">Transparent scoring</p>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">Every point is explainable.</h2>
            <p className="text-gray-500 mt-4 text-sm leading-relaxed">
              No black boxes. The scoring table is the scoring table — hardcoded, auditable, the same for every token.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Score table */}
            <div className="bg-[#0d0d0d] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800/80 bg-black/20 flex items-center justify-between">
                <span className="text-xs font-bold text-white">Scoring Rules</span>
                <span className="text-[10px] text-gray-500 font-mono">max 10 pts</span>
              </div>
              <div className="divide-y divide-gray-800/40">
                {[
                  { ind: 'Volume',  cond: '> 5× avg',         pts: +3 },
                  { ind: 'Volume',  cond: '3–5× avg',         pts: +2 },
                  { ind: 'Volume',  cond: '2–3× avg',         pts: +1 },
                  { ind: 'RSI(7)',  cond: '< 30 or 50–65',    pts: +2 },
                  { ind: 'RSI(7)',  cond: '30–50',            pts: +1 },
                  { ind: 'VWAP',   cond: 'Price > VWAP +2%', pts: +2 },
                  { ind: 'BB',     cond: 'Squeeze breakout',  pts: +2 },
                  { ind: 'ROC(5)', cond: '> 3% momentum',    pts: +1 },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-2.5 text-[12px] hover:bg-white/[0.02] transition-colors">
                    <span className="font-mono text-gray-500 w-16 shrink-0">{row.ind}</span>
                    <span className="text-gray-400 flex-1">{row.cond}</span>
                    <span className="font-bold text-neon-green font-mono ml-3">+{row.pts}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-5 py-2.5 text-[12px] bg-red-950/10">
                  <span className="font-mono text-gray-500 w-16 shrink-0">Emergency</span>
                  <span className="text-gray-400 flex-1">Vol collapse or VWAP div.</span>
                  <span className="font-bold text-red-400 font-mono ml-3">VOID</span>
                </div>
              </div>
            </div>

            {/* Signal tiers */}
            <div className="flex flex-col gap-4">
              <div className="bg-[#0d0d0d] border border-gray-800 rounded-2xl p-6 flex-1">
                <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-4">Signal Tiers</p>
                <div className="space-y-3">
                  {[
                    { score: '8–10', signal: 'BUY',       tier: 'AGGRESSIVE', tp: 'TP1 +25%  TP2 +50%  TP3 +100%',  sl: 'SL −15%', color: 'text-neon-green', bg: 'bg-neon-green/10 border-neon-green/30' },
                    { score: '6–7',  signal: 'BUY',       tier: 'MODERATE',   tp: 'TP1 +20%  TP2 +40%',              sl: 'SL −12%', color: 'text-sky-400',     bg: 'bg-sky-950/30 border-sky-800/30' },
                    { score: '3–5',  signal: 'WATCHLIST', tier: 'WAIT',       tp: 'Watch for score to rise',         sl: '',        color: 'text-yellow-400',   bg: 'bg-yellow-950/20 border-yellow-800/30' },
                    { score: '< 3',  signal: 'SKIP',      tier: '',           tp: 'Move on',                         sl: '',        color: 'text-gray-500',     bg: 'bg-gray-900/30 border-gray-800/30' },
                  ].map(t => (
                    <div key={t.score} className={`border rounded-xl px-4 py-3 ${t.bg}`}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`font-black text-sm ${t.color}`}>{t.signal}</span>
                        {t.tier && <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">{t.tier}</span>}
                        <span className="ml-auto text-[10px] font-mono text-gray-600">{t.score}</span>
                      </div>
                      <p className="text-[11px] font-mono text-gray-500">{t.tp} {t.sl && <span className="text-red-400">{t.sl}</span>}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="border-t border-gray-800/40 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="bg-[#0d0d0d] border border-gray-800 rounded-2xl p-10 sm:p-16 relative overflow-hidden">
            {/* subtle grid bg */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10 max-w-xl">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
                The scan takes<br className="hidden sm:block" /> under a second.
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                No account needed. Paste any contract, pick a chain, and see the score. Connect your wallet only if you want auto-execution.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/sniper"
                  className="inline-flex items-center gap-2 bg-neon-green text-black font-bold px-8 py-3.5 rounded hover:opacity-90 transition-opacity uppercase tracking-widest text-sm"
                >
                  Open App <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/trending"
                  className="inline-flex items-center gap-2 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-mono px-6 py-3.5 rounded transition-all text-sm"
                >
                  See trending tokens <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800/40 py-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-700 font-mono">
          <div className="flex items-center gap-2">
            <AlphaLogo className="w-4 h-4 text-neon-green" />
            <span>AlphaCatch — AVE Claw Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="https://cloud.ave.ai" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">AVE Cloud</a>
            <Link href="/sniper" className="hover:text-neon-green transition-colors">Launch App →</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
