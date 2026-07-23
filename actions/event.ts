"use server";

import { db } from "@/lib/db";
import {
  events,
  eventCategories,
  eventParticipants,
  users,
} from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEventRegistrationNotification } from "@/actions/telegram"; // 🔥 ИМПОРТ ФУНКЦИИ

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
    const newId = `evt_${crypto.randomUUID()}`;
    const preparedData = {
      ...data,
      categoryId: data.categoryId || null,
      price: data.price || null,
      description: data.description || null,
      location: data.location || null,
      time: data.time || null,
      recurringPattern: data.recurringPattern || null,
      recurringDays: data.recurringDays || null,
    };
    await db.insert(events).values({ id: newId, ...preparedData });
    revalidatePath("/dashboard/events");
    revalidatePath("/events");
    revalidatePath("/");
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
    const preparedData = {
      ...data,
      categoryId: data.categoryId || null,
      price: data.price || null,
      description: data.description || null,
      location: data.location || null,
      time: data.time || null,
      recurringPattern: data.recurringPattern || null,
      recurringDays: data.recurringDays || null,
    };
    await db.update(events).set(preparedData).where(eq(events.id, id));
    revalidatePath("/dashboard/events");
    revalidatePath("/events");
    revalidatePath("/");
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
    await db
      .insert(eventParticipants)
      .values({ id: newId, eventId, userId, phone, status: "pending" });

    // 🔥 ОТПРАВКА В TELEGRAM ГРУППУ
    try {
      const [eventData] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId));
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (eventData && userData) {
        await sendEventRegistrationNotification(eventData.title || "Событие", {
          firstName: userData.firstName ?? "",
          lastName: userData.lastName ?? "",
          email: userData.email ?? "",
          phone: phone,
        });
      }
    } catch (tgError) {
      console.error("Ошибка Telegram:", tgError);
    }

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

export async function getEventParticipantsList(eventId: string) {
  try {
    return await db
      .select({ participant: eventParticipants, user: users })
      .from(eventParticipants)
      .leftJoin(users, eq(eventParticipants.userId, users.id))
      .where(eq(eventParticipants.eventId, eventId))
      .orderBy(desc(eventParticipants.createdAt));
  } catch (error) {
    return [];
  }
}

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
      .where(inArray(eventCategories.id, activeCategoryIds as string[]));
  } catch (error) {
    return [];
  }
}

export async function getPublicEventsPaginated(
  page = 1,
  limit = 12,
  categoryId?: string | null,
  dateString?: string | null,
) {
  try {
    const offset = (page - 1) * limit;
    let conditions = eq(events.status, "planned");
    if (categoryId)
      conditions = and(conditions, eq(events.categoryId, categoryId)) as any;
    if (dateString)
      conditions = and(conditions, eq(events.date, dateString)) as any;

    const data = await db
      .select({ event: events, category: eventCategories })
      .from(events)
      .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .where(conditions)
      .orderBy(desc(events.date))
      .limit(limit)
      .offset(offset);
    return { events: data, hasMore: data.length === limit };
  } catch (error) {
    return { events: [], hasMore: false };
  }
}

export async function getEventById(id: string) {
  try {
    const data = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);
    return data[0] || null;
  } catch (error) {
    return null;
  }
}
