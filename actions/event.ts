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
import { sendEventRegistrationNotification } from "@/actions/telegram";
import { auth } from "@clerk/nextjs/server";

// 🔥 Функция: Транслитерация и создание красивой ссылки (Slug)
function generateSlug(title: string) {
  if (!title) return `evt_${Math.random().toString(36).substring(2, 8)}`;

  const ru: { [key: string]: string } = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };

  let slug = title
    .toLowerCase()
    .split("")
    .map((char) => ru[char] || char)
    .join("");

  slug = slug.replace(/[^a-z0-9]+/g, "-");
  slug = slug.replace(/^-+|-+$/g, "");
  const shortId = Math.floor(1000 + Math.random() * 9000);

  return slug ? `${slug}-${shortId}` : `evt_${shortId}`;
}

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

export async function deleteEvent(id: string) {
  try {
    await db.delete(events).where(eq(events.id, id));
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

export async function createEvent(data: any) {
  try {
    const newId = generateSlug(data.title);
    const preparedData = {
      ...data,
      categoryId: data.categoryId || null,
      price: data.price || null,
      childPrice: data.childPrice || null,
      paymentUrl: data.paymentUrl || null,
      description: data.description || null,
      location: data.location || null,
      time: data.time || null,
      recurringPattern: data.recurringPattern || null,
      recurringDays: data.recurringDays || null,
      isRegistrationClosed: data.isRegistrationClosed || false,
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

export async function updateEvent(id: string, data: any) {
  try {
    const preparedData = {
      ...data,
      categoryId: data.categoryId || null,
      price: data.price || null,
      childPrice: data.childPrice || null,
      paymentUrl: data.paymentUrl || null,
      description: data.description || null,
      location: data.location || null,
      time: data.time || null,
      recurringPattern: data.recurringPattern || null,
      recurringDays: data.recurringDays || null,
      isRegistrationClosed: data.isRegistrationClosed || false,
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

// === 3. ЗАЯВКИ ===

// 🔥 ИСПРАВЛЕНА ПРОВЕРКА РЕГИСТРАЦИИ (ТОЛЬКО PAID)
export async function checkRegistration(eventId: string, userId: string) {
  try {
    const existing = await db
      .select()
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.userId, userId),
          eq(eventParticipants.status, "paid"), // Считаем записанным только если ОПЛАЧЕНО
        ),
      );
    return existing.length > 0;
  } catch (error) {
    return false;
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

export async function updateEventParticipantStatus(
  id: string,
  newStatus: string,
) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Не авторизован" };

  const [caller] = await db.select().from(users).where(eq(users.id, userId));
  const role =
    caller?.email === "artemdev.isr@gmail.com" ? "superadmin" : caller?.role;
  if (role !== "admin" && role !== "superadmin")
    return { success: false, error: "Нет прав" };

  try {
    await db
      .update(eventParticipants)
      .set({ status: newStatus })
      .where(eq(eventParticipants.id, id));
    revalidatePath("/dashboard/applications");
    return { success: true };
  } catch (error) {
    console.error("Ошибка изменения статуса:", error);
    return { success: false, error: "Ошибка БД" };
  }
}

export async function deleteEventParticipant(id: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Не авторизован" };

  const [caller] = await db.select().from(users).where(eq(users.id, userId));
  const role =
    caller?.email === "artemdev.isr@gmail.com" ? "superadmin" : caller?.role;

  if (role !== "admin" && role !== "superadmin") {
    return { success: false, error: "Нет прав" };
  }

  try {
    await db.delete(eventParticipants).where(eq(eventParticipants.id, id));
    revalidatePath("/dashboard/applications");
    return { success: true };
  } catch (error) {
    console.error("Ошибка удаления заявки:", error);
    return { success: false, error: "Ошибка БД" };
  }
}

export async function getUserFamilyData(userId: string) {
  try {
    const [user] = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        email: users.email,
        spouseName: users.spouseName,
        childrenData: users.childrenData,
      })
      .from(users)
      .where(eq(users.id, userId));

    return user || null;
  } catch (error) {
    console.error("Ошибка при получении данных семьи:", error);
    return null;
  }
}

// 🔥 ИСПРАВЛЕНА РЕГИСТРАЦИЯ (ЗАЩИТА ОТ ДУБЛЕЙ И ГЕНЕРАЦИЯ ССЫЛКИ С ПРАВИЛЬНЫМИ ПАРАМЕТРАМИ)
export async function registerForEvent(
  eventId: string,
  userId: string,
  phone?: string | null,
  extraData?: any,
  profileUpdates?: {
    newSpouseName?: string;
    newChild?: { name: string; dateOfBirth: string };
  },
  totalAmount?: number,
) {
  try {
    // 1. Проверяем, есть ли уже ОПЛАЧЕННАЯ заявка
    const isAlreadyPaid = await db
      .select()
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.userId, userId),
          eq(eventParticipants.status, "paid"),
        ),
      );

    if (isAlreadyPaid.length > 0) {
      return { success: true, message: "already_registered" };
    }

    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    const userPhone = phone || userData?.phone || "Не указан";
    const userEmail = userData?.email || "";

    if (
      profileUpdates &&
      (profileUpdates.newSpouseName || profileUpdates.newChild)
    ) {
      let updatePayload: any = {};
      if (profileUpdates.newSpouseName) {
        updatePayload.spouseName = profileUpdates.newSpouseName;
        updatePayload.maritalStatus = "married";
      }
      if (profileUpdates.newChild) {
        const currentChildren = Array.isArray(userData.childrenData)
          ? userData.childrenData
          : [];
        updatePayload.childrenData = [
          ...currentChildren,
          profileUpdates.newChild,
        ];
        updatePayload.hasChildren = true;
      }
      if (Object.keys(updatePayload).length > 0) {
        await db.update(users).set(updatePayload).where(eq(users.id, userId));
      }
    }

    const [eventData] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
    if (!eventData) return { success: false, message: "Событие не найдено" };

    // 2. Ищем PENDING заявку, чтобы не плодить дубли
    const existingPending = await db
      .select()
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.userId, userId),
          eq(eventParticipants.status, "pending"),
        ),
      );

    const initialStatus = totalAmount && totalAmount > 0 ? "pending" : "paid";
    let newId = "";

    if (existingPending.length > 0) {
      // Обновляем существующую неоплаченную заявку
      newId = existingPending[0].id;
      await db
        .update(eventParticipants)
        .set({
          extraData: extraData || null,
          phone: userPhone,
        })
        .where(eq(eventParticipants.id, newId));
    } else {
      // Создаем новую заявку
      newId = `part_${Math.random().toString(36).substring(2, 11)}`;
      await db.insert(eventParticipants).values({
        id: newId,
        eventId,
        userId,
        phone: userPhone,
        status: initialStatus,
        extraData: extraData || null,
      });

      try {
        if (eventData && userData) {
          await sendEventRegistrationNotification(
            eventData.title || "Событие",
            {
              firstName: userData.firstName ?? "",
              lastName: userData.lastName ?? "",
              email: userEmail,
              phone: userPhone,
            },
          );
        }
      } catch (tgError) {}
    }

    revalidatePath("/");
    revalidatePath("/dashboard/my-events");
    revalidatePath("/dashboard/applications");

    let finalPaymentUrl = null;
    if (eventData.paymentUrl && totalAmount && totalAmount > 0) {
      try {
        const baseUrlObj = new URL(eventData.paymentUrl);
        const baseUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${baseUrlObj.pathname}`;

        // 🔥 ПЕРЕДАЕМ ТОЛЬКО БЕЗОПАСНЫЕ ДАННЫЕ 🔥
        const params = new URLSearchParams({
          price: totalAmount.toString(),
          quantity: "1",
          cur: "ILS",
          payments: "1",
          lang: "ru",
          custom1: newId, // ID заявки для вебхука (абсолютно безопасно)
        });

        finalPaymentUrl = `${baseUrl}?${params.toString()}`;
      } catch (e) {
        // Fallback если url не парсится
        const separator = eventData.paymentUrl.includes("?") ? "&" : "?";
        finalPaymentUrl = `${eventData.paymentUrl}${separator}price=${totalAmount}&custom1=${newId}&quantity=1&cur=ILS&payments=1&lang=ru`;
      }
    }

    return {
      success: true,
      paymentUrl: finalPaymentUrl,
    };
  } catch (error) {
    return { success: false, message: "Ошибка базы данных" };
  }
}
