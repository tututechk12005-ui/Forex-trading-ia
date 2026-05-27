import { pgTable, text, serial, timestamp, real, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const signalsTable = pgTable("signals", {
  id: serial("id").primaryKey(),
  pair: text("pair").notNull(),
  direction: text("direction").notNull(),
  entryPrice: real("entry_price").notNull(),
  stopLoss: real("stop_loss").notNull(),
  takeProfit1: real("take_profit_1").notNull(),
  takeProfit2: real("take_profit_2").notNull(),
  confidence: real("confidence").notNull(),
  trend: text("trend"),
  explanation: text("explanation"),
  result: text("result"),
  pips: real("pips"),
  telegramSent: boolean("telegram_sent").notNull().default(false),
  rsi: real("rsi"),
  macd: real("macd"),
  ema50: real("ema50"),
  ema200: real("ema200"),
  atr: real("atr"),
  session: text("session"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const insertSignalSchema = createInsertSchema(signalsTable).omit({ id: true, createdAt: true });
export type InsertSignal = z.infer<typeof insertSignalSchema>;
export type Signal = typeof signalsTable.$inferSelect;
