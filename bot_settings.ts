import { pgTable, serial, timestamp, boolean, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const botSettingsTable = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  autoAnalysisEnabled: boolean("auto_analysis_enabled").notNull().default(false),
  analysisIntervalMinutes: integer("analysis_interval_minutes").notNull().default(5),
  telegramEnabled: boolean("telegram_enabled").notNull().default(false),
  telegramBotToken: text("telegram_bot_token"),
  twelveDataApiKey: text("twelve_data_api_key"),
  alphaVantageApiKey: text("alpha_vantage_api_key"),
  openAiApiKey: text("open_ai_api_key"),
  binanceApiKey: text("binance_api_key"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBotSettingsSchema = createInsertSchema(botSettingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type BotSettings = typeof botSettingsTable.$inferSelect;
