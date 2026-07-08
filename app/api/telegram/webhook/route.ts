// app/api/telegram/webhook/route.ts
import { Telegraf } from "telegraf";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start(async (ctx) => {
  try {
    const tgUser = ctx.from;
    const chatId = ctx.chat.id.toString();

    const existingUser = await db.query.users.findFirst({
      where: eq(users.telegramChatId, chatId),
    });

    if (!existingUser) {
      // 🔥 ИСПРАВЛЕНИЕ: Передаем обязательные поля id и email
      await db.insert(users).values({
        id: `tg_${chatId}`, // Генерируем ID вручную
        email: `tg_${chatId}@telegram.bot`, // Делаем email-заглушку, так как поле notNull()
        firstName: tgUser.first_name,
        lastName: tgUser.last_name || "",
        username: tgUser.username || "",
        telegramChatId: chatId,
        source: "telegram_bot",
        role: "client",
      });

      await ctx.reply(
        `Шалом, ${tgUser.first_name}! 🎉\n\nВы успешно подписались на уведомления общины Menorah Center Rishon LeZion.`,
      );
    } else {
      await ctx.reply(
        `Рады видеть вас снова, ${tgUser.first_name}! Вы уже подписаны на рассылку.`,
      );
    }
  } catch (error) {
    console.error("Ошибка при сохранении пользователя:", error);
    await ctx.reply(
      "Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.",
    );
  }
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return new Response("Error", { status: 500 });
  }
}
