import { Router } from "express";
import { db } from "@workspace/db";
import { signalsTable, forexPairsTable, botSettingsTable } from "@workspace/db";
import { eq, desc, count, and, isNotNull } from "drizzle-orm";
import { analyzeSymbol, buildDetectors } from "../lib/analysis";
import { broadcastSignal } from "../lib/telegram";
import { requireAuth } from "../middlewares/auth";
import { GenerateSignalBody, UpdateSignalResultBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res): Promise<void> => {
  const { pair, result, limit = "50", offset = "0" } = req.query as Record<string, string>;
  const lim = Math.min(parseInt(limit) || 50, 200);
  const off = parseInt(offset) || 0;

  const conditions = [];
  if (pair) conditions.push(eq(signalsTable.pair, pair.toUpperCase()));
  if (result) conditions.push(eq(signalsTable.result, result));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [signals, [{ total }]] = await Promise.all([
    db.select().from(signalsTable)
      .where(whereClause)
      .orderBy(desc(signalsTable.createdAt))
      .limit(lim)
      .offset(off),
    db.select({ total: count() }).from(signalsTable).where(whereClause),
  ]);

  res.json({
    signals: signals.map(s => ({
      id: s.id,
      pair: s.pair,
      direction: s.direction,
      entryPrice: s.entryPrice,
      stopLoss: s.stopLoss,
      takeProfit1: s.takeProfit1,
      takeProfit2: s.takeProfit2,
      confidence: s.confidence,
      trend: s.trend,
      explanation: s.explanation,
      result: s.result,
      pips: s.pips,
      telegramSent: s.telegramSent,
      rsi: s.rsi,
      macd: s.macd,
      ema50: s.ema50,
      ema200: s.ema200,
      atr: s.atr,
      session: s.session,
      createdAt: s.createdAt.toISOString(),
      closedAt: s.closedAt?.toISOString() ?? null,
    })),
    total,
  });
});

router.post("/generate", requireAuth, async (req, res): Promise<void> => {
  const parsed = GenerateSignalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { symbol, sendTelegram = false } = parsed.data;

  const settings = await db.select().from(botSettingsTable).limit(1);
  const apiKey = settings[0]?.twelveDataApiKey ?? undefined;

  const analysis = await analyzeSymbol(symbol.toUpperCase(), apiKey ?? undefined);

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
    userId: req.user?.userId,
    telegramSent: false,
  }).returning();

  // Update pair stats
  await db.update(forexPairsTable)
    .set({
      currentPrice: analysis.entryPrice,
      trend: analysis.trend,
      bias: analysis.direction,
      confidence: analysis.confidence,
    })
    .where(eq(forexPairsTable.symbol, analysis.symbol));

  let tgSent = false;
  if (sendTelegram && settings[0]?.telegramEnabled) {
    const result = await broadcastSignal(analysis);
    tgSent = result.sent > 0;
    if (tgSent) {
      await db.update(signalsTable).set({ telegramSent: true }).where(eq(signalsTable.id, signal.id));
    }
  }

  res.status(201).json({
    id: signal.id,
    pair: signal.pair,
    direction: signal.direction,
    entryPrice: signal.entryPrice,
    stopLoss: signal.stopLoss,
    takeProfit1: signal.takeProfit1,
    takeProfit2: signal.takeProfit2,
    confidence: signal.confidence,
    trend: signal.trend,
    explanation: signal.explanation,
    result: signal.result,
    pips: signal.pips,
    telegramSent: tgSent,
    rsi: signal.rsi,
    macd: signal.macd,
    ema50: signal.ema50,
    ema200: signal.ema200,
    atr: signal.atr,
    session: signal.session,
    createdAt: signal.createdAt.toISOString(),
    closedAt: null,
  });
});

router.get("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [signal] = await db.select().from(signalsTable).where(eq(signalsTable.id, id)).limit(1);
  if (!signal) {
    res.status(404).json({ error: "Signal not found" });
    return;
  }
  res.json({
    id: signal.id,
    pair: signal.pair,
    direction: signal.direction,
    entryPrice: signal.entryPrice,
    stopLoss: signal.stopLoss,
    takeProfit1: signal.takeProfit1,
    takeProfit2: signal.takeProfit2,
    confidence: signal.confidence,
    trend: signal.trend,
    explanation: signal.explanation,
    result: signal.result,
    pips: signal.pips,
    telegramSent: signal.telegramSent,
    rsi: signal.rsi,
    macd: signal.macd,
    ema50: signal.ema50,
    ema200: signal.ema200,
    atr: signal.atr,
    session: signal.session,
    createdAt: signal.createdAt.toISOString(),
    closedAt: signal.closedAt?.toISOString() ?? null,
  });
});

router.patch("/:id/result", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = UpdateSignalResultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [signal] = await db.update(signalsTable)
    .set({ result: parsed.data.result, pips: parsed.data.pips ?? null, closedAt: new Date() })
    .where(eq(signalsTable.id, id))
    .returning();

  if (!signal) {
    res.status(404).json({ error: "Signal not found" });
    return;
  }

  res.json({
    id: signal.id,
    pair: signal.pair,
    direction: signal.direction,
    entryPrice: signal.entryPrice,
    stopLoss: signal.stopLoss,
    takeProfit1: signal.takeProfit1,
    takeProfit2: signal.takeProfit2,
    confidence: signal.confidence,
    trend: signal.trend,
    explanation: signal.explanation,
    result: signal.result,
    pips: signal.pips,
    telegramSent: signal.telegramSent,
    rsi: signal.rsi,
    macd: signal.macd,
    ema50: signal.ema50,
    ema200: signal.ema200,
    atr: signal.atr,
    session: signal.session,
    createdAt: signal.createdAt.toISOString(),
    closedAt: signal.closedAt?.toISOString() ?? null,
  });
});

router.get("/analysis/:symbol", async (req, res): Promise<void> => {
  const { symbol } = req.params;
  const settings = await db.select().from(botSettingsTable).limit(1);
  const apiKey = settings[0]?.twelveDataApiKey ?? undefined;
  const analysis = await analyzeSymbol(symbol.toUpperCase(), apiKey ?? undefined);
  res.json(analysis);
});

router.get("/detectors/:symbol", async (req, res): Promise<void> => {
  const { symbol } = req.params;
  const settings = await db.select().from(botSettingsTable).limit(1);
  const apiKey = settings[0]?.twelveDataApiKey ?? undefined;
  const analysis = await analyzeSymbol(symbol.toUpperCase(), apiKey ?? undefined);
  const detectors = buildDetectors(analysis);
  res.json(detectors);
});

export default router;
