"use server";

import { db } from "@/lib/db";
import { events, eventCategories, eventParticipants } from "@/lib/db/schema";
// Убедись, что таблица users импортируется корректно из твоей схемы
// Если она называется иначе, поправь импорт и название ниже
import { users } from "@/lib/db/schema";
import { eq, desc, and, inArray, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// === 1. КАТЕГОРИИ ===
export async function getEventCategories() {
  try {
    return await db
      .select()
      .from(eventCategories)
      .orderBy(desc(eventCategories.createdAt));
  } catch (error) {
    return [];
  }
}

export async function createEventCategory(name: string, color: string) {
  try {
    const newId = `cat_${Math.random().toString(36).substring(2, 11)}`;
    await db.insert(eventCategories).values({ id: newId, name, color });
    revalidatePath("/dashboard/events");
    return { success: true, id: newId };
  } catch (error) {
    return { success: false };
  }
}

export async function deleteEventCategory(id: string) {
  try {
    await db
      .update(events)
      .set({ categoryId: null })
      .where(eq(events.categoryId, id));
    await db.delete(eventCategories).where(eq(eventCategories.id, id));
    revalidatePath("/dashboard/events");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// === 2. СОБЫТИЯ ===
export async function getEvents() {
  try {
    return await db
      .select({ event: events, category: eventCategories })
      .from(events)
      .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .orderBy(desc(events.date));
  } catch (error) {
    return [];
  }
}

export async function createEvent(data: any) {
  try {
    const newId = `evt_${Math.random().toString(36).substring(2, 11)}`;
    await db.insert(events).values({ id: newId, ...data });
    revalidatePath("/dashboard/events");
    return { success: true, id: newId };
  } catch (error) {
    return { success: false };
  }
}

export async function deleteEvent(id: string) {
  try {
    await db.delete(events).where(eq(events.id, id));
    revalidatePath("/dashboard/events");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function updateEvent(id: string, data: any) {
  try {
    await db.update(events).set(data).where(eq(events.id, id));
    revalidatePath("/dashboard/events");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getLatestEvents() {
  try {
    return await db
      .select({ event: events, category: eventCategories })
      .from(events)
      .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .where(eq(events.status, "planned"))
      .orderBy(desc(events.createdAt))
      .limit(4);
  } catch (error) {
    return [];
  }
}

// === 3. ЗАЯВКИ ===
export async function checkRegistration(eventId: string, userId: string) {
  try {
    const existing = await db
      .select()
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.userId, userId),
        ),
      );
    return existing.length > 0;
  } catch (error) {
    return false;
  }
}

// ОБНОВЛЕНО: Добавлен параметр phone
export async function registerForEvent(
  eventId: string,
  userId: string,
  phone: string,
) {
  try {
    const isAlreadyRegistered = await checkRegistration(eventId, userId);
    if (isAlreadyRegistered)
      return { success: true, message: "already_registered" };

    const newId = `part_${Math.random().toString(36).substring(2, 11)}`;
    await db.insert(eventParticipants).values({
      id: newId,
      eventId,
      userId,
      phone, // Сохраняем телефон
      status: "pending",
    });
    revalidatePath("/");
    revalidatePath("/dashboard/my-events");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function cancelRegistration(eventId: string, userId: string) {
  try {
    await db
      .delete(eventParticipants)
      .where(
        and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.userId, userId),
        ),
      );
    revalidatePath("/dashboard/my-events");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getUserRegisteredEvents(userId: string) {
  try {
    return await db
      .select({
        event: events,
        category: eventCategories,
        participant: eventParticipants,
      })
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.eventId, events.id))
      .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .where(eq(eventParticipants.userId, userId))
      .orderBy(desc(eventParticipants.createdAt));
  } catch (error) {
    return [];
  }
}

// НОВОЕ: Для страницы админа - получить заявки по конкретному событию
export async function getEventParticipantsList(eventId: string) {
  try {
    return await db
      .select({
        participant: eventParticipants,
        user: users,
      })
      .from(eventParticipants)
      .leftJoin(users, eq(eventParticipants.userId, users.id))
      .where(eq(eventParticipants.eventId, eventId))
      .orderBy(desc(eventParticipants.createdAt));
  } catch (error) {
    console.error("Ошибка при получении участников:", error);
    return [];
  }
}

// Получаем только те категории, в которых сейчас есть активные события
export async function getActivePublicCategories() {
  try {
    const activeEvents = await db
      .select({ categoryId: events.categoryId })
      .from(events)
      .where(eq(events.status, "planned"));

    const activeCategoryIds = Array.from(
      new Set(activeEvents.map((e) => e.categoryId).filter(Boolean)),
    );

    if (activeCategoryIds.length === 0) return [];

    return await db
      .select()
      .from(eventCategories)
      // Получаем категории, чьи ID есть в списке активных
      .where(inArray(eventCategories.id, activeCategoryIds as string[]));
  } catch (error) {
    console.error("Ошибка при получении активных категорий:", error);
    return [];
  }
}

// Умная функция с ПАГИНАЦИЕЙ, ФИЛЬТРОМ КАТЕГОРИЙ и ФИЛЬТРОМ ДАТЫ
export async function getPublicEventsPaginated(
  page = 1,
  limit = 12,
  categoryId?: string | null,
  dateString?: string | null, // <--- Новый параметр
) {
  try {
    const offset = (page - 1) * limit;

    let conditions = eq(events.status, "planned");

    // Фильтр по категории
    if (categoryId) {
      conditions = and(conditions, eq(events.categoryId, categoryId)) as any;
    }

    // Фильтр по дате (теперь это простое сравнение строк "YYYY-MM-DD")
    if (dateString) {
      conditions = and(conditions, eq(events.date, dateString)) as any;
    }

    const data = await db
      .select({
        event: events,
        category: eventCategories,
      })
      .from(events)
      .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .where(conditions)
      .orderBy(desc(events.date)) // Сортируем по строковой дате (работает корректно для формата YYYY-MM-DD)
      .limit(limit)
      .offset(offset);

    const hasMore = data.length === limit;

    return { events: data, hasMore };
  } catch (error) {
    console.error("Ошибка при получении событий с пагинацией:", error);
    return { events: [], hasMore: false };
  }
}
