import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rewardRatesTable = pgTable("reward_rates", {
  id: serial("id").primaryKey(),
  rarity: text("rarity").notNull().unique(), // Common, Uncommon, Rare, Epic, Legendary
  xntPerDay: numeric("xnt_per_day", { precision: 36, scale: 18 }).notNull().default("1"),
  x1BrainsPerDay: numeric("x1brains_per_day", { precision: 36, scale: 18 }).notNull().default("1"),
  afPerDay: numeric("af_per_day", { precision: 36, scale: 18 }).notNull().default("1"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRewardRateSchema = createInsertSchema(rewardRatesTable).omit({ id: true });
export type InsertRewardRate = z.infer<typeof insertRewardRateSchema>;
export type RewardRate = typeof rewardRatesTable.$inferSelect;
