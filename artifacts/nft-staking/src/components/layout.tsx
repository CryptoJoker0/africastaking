import React from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '@/lib/wallet-context';
import { formatAddress } from '@/lib/utils';
import { Wallet, Menu, X } from 'lucide-react';
import logoSrc from '@assets/african-x1-logo.jpg';

const navLinks = [
  { num: '01', name: 'Home',       path: 'https://african-x-1-nft-1--africanft.replit.app/',           external: true },
  { num: '02', name: 'Collection', path: 'https://african-x-1-nft-1--africanft.replit.app/collection',  external: true },
  { num: '03', name: 'Mint',       path: 'https://african-x-1-nft-1--africanft.replit.app/mint',        external: true },
  { num: '04', name: 'Market',     path: 'https://african-x-1-nft-1--africanft.replit.app/market',      external: true },
  { num: '05', name: 'My NFTs',    path: 'https://african-x-1-nft-1--africanft.replit.app/my-nfts',     external: true },
  { num: '06', name: 'Staking',    path: '/',                                                            external: false },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { walletAddress, connectWallet, disconnectWallet } = useWallet();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary">

      {/* ── Header — matches african-x-1-nft-1 site exactly ── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#010207]/90 backdrop-blur-md">
        <div className="mx-auto max-w-screen-xl px-5 h-[60px] flex items-center justify-between gap-6">

          {/* Logo block */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src={logoSrc}
              alt="African X1 logo"
              className="w-9 h-9 rounded-full object-cover ring-1 ring-primary/30 group-hover:ring-primary/60 transition-all"
            />
            <div className="leading-tight">
              <div className="font-heading text-lg font-semibold text-foreground tracking-wide">
                African <span className="text-primary font-bold">X1</span>
              </div>
              <div className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase">
                Genesis · X1 Chain
              </div>
            </div>
          </Link>

          {/* Numbered nav — desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = !link.external && location === link.path;
              const cls = `flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`;
              return link.external ? (
                <a key={link.name} href={link.path} target="_blank" rel="noreferrer" className={cls}>
                  <span className="text-[10px] text-muted-foreground/60 font-mono tabular-nums">{link.num}</span>
                  <span className="font-medium">{link.name}</span>
                  {isActive && <span className="ml-0.5 w-1 h-1 rounded-full bg-primary inline-block" />}
                </a>
              ) : (
                <Link key={link.name} href={link.path} className={cls}>
                  <span className="text-[10px] text-muted-foreground/60 font-mono tabular-nums">{link.num}</span>
                  <span className="font-medium">{link.name}</span>
                  {isActive && <span className="ml-0.5 w-1 h-1 rounded-full bg-primary inline-block" />}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* BUY AF ON BARBIE — hot pink, prominent */}
            <a
              href="https://barbie.example.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center px-4 py-1.5 bg-[#FF00A0] text-white text-[11px] font-bold tracking-widest uppercase rounded-sm hover:bg-[#D4008A] transition-colors shadow-[0_0_14px_rgba(255,0,160,0.35)]"
            >
              Buy AF on Barbie
            </a>

            {/* Africa Staking pill — highlights this page */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-primary/40 rounded-full text-xs font-medium text-primary bg-primary/5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Africa Staking
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold tracking-wider">LIVE</span>
            </div>

            {/* Wallet */}
            {walletAddress ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-sm bg-white/3 text-sm">
                  <Wallet className="w-3.5 h-3.5 text-primary" />
                  <span className="font-mono text-[12px] text-foreground/80">{formatAddress(walletAddress)}</span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors px-1"
                  title="Disconnect"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#0A0F1A] border border-white/15 text-foreground text-[12px] font-medium rounded-sm hover:border-primary/40 hover:bg-[#0D1420] transition-all"
              >
                <Wallet className="w-3.5 h-3.5 text-primary" />
                Connect Wallet
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(v => !v)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/5 bg-[#010207] px-5 py-4 flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = !link.external && location === link.path;
              const cls = `flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-colors ${
                isActive ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/3'
              }`;
              return link.external ? (
                <a key={link.name} href={link.path} target="_blank" rel="noreferrer" className={cls} onClick={() => setMobileOpen(false)}>
                  <span className="text-[10px] text-muted-foreground/50 font-mono w-5">{link.num}</span>
                  {link.name}
                </a>
              ) : (
                <Link key={link.name} href={link.path} className={cls} onClick={() => setMobileOpen(false)}>
                  <span className="text-[10px] text-muted-foreground/50 font-mono w-5">{link.num}</span>
                  {link.name}
                </Link>
              );
            })}
            <div className="mt-3 pt-3 border-t border-white/5">
              <a
                href="https://barbie.example.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center w-full px-4 py-2 bg-[#FF00A0] text-white text-[11px] font-bold tracking-widest uppercase rounded-sm"
              >
                Buy AF on Barbie
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Ticker strip — mimics the site's VOLUME I · ISSUE 001 bar */}
      <div className="w-full border-b border-white/5 bg-transparent px-5 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground tracking-[0.15em] uppercase font-medium select-none">
        <span>Volume I · Staking Edition</span>
        <span className="hidden sm:block">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
        </span>
        <span>Genesis · X1 Chain</span>
      </div>

      <main className="flex-1 mx-auto w-full max-w-screen-xl px-5 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-auto py-6">
        <div className="mx-auto max-w-screen-xl px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="African X1" className="w-5 h-5 rounded-full object-cover opacity-60" />
            <span>© {new Date().getFullYear()} African X1. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://african-x-1-nft-1--africanft.replit.app" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Main Site</a>
            <Link href="/admin" className="hover:text-primary transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
