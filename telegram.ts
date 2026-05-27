import { Router } from "express";
import { db } from "@workspace/db";
import { telegramSubscribersTable, adminLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { broadcastText, getBotInstance } from "../lib/telegram";
import { logger } from "../lib/logger";
import { BroadcastMessageBody } from "@workspace/api-zod";

const router = Router();

router.get("/subscribers", requireAdmin, async (req, res): Promise<void> => {
  const subs = await db.select().from(telegramSubscribersTable).orderBy(telegramSubscribersTable.subscribedAt);
  res.json(subs.map(s => ({
    id: s.id,
    chatId: s.chatId,
    username: s.username,
    firstName: s.firstName,
    tier: s.tier,
    active: s.active,
    subscribedAt: s.subscribedAt.toISOString(),
  })));
});

router.post("/broadcast", requireAdmin, async (req, res): Promise<void> => {
  const parsed = BroadcastMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, tier = "all" } = parsed.data;
  const result = await broadcastText(message, tier as "all" | "free" | "premium");

  await db.insert(adminLogsTable).values({
    action: "BROADCAST_MESSAGE",
    userId: req.user?.userId,
    details: `Broadcast sent to ${tier} — ${result.sent}/${result.total} delivered`,
  });

  res.json(result);
});

router.post("/webhook", async (req, res): Promise<void> => {
  const bot = getBotInstance();
  if (bot) {
    try {
      await (bot as unknown as { processUpdate: (update: unknown) => void }).processUpdate(req.body);
    } catch (err) {
      logger.warn({ err }, "Webhook processing error");
    }
  }
  res.json({ ok: true });
});

export default router;
