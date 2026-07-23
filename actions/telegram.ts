"use server";

import { Telegraf } from "telegraf";
import { db } from "@/lib/db";
import { users, botSettings } from "@/lib/db/schema";
import { isNotNull, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

// 1. МАССОВАЯ РАССЫЛКА
export async function sendBroadcastMessage(message: string) {
  try {
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

    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
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

    for (const sub of subscribers) {
      if (!sub.telegramChatId) continue;
      try {
        await bot.telegram.sendMessage(sub.telegramChatId, message, {
          parse_mode: "HTML",
        });
        successCount++;
      } catch (err) {
        failCount++;
      }
    }

    return {
      success: true,
      message: `Рассылка завершена! Успешно доставлено: ${successCount}. Не доставлено: ${failCount}`,
    };
  } catch (error) {
    console.error("Ошибка при выполнении массовой рассылки:", error);
    return { success: false, error: "Внутренняя ошибка сервера" };
  }
}

// 2. ОТПРАВКА ЗАЯВКИ В ТЕМУ ГРУППЫ
export async function sendEventRegistrationNotification(
  eventTitle: string,
  user: {
    firstName: string;
    lastName?: string | null;
    email: string;
    phone?: string | null;
  },
) {
  try {
    const settings = await db.query.botSettings.findFirst();

    const groupId = settings?.notificationGroupId;
    const topicId = settings?.eventsTopicId;

    if (!groupId) {
      console.log("ID группы для уведомлений не настроен.");
      return { success: false, error: "ID группы не настроен" };
    }

    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

    const fileContent = `
НОВАЯ ЗАПИСЬ НА МЕРОПРИЯТИЕ
-----------------------------------
Мероприятие: ${eventTitle}
Дата регистрации: ${new Date().toLocaleString("ru-RU")}

ДАННЫЕ УЧАСТНИКА:
Имя: ${user.firstName} ${user.lastName || ""}
Email: ${user.email}
Телефон: ${user.phone || "Не указан"}
-----------------------------------
Данные сгенерированы автоматически.
    `.trim();

    const buffer = Buffer.from(fileContent, "utf-8");
    const safeName = user.firstName.replace(/[^a-zа-яё0-9]/gi, "_");
    const filename = `Заявка_${safeName}.txt`;

    await bot.telegram.sendDocument(
      groupId,
      { source: buffer, filename },
      {
        message_thread_id: topicId ? parseInt(topicId) : undefined, // Отправка в нужный топик
        caption: `🔥 <b>Новая заявка на мероприятие!</b>\n\nМероприятие: <b>${eventTitle}</b>\nОт: ${user.firstName} ${user.lastName || ""}\n\n<i>Контакты в файле ☝️</i>`,
        parse_mode: "HTML",
      },
    );

    return { success: true };
  } catch (error) {
    console.error("Ошибка при отправке файла в Telegram:", error);
    return { success: false, error: "Не удалось отправить уведомление" };
  }
}
