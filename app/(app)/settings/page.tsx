"use client";

import { useState, useEffect } from 'react';
import { Settings, Key, Shield, Zap, CheckCircle2, Save, Info, TrendingUp, Wallet, DollarSign } from 'lucide-react';

const DEFAULT_API_KEY = '6YIi5vdq3ofnato1iX24aSR61eVpFEMXt4aKfEIZMYZcsns4Ep7Nh7HHcEykqPUF';
export const STORAGE_KEY = 'alphacatch_settings';

export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

export interface AppSettings {
  apiKey: string;
  apiPlan: string;
  scoreThreshold: number;
  baseSL: number;
  baseTP: number;
  volCollapseEnabled: boolean;
  vwapDivEnabled: boolean;
  riskProfile: RiskProfile;
  tradeAmountUsd: number;
  autoTradeEnabled: boolean;
}

export const RISK_PRESETS: Record<RiskProfile, { label: string; sl: number; tp: number; maxUsd: number; desc: string; color: string }> = {
  conservative: {
    label: 'Conservative',
    sl: 5,
    tp: 15,
    maxUsd: 50,
    desc: 'Small position sizes, tight stop-loss. Best for low-cap volatile tokens.',
    color: 'text-blue-400 border-blue-500/40 bg-blue-950/20',
  },
  moderate: {
    label: 'Moderate',
    sl: 15,
    tp: 25,
    maxUsd: 200,
    desc: 'Balanced risk/reward. Follows default Hacktown scoring parameters.',
    color: 'text-neon-green border-neon-green/40 bg-neon-green/5',
  },
  aggressive: {
    label: 'Aggressive',
    sl: 25,
    tp: 50,
    maxUsd: 500,
    desc: 'Large positions, wide stop-loss. High conviction plays only.',
    color: 'text-orange-400 border-orange-500/40 bg-orange-950/20',
  },
};

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: DEFAULT_API_KEY,
  apiPlan: 'free',
  scoreThreshold: 6,
  baseSL: 15,
  baseTP: 25,
  volCollapseEnabled: true,
  vwapDivEnabled: true,
  riskProfile: 'moderate',
  tradeAmountUsd: 200,
  autoTradeEnabled: false,
};

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export default function SettingsDashboard() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
    const wallet = localStorage.getItem('alphacatch_wallet');
    setWalletAddress(wallet);
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const applyRiskPreset = (profile: RiskProfile) => {
    const preset = RISK_PRESETS[profile];
    setSettings(prev => ({
      ...prev,
      riskProfile: profile,
      baseSL: preset.sl,
      baseTP: preset.tp,
      tradeAmountUsd: preset.maxUsd,
    }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem('ave_api_key', settings.apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const preset = RISK_PRESETS[settings.riskProfile];

  return (
    <div className="flex flex-col gap-4 pb-10">
      <header className="relative z-10 flex justify-between items-center pb-3 bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-gray-800/80">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Settings className="text-neon-green w-5 h-5" /> Settings
          </h2>
          <p className="text-[11px] text-gray-500 mt-1">Configure trading parameters and risk profile</p>
        </div>
        {walletAddress ? (
          <div className="flex items-center gap-2 text-[11px] bg-neon-green/10 border border-neon-green/30 text-neon-green px-3 py-1.5 rounded-lg font-mono">
            <Wallet className="w-3 h-3" />
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] bg-gray-900 border border-gray-700 text-gray-500 px-3 py-1.5 rounded-lg font-mono">
            <Wallet className="w-3 h-3" /> No wallet connected
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">

        {/* Risk Profile */}
        <div className="bg-[#0A0A0B] rounded-xl border border-gray-800/80 shadow-lg overflow-hidden md:col-span-2">
          <div className="bg-[#111] px-5 py-4 border-b border-gray-800 flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-neon-green" />
            <h3 className="text-sm text-white font-bold">Risk Profile</h3>
            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded border font-mono uppercase tracking-widest ${preset.color}`}>
              {preset.label}
            </span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {(Object.keys(RISK_PRESETS) as RiskProfile[]).map(profile => {
                const p = RISK_PRESETS[profile];
                const isActive = settings.riskProfile === profile;
                return (
                  <button
                    key={profile}
                    onClick={() => applyRiskPreset(profile)}
                    className={`text-left p-4 rounded-lg border transition-all ${isActive ? p.color + ' border-opacity-100' : 'border-gray-800 bg-black/40 hover:border-gray-600'}`}
                  >
                    <div className={`text-sm font-bold mb-1 ${isActive ? '' : 'text-gray-400'}`}>{p.label}</div>
                    <div className="text-[10px] text-gray-500 leading-relaxed mb-3">{p.desc}</div>
                    <div className="flex gap-3 text-[10px] font-mono">
                      <span className="text-neon-red">SL {p.sl}%</span>
                      <span className="text-neon-green">TP {p.tp}%</span>
                      <span className="text-gray-400">Max ${p.maxUsd}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Trade Amount */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex justify-between text-[10px] uppercase text-gray-500 tracking-widest font-mono mb-2">
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Trade Amount (USD)</span>
                  <span className="text-neon-green font-bold">${settings.tradeAmountUsd}</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={settings.tradeAmountUsd}
                  onChange={(e) => update('tradeAmountUsd', Number(e.target.value))}
                  className="w-full bg-black border border-gray-800 p-3 rounded font-mono text-sm focus:outline-none focus:border-neon-green text-gray-300 text-center"
                />
              </div>
              <div>
                <label className="flex justify-between text-[10px] uppercase text-gray-500 tracking-widest font-mono mb-2">
                  <span>Stop Loss %</span>
                  <span className="text-neon-red font-bold">{settings.baseSL}%</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={settings.baseSL}
                  onChange={(e) => update('baseSL', Number(e.target.value))}
                  className="w-full bg-black border border-gray-800 p-3 rounded font-mono text-sm focus:outline-none focus:border-neon-red text-gray-300 text-center"
                />
              </div>
              <div>
                <label className="flex justify-between text-[10px] uppercase text-gray-500 tracking-widest font-mono mb-2">
                  <span>Take Profit %</span>
                  <span className="text-neon-green font-bold">{settings.baseTP}%</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={settings.baseTP}
                  onChange={(e) => update('baseTP', Number(e.target.value))}
                  className="w-full bg-black border border-gray-800 p-3 rounded font-mono text-sm focus:outline-none focus:border-neon-green text-gray-300 text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AVE Cloud Integration */}
        <div className="bg-[#0A0A0B] rounded-xl border border-gray-800/80 shadow-lg overflow-hidden">
          <div className="bg-[#111] px-5 py-4 border-b border-gray-800 flex items-center gap-3">
            <Key className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm text-white font-bold">AVE Cloud Integration</h3>
          </div>
          <div className="p-6 flex flex-col gap-5">
            <div>
              <label className="block text-[10px] uppercase text-gray-500 tracking-widest font-mono mb-2">API Key</label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => update('apiKey', e.target.value)}
                className="w-full bg-black border border-gray-800 p-3 rounded font-mono text-sm focus:outline-none focus:border-blue-500 text-gray-300 transition-colors"
              />
              <p className="flex items-start gap-1.5 text-[10px] text-gray-600 font-mono mt-2 leading-relaxed">
                <Info className="w-3 h-3 mt-0.5 shrink-0 text-blue-500/60" />
                Stored in localStorage. For server-side, update <code className="text-gray-500">frontend/.env.local</code>.
              </p>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-gray-500 tracking-widest font-mono mb-2">API Plan</label>
              <select
                value={settings.apiPlan}
                onChange={(e) => update('apiPlan', e.target.value)}
                className="w-full bg-black border border-gray-800 p-3 rounded font-mono text-sm focus:outline-none focus:border-blue-500 text-gray-300"
              >
                <option value="free">Free (1 RPS)</option>
                <option value="normal">Normal (5 RPS)</option>
                <option value="pro">Pro (20 RPS)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scoring Engine */}
        <div className="bg-[#0A0A0B] rounded-xl border border-gray-800/80 shadow-lg overflow-hidden">
          <div className="bg-[#111] px-5 py-4 border-b border-gray-800 flex items-center gap-3">
            <Zap className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm text-white font-bold">Scoring Engine</h3>
          </div>
          <div className="p-6 flex flex-col gap-5">
            <div>
              <label className="flex justify-between text-[10px] uppercase text-gray-500 tracking-widest font-mono mb-2">
                <span>Minimum Buy Score</span>
                <span className="text-neon-green font-bold">{settings.scoreThreshold} / 10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.scoreThreshold}
                onChange={(e) => update('scoreThreshold', Number(e.target.value))}
                className="w-full accent-neon-green h-1 bg-gray-800 rounded-full appearance-none"
              />
              <div className="flex justify-between text-[9px] text-gray-600 mt-1 font-mono">
                <span>1 (aggressive)</span>
                <span>10 (strict)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Exit Guards */}
        <div className="bg-[#0A0A0B] rounded-xl border border-gray-800/80 shadow-lg overflow-hidden md:col-span-2">
          <div className="bg-[#111] px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm text-white font-bold">Emergency Exit Guards</h3>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded border font-mono tracking-widest uppercase ${
              settings.volCollapseEnabled || settings.vwapDivEnabled
                ? 'bg-purple-900/30 text-purple-400 border-purple-500/30'
                : 'bg-gray-900/30 text-gray-500 border-gray-700/30'
            }`}>
              {settings.volCollapseEnabled || settings.vwapDivEnabled ? 'Active' : 'Disabled'}
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-4 p-4 border border-gray-800 rounded-lg bg-black/50 cursor-pointer hover:border-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={settings.volCollapseEnabled}
                onChange={(e) => update('volCollapseEnabled', e.target.checked)}
                className="mt-1 w-4 h-4 accent-purple-500 cursor-pointer"
              />
              <div>
                <h4 className="text-white text-sm font-bold mb-1">Volume Collapse Shield</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">Auto-voids buys if relative volume drops below 20% of the 10-period moving average.</p>
              </div>
            </label>
            <label className="flex items-start gap-4 p-4 border border-gray-800 rounded-lg bg-black/50 cursor-pointer hover:border-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={settings.vwapDivEnabled}
                onChange={(e) => update('vwapDivEnabled', e.target.checked)}
                className="mt-1 w-4 h-4 accent-purple-500 cursor-pointer"
              />
              <div>
                <h4 className="text-white text-sm font-bold mb-1">VWAP Divergence Cancel</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">Voids buys if price drops below VWAP after a major volume spike.</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end relative z-10 pt-2">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-8 py-3 rounded font-semibold tracking-widest uppercase transition-all text-sm ${saved ? 'bg-neon-green text-black border border-neon-green' : 'bg-black text-neon-green border border-neon-green hover:bg-neon-green/10'}`}
        >
          {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saved ? 'Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
