import React from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '@/lib/wallet-context';
import { formatAddress } from '@/lib/utils';
import { Shield, ChevronDown, Menu } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { walletAddress, connectWallet, disconnectWallet } = useWallet();

  const navLinks = [
    { name: 'Mint', path: '/mint' },
    { name: 'Collection', path: '/collection' },
    { name: 'Market', path: '/market' },
    { name: 'My NFTs', path: '/nfts' },
    { name: 'Staking', path: '/' },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground relative overflow-hidden">
      {/* Background ambient light */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 blur-[120px] rounded-[100%] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-[100%] pointer-events-none -z-10" />
      
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:border-primary/60 transition-colors">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-2xl tracking-widest text-primary text-glow-gold uppercase">AFRICA X1</span>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location === link.path;
                return (
                  <Link 
                    key={link.name} 
                    href={link.path}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      isActive 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="https://barbie.example.com" 
              target="_blank" 
              rel="noreferrer"
              className="hidden md:flex items-center justify-center px-6 py-2.5 bg-[#FF00A0] text-white font-bold rounded hover:bg-[#D40085] hover:shadow-[0_0_15px_rgba(255,0,160,0.5)] transition-all uppercase tracking-wider text-sm shadow-[0_0_10px_rgba(255,0,160,0.3)]"
            >
              Buy AF on Barbie
            </a>
            
            {walletAddress ? (
              <div className="flex items-center gap-3 glass-card px-4 py-2 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                <span className="font-mono text-sm">{formatAddress(walletAddress)}</span>
                <button 
                  onClick={disconnectWallet}
                  className="text-xs text-muted-foreground hover:text-destructive ml-2 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded hover:brightness-110 hover:shadow-[0_0_15px_rgba(201,168,76,0.5)] transition-all uppercase tracking-wider text-sm"
              >
                Connect Wallet
              </button>
            )}
            
            <button className="lg:hidden p-2 text-muted-foreground hover:text-foreground">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="border-t border-border/50 mt-auto py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AFRICA X1. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Admin Panel
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
