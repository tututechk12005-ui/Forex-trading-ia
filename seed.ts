import { db } from "@workspace/db";
import { forexPairsTable, botSettingsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

const FOREX_PAIRS = [
  { symbol: "EURUSD", name: "Euro / US Dollar", category: "forex", currentPrice: 1.0852, spread: 0.0001, volatility: "Medium", trend: "Uptrend", bias: "BUY", confidence: 68 },
  { symbol: "GBPUSD", name: "British Pound / US Dollar", category: "forex", currentPrice: 1.2741, spread: 0.0002, volatility: "Medium", trend: "Ranging", bias: "SELL", confidence: 62 },
  { symbol: "USDJPY", name: "US Dollar / Japanese Yen", category: "forex", currentPrice: 149.82, spread: 0.02, volatility: "High", trend: "Uptrend", bias: "BUY", confidence: 74 },
  { symbol: "GBPJPY", name: "British Pound / Japanese Yen", category: "forex", currentPrice: 190.94, spread: 0.03, volatility: "High", trend: "Uptrend", bias: "BUY", confidence: 71 },
  { symbol: "XAUUSD", name: "Gold / US Dollar", category: "commodity", currentPrice: 2318.5, spread: 0.3, volatility: "High", trend: "Uptrend", bias: "BUY", confidence: 78 },
  { symbol: "NAS100", name: "NASDAQ 100 Index", category: "index", currentPrice: 18254.0, spread: 1.0, volatility: "High", trend: "Uptrend", bias: "BUY", confidence: 65 },
  { symbol: "BTCUSD", name: "Bitcoin / US Dollar", category: "crypto", currentPrice: 67420.0, spread: 10.0, volatility: "Very High", trend: "Uptrend", bias: "BUY", confidence: 60 },
  { symbol: "AUDUSD", name: "Australian Dollar / US Dollar", category: "forex", currentPrice: 0.6534, spread: 0.0001, volatility: "Low", trend: "Downtrend", bias: "SELL", confidence: 66 },
  { symbol: "EURJPY", name: "Euro / Japanese Yen", category: "forex", currentPrice: 162.58, spread: 0.02, volatility: "Medium", trend: "Uptrend", bias: "BUY", confidence: 72 },
  { symbol: "USDCAD", name: "US Dollar / Canadian Dollar", category: "forex", currentPrice: 1.3621, spread: 0.0001, volatility: "Low", trend: "Ranging", bias: "BUY", confidence: 59 },
];

export async function seedInitialData(): Promise<void> {
  // Seed forex pairs with ON CONFLICT DO NOTHING
  for (const pair of FOREX_PAIRS) {
    await db.execute(sql`
      INSERT INTO forex_pairs (symbol, name, category, enabled, current_price, spread, volatility, trend, bias, confidence)
      VALUES (${pair.symbol}, ${pair.name}, ${pair.category}, true, ${pair.currentPrice}, ${pair.spread}, ${pair.volatility}, ${pair.trend}, ${pair.bias}, ${pair.confidence})
      ON CONFLICT (symbol) DO NOTHING
    `);
  }

  // Seed default bot settings
  const existing = await db.select().from(botSettingsTable).limit(1);
  if (existing.length === 0) {
    await db.insert(botSettingsTable).values({
      autoAnalysisEnabled: false,
      analysisIntervalMinutes: 5,
      telegramEnabled: false,
    });
    logger.info("Default bot settings created");
  }
}
