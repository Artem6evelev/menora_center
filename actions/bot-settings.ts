"use server";

import { db } from "@/lib/db";
import { botSettings } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function getBotSettings() {
  const settings = await db.select().from(botSettings).limit(1);
  return settings[0] || null;
}

export async function updateBotSettings(data: any) {
  const existing = await getBotSettings();

  if (existing) {
    await db.update(botSettings).set({
      ...data,
      updatedAt: new Date(),
    });
  } else {
    await db.insert(botSettings).values(data);
  }

  revalidatePath("/dashboard/telegram");
  return { success: true };
}

// Функция для рассылки сообщения всем, у кого привязан Telegram
export async function sendBulkTelegramMessage(text: string) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const usersWithTelegram = await db.query.users.findMany({
    where: (users, { isNotNull }) => isNotNull(users.telegramChatId),
  });

  const results = await Promise.all(
    usersWithTelegram.map(async (user) => {
      return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: user.telegramChatId,
          text: text,
          parse_mode: "HTML",
        }),
      });
    }),
  );

  return { success: true, count: results.length };
}
