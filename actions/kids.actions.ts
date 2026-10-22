"use server";
import { CommunityError, communityErrorMessage } from "@/lib/community/errors";

import { db } from "@/lib/db";
import { kidsApplications, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { saveOwnChildren } from "./community-children";
import { requireCommunityUser, requireStaff } from "@/lib/community/server";
import { createKidsApplicationForUser } from "@/lib/kids/applications";
import { revalidatePath } from "next/cache";

// 1. СОЗДАНИЕ ЗАЯВКИ (с лендинга или из кабинета)
export async function submitKidsApplication(data: any) {
  try {
    const actor = await requireCommunityUser();
    if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).some(key => !["programTitle", "childIds", "children", "parentFirstName", "parentLastName", "email", "phone"].includes(key))) throw new CommunityError("Недопустимые поля запроса");
    // Legacy website contact fields are ignored; the shared writer uses DB data.
    const childIds = data.childIds ?? (Array.isArray(data.children) ? data.children.map((child: any) => child?.id) : undefined);
    await db.transaction(tx => createKidsApplicationForUser(tx, actor, { programTitle: data.programTitle, childIds }));
    revalidatePath("/dashboard/kids"); revalidatePath("/dashboard/kids-applications");
    return { success: true as const };
  } catch (error) { return { success: false as const, error: communityErrorMessage(error, "Не удалось отправить заявку") }; }
}
export async function updateUserChildren(childrenData: unknown[]) { return saveOwnChildren(childrenData); }

// 3. ПОЛУЧЕНИЕ ВСЕХ ЗАЯВОК (ДЛЯ АДМИНА)
export async function getKidsApplications() {
  await requireStaff();

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
  try {
    await requireStaff();
    if (!["pending", "approved", "rejected"].includes(newStatus)) throw new CommunityError("Недопустимый статус заявки");
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
  try {
    await requireStaff();
    await db.delete(kidsApplications).where(eq(kidsApplications.id, id));
    revalidatePath("/dashboard/kids-applications");
    return { success: true };
  } catch (error) {
    console.error("Ошибка удаления:", error);
    return { success: false, error: "Ошибка БД" };
  }
}
