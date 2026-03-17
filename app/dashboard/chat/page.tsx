import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getMyChatHistory } from "@/actions/notification";
import ChatClientView from "@/components/dashboard/chat/chat-vlient-view";
import ChatAdminView from "@/components/dashboard/chat/chat-admin-view";

export default async function ChatPage() {
  const { userId } = await auth();
  if (!userId) return null;

  // 1. Узнаем роль пользователя
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const role = user?.role || "client";

  // 2. Логика для Клиента (Простой чат)
  if (role === "client") {
    const messages = await getMyChatHistory(userId);
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full h-[calc(100vh-80px)] flex flex-col">
        <div className="mb-8 shrink-0">
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
            Служба{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              Заботы
            </span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2 text-lg">
            Напишите нам, если у вас есть вопросы или предложения.
          </p>
        </div>
        <ChatClientView initialMessages={messages} userId={userId} />
      </div>
    );
  }

  // 3. Логика для Админа / Суперадмина (Мессенджер)
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-8 shrink-0">
        <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
          Центр{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
            Сообщений
          </span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2 text-lg">
          Управление диалогами и поддержка резидентов общины.
        </p>
      </div>
      <ChatAdminView />
    </div>
  );
}
