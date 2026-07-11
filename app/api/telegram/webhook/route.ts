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
  console.log("[TELEGRAM] Webhook health check requested", {
    hasToken: Boolean(TELEGRAM_BOT_TOKEN),
  });

  return Response.json({
    ok: true,
    route: "/api/telegram/webhook",
    hasToken: Boolean(TELEGRAM_BOT_TOKEN),
  });
}

bot.start(async (ctx) => {
  const updateId = ctx.update.update_id;
  const tgUser = ctx.from;
  const chatId = ctx.chat.id.toString();
  const trace = `[TELEGRAM][update:${updateId}][chat:${chatId}]`;

  console.log(`${trace} /start received`, {
    telegramUserId: tgUser.id,
    username: tgUser.username,
    firstName: tgUser.first_name,
    chatType: ctx.chat.type,
  });

  try {
    console.log(`${trace} DB lookup started`);

    const existingUser = await db.query.users.findFirst({
      where: eq(users.telegramChatId, chatId),
    });

    console.log(`${trace} DB lookup finished`, {
      found: Boolean(existingUser),
      userId: existingUser?.id,
    });

    if (!existingUser) {
      console.log(`${trace} DB insert started`);

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

      console.log(`${trace} DB insert finished`);

      await ctx.reply(
        `Шалом, ${tgUser.first_name}!\n\nВы успешно подписались на уведомления общины Menorah Center Rishon LeZion.`,
      );

      console.log(`${trace} Telegram reply sent for new subscriber`);
    } else {
      await ctx.reply(
        `Рады видеть вас снова, ${tgUser.first_name}! Вы уже подписаны на рассылку.`,
      );

      console.log(`${trace} Telegram reply sent for existing subscriber`);
    }
  } catch (error) {
    console.error(`${trace} start handler failed`, getErrorDetails(error));

    try {
      await ctx.reply(
        "Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.",
      );
      console.log(`${trace} Telegram error reply sent`);
    } catch (replyError) {
      console.error(
        `${trace} failed to send Telegram error reply`,
        getErrorDetails(replyError),
      );
    }
  }
});

export async function POST(req: Request) {
  const requestStartedAt = Date.now();
  const requestId =
    globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const trace = `[TELEGRAM][request:${requestId}]`;

  console.log(`${trace} POST received`, {
    contentType: req.headers.get("content-type"),
    userAgent: req.headers.get("user-agent"),
  });

  if (!TELEGRAM_BOT_TOKEN) {
    console.error(`${trace} rejected: TELEGRAM_BOT_TOKEN is missing`);
    return Response.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" },
      { status: 500 },
    );
  }

  let body: Parameters<typeof bot.handleUpdate>[0];

  try {
    body = await req.json();
    console.log(`${trace} JSON parsed`, {
      updateId: body.update_id,
      keys: Object.keys(body),
    });
  } catch (error) {
    console.error(`${trace} JSON parse failed`, getErrorDetails(error));
    return Response.json(
      { ok: false, error: "Invalid Telegram webhook JSON" },
      { status: 400 },
    );
  }

  try {
    console.log(`${trace} Telegraf handleUpdate started`);
    await bot.handleUpdate(body);
    console.log(`${trace} Telegraf handleUpdate finished`, {
      durationMs: Date.now() - requestStartedAt,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error(`${trace} Telegraf handleUpdate failed`, {
      ...getErrorDetails(error),
      durationMs: Date.now() - requestStartedAt,
    });

    return Response.json(
      { ok: false, error: "Telegram webhook processing failed" },
      { status: 500 },
    );
  }
}
