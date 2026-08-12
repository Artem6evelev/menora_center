"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { kidsApplications, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// 1. СОЗДАНИЕ ЗАЯВКИ (с лендинга или из кабинета)
export async function submitKidsApplication(data: any) {
  try {
    const { userId } = await auth(); // Может быть null, если с лендинга

    await db.insert(kidsApplications).values({
      programTitle: data.programTitle,
      parentFirstName: data.parentFirstName,
      parentLastName: data.parentLastName,
      email: data.email,
      phone: data.phone,
      children: data.children, // Массив детей
      userId: userId || null, // Привязываем к юзеру, если он залогинен
    });

    revalidatePath("/dashboard/kids");
    revalidatePath("/dashboard/kids-applications");
    return { success: true };
  } catch (error) {
    console.error("Ошибка при создании заявки Menorah Kids:", error);
    return { success: false, error: "Ошибка БД" };
  }
}

// 2. ОБНОВЛЕНИЕ ДАННЫХ ДЕТЕЙ В ПРОФИЛЕ ПОЛЬЗОВАТЕЛЯ
export async function updateUserChildren(childrenData: any[]) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Не авторизован" };

  try {
    await db
      .update(users)
      .set({
        childrenData,
        hasChildren: childrenData.length > 0,
      })
      .where(eq(users.id, userId));

    revalidatePath("/dashboard/kids");
    return { success: true };
  } catch (error) {
    console.error("Ошибка обновления детей:", error);
    return { success: false, error: "Ошибка БД" };
  }
}

// 3. ПОЛУЧЕНИЕ ВСЕХ ЗАЯВОК (ДЛЯ АДМИНА)
export async function getKidsApplications() {
  const { userId } = await auth();
  if (!userId) return [];

  const [caller] = await db.select().from(users).where(eq(users.id, userId));
  const role =
    caller?.email === "artemdev.isr@gmail.com" ? "superadmin" : caller?.role;

  if (role !== "admin" && role !== "superadmin") return [];

  // 🔥 ДЕЛАЕМ JOIN С ТАБЛИЦЕЙ USERS, ЧТОБЫ ПОЛУЧИТЬ СТАТУС РОДИТЕЛЯ
  const data = await db
    .select({
      app: kidsApplications,
      jewishStatus: users.jewishStatus, // Тянем статус
    })
    .from(kidsApplications)
    .leftJoin(users, eq(kidsApplications.userId, users.id))
    .orderBy(desc(kidsApplications.createdAt));

  // Возвращаем склеенный объект
  return data.map((row) => ({
    ...row.app,
    parentJewishStatus: row.jewishStatus, // Добавляем поле для клиента
  }));
}

// 4. ИЗМЕНЕНИЕ СТАТУСА ЗАЯВКИ (ДЛЯ АДМИНА)
export async function updateKidsApplicationStatus(
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
      .update(kidsApplications)
      .set({ status: newStatus })
      .where(eq(kidsApplications.id, id));
    revalidatePath("/dashboard/kids-applications");
    return { success: true };
  } catch (error) {
    console.error("Ошибка изменения статуса:", error);
    return { success: false, error: "Ошибка БД" };
  }
}

// 5. УДАЛЕНИЕ ЗАЯВКИ (ДЛЯ АДМИНА)
export async function deleteKidsApplication(id: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Не авторизован" };

  const [caller] = await db.select().from(users).where(eq(users.id, userId));
  const role =
    caller?.email === "artemdev.isr@gmail.com" ? "superadmin" : caller?.role;
  if (role !== "admin" && role !== "superadmin")
    return { success: false, error: "Нет прав" };

  try {
    await db.delete(kidsApplications).where(eq(kidsApplications.id, id));
    revalidatePath("/dashboard/kids-applications");
    return { success: true };
  } catch (error) {
    console.error("Ошибка удаления:", error);
    return { success: false, error: "Ошибка БД" };
  }
}
