// app/api/telegram/webhook/route.ts
import { Telegraf, Markup } from "telegraf";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
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

// 🔥 КЛАВИАТУРА, ПОЛНОСТЬЮ ОТРАЖАЮЩАЯ СТРУКТУРУ САЙТА
const mainMenuKeyboard = Markup.inlineKeyboard([
  // Главная кнопка
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
  [
    Markup.button.url(
      "☕️ Утренний Хасидут: онлайн каждый день",
      "https://t.me/menorah_rishon",
    ),
  ],

  // Поддержка
  [
    Markup.button.url(
      "🤍 Поддержать общину (Цдака)",
      "https://shutaf.im/cba30",
    ),
  ],
]);

// 🔥 ОБРАБОТКА КОМАНДЫ /start
bot.start(async (ctx) => {
  const updateId = ctx.update.update_id;
  const tgUser = ctx.from;
  const chatId = ctx.chat.id.toString();
  const trace = `[TELEGRAM][update:${updateId}][chat:${chatId}]`;

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.telegramChatId, chatId),
    });

    // 🔥 ИДЕАЛЬНЫЙ ТЕКСТ, СКОПИРОВАННЫЙ СО СМЫСЛОВ САЙТА
    const welcomeText =
      `✨ <b>Шалом, ${tgUser.first_name}!</b>\n\n` +
      `Добро пожаловать в официальный бот <b>Menorah Center</b>.\n\n` +
      `Мы — место, где создаются знакомства, семьи и сильное сообщество. Для тех, кто ищет больше: общение, поддержку и настоящие связи 🤍\n\n` +
      `<b>Присоединившись к нам, вы сможете:</b>\n` +
      `🔸 Участвовать в живых, тёплых мероприятиях и фарбренгенах\n` +
      `🔸 Узнавать больше о еврейских традициях в лёгкой форме\n` +
      `🔸 Участвовать во встречах предпринимателей разных уровней\n` +
      `🔸 Расширять круг общения через еврейский нетворкинг\n` +
      `🔸 Получать личную и общинную поддержку\n\n` +
      `🕊 <i>Вы успешно подписаны на уведомления. Мы будем присылать сюда только самые важные новости, расписание уроков Торы и анонсы.</i>\n\n` +
      `👇 <b>Воспользуйтесь навигацией ниже, чтобы узнать больше:</b>`;

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

      await ctx.reply(welcomeText, {
        parse_mode: "HTML",
        ...mainMenuKeyboard,
      });
    } else {
      // Для тех, кто уже в базе, но случайно нажал /start еще раз
      const existingText =
        `🕎 <b>Рады снова видеть вас, ${tgUser.first_name}!</b>\n\n` +
        `Вы уже являетесь резидентом Menorah Center — места, где создаются знакомства, семьи и сильное сообщество 🤍\n\n` +
        `👇 <b>Воспользуйтесь меню навигации по общине:</b>`;

      await ctx.reply(existingText, {
        parse_mode: "HTML",
        ...mainMenuKeyboard,
      });
    }
  } catch (error) {
    console.error(`${trace} start handler failed`, getErrorDetails(error));
    try {
      await ctx.reply(
        "Произошла ошибка при соединении с сервером. Пожалуйста, попробуйте позже.",
      );
    } catch (replyError) {
      console.error("Failed to send error reply", replyError);
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
    ...mainMenuKeyboard,
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
