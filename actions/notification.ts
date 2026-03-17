"use server";

import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { eq, or, and, desc, asc, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server"; // Добавляем для CRM

// 1. Получить все уведомления пользователя
export async function getUserNotifications(userId: string) {
  try {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  } catch (error) {
    console.error("Ошибка при получении уведомлений:", error);
    return [];
  }
}

// 2. Улучшенная функция создания уведомления (Старое не ломается!)
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  link?: string,
  senderId?: string, // Новое: необязательно
  type: string = "system", // Новое: по умолчанию "system" для Канбана
) {
  try {
    const newId = `notif_${Math.random().toString(36).substring(2, 11)}`;
    await db.insert(notifications).values({
      id: newId,
      userId,
      title,
      message,
      link: link || null,
      senderId: senderId || null, // Если не передано, будет null (ок для базы)
      type: type, // "system", "crm_personal" и т.д.
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Ошибка при создании уведомления:", error);
    return { success: false };
  }
}

// --- НОВОЕ: СПЕЦИАЛЬНО ДЛЯ CRM ---

// 3. Быстрая массовая рассылка (одним запросом в БД)
export async function sendBulkCrmMessages(userIds: string[], message: string) {
  const { userId: adminId } = await auth();
  if (!adminId) throw new Error("Unauthorized");

  try {
    const data = userIds.map((id) => ({
      id: `notif_${Math.random().toString(36).substring(2, 11)}`,
      userId: id,
      senderId: adminId,
      title: "Объявление общины",
      message: message.trim(),
      link: "/dashboard",
      type: "crm_bulk",
      isRead: false,
    }));

    // Вставляем сразу массив данных — это в десятки раз быстрее, чем цикл
    await db.insert(notifications).values(data);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Ошибка при массовой рассылке:", error);
    return { success: false };
  }
}

// --- ОСТАЛЬНЫЕ СТАРЫЕ ФУНКЦИИ БЕЗ ИЗМЕНЕНИЙ ---

// 4. Отметить как прочитанное
export async function markAsRead(notificationId: string) {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 5. Отметить ВСЕ как прочитанные
export async function markAllAsRead(userId: string) {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 6. Удалить уведомление
export async function deleteNotification(id: string) {
  try {
    await db.delete(notifications).where(eq(notifications.id, id));
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// Получить историю переписки для CRM
export async function getNotificationHistory(userId: string) {
  try {
    const history = await db
      .select({
        id: notifications.id,
        message: notifications.message,
        createdAt: notifications.createdAt,
        type: notifications.type,
        senderId: notifications.senderId,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50); // Не берем больше 50, чтобы не тормозило

    return history;
  } catch (error) {
    console.error("Ошибка при загрузке истории:", error);
    return [];
  }
}

// Получить всю переписку для клиента (его сообщения и ответы админов)
export async function getMyChatHistory(userId: string) {
  try {
    return await db
      .select()
      .from(notifications)
      .where(
        or(
          eq(notifications.userId, userId), // Сообщения мне
          eq(notifications.senderId, userId), // Сообщения от меня
        ),
      )
      .orderBy(asc(notifications.createdAt)); // Сортируем от старых к новым для чата
  } catch (error) {
    return [];
  }
}

// Универсальная отправка сообщения (от клиента к админу)
export async function sendClientMessage(message: string) {
  const { userId: clientId } = await auth();
  if (!clientId) throw new Error("Unauthorized");

  try {
    // 1. Находим в базе любого админа, чтобы указать его как получателя (userId)
    // Это нужно, чтобы не было ошибки Foreign Key
    const admin = await db.query.users.findFirst({
      where: or(eq(users.role, "admin"), eq(users.role, "superadmin")),
    });

    // Если админ не найден, отправим сообщение самому себе (как системное)
    const receiverId = admin ? admin.id : clientId;

    const newId = `notif_${Math.random().toString(36).substring(2, 11)}`;

    await db.insert(notifications).values({
      id: newId,
      userId: receiverId, // Кому (админу)
      senderId: clientId, // От кого (клиента)
      title: "Ответ клиента",
      message: message.trim(),
      type: "client_reply",
      isRead: false,
    });

    revalidatePath("/dashboard/chat");
    return { success: true };
  } catch (error) {
    // ОБЯЗАТЕЛЬНО посмотри в терминал (консоль VS Code), там будет видна точная ошибка
    console.error("ОШИБКА БД:", error);
    return { success: false };
  }
}

// 1. Получить список людей с подсчетом непрочитанных
export async function getActiveChats() {
  const { userId: adminId } = await auth();
  if (!adminId) return [];

  try {
    // Используем группировку, чтобы достать юзеров и сразу посчитать непрочитанные от них
    const activeUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        imageUrl: users.imageUrl,
        // Считаем: если isRead = false И отправил этот клиент И сообщение для админа -> +1
        unreadCount: sql<number>`CAST(SUM(CASE WHEN ${notifications.isRead} = false AND ${notifications.senderId} = ${users.id} THEN 1 ELSE 0 END) AS INTEGER)`,
      })
      .from(users)
      .innerJoin(
        notifications,
        or(
          eq(notifications.senderId, users.id),
          eq(notifications.userId, users.id),
        ),
      )
      .where(
        inArray(notifications.type, [
          "crm_personal",
          "client_reply",
          "crm_bulk",
        ]),
      )
      .groupBy(users.id);

    // Сортируем: сначала те, у кого есть непрочитанные (unreadCount > 0), затем остальные
    return activeUsers.sort((a, b) => b.unreadCount - a.unreadCount);
  } catch (error) {
    console.error("Error fetching chat list:", error);
    return [];
  }
}

// НОВАЯ ФУНКЦИЯ: Пометить сообщения конкретного чата как прочитанные
export async function markChatAsRead(clientId: string) {
  const { userId: adminId } = await auth();
  if (!adminId) return { success: false };

  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.senderId, clientId), // Сообщения от этого клиента
          eq(notifications.userId, adminId), // Адресованные мне (админу)
          eq(notifications.isRead, false), // Которые еще не прочитаны
        ),
      );
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// Получить переписку между двумя конкретными пользователями (Админ <-> Клиент)
export async function getConversation(adminId: string, clientId: string) {
  try {
    const chat = await db
      .select()
      .from(notifications)
      .where(
        or(
          // Сообщения от Админа к Клиенту
          and(
            eq(notifications.senderId, adminId),
            eq(notifications.userId, clientId),
          ),
          // Сообщения от Клиента к Админу
          and(
            eq(notifications.senderId, clientId),
            eq(notifications.userId, adminId),
          ),
        ),
      )
      .orderBy(asc(notifications.createdAt)) // asc - от старых к новым (для чата)
      .limit(100); // Берем последние 100, чтобы не грузить память

    return chat;
  } catch (error) {
    console.error("Ошибка при получении переписки:", error);
    return [];
  }
}
