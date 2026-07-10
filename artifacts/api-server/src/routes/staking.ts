import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import {
  db,
  stakedNftsTable,
  stakingEventsTable,
  stakingConfigTable,
  rewardRatesTable,
  rewardHistoryTable,
  nftRegistryTable,
} from "@workspace/db";
import {
  GetWalletDashboardParams,
  GetWalletNftsParams,
  GetStakedNftsParams,
  StakeNftBody,
  UnstakeNftBody,
  ClaimRewardsBody,
  GetWalletRewardsParams,
} from "@workspace/api-zod";
import { calculatePendingRewards, getRateForRarity } from "../lib/rewards";

const router: IRouter = Router();

// GET /staking/dashboard/:walletAddress
router.get("/staking/dashboard/:walletAddress", async (req, res): Promise<void> => {
  const params = GetWalletDashboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { walletAddress } = params.data;

  const nftsOwned = await db
    .select()
    .from(nftRegistryTable)
    .where(eq(nftRegistryTable.walletAddress, walletAddress));

  const stakedNfts = await db
    .select()
    .from(stakedNftsTable)
    .where(and(eq(stakedNftsTable.walletAddress, walletAddress), eq(stakedNftsTable.isActive, true)));

  let pendingXnt = 0;
  let pendingX1Brains = 0;
  let pendingAf = 0;

  for (const nft of stakedNfts) {
    const pending = await calculatePendingRewards(nft.tokenId);
    pendingXnt += parseFloat(pending.xnt);
    pendingX1Brains += parseFloat(pending.x1Brains);
    pendingAf += parseFloat(pending.af);
  }

  const lifetimeXnt = stakedNfts.reduce((sum, n) => sum + parseFloat(n.totalEarnedXnt), 0);
  const lifetimeX1Brains = stakedNfts.reduce((sum, n) => sum + parseFloat(n.totalEarnedX1Brains), 0);
  const lifetimeAf = stakedNfts.reduce((sum, n) => sum + parseFloat(n.totalEarnedAf), 0);

  res.json({
    walletAddress,
    nftsOwned: nftsOwned.length,
    nftsStaked: stakedNfts.length,
    pendingXnt: pendingXnt.toFixed(18),
    pendingX1Brains: pendingX1Brains.toFixed(18),
    pendingAf: pendingAf.toFixed(18),
    lifetimeXnt: lifetimeXnt.toFixed(18),
    lifetimeX1Brains: lifetimeX1Brains.toFixed(18),
    lifetimeAf: lifetimeAf.toFixed(18),
    totalValueEarned: (lifetimeXnt + lifetimeX1Brains + lifetimeAf).toFixed(18),
  });
});

// GET /staking/nfts/:walletAddress
router.get("/staking/nfts/:walletAddress", async (req, res): Promise<void> => {
  const params = GetWalletNftsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { walletAddress } = params.data;

  const nfts = await db
    .select()
    .from(nftRegistryTable)
    .where(eq(nftRegistryTable.walletAddress, walletAddress));

  const stakedMap = new Map<string, typeof stakedNftsTable.$inferSelect>();
  const stakedNfts = await db
    .select()
    .from(stakedNftsTable)
    .where(and(eq(stakedNftsTable.walletAddress, walletAddress), eq(stakedNftsTable.isActive, true)));
  for (const s of stakedNfts) stakedMap.set(s.tokenId, s);

  const items = await Promise.all(
    nfts.map(async (nft) => {
      const staked = stakedMap.get(nft.tokenId);
      const rates = await getRateForRarity(nft.rarity);
      let pendingXnt = null;
      let pendingX1Brains = null;
      let pendingAf = null;
      if (staked) {
        const pending = await calculatePendingRewards(nft.tokenId);
        pendingXnt = pending.xnt;
        pendingX1Brains = pending.x1Brains;
        pendingAf = pending.af;
      }
      return {
        tokenId: nft.tokenId,
        name: nft.name,
        imageUrl: nft.imageUrl,
        rarity: nft.rarity as "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary",
        isStaked: !!staked,
        status: staked ? ("Staked" as const) : ("Unstaked" as const),
        dailyRewardXnt: rates.xntPerDay,
        dailyRewardX1Brains: rates.x1BrainsPerDay,
        dailyRewardAf: rates.afPerDay,
        totalEarnedXnt: staked?.totalEarnedXnt ?? "0",
        totalEarnedX1Brains: staked?.totalEarnedX1Brains ?? "0",
        totalEarnedAf: staked?.totalEarnedAf ?? "0",
        stakedAt: staked?.stakedAt?.toISOString() ?? null,
        pendingXnt,
        pendingX1Brains,
        pendingAf,
      };
    }),
  );

  res.json(items);
});

// GET /staking/staked/:walletAddress
router.get("/staking/staked/:walletAddress", async (req, res): Promise<void> => {
  const params = GetStakedNftsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { walletAddress } = params.data;

  const stakedNfts = await db
    .select()
    .from(stakedNftsTable)
    .where(and(eq(stakedNftsTable.walletAddress, walletAddress), eq(stakedNftsTable.isActive, true)));

  const items = await Promise.all(
    stakedNfts.map(async (nft) => {
      const pending = await calculatePendingRewards(nft.tokenId);
      const rates = await getRateForRarity(nft.rarity);
      return {
        id: nft.id,
        tokenId: nft.tokenId,
        walletAddress: nft.walletAddress,
        name: nft.name,
        imageUrl: nft.imageUrl,
        rarity: nft.rarity as "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary",
        stakedAt: nft.stakedAt.toISOString(),
        pendingXnt: pending.xnt,
        pendingX1Brains: pending.x1Brains,
        pendingAf: pending.af,
        totalEarnedXnt: nft.totalEarnedXnt,
        totalEarnedX1Brains: nft.totalEarnedX1Brains,
        totalEarnedAf: nft.totalEarnedAf,
        dailyRewardXnt: rates.xntPerDay,
        dailyRewardX1Brains: rates.x1BrainsPerDay,
        dailyRewardAf: rates.afPerDay,
      };
    }),
  );

  res.json(items);
});

// GET /staking/reward-rates
router.get("/staking/reward-rates", async (_req, res): Promise<void> => {
  const rates = await db.select().from(rewardRatesTable);
  res.json({
    rates: rates.map((r) => ({
      rarity: r.rarity as "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary",
      xntPerDay: r.xntPerDay,
      x1BrainsPerDay: r.x1BrainsPerDay,
      afPerDay: r.afPerDay,
    })),
    lastUpdated: new Date().toISOString(),
  });
});

// POST /staking/stake
router.post("/staking/stake", async (req, res): Promise<void> => {
  const body = StakeNftBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { walletAddress, tokenId } = body.data;

  // Check staking config
  const configs = await db.select().from(stakingConfigTable).limit(1);
  const config = configs[0];
  if (config && (!config.stakingEnabled || config.stakingPaused)) {
    res.status(400).json({ error: "Staking is currently paused or disabled" });
    return;
  }

  // Verify NFT is in the registry AND owned by this wallet — no auto-registration
  const [nft] = await db
    .select()
    .from(nftRegistryTable)
    .where(
      and(
        eq(nftRegistryTable.tokenId, tokenId),
        eq(nftRegistryTable.walletAddress, walletAddress),
      ),
    );

  if (!nft) {
    res.status(403).json({ error: "NFT not found in the AFRICA X1 collection for this wallet" });
    return;
  }

  // Prevent double staking (check active stake by walletAddress + tokenId)
  const existing = await db
    .select()
    .from(stakedNftsTable)
    .where(and(eq(stakedNftsTable.tokenId, tokenId), eq(stakedNftsTable.isActive, true)));
  if (existing.length > 0) {
    res.status(409).json({ error: "NFT is already staked" });
    return;
  }

  // Insert new stake record (previous inactive records are kept as history)
  await db.insert(stakedNftsTable).values({
    tokenId,
    walletAddress,
    name: nft.name,
    imageUrl: nft.imageUrl,
    rarity: nft.rarity,
    isActive: true,
  });

  const txHash = "0x" + tokenId.padStart(64, "0");
  const [event] = await db
    .insert(stakingEventsTable)
    .values({ eventType: "stake", walletAddress, tokenId, txHash })
    .returning();

  res.json({
    id: event.id,
    eventType: event.eventType as "stake",
    walletAddress: event.walletAddress,
    tokenId: event.tokenId,
    txHash: event.txHash,
    xntAmount: null,
    x1BrainsAmount: null,
    afAmount: null,
    createdAt: event.createdAt.toISOString(),
  });
});

// POST /staking/unstake
router.post("/staking/unstake", async (req, res): Promise<void> => {
  const body = UnstakeNftBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { walletAddress, tokenId } = body.data;

  const [staked] = await db
    .select()
    .from(stakedNftsTable)
    .where(
      and(
        eq(stakedNftsTable.tokenId, tokenId),
        eq(stakedNftsTable.walletAddress, walletAddress),
        eq(stakedNftsTable.isActive, true),
      ),
    );

  if (!staked) {
    res.status(400).json({ error: "NFT is not currently staked by this wallet" });
    return;
  }

  // Calculate and accumulate any pending rewards
  const pending = await calculatePendingRewards(tokenId);

  await db
    .update(stakedNftsTable)
    .set({
      isActive: false,
      totalEarnedXnt: (parseFloat(staked.totalEarnedXnt) + parseFloat(pending.xnt)).toFixed(18),
      totalEarnedX1Brains: (parseFloat(staked.totalEarnedX1Brains) + parseFloat(pending.x1Brains)).toFixed(18),
      totalEarnedAf: (parseFloat(staked.totalEarnedAf) + parseFloat(pending.af)).toFixed(18),
    })
    .where(eq(stakedNftsTable.id, staked.id));

  const txHash = "0x" + tokenId.padStart(64, "0") + "ff";
  const [event] = await db
    .insert(stakingEventsTable)
    .values({
      eventType: "unstake",
      walletAddress,
      tokenId,
      txHash,
      xntAmount: pending.xnt,
      x1BrainsAmount: pending.x1Brains,
      afAmount: pending.af,
    })
    .returning();

  res.json({
    id: event.id,
    eventType: event.eventType as "unstake",
    walletAddress: event.walletAddress,
    tokenId: event.tokenId,
    txHash: event.txHash,
    xntAmount: event.xntAmount ?? null,
    x1BrainsAmount: event.x1BrainsAmount ?? null,
    afAmount: event.afAmount ?? null,
    createdAt: event.createdAt.toISOString(),
  });
});

// POST /staking/claim
router.post("/staking/claim", async (req, res): Promise<void> => {
  const body = ClaimRewardsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { walletAddress, tokenId } = body.data;

  // Check claiming config
  const configs = await db.select().from(stakingConfigTable).limit(1);
  const config = configs[0];
  if (config?.claimingPaused) {
    res.status(400).json({ error: "Reward claiming is currently paused" });
    return;
  }

  const [staked] = await db
    .select()
    .from(stakedNftsTable)
    .where(
      and(
        eq(stakedNftsTable.tokenId, tokenId),
        eq(stakedNftsTable.walletAddress, walletAddress),
        eq(stakedNftsTable.isActive, true),
      ),
    );

  if (!staked) {
    res.status(400).json({ error: "NFT is not currently staked by this wallet" });
    return;
  }

  const pending = await calculatePendingRewards(tokenId);
  const totalXnt = parseFloat(staked.totalEarnedXnt) + parseFloat(pending.xnt);
  const totalX1Brains = parseFloat(staked.totalEarnedX1Brains) + parseFloat(pending.x1Brains);
  const totalAf = parseFloat(staked.totalEarnedAf) + parseFloat(pending.af);

  // Reset pending rewards by updating lastClaimedAt
  await db
    .update(stakedNftsTable)
    .set({
      lastClaimedAt: new Date(),
      pendingXnt: "0",
      pendingX1Brains: "0",
      pendingAf: "0",
      totalEarnedXnt: totalXnt.toFixed(18),
      totalEarnedX1Brains: totalX1Brains.toFixed(18),
      totalEarnedAf: totalAf.toFixed(18),
    })
    .where(eq(stakedNftsTable.id, staked.id));

  // Record in reward history and events
  await db.insert(rewardHistoryTable).values({
    walletAddress,
    tokenId,
    xntAmount: pending.xnt,
    x1BrainsAmount: pending.x1Brains,
    afAmount: pending.af,
  });

  const txHash = "0x" + tokenId.padStart(64, "0") + "cc";
  await db.insert(stakingEventsTable).values({
    eventType: "claim",
    walletAddress,
    tokenId,
    txHash,
    xntAmount: pending.xnt,
    x1BrainsAmount: pending.x1Brains,
    afAmount: pending.af,
  });

  res.json({
    success: true,
    claimedXnt: pending.xnt,
    claimedX1Brains: pending.x1Brains,
    claimedAf: pending.af,
    txHash,
  });
});

// GET /staking/rewards/:walletAddress
router.get("/staking/rewards/:walletAddress", async (req, res): Promise<void> => {
  const params = GetWalletRewardsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { walletAddress } = params.data;

  const stakedNfts = await db
    .select()
    .from(stakedNftsTable)
    .where(and(eq(stakedNftsTable.walletAddress, walletAddress), eq(stakedNftsTable.isActive, true)));

  let totalXnt = 0;
  let totalX1Brains = 0;
  let totalAf = 0;

  for (const nft of stakedNfts) {
    const pending = await calculatePendingRewards(nft.tokenId);
    totalXnt += parseFloat(pending.xnt);
    totalX1Brains += parseFloat(pending.x1Brains);
    totalAf += parseFloat(pending.af);
  }

  res.json({
    walletAddress,
    totalPendingXnt: totalXnt.toFixed(18),
    totalPendingX1Brains: totalX1Brains.toFixed(18),
    totalPendingAf: totalAf.toFixed(18),
    stakedNftCount: stakedNfts.length,
  });
});

export default router;
