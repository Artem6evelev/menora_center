// app/api/telegram/webhook/route.ts
import { Telegraf, Markup } from "telegraf";
import { db } from "@/lib/db";
import { users, botSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("[TELEGRAM] TELEGRAM_BOT_TOKEN is not set");
}

const bot = new Telegraf(TELEGRAM_BOT_TOKEN || "missing-token");

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { error };
}

export async function GET() {
  return Response.json({
    ok: true,
    route: "/api/telegram/webhook",
    hasToken: Boolean(TELEGRAM_BOT_TOKEN),
  });
}

// 🔥 ОБЪЕДИНЕННАЯ КЛАВИАТУРА: Рош ха-Шана + Навигация по сайту
const roshHashanaKeyboard = Markup.inlineKeyboard([
  // Кнопки для мероприятия
  [Markup.button.callback("🍯 Я приду!", "attend_rosh_hashana")],
  [
    Markup.button.url(
      "📞 Информация по WhatsApp",
      "https://wa.me/972506700779",
    ),
  ],

  // Главная кнопка сайта
  [
    Markup.button.url(
      "🌐 Главная страница общины",
      "https://www.menorah-rishon.com",
    ),
  ],

  // Основные разделы
  [
    Markup.button.url(
      "📅 Мероприятия",
      "https://www.menorah-rishon.com/events",
    ),
    Markup.button.url("🕍 Услуги", "https://www.menorah-rishon.com/services"),
  ],

  // Дополнительные разделы
  [
    Markup.button.url(
      "📺 Видеоуроки",
      "https://www.menorah-rishon.com/lessons",
    ),
    Markup.button.url("👶 Menorah Kids", "https://www.menorah-rishon.com/kids"),
  ],

  // Ежедневный контент
  [Markup.button.url("Наш Телеграм канал", "https://t.me/menorah_rishon")],

  // Поддержка
  [
    Markup.button.url(
      "🤍 Поддержать общину (Цдака)",
      "https://shutaf.im/cba30",
    ),
  ],
]);

// 🔥 ВРЕМЕННЫЙ ПОМОЩНИК: Получаем file_id видео (удали после получения ID)
bot.on("video", async (ctx) => {
  const fileId = ctx.message.video.file_id;
  await ctx.reply(
    `Твой file_id для видео:\n\n<code>${fileId}</code>\n\nВставь его в переменную videoFileId в коде.`,
    {
      parse_mode: "HTML",
    },
  );
});

// 🔥 ОБРАБОТКА КОМАНДЫ /start
bot.start(async (ctx) => {
  const updateId = ctx.update.update_id;
  const tgUser = ctx.from;
  const chatId = ctx.chat.id.toString();
  const trace = `[TELEGRAM][update:${updateId}][chat:${chatId}]`;

  // ⚠️ СЮДА ВСТАВЬ КОД ВИДЕО, КОТОРЫЙ ВЫДАСТ БОТ
  const videoFileId = "СЮДА_ВСТАВИТЬ_FILE_ID_ВИДЕО";

  const inviteCaption = `
🍯 <b>Счастливый и сладкий год вам обеспечен, ${tgUser.first_name}!</b>

Община «Menorah Center» приглашает вас вместе со всей вашей семьёй услышать звучание Шофара и исполнить одну из главных заповедей Рош ха-Шана.

🎺 <b>Главное событие: Звук шофара</b>
• <b>Когда:</b> 2-го Тишрея (13.09) в <b>12:00</b>

📍 <b>Место:</b> <a href="https://maps.google.com/?cid=16811818334291695337">Ришон ле-Цион, ул. Меирович 40</a> (синагога, 1-й этаж).

<i>Мы будем рады видеть каждого из вас вместе с вашей семьёй!
«Menorah Center» объединяет людей! 🤍</i>
  `.trim();

  try {
    // Сохраняем пользователя в БД, если его там нет
    const existingUser = await db.query.users.findFirst({
      where: eq(users.telegramChatId, chatId),
    });

    if (!existingUser) {
      await db.insert(users).values({
        id: `tg_${chatId}`,
        email: `tg_${chatId}@telegram.bot`,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name || "",
        username: tgUser.username || "",
        telegramChatId: chatId,
        source: "telegram_bot",
        role: "client",
      });
    }

    // Отправляем видео с приглашением и кнопками
    await ctx.replyWithVideo(videoFileId, {
      caption: inviteCaption,
      parse_mode: "HTML",
      ...roshHashanaKeyboard,
    });
  } catch (error) {
    console.error(`${trace} start handler failed`, getErrorDetails(error));
    // Фолбэк на случай, если видео еще не загружено или указан неверный ID
    try {
      await ctx.reply(inviteCaption, {
        parse_mode: "HTML",
        ...roshHashanaKeyboard,
      });
    } catch (replyError) {
      console.error("Failed to send error reply", replyError);
    }
  }
});

// 🔥 ОБРАБОТКА НАЖАТИЯ НА КНОПКУ «Я приду!»
bot.on("callback_query", async (ctx) => {
  const cbQuery = ctx.callbackQuery;

  if ("data" in cbQuery && cbQuery.data === "attend_rosh_hashana") {
    const tgUser = cbQuery.from;
    const username = tgUser.username
      ? `@${tgUser.username}`
      : tgUser.first_name;

    try {
      await ctx.answerCbQuery(
        "Отлично! Ждем вас на празднике. Сладкого года! 🍯",
        { show_alert: true },
      );

      const settings = await db.query.botSettings.findFirst();
      const groupId = settings?.notificationGroupId;
      const topicId = settings?.eventsTopicId;

      if (groupId) {
        await ctx.telegram.sendMessage(
          groupId,
          `🔔 <b>Новый гость на Рош ха-Шана!</b>\nПользователь ${username} нажал кнопку «Я приду!».`,
          {
            parse_mode: "HTML",
            message_thread_id:
              topicId && topicId.trim() !== "" ? parseInt(topicId) : undefined,
          },
        );
      }
    } catch (error) {
      console.error("Ошибка обработки callback_query:", error);
    }
  }
});

// 🔥 ОБРАБОТКА ЛЮБОГО ДРУГОГО ТЕКСТА
bot.on("text", async (ctx) => {
  const text =
    `Шалом! Этот бот работает в автоматическом режиме для связи с сообществом Menorah Center.\n\n` +
    `👇 <b>Пожалуйста, воспользуйтесь главным меню:</b>`;

  await ctx.reply(text, {
    parse_mode: "HTML",
    ...roshHashanaKeyboard,
  });
});

export async function POST(req: Request) {
  if (!TELEGRAM_BOT_TOKEN)
    return Response.json(
      { ok: false, error: "Missing token" },
      { status: 500 },
    );

  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Processing failed" },
      { status: 500 },
    );
  }
}
