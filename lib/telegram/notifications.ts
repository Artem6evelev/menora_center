import "server-only";
import { Telegraf } from "telegraf";
import { db } from "@/lib/db";
import { botSettings } from "@/lib/db/schema";
import { escapeTelegramHtml } from "./safety";

// 2. ОТПРАВКА ЗАЯВКИ В ТЕМУ ГРУППЫ (МЕРОПРИЯТИЯ)
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

    if (!groupId || groupId.trim() === "") {
      console.log("Уведомления отключены: ID группы не задан.");
      return { success: true, message: "Уведомления отключены" };
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
        message_thread_id:
          topicId && topicId.trim() !== "" ? parseInt(topicId) : undefined,
        caption: `🔥 <b>Новая заявка на мероприятие!</b>\n\nМероприятие: <b>${escapeTelegramHtml(eventTitle)}</b>\nОт: ${escapeTelegramHtml(user.firstName)} ${escapeTelegramHtml(user.lastName || "")}\n\n<i>Контакты в файле ☝️</i>`,
        parse_mode: "HTML",
      },
    );

    return { success: true };
  } catch (error) {
    console.error("Telegram notification failed");
    return { success: false, error: "Не удалось отправить уведомление" };
  }
}

// 3. ОТПРАВКА ЗАЯВКИ В ТЕМУ ГРУППЫ (УСЛУГИ)
export async function sendServiceRegistrationNotification(
  serviceTitle: string,
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
    const topicId = settings?.servicesTopicId;

    if (!groupId || groupId.trim() === "") {
      return { success: true, message: "Уведомления отключены" };
    }

    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

    const fileContent = `
НОВАЯ ЗАЯВКА НА УСЛУГУ
-----------------------------------
Услуга: ${serviceTitle}
Дата регистрации: ${new Date().toLocaleString("ru-RU")}

ДАННЫЕ ЗАКАЗЧИКА:
Имя: ${user.firstName} ${user.lastName || ""}
Email: ${user.email}
Телефон: ${user.phone || "Не указан"}
-----------------------------------
Данные сгенерированы автоматически.
    `.trim();

    const buffer = Buffer.from(fileContent, "utf-8");
    const safeName = user.firstName.replace(/[^a-zа-яё0-9]/gi, "_");
    const filename = `Услуга_${safeName}.txt`;

    await bot.telegram.sendDocument(
      groupId,
      { source: buffer, filename },
      {
        message_thread_id:
          topicId && topicId.trim() !== "" ? parseInt(topicId) : undefined,
        caption: `🛠 <b>Новая заявка на услугу!</b>\n\nУслуга: <b>${escapeTelegramHtml(serviceTitle)}</b>\nОт: ${escapeTelegramHtml(user.firstName)} ${escapeTelegramHtml(user.lastName || "")}\n\n<i>Контакты в файле ☝️</i>`,
        parse_mode: "HTML",
      },
    );

    return { success: true };
  } catch (error) {
    console.error("Telegram notification failed");
    return { success: false, error: "Не удалось отправить уведомление" };
  }
}
