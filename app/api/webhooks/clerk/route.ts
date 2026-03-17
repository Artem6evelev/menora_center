// app/api/webhooks/clerk/route.ts
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Инициализация Supabase с Service Role Key (дает права обходить RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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

  // Верификация: проверяем, что запрос реально пришел от Clerk
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Ошибка верификации вебхука:", err);
    return new Response("Ошибка верификации", { status: 400 });
  }

  const eventType = evt.type;

  // ЛОГИКА СИНХРОНИЗАЦИИ
  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const primaryEmail = email_addresses?.[0]?.email_address;

    const userData = {
      id,
      email: primaryEmail,
      first_name,
      last_name,
      image_url,
      updated_at: new Date().toISOString(),
    };

    try {
      if (eventType === "user.created") {
        // Если юзер НОВЫЙ — создаем его и ставим роль по умолчанию 'client'
        const { error } = await supabase.from("users").upsert({
          ...userData,
          role: "client",
        });
        if (error) throw error;
        console.log(`Юзер ${id} создан в базе.`);
      } else if (eventType === "user.updated") {
        // Если юзер ОБНОВИЛСЯ — обновляем данные, но НЕ ТРОГАЕМ поле 'role'
        // Таким образом ваш 'superadmin' в базе останется на месте
        const { error } = await supabase
          .from("users")
          .update(userData)
          .eq("id", id);
        if (error) throw error;
        console.log(`Данные юзера ${id} обновлены (роль сохранена).`);
      }
    } catch (error) {
      console.error("Ошибка Supabase:", error);
      return new Response("Ошибка базы данных", { status: 500 });
    }
  }

  // УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ
  if (eventType === "user.deleted") {
    const { id } = evt.data;
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      console.log(`Юзер ${id} удален из базы.`);
    } catch (error) {
      console.error("Ошибка при удалении:", error);
      return new Response("Ошибка базы данных", { status: 500 });
    }
  }

  return new Response("Успешно", { status: 200 });
}
