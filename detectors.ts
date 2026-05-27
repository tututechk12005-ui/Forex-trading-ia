import { Router } from "express";
import { db } from "@workspace/db";
import { botSettingsTable } from "@workspace/db";
import { analyzeSymbol, buildDetectors } from "../lib/analysis";

const router = Router();

// GET /api/detectors/:symbol
router.get("/:symbol", async (req, res): Promise<void> => {
  const { symbol } = req.params;
  const settings = await db.select().from(botSettingsTable).limit(1);
  const apiKey = settings[0]?.twelveDataApiKey ?? undefined;
  const analysis = await analyzeSymbol(symbol.toUpperCase(), apiKey ?? undefined);
  const detectors = buildDetectors(analysis);
  res.json(detectors);
});

export default router;
