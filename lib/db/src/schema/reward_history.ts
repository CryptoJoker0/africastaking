import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rewardHistoryTable = pgTable("reward_history", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  tokenId: text("token_id").notNull(),
  xntAmount: numeric("xnt_amount", { precision: 36, scale: 18 }).notNull().default("0"),
  x1BrainsAmount: numeric("x1brains_amount", { precision: 36, scale: 18 }).notNull().default("0"),
  afAmount: numeric("af_amount", { precision: 36, scale: 18 }).notNull().default("0"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRewardHistorySchema = createInsertSchema(rewardHistoryTable).omit({ id: true, claimedAt: true });
export type InsertRewardHistory = z.infer<typeof insertRewardHistorySchema>;
export type RewardHistory = typeof rewardHistoryTable.$inferSelect;
