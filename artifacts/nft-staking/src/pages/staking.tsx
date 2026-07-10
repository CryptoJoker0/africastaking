import React, { useState, useEffect } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { 
  useGetWalletDashboard, 
  useGetWalletNfts, 
  useGetStakedNfts, 
  useGetRewardRates,
  useStakeNft,
  useUnstakeNft,
  useClaimRewards,
  getGetWalletDashboardQueryKey,
  getGetWalletNftsQueryKey,
  getGetStakedNftsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { formatToken, generateMockSignature, generateMockMessage } from '@/lib/utils';
import type { NFTItem, StakedNFTDetail } from '@workspace/api-client-react';
import { Shield, Clock, TrendingUp, Coins, LockKeyhole, Pickaxe, Award, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function StakingPage() {
  const { walletAddress, connectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<'owned' | 'staked'>('owned');

  if (!walletAddress) {
    return <UnconnectedState onConnect={connectWallet} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-wider text-glow-gold mb-2">
            Staking Vault
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Lock your Genesis NFTs to earn XNT, X1Brains, and AF rewards. The longer you stake, the more power you wield in the ecosystem.
          </p>
        </div>
        
        <RewardRatesWidget />
      </div>

      <DashboardStats address={walletAddress} />

      <div className="space-y-6">
        <div className="flex border-b border-border/50 w-full">
          <button
            onClick={() => setActiveTab('owned')}
            className={`px-8 py-4 font-heading text-lg font-bold tracking-widest uppercase transition-all border-b-2 relative ${
              activeTab === 'owned' 
                ? 'text-primary border-primary' 
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            My Wallet
            {activeTab === 'owned' && (
              <motion.div 
                layoutId="activeTab" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary glow-gold" 
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('staked')}
            className={`px-8 py-4 font-heading text-lg font-bold tracking-widest uppercase transition-all border-b-2 relative ${
              activeTab === 'staked' 
                ? 'text-primary border-primary' 
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Staked Vault
            {activeTab === 'staked' && (
              <motion.div 
                layoutId="activeTab" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary glow-gold" 
              />
            )}
          </button>
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'owned' ? (
            <OwnedNfts address={walletAddress} />
          ) : (
            <StakedNfts address={walletAddress} />
          )}
        </div>
      </div>
    </div>
  );
}

function UnconnectedState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-700">
      <div className="w-24 h-24 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center mb-8 relative">
        <div className="absolute inset-0 rounded-full glow-gold opacity-50" />
        <Shield className="w-12 h-12 text-primary" />
      </div>
      <h1 className="font-heading text-5xl font-bold uppercase tracking-widest mb-4 text-glow-gold">
        Africa X1 Vault
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Connect your wallet to access the staking vault. Lock your premium African heritage NFTs to earn daily rewards in XNT, X1Brains, and AF.
      </p>
      <button 
        onClick={onConnect}
        className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg hover:brightness-110 hover:shadow-[0_0_20px_rgba(201,168,76,0.6)] transition-all uppercase tracking-widest text-lg"
      >
        Connect Wallet to Enter
      </button>
    </div>
  );
}

function DashboardStats({ address }: { address: string }) {
  const { data: dashboard, isLoading } = useGetWalletDashboard(address, { 
    query: { enabled: !!address, refetchInterval: 10000, queryKey: getGetWalletDashboardQueryKey(address) } 
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card p-6 rounded-xl animate-pulse h-32" />
        ))}
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title="Total Value Earned" 
        value={`$${formatToken(dashboard.totalValueEarned)}`}
        icon={<TrendingUp className="w-5 h-5 text-green-400" />}
        highlight
      />
      <StatCard 
        title="Pending XNT" 
        value={formatToken(dashboard.pendingXnt)}
        icon={<Coins className="w-5 h-5 text-primary" />}
        ticker
      />
      <StatCard 
        title="Pending X1Brains" 
        value={formatToken(dashboard.pendingX1Brains)}
        icon={<Award className="w-5 h-5 text-secondary" />}
        ticker
      />
      <StatCard 
        title="Pending AF" 
        value={formatToken(dashboard.pendingAf)}
        icon={<Pickaxe className="w-5 h-5 text-[#FF00A0]" />}
        ticker
      />
      <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card px-6 py-4 rounded-lg flex justify-between items-center">
          <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">NFTs Owned</span>
          <span className="font-heading font-bold text-xl">{dashboard.nftsOwned}</span>
        </div>
        <div className="glass-card px-6 py-4 rounded-lg flex justify-between items-center border-primary/30">
          <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">NFTs Staked</span>
          <span className="font-heading font-bold text-xl text-primary">{dashboard.nftsStaked}</span>
        </div>
        <div className="glass-card px-6 py-4 rounded-lg flex justify-between items-center">
          <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Lifetime XNT</span>
          <span className="font-mono font-medium">{formatToken(dashboard.lifetimeXnt)}</span>
        </div>
        <div className="glass-card px-6 py-4 rounded-lg flex justify-between items-center">
          <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Lifetime AF</span>
          <span className="font-mono font-medium">{formatToken(dashboard.lifetimeAf)}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, highlight = false, ticker = false }: { title: string, value: string, icon: React.ReactNode, highlight?: boolean, ticker?: boolean }) {
  // Simple ticker effect for visuals
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    setDisplayValue(value);
    if (!ticker) return;
    
    // Simulate a slow ticking up of decimals
    const interval = setInterval(() => {
      setDisplayValue(prev => {
        const val = parseFloat(prev.replace(/[^0-9.-]+/g,""));
        if (isNaN(val)) return prev;
        return formatToken(val + 0.0001);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [value, ticker]);

  return (
    <div className={`glass-card p-6 rounded-xl relative overflow-hidden group transition-all ${highlight ? 'border-primary/50 bg-primary/5' : ''}`}>
      {highlight && (
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/20 blur-3xl rounded-full" />
      )}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
        <div className="p-2 bg-background/50 rounded-lg">{icon}</div>
      </div>
      <div className={`font-mono text-2xl md:text-3xl font-bold ${highlight ? 'text-primary text-glow-gold' : 'text-foreground'}`}>
        {displayValue}
      </div>
    </div>
  );
}

function RewardRatesWidget() {
  const { data } = useGetRewardRates();
  
  if (!data) return null;

  return (
    <div className="glass-card p-4 rounded-lg text-sm border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="font-heading font-bold uppercase tracking-wider text-primary">Daily Base Rates</span>
      </div>
      <div className="flex gap-4">
        {data.rates.map(rate => (
          <div key={rate.rarity} className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase">{rate.rarity}</span>
            <span className="font-mono text-xs">{formatToken(rate.xntPerDay)} XNT</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OwnedNfts({ address }: { address: string }) {
  const { data: nfts, isLoading } = useGetWalletNfts(address, {
    query: { enabled: !!address, queryKey: getGetWalletNftsQueryKey(address) }
  });

  if (isLoading) return <GridSkeleton />;
  
  if (!nfts || nfts.length === 0) {
    return <EmptyState title="No Unstaked NFTs" description="Your wallet doesn't have any unstaked AFRICA X1 NFTs." />;
  }

  const unstaked = nfts.filter(nft => !nft.isStaked);

  if (unstaked.length === 0) {
    return <EmptyState title="All NFTs Staked!" description="All your AFRICA X1 NFTs are currently earning rewards." />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {unstaked.map(nft => (
        <NftCard key={nft.tokenId} nft={nft} walletAddress={address} />
      ))}
    </div>
  );
}

function StakedNfts({ address }: { address: string }) {
  const { data: staked, isLoading } = useGetStakedNfts(address, {
    query: { enabled: !!address, queryKey: getGetStakedNftsQueryKey(address), refetchInterval: 10000 }
  });

  if (isLoading) return <GridSkeleton />;
  
  if (!staked || staked.length === 0) {
    return <EmptyState title="Vault Empty" description="You haven't staked any NFTs yet. Lock them in the vault to earn rewards." />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {staked.map(nft => (
        <StakedNftCard key={nft.tokenId} nft={nft} walletAddress={address} />
      ))}
    </div>
  );
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'Legendary': return 'text-orange-400 border-orange-400/50 bg-orange-400/10 shadow-[0_0_10px_rgba(251,146,60,0.3)]';
    case 'Epic': return 'text-purple-400 border-purple-400/50 bg-purple-400/10 shadow-[0_0_10px_rgba(192,132,252,0.3)]';
    case 'Rare': return 'text-blue-400 border-blue-400/50 bg-blue-400/10 shadow-[0_0_10px_rgba(96,165,250,0.3)]';
    case 'Uncommon': return 'text-green-400 border-green-400/50 bg-green-400/10 shadow-[0_0_10px_rgba(74,222,128,0.3)]';
    default: return 'text-gray-400 border-gray-400/50 bg-gray-400/10';
  }
}

function NftCard({ nft, walletAddress }: { nft: NFTItem, walletAddress: string }) {
  const queryClient = useQueryClient();
  const stakeNft = useStakeNft();

  const handleStake = () => {
    const signature = generateMockSignature();
    const message = generateMockMessage('stake', nft.tokenId);
    
    toast.loading(`Staking ${nft.name}...`, { id: `stake-${nft.tokenId}` });
    
    stakeNft.mutate({ 
      data: { walletAddress, tokenId: nft.tokenId, signature, message } 
    }, {
      onSuccess: () => {
        toast.success(`${nft.name} staked successfully!`, { id: `stake-${nft.tokenId}` });
        queryClient.invalidateQueries({ queryKey: getGetWalletNftsQueryKey(walletAddress) });
        queryClient.invalidateQueries({ queryKey: getGetStakedNftsQueryKey(walletAddress) });
        queryClient.invalidateQueries({ queryKey: getGetWalletDashboardQueryKey(walletAddress) });
      },
      onError: (err) => {
        toast.error(`Failed to stake: ${err.message || 'Unknown error'}`, { id: `stake-${nft.tokenId}` });
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass-card rounded-xl overflow-hidden flex flex-col glow-gold-hover transition-all"
    >
      <div className="aspect-square bg-muted relative">
        {/* Placeholder for actual image */}
        <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-br from-black to-zinc-900">
          <div className="w-full h-full border border-primary/20 rounded-full flex items-center justify-center opacity-50 relative">
             <div className="absolute w-2/3 h-2/3 border-2 border-primary/40 rotate-45" />
             <div className="absolute w-2/3 h-2/3 border-2 border-primary/40 -rotate-45" />
          </div>
          <span className="absolute bottom-4 right-4 font-mono text-xs text-muted-foreground bg-black/80 px-2 py-1 rounded">#{nft.tokenId}</span>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-heading font-bold text-lg">{nft.name}</h4>
          <span className={`text-[10px] px-2 py-1 rounded border uppercase tracking-widest font-bold ${getRarityColor(nft.rarity)}`}>
            {nft.rarity}
          </span>
        </div>
        
        <div className="mt-4 space-y-2 flex-1">
          <div className="flex justify-between text-sm border-b border-white/5 pb-2">
            <span className="text-muted-foreground">Est. XNT/day</span>
            <span className="font-mono text-primary">{formatToken(nft.dailyRewardXnt)}</span>
          </div>
          <div className="flex justify-between text-sm border-b border-white/5 pb-2">
            <span className="text-muted-foreground">Est. Brains/day</span>
            <span className="font-mono text-secondary">{formatToken(nft.dailyRewardX1Brains)}</span>
          </div>
        </div>
        
        <button
          onClick={handleStake}
          disabled={stakeNft.isPending}
          className="w-full mt-6 py-3 bg-primary/10 text-primary border border-primary/50 rounded font-bold uppercase tracking-widest text-sm hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_15px_rgba(201,168,76,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {stakeNft.isPending ? <LockKeyhole className="w-4 h-4 animate-pulse" /> : <LockKeyhole className="w-4 h-4" />}
          {stakeNft.isPending ? 'Staking...' : 'Stake to Vault'}
        </button>
      </div>
    </motion.div>
  );
}

function StakedNftCard({ nft, walletAddress }: { nft: StakedNFTDetail, walletAddress: string }) {
  const queryClient = useQueryClient();
  const unstakeNft = useUnstakeNft();
  const claimRewards = useClaimRewards();

  const handleUnstake = () => {
    const signature = generateMockSignature();
    const message = generateMockMessage('unstake', nft.tokenId);
    
    toast.loading(`Unstaking ${nft.name}...`, { id: `unstake-${nft.tokenId}` });
    
    unstakeNft.mutate({ 
      data: { walletAddress, tokenId: nft.tokenId, signature, message } 
    }, {
      onSuccess: () => {
        toast.success(`${nft.name} unstaked successfully!`, { id: `unstake-${nft.tokenId}` });
        queryClient.invalidateQueries({ queryKey: getGetWalletNftsQueryKey(walletAddress) });
        queryClient.invalidateQueries({ queryKey: getGetStakedNftsQueryKey(walletAddress) });
        queryClient.invalidateQueries({ queryKey: getGetWalletDashboardQueryKey(walletAddress) });
      },
      onError: (err) => {
        toast.error(`Failed to unstake: ${err.message || 'Unknown error'}`, { id: `unstake-${nft.tokenId}` });
      }
    });
  };

  const handleClaim = () => {
    const signature = generateMockSignature();
    const message = generateMockMessage('claim', nft.tokenId);
    
    toast.loading(`Claiming rewards for ${nft.name}...`, { id: `claim-${nft.tokenId}` });
    
    claimRewards.mutate({ 
      data: { walletAddress, tokenId: nft.tokenId, signature, message } 
    }, {
      onSuccess: (res) => {
        toast.success(`Claimed ${formatToken(res.claimedXnt)} XNT!`, { id: `claim-${nft.tokenId}` });
        queryClient.invalidateQueries({ queryKey: getGetStakedNftsQueryKey(walletAddress) });
        queryClient.invalidateQueries({ queryKey: getGetWalletDashboardQueryKey(walletAddress) });
      },
      onError: (err) => {
        toast.error(`Failed to claim: ${err.message || 'Unknown error'}`, { id: `claim-${nft.tokenId}` });
      }
    });
  };

  const isPendingRewards = parseFloat(nft.pendingXnt || '0') > 0 || parseFloat(nft.pendingAf || '0') > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl overflow-hidden flex flex-col staked-border relative"
    >
      <div className="absolute top-2 left-2 z-10 flex gap-1">
        <div className="px-2 py-1 bg-black/80 backdrop-blur rounded border border-primary/50 text-[10px] font-bold tracking-wider text-primary uppercase flex items-center gap-1 shadow-[0_0_10px_rgba(201,168,76,0.3)]">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Secured
        </div>
      </div>

      <div className="aspect-square bg-muted relative">
        <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-br from-black to-zinc-900 border-b border-primary/20">
          <div className="w-full h-full border border-primary/40 rounded-full flex items-center justify-center opacity-70 relative">
             <div className="absolute w-2/3 h-2/3 border-2 border-primary rotate-45 shadow-[0_0_15px_rgba(201,168,76,0.5)]" />
             <div className="absolute w-2/3 h-2/3 border-2 border-primary -rotate-45 shadow-[0_0_15px_rgba(201,168,76,0.5)]" />
          </div>
          <span className="absolute bottom-4 right-4 font-mono text-xs text-primary bg-black/80 px-2 py-1 rounded border border-primary/30">#{nft.tokenId}</span>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col bg-primary/5">
        <div className="flex justify-between items-start mb-4">
          <h4 className="font-heading font-bold text-lg text-glow-gold">{nft.name}</h4>
          <span className={`text-[10px] px-2 py-1 rounded border uppercase tracking-widest font-bold ${getRarityColor(nft.rarity)}`}>
            {nft.rarity}
          </span>
        </div>
        
        <div className="space-y-3 flex-1 mb-6">
          <div className="bg-black/40 p-3 rounded border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Pending Rewards</p>
            <div className="flex justify-between items-center">
              <span className="font-mono text-lg font-bold text-primary">{formatToken(nft.pendingXnt)} <span className="text-xs text-muted-foreground">XNT</span></span>
            </div>
            {(parseFloat(nft.pendingAf) > 0 || parseFloat(nft.pendingX1Brains) > 0) && (
              <div className="flex gap-3 mt-1 pt-1 border-t border-white/5">
                {parseFloat(nft.pendingAf) > 0 && <span className="font-mono text-xs text-[#FF00A0]">{formatToken(nft.pendingAf)} AF</span>}
                {parseFloat(nft.pendingX1Brains) > 0 && <span className="font-mono text-xs text-secondary">{formatToken(nft.pendingX1Brains)} B</span>}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Staked: {new Date(nft.stakedAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleClaim}
            disabled={!isPendingRewards || claimRewards.isPending}
            className="flex-1 py-2.5 bg-primary/20 text-primary border border-primary/50 rounded font-bold uppercase tracking-widest text-xs hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {claimRewards.isPending ? 'Claiming...' : 'Claim'}
          </button>
          <button
            onClick={handleUnstake}
            disabled={unstakeNft.isPending}
            className="flex-1 py-2.5 bg-transparent text-muted-foreground border border-white/10 rounded font-bold uppercase tracking-widest text-xs hover:bg-white/5 hover:text-foreground hover:border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {unstakeNft.isPending ? 'Unstaking...' : 'Unstake'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-xl border-dashed border-2">
      <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 border border-primary/20">
        <AlertCircle className="w-8 h-8 text-primary/50" />
      </div>
      <h3 className="font-heading text-xl font-bold uppercase tracking-widest mb-2 text-glow-gold">{title}</h3>
      <p className="text-muted-foreground max-w-md">{description}</p>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="glass-card rounded-xl overflow-hidden h-[400px] animate-pulse">
          <div className="h-1/2 bg-white/5" />
          <div className="p-5 space-y-4">
            <div className="h-6 w-1/2 bg-white/10 rounded" />
            <div className="h-4 w-1/3 bg-white/5 rounded" />
            <div className="h-10 w-full bg-white/5 rounded mt-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
