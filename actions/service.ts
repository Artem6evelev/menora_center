"use server";

import { db } from "@/lib/db";
import {
  services,
  serviceCategories,
  serviceParticipants,
  users,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- Категории услуг ---
export async function getServiceCategories() {
  return await db
    .select()
    .from(serviceCategories)
    .orderBy(desc(serviceCategories.createdAt));
}

export async function createServiceCategory(name: string, color: string) {
  const id = `scat_${Math.random().toString(36).substring(2, 11)}`;
  await db.insert(serviceCategories).values({ id, name, color });
  revalidatePath("/dashboard/services");
  return { success: true, id };
}

// --- Управление услугами ---
export async function getServices() {
  return await db
    .select({ service: services, category: serviceCategories })
    .from(services)
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .orderBy(desc(services.createdAt));
}

export async function createService(data: any) {
  try {
    const id = `ser_${Math.random().toString(36).substring(2, 11)}`;
    // Защита от пустых строк, которые ломают базу данных
    const cleanData = {
      ...data,
      categoryId: data.categoryId === "" ? null : data.categoryId,
      imageUrl: data.imageUrl === "" ? null : data.imageUrl,
    };
    await db.insert(services).values({ id, ...cleanData });
    revalidatePath("/dashboard/services");
    return { success: true, id };
  } catch (error) {
    console.error("Ошибка создания услуги:", error);
    return { success: false };
  }
}

export async function updateService(id: string, data: any) {
  try {
    const cleanData = {
      ...data,
      categoryId: data.categoryId === "" ? null : data.categoryId,
      imageUrl: data.imageUrl === "" ? null : data.imageUrl,
    };
    await db.update(services).set(cleanData).where(eq(services.id, id));
    revalidatePath("/dashboard/services");
    return { success: true };
  } catch (error) {
    console.error("Ошибка обновления услуги:", error);
    return { success: false };
  }
}

export async function deleteService(id: string) {
  try {
    await db.delete(services).where(eq(services.id, id));
    revalidatePath("/dashboard/services");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// --- Заявки на услуги ---
export async function getServiceApplications(serviceId?: string) {
  try {
    let query = db
      .select({
        participant: serviceParticipants,
        user: users,
        service: services,
      })
      .from(serviceParticipants)
      .leftJoin(users, eq(serviceParticipants.userId, users.id))
      .leftJoin(services, eq(serviceParticipants.serviceId, services.id));

    if (serviceId) {
      query = query.where(eq(serviceParticipants.serviceId, serviceId)) as any;
    }

    return await query.orderBy(desc(serviceParticipants.createdAt));
  } catch (error) {
    console.error("Ошибка получения заявок:", error);
    return [];
  }
}

// Добавь это в actions/service.ts (сразу после createServiceCategory)

export async function deleteServiceCategory(id: string) {
  try {
    // Сначала отвязываем категорию от всех услуг, где она была выбрана
    await db
      .update(services)
      .set({ categoryId: null })
      .where(eq(services.categoryId, id));
    // Затем удаляем саму категорию
    await db.delete(serviceCategories).where(eq(serviceCategories.id, id));

    revalidatePath("/dashboard/services");
    return { success: true };
  } catch (error) {
    console.error("Ошибка при удалении категории услуг:", error);
    return { success: false };
  }
}
// ДОБАВЬ ЭТИ ФУНКЦИИ В actions/service.ts, ЕСЛИ ИХ ТАМ НЕТ:

// 1. Публичный вывод услуг для главной страницы
export async function getPublicServicesPaginated(
  page = 1,
  limit = 4,
  categoryId?: string | null,
) {
  try {
    const offset = (page - 1) * limit;
    let conditions = eq(services.isActive, true);

    if (categoryId) {
      conditions = and(conditions, eq(services.categoryId, categoryId)) as any;
    }

    const data = await db
      .select({ service: services, category: serviceCategories })
      .from(services)
      .leftJoin(
        serviceCategories,
        eq(services.categoryId, serviceCategories.id),
      )
      .where(conditions)
      .orderBy(desc(services.createdAt))
      .limit(limit)
      .offset(offset);

    return { services: data, hasMore: data.length === limit };
  } catch (error) {
    return { services: [], hasMore: false };
  }
}

// 2. Проверка, записан ли уже юзер на услугу
export async function checkServiceRegistration(
  serviceId: string,
  userId: string,
) {
  try {
    const existing = await db
      .select()
      .from(serviceParticipants)
      .where(
        and(
          eq(serviceParticipants.serviceId, serviceId),
          eq(serviceParticipants.userId, userId),
        ),
      );
    return existing.length > 0;
  } catch (error) {
    return false;
  }
}

// 3. Сама запись на услугу (с телефоном)
export async function registerForService(
  serviceId: string,
  userId: string,
  phone: string,
) {
  try {
    const isAlreadyRegistered = await checkServiceRegistration(
      serviceId,
      userId,
    );
    if (isAlreadyRegistered)
      return { success: true, message: "already_registered" };

    const newId = `spart_${Math.random().toString(36).substring(2, 11)}`;
    await db.insert(serviceParticipants).values({
      id: newId,
      serviceId,
      userId,
      phone,
      status: "pending",
    });

    revalidatePath("/dashboard/my-services");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// Получить список услуг, на которые записан конкретный пользователь
export async function getUserRegisteredServices(userId: string) {
  try {
    const data = await db
      .select({
        participant: serviceParticipants,
        service: services,
        category: serviceCategories,
      })
      .from(serviceParticipants)
      .innerJoin(services, eq(serviceParticipants.serviceId, services.id))
      .leftJoin(
        serviceCategories,
        eq(services.categoryId, serviceCategories.id),
      )
      .where(eq(serviceParticipants.userId, userId))
      .orderBy(desc(serviceParticipants.createdAt));

    return data;
  } catch (error) {
    console.error("Ошибка при получении услуг пользователя:", error);
    return [];
  }
}
