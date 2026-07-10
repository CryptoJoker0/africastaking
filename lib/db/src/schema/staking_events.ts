import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stakingEventsTable = pgTable("staking_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // stake, unstake, claim
  walletAddress: text("wallet_address").notNull(),
  tokenId: text("token_id").notNull(),
  txHash: text("tx_hash").notNull(),
  xntAmount: numeric("xnt_amount", { precision: 36, scale: 18 }),
  x1BrainsAmount: numeric("x1brains_amount", { precision: 36, scale: 18 }),
  afAmount: numeric("af_amount", { precision: 36, scale: 18 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStakingEventSchema = createInsertSchema(stakingEventsTable).omit({ id: true, createdAt: true });
export type InsertStakingEvent = z.infer<typeof insertStakingEventSchema>;
export type StakingEvent = typeof stakingEventsTable.$inferSelect;
