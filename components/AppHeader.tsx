"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Wallet, Bell, Activity, Wifi } from 'lucide-react';
import { useRouter } from 'next/navigation';

const WALLET_STORAGE_KEY = 'alphacatch_wallet';

export default function AppHeader() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Restore wallet address from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    if (stored) setWalletAddress(stored);
  }, []);

  // Ctrl+K — focus the search input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close wallet dropdown when clicking outside
  useEffect(() => {
    if (!showWalletMenu) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-wallet-menu]')) setShowWalletMenu(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [showWalletMenu]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/sniper?address=${encodeURIComponent(searchInput.trim())}&chain=solana`);
      setSearchInput('');
    }
  };

  const saveWallet = (address: string) => {
    setWalletAddress(address);
    localStorage.setItem(WALLET_STORAGE_KEY, address);
  };

  const connectEVM = async () => {
    if (connecting) return;
    try {
      setConnecting(true);
      const win = window as any;
      if (typeof win.ethereum !== 'undefined') {
        const accounts: string[] = await win.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) saveWallet(accounts[0]);
      } else {
        alert("MetaMask (EVM) is not installed.");
      }
    } catch (err) {
      console.error("EVM Connection Error", err);
    } finally {
      setConnecting(false);
      setShowWalletMenu(false);
    }
  };

  const connectSolana = async () => {
    if (connecting) return;
    try {
      setConnecting(true);
      const win = window as any;
      if (typeof win.solana !== 'undefined') {
        const resp = await win.solana.connect();
        const pubkey = resp?.publicKey?.toString();
        if (pubkey) saveWallet(pubkey);
      } else {
        alert("Phantom (Solana) is not installed.");
      }
    } catch (err) {
      console.error("Solana Connection Error", err);
    } finally {
      setConnecting(false);
      setShowWalletMenu(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    localStorage.removeItem(WALLET_STORAGE_KEY);
  };

  return (
    <header className="h-16 bg-[#050505]/95 border-b border-gray-800/80 flex items-center justify-between px-4 md:px-6 relative z-30 backdrop-blur-md">

      {/* Global Search / Command Center */}
      <div className="flex-1 max-w-md hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative group">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--color-neon-green)] transition-colors" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search Contract Address... (Ctrl+K)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-black/50 border border-gray-800/60 text-white rounded pb-2 pt-2.5 pl-10 pr-4 text-xs font-mono tracking-widest focus:outline-none focus:border-[var(--color-neon-green)]/50 focus:bg-black transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50">
            <kbd className="bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded text-[8px] font-sans text-gray-300">CTRL</kbd>
            <kbd className="bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded text-[8px] font-sans text-gray-300">K</kbd>
          </div>
        </form>
      </div>

      {/* Right Side Tools */}
      <div className="flex items-center gap-4 md:gap-6 ml-auto">

        {/* Network Stats — static display */}
        <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono tracking-widest border-r border-gray-800/60 pr-6">
          <div className="flex items-center gap-2" title="API Latency">
             <Activity className="w-3 h-3 text-[var(--color-neon-green)]" />
             <span className="text-gray-400">12ms</span>
          </div>
          <div className="flex items-center gap-2" title="Network Load">
             <Wifi className="w-3 h-3 text-orange-400" />
             <span className="text-gray-400">0.05 GWEI</span>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--color-neon-red)] rounded-full border border-black animate-pulse"></span>
        </button>

        {/* Wallet Connect module */}
        <div className="relative" data-wallet-menu>
          {walletAddress ? (
            <button
              onClick={disconnectWallet}
              title="Click to Disconnect"
              className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold tracking-widest uppercase transition-all bg-black text-neon-green border border-neon-green hover:bg-neon-red/10 hover:text-neon-red hover:border-neon-red group"
            >
              <Wallet className="w-4 h-4" />
              <span className="group-hover:hidden">
                {walletAddress.substring(0, 5)}...{walletAddress.substring(walletAddress.length - 4)}
              </span>
              <span className="hidden group-hover:inline">Disconnect</span>
            </button>
          ) : (
            <button
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              disabled={connecting}
              className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold tracking-widest uppercase transition-all bg-neon-green text-black hover:opacity-90 disabled:opacity-60"
            >
              <Wallet className="w-4 h-4" />
              {connecting ? "CONNECTING..." : "CONNECT WALLET"}
            </button>
          )}

          {/* Wallet Dropdown */}
          {showWalletMenu && !walletAddress && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#0A0A0B] border border-gray-800 rounded-lg shadow-2xl p-2 flex flex-col gap-1 z-50">
               <button
                 onClick={connectSolana}
                 className="text-left px-4 py-3 rounded text-sm text-gray-300 font-bold hover:bg-[#111] hover:text-[var(--color-neon-green)] transition-colors flex items-center gap-3"
               >
                 <div className="w-6 h-6 rounded bg-[#AB9FF2] flex items-center justify-center shadow-inner shrink-0">
                    <img src="https://cryptologos.cc/logos/solana-sol-logo.png" alt="Phantom" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = 'none'; }}/>
                 </div>
                 Phantom
               </button>
               <button
                 onClick={connectEVM}
                 className="text-left px-4 py-3 rounded text-sm text-gray-300 font-bold hover:bg-[#111] hover:text-[#f6851b] transition-colors flex items-center gap-3"
               >
                 <div className="w-6 h-6 rounded bg-gray-900 border border-gray-800 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-4 h-4" fill="#f6851b"><path d="M 10 90 L 30 20 L 50 60 L 70 20 L 90 90 Z"/></svg>
                 </div>
                 MetaMask
               </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
