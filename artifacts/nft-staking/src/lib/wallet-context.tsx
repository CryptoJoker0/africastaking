import React, { createContext, useContext, useState, useEffect } from 'react';

interface WalletContextType {
  walletAddress: string | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
  setMockAddress: (address: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('africax1-wallet');
    if (saved) setWalletAddress(saved);
  }, []);

  const connectWallet = () => {
    const mockAddress = "0x742d35Cc6634C0532925a3b8D4C9E4d5B1E8F821";
    setWalletAddress(mockAddress);
    localStorage.setItem('africax1-wallet', mockAddress);
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    localStorage.removeItem('africax1-wallet');
  };

  const setMockAddress = (address: string) => {
    setWalletAddress(address);
    localStorage.setItem('africax1-wallet', address);
  };

  return (
    <WalletContext.Provider value={{ walletAddress, connectWallet, disconnectWallet, setMockAddress }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
