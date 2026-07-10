import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stakingConfigTable = pgTable("staking_config", {
  id: serial("id").primaryKey(),
  stakingEnabled: boolean("staking_enabled").notNull().default(true),
  stakingPaused: boolean("staking_paused").notNull().default(false),
  claimingPaused: boolean("claiming_paused").notNull().default(false),
  collectionAddress: text("collection_address").notNull().default("0xAfricaX1GenesisCollection"),
  supportedTokens: text("supported_tokens").array().notNull().default(["XNT", "X1Brains", "AF"]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStakingConfigSchema = createInsertSchema(stakingConfigTable).omit({ id: true });
export type InsertStakingConfig = z.infer<typeof insertStakingConfigSchema>;
export type StakingConfig = typeof stakingConfigTable.$inferSelect;
