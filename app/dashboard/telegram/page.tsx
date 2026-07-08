// app/dashboard/telegram/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import TelegramClient from "@/components/dashboard/telegram/telegram-client";

export default async function TelegramDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // === ПРОВЕРКА ПРАВ ДОСТУПА ===
  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));

  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "superadmin")) {
    redirect("/dashboard");
  }

  // Считаем количество «схваченных» пользователей в боте
  const subscribers = await db
    .select()
    .from(users)
    .where(isNotNull(users.telegramChatId));

  return <TelegramClient totalSubscribers={subscribers.length} />;
}
