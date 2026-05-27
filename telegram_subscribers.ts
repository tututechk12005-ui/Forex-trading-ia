import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const telegramSubscribersTable = pgTable("telegram_subscribers", {
  id: serial("id").primaryKey(),
  chatId: text("chat_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  tier: text("tier").notNull().default("free"),
  active: boolean("active").notNull().default(true),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTelegramSubscriberSchema = createInsertSchema(telegramSubscribersTable).omit({ id: true, subscribedAt: true, updatedAt: true });
export type InsertTelegramSubscriber = z.infer<typeof insertTelegramSubscriberSchema>;
export type TelegramSubscriber = typeof telegramSubscribersTable.$inferSelect;
