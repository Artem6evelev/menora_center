import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, botSettings } from "@/lib/db/schema";
import { eq, like } from "drizzle-orm";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Вспомогательная функция для отправки сообщений
async function sendMessage(
  chatId: number | string,
  text: string,
  replyMarkup: any = null,
) {
  const payload: any = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
  };
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Telegram присылает данные в объекте message
    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text;
      const contact = body.message.contact;

      // Получаем настройки бота из БД (если их еще нет, берем дефолтные пустые)
      const settingsList = await db.select().from(botSettings).limit(1);
      const settings = settingsList[0] || {};

      // СЦЕНАРИЙ 1: Пользователь нажал /start
      if (text === "/start") {
        await sendMessage(
          chatId,
          "Шалом! ☕️\n\nЧтобы присоединиться к закрытым утренним эфирам Хасидута, нам нужно убедиться, что вы являетесь резидентом общины.\n\nПожалуйста, нажмите кнопку ниже, чтобы поделиться контактом.",
          {
            keyboard: [
              [{ text: "📱 Поделиться контактом", request_contact: true }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        );
        return NextResponse.json({ ok: true });
      }

      // СЦЕНАРИЙ 2: Пользователь отправил контакт
      if (contact && contact.phone_number) {
        // Очищаем номер от плюсов, скобок и пробелов для точного поиска
        const cleanPhone = contact.phone_number.replace(/\D/g, "");

        // Ищем пользователя в БД по номеру (используем like, т.к. номера могут быть записаны по-разному)
        const foundUsers = await db
          .select()
          .from(users)
          .where(like(users.phone, `%${cleanPhone.slice(-9)}%`)); // Ищем по последним 9 цифрам для надежности

        if (foundUsers.length > 0) {
          const user = foundUsers[0];

          // Привязываем Telegram ID к карточке пользователя
          await db
            .update(users)
            .set({ telegramChatId: chatId.toString() })
            .where(eq(users.id, user.id));

          // Отправляем успешное сообщение и ссылку на канал (если она есть в настройках)
          const channelLink = settings.channelLink || "Ссылка скоро появится";

          // Убираем клавиатуру с кнопкой "Поделиться"
          await sendMessage(
            chatId,
            `Рады видеть вас, <b>${user.firstName || "резидент"}</b>! 🎉\n\nВы успешно авторизованы.\n\n👉 Вот ваша ссылка на закрытый канал: ${channelLink}\n\n<i>Каждое утро мы будем присылать вам напоминание перед началом эфира.</i>`,
            { remove_keyboard: true },
          );
        } else {
          // Если номер не найден в CRM
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
          await sendMessage(
            chatId,
            `К сожалению, ваш номер не найден в базе резидентов. 😔\n\nЕсли вы еще не заполнили анкету, пожалуйста, сделайте это на нашей платформе:\n👉 <a href="${appUrl}/sign-in">Регистрация в Menorah</a>\n\nПосле заполнения анкеты возвращайтесь сюда и попробуйте снова!`,
            { remove_keyboard: true },
          );
        }
        return NextResponse.json({ ok: true });
      }
    }

    // Возвращаем 200 OK, чтобы Telegram понял, что мы приняли запрос
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Ошибка в Webhook Telegram:", error);
    return NextResponse.json({ ok: false });
  }
}
