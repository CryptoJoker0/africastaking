import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Registry of known AFRICA X1 NFTs (populated via mint events or admin import)
export const nftRegistryTable = pgTable("nft_registry", {
  id: serial("id").primaryKey(),
  tokenId: text("token_id").notNull().unique(),
  walletAddress: text("wallet_address").notNull(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  rarity: text("rarity").notNull(), // Common, Uncommon, Rare, Epic, Legendary
  collectionAddress: text("collection_address").notNull().default("0xAfricaX1GenesisCollection"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertNftRegistrySchema = createInsertSchema(nftRegistryTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNftRegistry = z.infer<typeof insertNftRegistrySchema>;
export type NftRegistry = typeof nftRegistryTable.$inferSelect;
