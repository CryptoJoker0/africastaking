import { db, rewardRatesTable, stakedNftsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

/**
 * Calculates accrued rewards since last claim (or stakeAt) based on rarity rates.
 * Returns amounts as strings (to preserve numeric precision).
 */
export async function calculatePendingRewards(
  tokenId: string,
): Promise<{ xnt: string; x1Brains: string; af: string }> {
  const [staked] = await db
    .select()
    .from(stakedNftsTable)
    .where(and(eq(stakedNftsTable.tokenId, tokenId), eq(stakedNftsTable.isActive, true)));

  if (!staked) return { xnt: "0", x1Brains: "0", af: "0" };

  const [rate] = await db
    .select()
    .from(rewardRatesTable)
    .where(eq(rewardRatesTable.rarity, staked.rarity));

  if (!rate) return { xnt: "0", x1Brains: "0", af: "0" };

  const since = staked.lastClaimedAt ?? staked.stakedAt;
  const elapsedMs = Date.now() - since.getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

  const xnt = (parseFloat(rate.xntPerDay) * elapsedDays).toFixed(18);
  const x1Brains = (parseFloat(rate.x1BrainsPerDay) * elapsedDays).toFixed(18);
  const af = (parseFloat(rate.afPerDay) * elapsedDays).toFixed(18);

  return { xnt, x1Brains, af };
}

/** Fetch rate for a given rarity, returns zeros if not configured */
export async function getRateForRarity(
  rarity: string,
): Promise<{ xntPerDay: string; x1BrainsPerDay: string; afPerDay: string }> {
  const [rate] = await db
    .select()
    .from(rewardRatesTable)
    .where(eq(rewardRatesTable.rarity, rarity));
  if (!rate) return { xntPerDay: "0", x1BrainsPerDay: "0", afPerDay: "0" };
  return {
    xntPerDay: rate.xntPerDay,
    x1BrainsPerDay: rate.x1BrainsPerDay,
    afPerDay: rate.afPerDay,
  };
}
