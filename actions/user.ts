"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { desc, ilike, or, sql } from "drizzle-orm";

// Получить всех пользователей (для первой загрузки страницы)
export async function getAllUsers() {
  return await db.select().from(users);
}

// Изменить роль пользователя
export async function updateUserRoleAction(userId: string, newRole: string) {
  try {
    await db.update(users).set({ role: newRole }).where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error("Ошибка при обновлении роли:", error);
    return { success: false, error: "Не удалось обновить роль" };
  }
}

export async function completeUserProfile(userId: string, data: any) {
  try {
    // Достаем данные из Clerk, на случай если создаем юзера с нуля
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress || "";

    // Используем Upsert: Вставляем нового, а если такой ID уже есть — обновляем
    await db
      .insert(users)
      .values({
        id: userId,
        email: email,
        firstName: clerkUser?.firstName || "",
        lastName: clerkUser?.lastName || "",
        imageUrl: clerkUser?.imageUrl || "",
        role: "client", // Задаем роль по умолчанию
        isProfileComplete: true, // Анкета заполнена!
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        city: data.city,
        maritalStatus: data.maritalStatus,
        hasChildren: data.hasChildren === "yes",
        source: data.source || null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          isProfileComplete: true,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          city: data.city,
          maritalStatus: data.maritalStatus,
          hasChildren: data.hasChildren === "yes",
          source: data.source || null,
        },
      });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Ошибка при обновлении профиля:", error);
    return { success: false };
  }
}

export async function getUsersPaginated(
  page = 1,
  limit = 20,
  searchQuery = "",
) {
  try {
    const offset = (page - 1) * limit;

    // Формируем условия поиска, если админ что-то ввел
    let conditions = undefined;
    if (searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      // Ищем совпадения в имени, фамилии, телефоне или email (ilike не чувствителен к регистру)
      conditions = or(
        ilike(users.firstName, q),
        ilike(users.lastName, q),
        ilike(users.phone, q),
        ilike(users.email, q),
      );
    }

    // Запрашиваем только нужный кусок (limit/offset)
    const data = await db
      .select()
      .from(users)
      .where(conditions)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Запрашиваем общее количество, чтобы знать, сколько всего страниц
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(conditions);

    const totalUsers = Number(totalCountResult[0].count);

    return {
      users: data,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    };
  } catch (error) {
    console.error("Ошибка при получении пользователей:", error);
    return { users: [], totalPages: 0, totalUsers: 0 };
  }
}

// actions/user.ts

export async function updateUserTags(userId: string, tags: string[]) {
  try {
    await db
      .update(users)
      .set({ tags: JSON.stringify(tags) })
      .where(eq(users.id, userId));

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
