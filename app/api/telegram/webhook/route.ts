// app/api/telegram/webhook/route.ts
import { Telegraf } from "telegraf";
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
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
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

// 🔥 ПРОСТАЯ И НАДЕЖНАЯ ЛОГИКА ПОДПИСКИ
bot.start(async (ctx) => {
  const updateId = ctx.update.update_id;
  const tgUser = ctx.from;
  const chatId = ctx.chat.id.toString();
  const trace = `[TELEGRAM][update:${updateId}][chat:${chatId}]`;

  console.log(`${trace} /start received`, {
    telegramUserId: tgUser.id,
    username: tgUser.username,
    firstName: tgUser.first_name,
  });

  try {
    // Проверяем, есть ли уже этот chat_id в базе
    const existingUser = await db.query.users.findFirst({
      where: eq(users.telegramChatId, chatId),
    });

    if (!existingUser) {
      console.log(`${trace} User not found, creating new subscriber...`);

      // Если нет — создаем запись для рассылки
      // Генерируем уникальный ID и фейковый email (т.к. схема требует email)
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

      await ctx.reply(
        `Шалом, ${tgUser.first_name}! 🎉\n\nВы успешно подписались на уведомления общины Menorah Center. Здесь мы будем публиковать важные анонсы и уроки.`,
      );
      console.log(`${trace} New subscriber added successfully`);
    } else {
      // Если уже есть в базе — просто здороваемся
      await ctx.reply(
        `Рады видеть вас снова, ${tgUser.first_name}! Вы уже подписаны на нашу рассылку.`,
      );
      console.log(`${trace} Subscriber already exists`);
    }
  } catch (error) {
    console.error(`${trace} start handler failed`, getErrorDetails(error));
    try {
      await ctx.reply(
        "Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.",
      );
    } catch (replyError) {
      console.error(
        `${trace} failed to send error reply`,
        getErrorDetails(replyError),
      );
    }
  }
});

export async function POST(req: Request) {
  const requestStartedAt = Date.now();

  if (!TELEGRAM_BOT_TOKEN) {
    return Response.json(
      { ok: false, error: "Missing token" },
      { status: 500 },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch (error) {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await bot.handleUpdate(body);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Webhook processing failed", getErrorDetails(error));
    return Response.json(
      { ok: false, error: "Processing failed" },
      { status: 500 },
    );
  }
}
