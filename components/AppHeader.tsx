"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Wallet, Bell, Activity, Wifi, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AlphaLogo from './AlphaLogo';

const WALLET_STORAGE_KEY = 'alphacatch_wallet';

export default function AppHeader() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    if (stored) setWalletAddress(stored);
  }, []);

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

  useEffect(() => {
    if (!showWalletMenu) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-wallet-menu]')) setShowWalletMenu(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [showWalletMenu]);

  useEffect(() => {
    if (showMobileSearch) {
      setTimeout(() => mobileSearchRef.current?.focus(), 50);
    }
  }, [showMobileSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/sniper?address=${encodeURIComponent(searchInput.trim())}&chain=solana`);
      setSearchInput('');
      setShowMobileSearch(false);
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
    <header className="bg-[#050505]/95 border-b border-gray-800/80 relative z-30 backdrop-blur-md">
      {/* Main header row */}
      <div className="h-14 md:h-16 flex items-center justify-between px-3 md:px-6">

        {/* Mobile: Logo + brand */}
        <div className="flex items-center gap-2 sm:hidden">
          <AlphaLogo className="text-neon-green w-6 h-6 shrink-0" />
          <span className="text-sm font-black tracking-widest uppercase text-white">
            ALPHA<span className="text-neon-green">CATCH</span>
          </span>
        </div>

        {/* Desktop: Global Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-neon-green transition-colors" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search Contract Address... (Ctrl+K)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-black/50 border border-gray-800/60 text-white rounded pb-2 pt-2.5 pl-10 pr-4 text-xs font-mono tracking-widest focus:outline-none focus:border-neon-green/50 focus:bg-black transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50">
              <kbd className="bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded text-[8px] font-sans text-gray-300">CTRL</kbd>
              <kbd className="bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded text-[8px] font-sans text-gray-300">K</kbd>
            </div>
          </form>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto sm:ml-auto md:ml-0">

          {/* Network stats — large screens only */}
          <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono tracking-widest border-r border-gray-800/60 pr-6">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-neon-green" />
              <span className="text-gray-400">12ms</span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="w-3 h-3 text-orange-400" />
              <span className="text-gray-400">0.05 GWEI</span>
            </div>
          </div>

          {/* Mobile search toggle */}
          <button
            className="sm:hidden p-2 text-gray-400 hover:text-white transition-colors"
            onClick={() => setShowMobileSearch(v => !v)}
            aria-label="Search"
          >
            {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <button className="relative text-gray-400 hover:text-white transition-colors p-1">
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-neon-red rounded-full border border-black animate-pulse" />
          </button>

          {/* Wallet */}
          <div className="relative" data-wallet-menu>
            {walletAddress ? (
              <button
                onClick={disconnectWallet}
                title="Click to Disconnect"
                className="flex items-center gap-1.5 px-2.5 md:px-4 py-2 rounded text-[10px] md:text-xs font-bold tracking-widest uppercase transition-all bg-black text-neon-green border border-neon-green hover:bg-neon-red/10 hover:text-neon-red hover:border-neon-red group"
              >
                <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                <span className="group-hover:hidden hidden xs:inline sm:inline">
                  {walletAddress.substring(0, 4)}…{walletAddress.substring(walletAddress.length - 3)}
                </span>
                <span className="hidden group-hover:inline">Disc.</span>
              </button>
            ) : (
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                disabled={connecting}
                className="flex items-center gap-1.5 px-2.5 md:px-4 py-2 rounded text-[10px] md:text-xs font-bold tracking-widest uppercase transition-all bg-neon-green text-black hover:opacity-90 disabled:opacity-60"
              >
                <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                <span className="hidden sm:inline">{connecting ? 'CONNECTING...' : 'CONNECT'}</span>
                <span className="sm:hidden">{connecting ? '...' : 'CONNECT'}</span>
              </button>
            )}

            {showWalletMenu && !walletAddress && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-[#0A0A0B] border border-gray-800 rounded-lg shadow-2xl p-2 flex flex-col gap-1 z-50">
                <button
                  onClick={connectSolana}
                  className="text-left px-4 py-3 rounded text-sm text-gray-300 font-bold hover:bg-[#111] hover:text-neon-green transition-colors flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded bg-[#AB9FF2] flex items-center justify-center shadow-inner shrink-0">
                    <img src="https://cryptologos.cc/logos/solana-sol-logo.png" alt="Phantom" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                  Phantom
                </button>
                <button
                  onClick={connectEVM}
                  className="text-left px-4 py-3 rounded text-sm text-gray-300 font-bold hover:bg-[#111] hover:text-[#f6851b] transition-colors flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded bg-gray-900 border border-gray-800 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-4 h-4" fill="#f6851b"><path d="M 10 90 L 30 20 L 50 60 L 70 20 L 90 90 Z" /></svg>
                  </div>
                  MetaMask
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar — slides in below header */}
      {showMobileSearch && (
        <div className="sm:hidden px-3 pb-3 border-t border-gray-800/60">
          <form onSubmit={handleSearchSubmit} className="relative mt-3">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={mobileSearchRef}
              type="text"
              placeholder="Paste contract address..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-black border border-gray-700 text-white rounded py-2.5 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-neon-green transition-all"
            />
          </form>
        </div>
      )}
    </header>
  );
}
