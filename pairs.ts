import { Router } from "express";
import { db } from "@workspace/db";
import { forexPairsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getLivePrice } from "../lib/analysis";

const router = Router();

router.get("/", async (req, res): Promise<void> => {
  const pairs = await db.select().from(forexPairsTable).orderBy(forexPairsTable.symbol);
  res.json(pairs.map(p => ({
    id: p.id,
    symbol: p.symbol,
    name: p.name,
    category: p.category,
    enabled: p.enabled,
    currentPrice: p.currentPrice,
    priceChange: p.priceChange,
    spread: p.spread,
    volatility: p.volatility,
    trend: p.trend,
    bias: p.bias,
    confidence: p.confidence,
    updatedAt: p.updatedAt?.toISOString() ?? null,
  })));
});

router.get("/:symbol", async (req, res): Promise<void> => {
  const { symbol } = req.params;
  const [pair] = await db.select().from(forexPairsTable).where(eq(forexPairsTable.symbol, symbol.toUpperCase())).limit(1);
  if (!pair) {
    res.status(404).json({ error: "Pair not found" });
    return;
  }
  res.json({
    id: pair.id,
    symbol: pair.symbol,
    name: pair.name,
    category: pair.category,
    enabled: pair.enabled,
    currentPrice: pair.currentPrice,
    priceChange: pair.priceChange,
    spread: pair.spread,
    volatility: pair.volatility,
    trend: pair.trend,
    bias: pair.bias,
    confidence: pair.confidence,
    updatedAt: pair.updatedAt?.toISOString() ?? null,
  });
});

router.get("/:symbol/price", async (req, res): Promise<void> => {
  const { symbol } = req.params;
  const price = getLivePrice(symbol.toUpperCase());
  res.json(price);
});

export default router;
