import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, signalsTable, telegramSubscribersTable, botSettingsTable, adminLogsTable } from "@workspace/db";
import { eq, count, desc, sql, gte } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { getBotUptime } from "../lib/telegram";
import { broadcastSignal } from "../lib/telegram";
import { analyzeSymbol } from "../lib/analysis";
import { forexPairsTable } from "@workspace/db";
import { TogglePairBody, ToggleAutoAnalysisBody, AdminSendSignalBody } from "@workspace/api-zod";

const router = Router();
router.use(requireAdmin);

router.get("/dashboard", async (req, res): Promise<void> => {
  const [
    [{ totalUsers }],
    [{ totalSignals }],
    [{ totalSubscribers }],
    wins,
    losses,
    settings,
  ] = await Promise.all([
    db.select({ totalUsers: count() }).from(usersTable),
    db.select({ totalSignals: count() }).from(signalsTable),
    db.select({ totalSubscribers: count() }).from(telegramSubscribersTable).where(eq(telegramSubscribersTable.active, true)),
    db.select({ total: count() }).from(signalsTable).where(eq(signalsTable.result, "win")),
    db.select({ total: count() }).from(signalsTable).where(eq(signalsTable.result, "loss")),
    db.select().from(botSettingsTable).limit(1),
  ]);

  const total = wins[0].total + losses[0].total;
  const winRate = total > 0 ? parseFloat(((wins[0].total / total) * 100).toFixed(1)) : 0;
  const lossRate = total > 0 ? parseFloat(((losses[0].total / total) * 100).toFixed(1)) : 0;

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const [{ todaySignals }] = await db.select({ todaySignals: count() }).from(signalsTable).where(gte(signalsTable.createdAt, todayStart));

  const pipsResult = await db.select({ total: sql<number>`COALESCE(SUM(pips), 0)` }).from(signalsTable);
  const totalProfit = parseFloat((Number(pipsResult[0]?.total) * 0.1).toFixed(2));

  res.json({
    totalUsers,
    activeUsers: totalUsers,
    totalSignals,
    botUptime: getBotUptime(),
    winRate,
    lossRate,
    telegramSubscribers: totalSubscribers,
    todaySignals,
    autoAnalysisEnabled: settings[0]?.autoAnalysisEnabled ?? false,
    totalProfit,
  });
});

router.get("/users", async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map(u => ({
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  })));
});

router.get("/logs", async (req, res): Promise<void> => {
  const logs = await db.select().from(adminLogsTable).orderBy(desc(adminLogsTable.createdAt)).limit(100);
  res.json(logs.map(l => ({
    id: l.id,
    action: l.action,
    userId: l.userId,
    details: l.details,
    createdAt: l.createdAt.toISOString(),
  })));
});

router.patch("/pairs/:symbol/toggle", async (req, res): Promise<void> => {
  const parsed = TogglePairBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { symbol } = req.params;
  const [pair] = await db.update(forexPairsTable)
    .set({ enabled: parsed.data.enabled })
    .where(eq(forexPairsTable.symbol, symbol.toUpperCase()))
    .returning();

  if (!pair) {
    res.status(404).json({ error: "Pair not found" });
    return;
  }

  await db.insert(adminLogsTable).values({
    action: `${parsed.data.enabled ? "ENABLED" : "DISABLED"}_PAIR`,
    userId: req.user?.userId,
    details: `Pair ${symbol.toUpperCase()} ${parsed.data.enabled ? "enabled" : "disabled"}`,
  });

  res.json({
    id: pair.id, symbol: pair.symbol, name: pair.name, category: pair.category,
    enabled: pair.enabled, currentPrice: pair.currentPrice, priceChange: pair.priceChange,
    spread: pair.spread, volatility: pair.volatility, trend: pair.trend, bias: pair.bias,
    confidence: pair.confidence, updatedAt: pair.updatedAt?.toISOString() ?? null,
  });
});

router.patch("/auto-analysis/toggle", async (req, res): Promise<void> => {
  const parsed = ToggleAutoAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(botSettingsTable).limit(1);
  let settings;
  if (existing.length === 0) {
    [settings] = await db.insert(botSettingsTable).values({ autoAnalysisEnabled: parsed.data.enabled }).returning();
  } else {
    [settings] = await db.update(botSettingsTable)
      .set({ autoAnalysisEnabled: parsed.data.enabled })
      .where(eq(botSettingsTable.id, existing[0].id))
      .returning();
  }

  await db.insert(adminLogsTable).values({
    action: "TOGGLE_AUTO_ANALYSIS",
    userId: req.user?.userId,
    details: `Auto analysis ${parsed.data.enabled ? "enabled" : "disabled"}`,
  });

  res.json({
    id: settings.id,
    autoAnalysisEnabled: settings.autoAnalysisEnabled,
    analysisIntervalMinutes: settings.analysisIntervalMinutes,
    telegramEnabled: settings.telegramEnabled,
    hasTelegramToken: !!settings.telegramBotToken,
    hasTwelveDataKey: !!settings.twelveDataApiKey,
    hasAlphaVantageKey: !!settings.alphaVantageApiKey,
    hasOpenAiKey: !!settings.openAiApiKey,
    hasBinanceKey: !!settings.binanceApiKey,
    updatedAt: settings.updatedAt.toISOString(),
  });
});

router.post("/signal/send", async (req, res): Promise<void> => {
  const parsed = AdminSendSignalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const settings = await db.select().from(botSettingsTable).limit(1);
  const apiKey = settings[0]?.twelveDataApiKey ?? undefined;

  const pairs = await db.select().from(forexPairsTable).where(eq(forexPairsTable.enabled, true)).limit(1);
  const symbol = pairs[0]?.symbol ?? "EURUSD";
  const analysis = await analyzeSymbol(symbol, apiKey ?? undefined);
  const result = await broadcastSignal(analysis);

  await db.insert(adminLogsTable).values({
    action: "MANUAL_SIGNAL_SEND",
    userId: req.user?.userId,
    details: `Manual signal sent for ${symbol} — ${result.sent} delivered`,
  });

  res.json(result);
});

export default router;
