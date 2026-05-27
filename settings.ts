import { Router } from "express";
import { db } from "@workspace/db";
import { botSettingsTable, adminLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { initBot } from "../lib/telegram";
import { logger } from "../lib/logger";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router = Router();
router.use(requireAdmin);

function toResponse(s: typeof botSettingsTable.$inferSelect) {
  return {
    id: s.id,
    autoAnalysisEnabled: s.autoAnalysisEnabled,
    analysisIntervalMinutes: s.analysisIntervalMinutes,
    telegramEnabled: s.telegramEnabled,
    hasTelegramToken: !!s.telegramBotToken,
    hasTwelveDataKey: !!s.twelveDataApiKey,
    hasAlphaVantageKey: !!s.alphaVantageApiKey,
    hasOpenAiKey: !!s.openAiApiKey,
    hasBinanceKey: !!s.binanceApiKey,
    updatedAt: s.updatedAt.toISOString(),
  };
}

router.get("/", async (req, res): Promise<void> => {
  const existing = await db.select().from(botSettingsTable).limit(1);
  if (existing.length === 0) {
    const [settings] = await db.insert(botSettingsTable).values({}).returning();
    res.json(toResponse(settings));
    return;
  }
  res.json(toResponse(existing[0]));
});

router.patch("/", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const existing = await db.select().from(botSettingsTable).limit(1);

  const updateData: Record<string, unknown> = {};
  if (data.autoAnalysisEnabled !== undefined) updateData.autoAnalysisEnabled = data.autoAnalysisEnabled;
  if (data.analysisIntervalMinutes !== undefined) updateData.analysisIntervalMinutes = data.analysisIntervalMinutes;
  if (data.telegramEnabled !== undefined) updateData.telegramEnabled = data.telegramEnabled;
  if (data.telegramBotToken !== undefined && data.telegramBotToken !== "") updateData.telegramBotToken = data.telegramBotToken;
  if (data.twelveDataApiKey !== undefined && data.twelveDataApiKey !== "") updateData.twelveDataApiKey = data.twelveDataApiKey;
  if (data.alphaVantageApiKey !== undefined && data.alphaVantageApiKey !== "") updateData.alphaVantageApiKey = data.alphaVantageApiKey;
  if (data.openAiApiKey !== undefined && data.openAiApiKey !== "") updateData.openAiApiKey = data.openAiApiKey;
  if (data.binanceApiKey !== undefined && data.binanceApiKey !== "") updateData.binanceApiKey = data.binanceApiKey;

  let settings;
  if (existing.length === 0) {
    [settings] = await db.insert(botSettingsTable).values(updateData as Parameters<typeof db.insert>[1]).returning();
  } else {
    [settings] = await db.update(botSettingsTable)
      .set(updateData)
      .where(eq(botSettingsTable.id, existing[0].id))
      .returning();
  }

  if (data.telegramBotToken && data.telegramBotToken !== "") {
    try {
      await initBot(data.telegramBotToken);
      logger.info("Telegram bot re-initialized with new token");
    } catch (err) {
      logger.warn({ err }, "Failed to init bot with new token");
    }
  }

  await db.insert(adminLogsTable).values({
    action: "UPDATE_SETTINGS",
    userId: req.user?.userId,
    details: `Settings updated: ${Object.keys(updateData).join(", ")}`,
  });

  res.json(toResponse(settings));
});

export default router;
