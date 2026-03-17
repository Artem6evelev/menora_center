import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { botSettings, users } from "@/lib/db/schema";
import { isNotNull } from "drizzle-orm";

export async function GET(req: Request) {
  // Защита: проверяем секретный заголовок, чтобы никто другой не дергал этот API
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const settings = await db.query.botSettings.findFirst();

    // Если рассылки выключены в админке, ничего не делаем
    if (!settings?.isActive) return NextResponse.json({ skipped: true });

    const message = settings.reminderMessage;
    const subscribers = await db.query.users.findMany({
      where: isNotNull(users.telegramChatId),
    });

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    // Рассылаем напоминание
    await Promise.all(
      subscribers.map((user) =>
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: user.telegramChatId,
            text: message,
            parse_mode: "HTML",
          }),
        }),
      ),
    );

    return NextResponse.json({ success: true, sent: subscribers.length });
  } catch (error) {
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
