import cron from "node-cron";
import { db } from "@workspace/db";
import { botSettingsTable, forexPairsTable, signalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { analyzeSymbol } from "./analysis";
import { broadcastSignal } from "./telegram";
import { logger } from "./logger";

let cronTask: cron.ScheduledTask | null = null;

export async function startAutoAnalysis(): Promise<void> {
  const settings = await db.select().from(botSettingsTable).limit(1);
  if (!settings.length || !settings[0].autoAnalysisEnabled) {
    logger.info("Auto-analysis is disabled — skipping start");
    return;
  }

  const intervalMinutes = settings[0].analysisIntervalMinutes ?? 5;
  const cronExpr = `*/${intervalMinutes} * * * *`;

  if (cronTask) {
    cronTask.stop();
  }

  cronTask = cron.schedule(cronExpr, async () => {
    try {
      const currentSettings = await db.select().from(botSettingsTable).limit(1);
      if (!currentSettings.length || !currentSettings[0].autoAnalysisEnabled) {
        return;
      }

      const pairs = await db.select().from(forexPairsTable).where(eq(forexPairsTable.enabled, true));
      const apiKey = currentSettings[0].twelveDataApiKey ?? undefined;

      for (const pair of pairs) {
        try {
          const analysis = await analyzeSymbol(pair.symbol, apiKey);

          // Only generate signal if confidence >= 70
          if (analysis.confidence >= 70) {
            const [signal] = await db.insert(signalsTable).values({
              pair: analysis.symbol,
              direction: analysis.direction,
              entryPrice: analysis.entryPrice,
              stopLoss: analysis.stopLoss,
              takeProfit1: analysis.takeProfit1,
              takeProfit2: analysis.takeProfit2,
              confidence: analysis.confidence,
              trend: analysis.trend,
              explanation: analysis.explanation,
              rsi: analysis.rsi,
              macd: analysis.macd,
              ema50: analysis.ema50,
              ema200: analysis.ema200,
              atr: analysis.atr,
              session: analysis.session,
              telegramSent: false,
            }).returning();

            // Update pair stats
            await db.update(forexPairsTable).set({
              currentPrice: analysis.entryPrice,
              trend: analysis.trend,
              bias: analysis.direction,
              confidence: analysis.confidence,
            }).where(eq(forexPairsTable.symbol, pair.symbol));

            // Broadcast if telegram is enabled
            if (currentSettings[0].telegramEnabled) {
              const result = await broadcastSignal(analysis);
              if (result.sent > 0) {
                await db.update(signalsTable).set({ telegramSent: true }).where(eq(signalsTable.id, signal.id));
              }
              logger.info({ symbol: pair.symbol, sent: result.sent }, "Auto signal broadcast");
            }

            logger.info({ symbol: pair.symbol, direction: analysis.direction, confidence: analysis.confidence }, "Auto signal generated");
          }
        } catch (err) {
          logger.warn({ err, symbol: pair.symbol }, "Auto-analysis failed for pair");
        }

        // Small delay between pairs
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      logger.error({ err }, "Auto-analysis cron error");
    }
  });

  logger.info({ cronExpr }, "Auto-analysis cron started");
}

export function stopAutoAnalysis(): void {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info("Auto-analysis cron stopped");
  }
}
