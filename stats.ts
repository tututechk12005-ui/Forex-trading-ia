import { Router } from "express";
import { db } from "@workspace/db";
import { signalsTable, telegramSubscribersTable } from "@workspace/db";
import { eq, count, sql, and, gte, isNotNull } from "drizzle-orm";

const router = Router();

router.get("/overview", async (req, res): Promise<void> => {
  const [all, wins, losses, breakevens, activeSubscribers] = await Promise.all([
    db.select({ total: count() }).from(signalsTable),
    db.select({ total: count() }).from(signalsTable).where(eq(signalsTable.result, "win")),
    db.select({ total: count() }).from(signalsTable).where(eq(signalsTable.result, "loss")),
    db.select({ total: count() }).from(signalsTable).where(eq(signalsTable.result, "breakeven")),
    db.select({ total: count() }).from(telegramSubscribersTable).where(eq(telegramSubscribersTable.active, true)),
  ]);

  const totalSignals = all[0].total;
  const totalWins = wins[0].total;
  const totalLosses = losses[0].total;
  const totalBreakeven = breakevens[0].total;
  const winRate = totalSignals > 0 ? parseFloat(((totalWins / totalSignals) * 100).toFixed(1)) : 0;

  // Pips stats
  const pipsResult = await db.select({ total: sql<number>`COALESCE(SUM(pips), 0)` }).from(signalsTable).where(isNotNull(signalsTable.pips));
  const totalPips = parseFloat((pipsResult[0]?.total || 0).toFixed(1));

  // Best/worst pair
  const pairStats = await db.select({
    pair: signalsTable.pair,
    wins: sql<number>`COUNT(*) FILTER (WHERE result = 'win')`,
    total: count(),
  }).from(signalsTable).groupBy(signalsTable.pair);

  let bestPair: string | null = null;
  let worstPair: string | null = null;
  let bestWr = -1;
  let worstWr = 101;

  for (const p of pairStats) {
    const wr = p.total > 0 ? (Number(p.wins) / p.total) * 100 : 0;
    if (wr > bestWr) { bestWr = wr; bestPair = p.pair; }
    if (wr < worstWr) { worstWr = wr; worstPair = p.pair; }
  }

  // Daily/weekly/monthly profit (simulated from pips)
  const dailyProfit = parseFloat((totalPips * 0.1 * 0.3).toFixed(2));
  const weeklyProfit = parseFloat((totalPips * 0.1 * 0.7).toFixed(2));
  const monthlyProfit = parseFloat((totalPips * 0.1).toFixed(2));

  // Today signals
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const [todaySig] = await db.select({ total: count() }).from(signalsTable).where(gte(signalsTable.createdAt, todayStart));

  res.json({
    totalSignals,
    totalWins,
    totalLosses,
    totalBreakeven,
    winRate,
    totalPips,
    bestPair,
    worstPair,
    dailyProfit,
    weeklyProfit,
    monthlyProfit,
    todaySignals: todaySig.total,
    activeSubscribers: activeSubscribers[0].total,
  });
});

router.get("/performance", async (req, res): Promise<void> => {
  const { period = "daily" } = req.query as { period?: string };

  const days = period === "monthly" ? 90 : period === "weekly" ? 28 : 14;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const signals = await db.select().from(signalsTable).where(gte(signalsTable.createdAt, since));

  const grouped: Record<string, { profit: number; wins: number; total: number }> = {};

  for (const s of signals) {
    let key: string;
    const d = s.createdAt;
    if (period === "monthly") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else if (period === "weekly") {
      const week = Math.floor(d.getDate() / 7);
      key = `${d.getFullYear()}-W${week}`;
    } else {
      key = d.toISOString().split("T")[0];
    }

    if (!grouped[key]) grouped[key] = { profit: 0, wins: 0, total: 0 };
    grouped[key].total++;
    if (s.result === "win") grouped[key].wins++;
    if (s.pips) grouped[key].profit += s.pips;
  }

  const points = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      profit: parseFloat(data.profit.toFixed(1)),
      winRate: data.total > 0 ? parseFloat(((data.wins / data.total) * 100).toFixed(1)) : 0,
      signals: data.total,
    }));

  res.json(points);
});

router.get("/pairs", async (req, res): Promise<void> => {
  const pairStats = await db.select({
    pair: signalsTable.pair,
    total: count(),
    wins: sql<number>`COUNT(*) FILTER (WHERE result = 'win')`,
    losses: sql<number>`COUNT(*) FILTER (WHERE result = 'loss')`,
    totalPips: sql<number>`COALESCE(SUM(pips), 0)`,
  }).from(signalsTable).groupBy(signalsTable.pair);

  res.json(pairStats.map(p => ({
    symbol: p.pair,
    totalSignals: p.total,
    wins: Number(p.wins),
    losses: Number(p.losses),
    winRate: p.total > 0 ? parseFloat(((Number(p.wins) / p.total) * 100).toFixed(1)) : 0,
    totalPips: parseFloat((Number(p.totalPips)).toFixed(1)),
  })));
});

export default router;
