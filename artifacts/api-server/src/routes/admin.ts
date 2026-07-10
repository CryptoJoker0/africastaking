import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  stakedNftsTable,
  stakingEventsTable,
  stakingConfigTable,
  rewardRatesTable,
  rewardHistoryTable,
} from "@workspace/db";
import { UpdateAdminConfigBody } from "@workspace/api-zod";
import { calculatePendingRewards, getRateForRarity } from "../lib/rewards";
import { adminAuth } from "../middlewares/adminAuth";

const router: IRouter = Router();

// All admin routes require the admin API key
router.use("/admin", adminAuth);

// GET /admin/stats
router.get("/admin/stats", async (_req, res): Promise<void> => {
  const allStaked = await db
    .select()
    .from(stakedNftsTable)
    .where(eq(stakedNftsTable.isActive, true));

  const wallets = new Set(allStaked.map((n) => n.walletAddress));
  const history = await db.select().from(rewardHistoryTable);

  const totalXnt = history.reduce((sum, r) => sum + parseFloat(r.xntAmount), 0);
  const totalX1Brains = history.reduce((sum, r) => sum + parseFloat(r.x1BrainsAmount), 0);
  const totalAf = history.reduce((sum, r) => sum + parseFloat(r.afAmount), 0);

  const configs = await db.select().from(stakingConfigTable).limit(1);
  const config = configs[0];

  res.json({
    totalStaked: allStaked.length,
    totalWallets: wallets.size,
    totalXntDistributed: totalXnt.toFixed(18),
    totalX1BrainsDistributed: totalX1Brains.toFixed(18),
    totalAfDistributed: totalAf.toFixed(18),
    stakingEnabled: config?.stakingEnabled ?? true,
    claimingPaused: config?.claimingPaused ?? false,
  });
});

// GET /admin/config
router.get("/admin/config", async (_req, res): Promise<void> => {
  const configs = await db.select().from(stakingConfigTable).limit(1);
  let config = configs[0];

  if (!config) {
    const [created] = await db.insert(stakingConfigTable).values({}).returning();
    config = created;
  }

  res.json({
    stakingEnabled: config.stakingEnabled,
    stakingPaused: config.stakingPaused,
    claimingPaused: config.claimingPaused,
    collectionAddress: config.collectionAddress,
    supportedTokens: config.supportedTokens,
    updatedAt: config.updatedAt.toISOString(),
  });
});

// PATCH /admin/config
router.patch("/admin/config", async (req, res): Promise<void> => {
  const body = UpdateAdminConfigBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { rewardRates, ...configUpdate } = body.data;

  // Update reward rates if provided
  if (rewardRates && rewardRates.length > 0) {
    for (const rate of rewardRates) {
      await db
        .insert(rewardRatesTable)
        .values({
          rarity: rate.rarity,
          xntPerDay: rate.xntPerDay,
          x1BrainsPerDay: rate.x1BrainsPerDay,
          afPerDay: rate.afPerDay,
        })
        .onConflictDoUpdate({
          target: rewardRatesTable.rarity,
          set: {
            xntPerDay: rate.xntPerDay,
            x1BrainsPerDay: rate.x1BrainsPerDay,
            afPerDay: rate.afPerDay,
          },
        });
    }
  }

  const existing = await db.select().from(stakingConfigTable).limit(1);
  let config;
  if (existing.length === 0) {
    const [created] = await db.insert(stakingConfigTable).values({ ...configUpdate }).returning();
    config = created;
  } else {
    const [updated] = await db
      .update(stakingConfigTable)
      .set({ ...configUpdate, updatedAt: new Date() })
      .where(eq(stakingConfigTable.id, existing[0].id))
      .returning();
    config = updated;
  }

  res.json({
    stakingEnabled: config.stakingEnabled,
    stakingPaused: config.stakingPaused,
    claimingPaused: config.claimingPaused,
    collectionAddress: config.collectionAddress,
    supportedTokens: config.supportedTokens,
    updatedAt: config.updatedAt.toISOString(),
  });
});

// GET /admin/staked-nfts
router.get("/admin/staked-nfts", async (_req, res): Promise<void> => {
  const stakedNfts = await db
    .select()
    .from(stakedNftsTable)
    .where(eq(stakedNftsTable.isActive, true));

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

// GET /admin/treasury
router.get("/admin/treasury", async (_req, res): Promise<void> => {
  const history = await db.select().from(rewardHistoryTable);
  const distributed = history.reduce(
    (acc, r) => ({
      xnt: acc.xnt + parseFloat(r.xntAmount),
      x1Brains: acc.x1Brains + parseFloat(r.x1BrainsAmount),
      af: acc.af + parseFloat(r.afAmount),
    }),
    { xnt: 0, x1Brains: 0, af: 0 },
  );

  const POOL_XNT = 10_000_000;
  const POOL_X1BRAINS = 5_000_000;
  const POOL_AF = 50_000_000;

  res.json({
    xntBalance: (POOL_XNT - distributed.xnt).toFixed(18),
    x1BrainsBalance: (POOL_X1BRAINS - distributed.x1Brains).toFixed(18),
    afBalance: (POOL_AF - distributed.af).toFixed(18),
    lastUpdated: new Date().toISOString(),
  });
});

// GET /admin/reward-history
router.get("/admin/reward-history", async (_req, res): Promise<void> => {
  const history = await db
    .select()
    .from(rewardHistoryTable)
    .orderBy(rewardHistoryTable.claimedAt);

  res.json(
    history.map((r) => ({
      id: r.id,
      walletAddress: r.walletAddress,
      tokenId: r.tokenId,
      xntAmount: r.xntAmount,
      x1BrainsAmount: r.x1BrainsAmount,
      afAmount: r.afAmount,
      claimedAt: r.claimedAt.toISOString(),
    })),
  );
});

// GET /admin/events
router.get("/admin/events", async (_req, res): Promise<void> => {
  const events = await db
    .select()
    .from(stakingEventsTable)
    .orderBy(stakingEventsTable.createdAt);

  res.json(
    events.map((e) => ({
      id: e.id,
      eventType: e.eventType as "stake" | "unstake" | "claim",
      walletAddress: e.walletAddress,
      tokenId: e.tokenId,
      txHash: e.txHash,
      xntAmount: e.xntAmount ?? null,
      x1BrainsAmount: e.x1BrainsAmount ?? null,
      afAmount: e.afAmount ?? null,
      createdAt: e.createdAt.toISOString(),
    })),
  );
});

export default router;
