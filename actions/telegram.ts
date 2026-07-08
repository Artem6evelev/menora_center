// actions/telegram.ts
"use server";

import { Telegraf } from "telegraf";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isNotNull, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function sendBroadcastMessage(message: string) {
  try {
    // 1. Проверяем, что рассылку делает именно администратор
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Не авторизован" };

    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    if (
      !currentUser ||
      (currentUser.role !== "admin" && currentUser.role !== "superadmin")
    ) {
      return { success: false, error: "Недостаточно прав доступа" };
    }

    if (!message.trim()) {
      return { success: false, error: "Текст сообщения не может быть пустым" };
    }

    // 2. Инициализируем бота
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

    // 3. Достаем всех подписчиков из БД
    const subscribers = await db
      .select()
      .from(users)
      .where(isNotNull(users.telegramChatId));

    if (subscribers.length === 0) {
      return {
        success: false,
        error: "В базе данных нет активных подписчиков с Telegram",
      };
    }

    let successCount = 0;
    let failCount = 0;

    // 4. Делаем рассылку
    for (const sub of subscribers) {
      if (!sub.telegramChatId) continue;
      try {
        await bot.telegram.sendMessage(sub.telegramChatId, message, {
          parse_mode: "HTML", // Разрешаем жирный шрифт и ссылки
        });
        successCount++;
      } catch (err) {
        // Если юзер заблокировал бота, ошибка перехватывается здесь
        failCount++;
      }
    }

    return {
      success: true,
      message: `Рассылка завершена! Успешно доставлено: ${successCount}. Не доставлено (заблокировали бота): ${failCount}`,
    };
  } catch (error) {
    console.error("Ошибка при выполнении массовой рассылки:", error);
    return {
      success: false,
      error: "Не удалось выполнить рассылку из-за внутренней ошибки сервера",
    };
  }
}
