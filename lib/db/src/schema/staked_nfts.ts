import { pgTable, text, serial, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stakedNftsTable = pgTable("staked_nfts", {
  id: serial("id").primaryKey(),
  // No global unique on tokenId — a partial unique index (WHERE is_active = true)
  // is applied via migration after push so that the same NFT can be restaked.
  tokenId: text("token_id").notNull(),
  walletAddress: text("wallet_address").notNull(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  rarity: text("rarity").notNull(), // Common, Uncommon, Rare, Epic, Legendary
  stakedAt: timestamp("staked_at", { withTimezone: true }).notNull().defaultNow(),
  lastClaimedAt: timestamp("last_claimed_at", { withTimezone: true }),
  pendingXnt: numeric("pending_xnt", { precision: 36, scale: 18 }).notNull().default("0"),
  pendingX1Brains: numeric("pending_x1brains", { precision: 36, scale: 18 }).notNull().default("0"),
  pendingAf: numeric("pending_af", { precision: 36, scale: 18 }).notNull().default("0"),
  totalEarnedXnt: numeric("total_earned_xnt", { precision: 36, scale: 18 }).notNull().default("0"),
  totalEarnedX1Brains: numeric("total_earned_x1brains", { precision: 36, scale: 18 }).notNull().default("0"),
  totalEarnedAf: numeric("total_earned_af", { precision: 36, scale: 18 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStakedNftSchema = createInsertSchema(stakedNftsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStakedNft = z.infer<typeof insertStakedNftSchema>;
export type StakedNft = typeof stakedNftsTable.$inferSelect;
