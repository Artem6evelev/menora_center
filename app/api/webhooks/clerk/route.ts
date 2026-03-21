import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Пожалуйста, добавьте CLERK_WEBHOOK_SECRET в .env.local");
  }

  // Получаем заголовки Svix для верификации
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Ошибка: отсутствуют заголовки svix", { status: 400 });
  }

  // Получаем тело запроса
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  // Верификация
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("🔥 Ошибка верификации вебхука:", err);
    return new Response("Ошибка верификации", { status: 400 });
  }

  const eventType = evt.type;

  // === ЛОГИКА СИНХРОНИЗАЦИИ (Используем Drizzle) ===
  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const primaryEmail = email_addresses?.[0]?.email_address || "";

    try {
      // Используем Upsert (Вставить или Обновить).
      // Это супер-надежно: если юзер уже есть, обновит его данные (не трогая role), если нет — создаст.
      await db
        .insert(users)
        .values({
          id: id,
          email: primaryEmail,
          firstName: first_name || "",
          lastName: last_name || "",
          imageUrl: image_url || "",
          role: "client", // Роль по умолчанию
          isProfileComplete: false,
        })
        .onConflictDoUpdate({
          target: users.id, // Если такой ID уже есть
          set: {
            email: primaryEmail,
            firstName: first_name || "",
            lastName: last_name || "",
            imageUrl: image_url || "",
            // Заметь: мы НЕ обновляем 'role' здесь, чтобы не сбросить 'superadmin' обратно на 'client'
          },
        });

      console.log(`✅ Юзер ${id} успешно синхронизирован через вебхук.`);
    } catch (error) {
      console.error("🔥 Ошибка Drizzle при синхронизации юзера:", error);
      return new Response("Ошибка базы данных", { status: 500 });
    }
  }

  // === УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ ===
  if (eventType === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      try {
        await db.delete(users).where(eq(users.id, id));
        console.log(`🗑️ Юзер ${id} удален из базы.`);
      } catch (error) {
        console.error("🔥 Ошибка при удалении:", error);
        return new Response("Ошибка базы данных", { status: 500 });
      }
    }
  }

  return new Response("Успешно", { status: 200 });
}
