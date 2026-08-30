"use server";

import { db } from "@/lib/db";
import { eventParticipants, events, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function registerForEvent(
  eventId: string,
  userId: string,
  extraData: any,
) {
  try {
    // 1. Получаем данные ивента для ссылки на оплату
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
    if (!event) return { success: false, message: "Мероприятие не найдено" };

    // 2. Получаем телефон пользователя
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    // 3. Создаем запись со статусом "pending" (ожидает оплаты)
    await db.insert(eventParticipants).values({
      eventId,
      userId,
      phone: user?.phone || "Не указан",
      extraData,
      status: "pending",
    });

    // 4. Возвращаем ссылку на Шутафим
    return {
      success: true,
      paymentUrl: event.paymentUrl || "/dashboard/my-events",
    };
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    return { success: false, message: "Произошла ошибка при записи" };
  }
}

export async function getUserFamilyData(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user;
}
