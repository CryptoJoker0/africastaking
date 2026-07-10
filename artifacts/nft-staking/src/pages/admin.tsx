import React, { useState } from 'react';
import { 
  useGetAdminStats,
  useGetAdminConfig,
  useUpdateAdminConfig,
  useGetAllStakedNfts,
  useGetTreasuryBalances,
  useGetRewardHistory,
  useGetAllEvents,
  getGetAdminConfigQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Activity, Users, Database, Server, Settings, Save, AlertTriangle } from 'lucide-react';
import { formatToken, formatAddress } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <ShieldAlert className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-red-500">
            System Control
          </h1>
          <p className="text-muted-foreground text-sm font-mono">
            Authorized Personnel Only • Sector X1
          </p>
        </div>
      </div>

      <AdminStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <TreasuryPanel />
          <ConfigPanel />
        </div>
        <div className="lg:col-span-2 space-y-8">
          <StakedInventory />
          <EventLog />
        </div>
      </div>
    </div>
  );
}

function AdminStats() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) return <div className="h-32 glass-card rounded-xl animate-pulse" />;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="glass-card p-4 rounded-lg border-l-2 border-l-primary flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-2">
          <Database className="w-3 h-3" /> Total Staked
        </span>
        <span className="font-heading text-2xl font-bold">{stats.totalStaked}</span>
      </div>
      <div className="glass-card p-4 rounded-lg border-l-2 border-l-secondary flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-2">
          <Users className="w-3 h-3" /> Active Wallets
        </span>
        <span className="font-heading text-2xl font-bold">{stats.totalWallets}</span>
      </div>
      <div className="glass-card p-4 rounded-lg border-l-2 border-l-primary flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">XNT Distributed</span>
        <span className="font-mono text-xl">{formatToken(stats.totalXntDistributed)}</span>
      </div>
      <div className="glass-card p-4 rounded-lg border-l-2 border-l-[#FF00A0] flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">AF Distributed</span>
        <span className="font-mono text-xl">{formatToken(stats.totalAfDistributed)}</span>
      </div>
    </div>
  );
}

function TreasuryPanel() {
  const { data: treasury } = useGetTreasuryBalances();

  if (!treasury) return null;

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Server className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-heading font-bold uppercase tracking-wider text-sm">Treasury Reserves</h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <span className="text-sm font-bold text-primary">XNT Reserve</span>
          <span className="font-mono">{formatToken(treasury.xntBalance)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <span className="text-sm font-bold text-secondary">X1Brains Reserve</span>
          <span className="font-mono">{formatToken(treasury.x1BrainsBalance)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-[#FF00A0]">AF Reserve</span>
          <span className="font-mono">{formatToken(treasury.afBalance)}</span>
        </div>
        <p className="text-[10px] text-muted-foreground text-right mt-2">
          Last updated: {new Date(treasury.lastUpdated).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function ConfigPanel() {
  const { data: config } = useGetAdminConfig();
  const updateConfig = useUpdateAdminConfig();
  const queryClient = useQueryClient();

  // local state for toggle so we can interact immediately
  const [stakingEnabled, setStakingEnabled] = useState(config?.stakingEnabled ?? true);
  const [stakingPaused, setStakingPaused] = useState(config?.stakingPaused ?? false);
  const [claimingPaused, setClaimingPaused] = useState(config?.claimingPaused ?? false);

  React.useEffect(() => {
    if (config) {
      setStakingEnabled(config.stakingEnabled);
      setStakingPaused(config.stakingPaused);
      setClaimingPaused(config.claimingPaused);
    }
  }, [config]);

  const handleSave = () => {
    toast.loading('Updating system config...', { id: 'config-update' });
    updateConfig.mutate({
      data: {
        stakingEnabled,
        stakingPaused,
        claimingPaused
      }
    }, {
      onSuccess: () => {
        toast.success('Configuration saved successfully', { id: 'config-update' });
        queryClient.invalidateQueries({ queryKey: getGetAdminConfigQueryKey() });
      },
      onError: (err) => {
        toast.error(`Update failed: ${err.message}`, { id: 'config-update' });
      }
    });
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-heading font-bold uppercase tracking-wider text-sm">System Config</h3>
        </div>
        <button 
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-primary/20 text-primary rounded hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Save className="w-3 h-3" /> Save
        </button>
      </div>
      <div className="p-4 space-y-4">
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm font-medium group-hover:text-white transition-colors">Master Staking Switch</span>
          <div className={`w-10 h-5 rounded-full p-1 transition-colors ${stakingEnabled ? 'bg-primary' : 'bg-muted'}`}>
            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${stakingEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          {/* hidden input for accessibility */}
          <input type="checkbox" className="hidden" checked={stakingEnabled} onChange={e => setStakingEnabled(e.target.checked)} />
        </label>
        
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm font-medium flex items-center gap-2 group-hover:text-white transition-colors">
            <AlertTriangle className="w-3 h-3 text-yellow-500" /> Pause Deposits
          </span>
          <div className={`w-10 h-5 rounded-full p-1 transition-colors ${stakingPaused ? 'bg-yellow-500' : 'bg-muted'}`}>
            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${stakingPaused ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <input type="checkbox" className="hidden" checked={stakingPaused} onChange={e => setStakingPaused(e.target.checked)} />
        </label>
        
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm font-medium flex items-center gap-2 group-hover:text-white transition-colors">
            <AlertTriangle className="w-3 h-3 text-red-500" /> Pause Claims
          </span>
          <div className={`w-10 h-5 rounded-full p-1 transition-colors ${claimingPaused ? 'bg-red-500' : 'bg-muted'}`}>
            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${claimingPaused ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <input type="checkbox" className="hidden" checked={claimingPaused} onChange={e => setClaimingPaused(e.target.checked)} />
        </label>
      </div>
    </div>
  );
}

function StakedInventory() {
  const { data: nfts, isLoading } = useGetAllStakedNfts();

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="bg-white/5 px-4 py-3 border-b border-white/5">
        <h3 className="font-heading font-bold uppercase tracking-wider text-sm">Global Staked Inventory</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground bg-black/20">
            <tr>
              <th className="px-4 py-3 font-medium">Token ID</th>
              <th className="px-4 py-3 font-medium">Wallet</th>
              <th className="px-4 py-3 font-medium">Rarity</th>
              <th className="px-4 py-3 font-medium text-right">Pending XNT</th>
              <th className="px-4 py-3 font-medium">Staked Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground animate-pulse">Loading vault data...</td></tr>
            ) : !nfts || nfts.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No NFTs currently staked in the system.</td></tr>
            ) : (
              nfts.slice(0, 10).map((nft) => (
                <tr key={nft.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono">#{nft.tokenId}</td>
                  <td className="px-4 py-3 font-mono text-primary">{formatAddress(nft.walletAddress)}</td>
                  <td className="px-4 py-3">{nft.rarity}</td>
                  <td className="px-4 py-3 font-mono text-right">{formatToken(nft.pendingXnt)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(nft.stakedAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {nfts && nfts.length > 10 && (
        <div className="px-4 py-2 border-t border-white/5 text-center text-xs text-muted-foreground">
          Showing 10 of {nfts.length} records
        </div>
      )}
    </div>
  );
}

function EventLog() {
  const { data: events, isLoading } = useGetAllEvents();

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-heading font-bold uppercase tracking-wider text-sm">System Event Log</h3>
      </div>
      <div className="max-h-[300px] overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {isLoading ? (
          <div className="animate-pulse text-muted-foreground text-center py-4">Reading logs...</div>
        ) : !events || events.length === 0 ? (
          <div className="text-muted-foreground text-center py-4">No events recorded.</div>
        ) : (
          events.slice(0, 15).map(event => (
            <div key={event.id} className="flex gap-4 border-l-2 border-white/10 pl-3 py-1">
              <span className="text-muted-foreground whitespace-nowrap">
                {new Date(event.createdAt).toLocaleTimeString([], { hour12: false })}
              </span>
              <span className={`uppercase font-bold w-16 ${
                event.eventType === 'stake' ? 'text-green-400' : 
                event.eventType === 'unstake' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {event.eventType}
              </span>
              <span className="text-foreground">
                Token #{event.tokenId} by <span className="text-primary">{formatAddress(event.walletAddress)}</span>
              </span>
              {event.txHash && (
                <span className="text-muted-foreground truncate max-w-[100px] ml-auto">
                  {formatAddress(event.txHash)}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
