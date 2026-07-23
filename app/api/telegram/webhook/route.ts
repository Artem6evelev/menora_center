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

// 🔥 КЛАВИАТУРА
const mainMenuKeyboard = Markup.inlineKeyboard([
  // Первый ряд
  [Markup.button.url("🌐 Главная страница", "https://www.menorah-rishon.com")],

  // Второй ряд
  [
    Markup.button.url(
      "📅 Мероприятия",
      "https://www.menorah-rishon.com/events",
    ),
    Markup.button.url("🕍 Услуги", "https://www.menorah-rishon.com/services"),
  ],

  // Третий ряд
  [
    Markup.button.url("📺 Видеоуроки", "https://www.menorah-rishon.com/videos"),
    Markup.button.url("👶 Menorah Kids", "https://www.menorah-rishon.com/kids"),
  ],

  // Четвертый ряд - Обновленная кнопка Хасидута
  [
    Markup.button.url(
      "☕️ Утренний Хасидут: онлайн трансляции каждый день",
      "https://t.me/menorah_rishon",
    ),
  ],

  // Пятый ряд
  [
    Markup.button.url(
      "🤍 Поддержать общину (Цдака)",
      "https://shutaf.im/cba30",
    ),
  ],
]);

bot.start(async (ctx) => {
  const updateId = ctx.update.update_id;
  const tgUser = ctx.from;
  const chatId = ctx.chat.id.toString();
  const trace = `[TELEGRAM][update:${updateId}][chat:${chatId}]`;

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.telegramChatId, chatId),
    });

    const welcomeNewText = `Шалом, <b>${tgUser.first_name}</b>! ✨\n\nДобро пожаловать в официальный бот общины <b>Menorah Center</b>.\n\nВы успешно подписались на уведомления. Здесь мы будем публиковать важные анонсы, расписание уроков и новости.\n\nВыберите интересующий вас раздел:`;

    const welcomeExistingText = `Рады видеть вас снова, <b>${tgUser.first_name}</b>! 🕎\n\nВы уже подписаны на нашу рассылку. Воспользуйтесь меню ниже для быстрого доступа к разделам общины:`;

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

      await ctx.reply(welcomeNewText, {
        parse_mode: "HTML",
        ...mainMenuKeyboard,
      });
    } else {
      await ctx.reply(welcomeExistingText, {
        parse_mode: "HTML",
        ...mainMenuKeyboard,
      });
    }
  } catch (error) {
    console.error(`${trace} start handler failed`, getErrorDetails(error));
    try {
      await ctx.reply(
        "Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.",
      );
    } catch (replyError) {
      console.error("Failed to send error reply", replyError);
    }
  }
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
