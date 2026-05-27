import { pgTable, text, serial, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const forexPairsTable = pgTable("forex_pairs", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull().default("forex"),
  enabled: boolean("enabled").notNull().default(true),
  currentPrice: real("current_price"),
  priceChange: real("price_change"),
  spread: real("spread"),
  volatility: text("volatility"),
  trend: text("trend"),
  bias: text("bias"),
  confidence: real("confidence"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertForexPairSchema = createInsertSchema(forexPairsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertForexPair = z.infer<typeof insertForexPairSchema>;
export type ForexPair = typeof forexPairsTable.$inferSelect;
