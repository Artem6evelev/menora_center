"use server";
import { CommunityError, communityErrorMessage } from "@/lib/community/errors";

import { db } from "@/lib/db";
import {
  events,
  eventCategories,
  eventParticipants,
  eventPaymentAttempts,
  users,
} from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEventRegistrationNotification } from "@/lib/telegram/notifications";
import { canReadEvents, canManageEvents, currentCommunityUser, requireCommunityUser, requirePrivateScope, requireStaff } from "@/lib/community/server";
import { communityAccess, isStaff } from "@/lib/community/policy";
import { requirePaymentConfirmationReady } from "@/lib/community/payments";
import { profileChildren } from "@/lib/community/children";
import { checkoutEvent } from "@/lib/community/event-checkout";
import { prepareEventRegistration } from "@/lib/community/registration";
import { preserveChildHistory } from "@/lib/community/history";
import { auth } from "@clerk/nextjs/server";
import { readEventPaymentParticipants } from "@/lib/community/event-payment-crm";

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
  if (!(await canReadEvents()) && !(await canManageEvents())) return [];
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
    await requireStaff();
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
    await requireStaff();
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
  if (!(await canReadEvents()) && !(await canManageEvents())) return [];
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
    await requireStaff();
    await db.delete(events).where(eq(events.id, id));
    revalidatePath("/dashboard/events");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getLatestEvents() {
  if (!(await canReadEvents())) return [];
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
    await requireStaff();
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
    await requireStaff();
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
  if (!(await canReadEvents())) return [];
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
  if (!(await canReadEvents())) return { events: [], hasMore: false };
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
  if (!(await canReadEvents())) return null;
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
    await requirePrivateScope(userId);
    const existing = await db
      .select()
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.userId, userId),
          inArray(eventParticipants.status, ["paid", "confirmed"]),
        ),
      );
    return existing.length > 0;
  } catch (error) {
    return false;
  }
}

export async function getUserRegisteredEvents(userId: string) {
  try {
    await requirePrivateScope(userId);
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
    await requireStaff();
    return await readEventPaymentParticipants(db, eventId);
  } catch (error) {
    throw new CommunityError(communityErrorMessage(error, "Не удалось загрузить заявки"));
  }
}

export async function updateEventParticipantStatus(id: string, newStatus: string) {
  try {
    await requireStaff();
    if (newStatus === "paid") requirePaymentConfirmationReady();
    if (!["pending", "confirmed", "abandoned", "rejected"].includes(newStatus)) throw new CommunityError("Неизвестный статус записи");
    await db.transaction(async tx => {
      const [participant] = await tx.select().from(eventParticipants).where(eq(eventParticipants.id, id)).for("update");
      if (!participant) throw new CommunityError("Запись не найдена");
      if (participant.status === "paid") requirePaymentConfirmationReady();
      const [event] = await tx.select().from(events).where(eq(events.id, participant.eventId));
      if (newStatus === "confirmed" && !event?.isFree) requirePaymentConfirmationReady();
      await tx.update(eventParticipants).set({ status: newStatus }).where(eq(eventParticipants.id, id));
    });
    revalidatePath("/dashboard/applications"); return { success: true };
  } catch (error) { return { success: false, error: communityErrorMessage(error, "Не удалось изменить запись") }; }
}
export async function deleteEventParticipant(id: string) {
  try {
    await db.transaction(async tx => {
      await requireStaff(tx);
      const [participant] = await tx.select().from(eventParticipants).where(eq(eventParticipants.id, id)).for("update");
      if (!participant) throw new CommunityError("Запись не найдена");
      const attempts = await tx.select().from(eventPaymentAttempts)
        .where(eq(eventPaymentAttempts.registrationId, participant.id)).for("update");
      if (participant.status === "paid" || attempts.some(attempt => attempt.status === "paid")) {
        const message = "Оплаченную регистрацию нельзя удалить. Сначала необходимо корректно обработать платёж.";
        requirePaymentConfirmationReady(message);
        // Paid history remains protected even when confirmation becomes available.
        throw new CommunityError(message);
      }
      if (attempts.some(attempt => attempt.status !== "pending" && attempt.status !== "cancelled"))
        throw new CommunityError("Нельзя удалить регистрацию с неизвестным статусом платежа");
      // Keep the RESTRICT FK: only this authorized transaction removes dependents.
      await tx.delete(eventPaymentAttempts).where(eq(eventPaymentAttempts.registrationId, participant.id));
      await tx.delete(eventParticipants).where(eq(eventParticipants.id, id));
    });
    revalidatePath("/dashboard/applications"); revalidatePath("/dashboard/my-events"); return { success: true };
  } catch (error) { return { success: false, error: communityErrorMessage(error, "Не удалось удалить заявку") }; }
}

export async function getUserFamilyData(userId: string) {
  try {
    const user = await requirePrivateScope(userId);
    return { firstName: user.firstName, lastName: user.lastName, phone: user.phone, email: user.email,
      spouseName: user.spouseName, childrenData: profileChildren(user.id, user.childrenData),
      canManageChildren: communityAccess(user).canManageChildren };
  } catch { return null; }
}

export async function registerForEvent(
  eventId: string, userId: string, phone?: string | null, extraData?: any,
  profileUpdates?: { newSpouseName?: string; newChild?: { name: string; dateOfBirth: string } },
  _clientAmount?: number,
) {
  try {
    await requireCommunityUser(userId);
    const result = await db.transaction(async tx => {
      const [profile] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
      if (!profile) throw new CommunityError("Заполните анкету общины");
      const [event] = await tx.select().from(events).where(eq(events.id, eventId)).for("update");
      if (!event) throw new CommunityError("Событие не найдено");
      // Fresh admission and ownership checks happen before payment/deduplication or family writes.
      const prepared = prepareEventRegistration(profile, event, extraData, profileUpdates);
      const existing = await tx.select().from(eventParticipants).where(and(eq(eventParticipants.eventId, eventId), eq(eventParticipants.userId, userId)));
      const settled = existing.find(item => item.status === "paid" || item.status === "confirmed");
      if (settled) return { registrationId: settled.id, paymentUrl: null, alreadyRegistered: true, notify: null };
      const pending = existing.find(item => item.status === "pending");
      if (prepared.profileUpdate.newChild || prepared.profileUpdate.newSpouseName) {
        await preserveChildHistory(tx, userId, profile.childrenData);
        await tx.update(users).set({ ...(prepared.profileUpdate.newChild ? { childrenData: prepared.children, hasChildren: true } : {}),
          ...(prepared.profileUpdate.newSpouseName ? { spouseName: prepared.spouseName, maritalStatus: "married" } : {}) }).where(eq(users.id, userId));
      }
      // The same calculator/immutable attempt as Mini App, after website family updates.
      const canonicalProfile = { ...profile, childrenData: prepared.children, spouseName: prepared.spouseName,
        phone: profile.phone || phone?.slice(0, 25) || "Не указан" };
      const checkout = await checkoutEvent(tx, canonicalProfile, eventId, {
        family: { self: true, ...(prepared.extraData.family.spouse ? { spouse: true } : {}) },
        childIds: prepared.extraData.childIds, extraAdults: prepared.extraData.extraAdults, extraKids: 0,
      });
      return { ...checkout, notify: pending ? null : { title: event.title, firstName: profile.firstName || "", lastName: profile.lastName || "", email: profile.email ?? "", phone: canonicalProfile.phone } };
    });
    if (result.notify) { try { const { title, ...person } = result.notify; await sendEventRegistrationNotification(title, person); } catch { /* Registration remains saved if delivery fails. */ } }
    revalidatePath("/dashboard/my-events"); revalidatePath("/dashboard/applications");
    return { success: true, registrationId: result.registrationId, paymentUrl: result.paymentUrl, message: result.alreadyRegistered ? "already_registered" : "registered" };
  } catch (error) { return { success: false, paymentUrl: null, message: communityErrorMessage(error, "Не удалось выполнить запись. Попробуйте ещё раз.") }; }
}
