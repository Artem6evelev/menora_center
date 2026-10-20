"use server";
import { CommunityError, communityErrorMessage } from "@/lib/community/errors";

import { db } from "@/lib/db";
import { kidsApplications, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { saveOwnChildren } from "./community-children";
import { requireCommunityUser, requireChildPermission, requireStaff } from "@/lib/community/server";
import { profileChildren } from "@/lib/community/children";
import { revalidatePath } from "next/cache";

// 1. СОЗДАНИЕ ЗАЯВКИ (с лендинга или из кабинета)
export async function submitKidsApplication(data: any) {
  try {
    const actor = await requireCommunityUser();
    requireChildPermission(actor);
    if (data.userId || data.parentId || data.gender || data.affiliation) throw new CommunityError("Недопустимые поля запроса");
    const children = profileChildren(actor.id, actor.childrenData);
    const ids: string[] = data.childIds || (Array.isArray(data.children) ? data.children.map((child: any) => child.id) : []);
    if (!Array.isArray(ids) || !ids.length || ids.length > 20 || new Set(ids).size !== ids.length) throw new CommunityError("Выберите сохранённых детей из своего профиля");
    const selected = ids.map(id => {
      const child = children.find(item => item.id === id && item.parentId === actor.id);
      if (!child) throw new CommunityError("Ребёнок не связан с Вашим профилем");
      return child;
    });
    if (typeof data.programTitle !== "string" || !data.programTitle.trim() || data.programTitle.length > 200) throw new CommunityError("Выберите программу");
    await db.transaction(async tx => {
      const [fresh] = await tx.select().from(users).where(eq(users.id, actor.id)).for("update");
      requireChildPermission(fresh);
      const actual = profileChildren(actor.id, fresh.childrenData);
      if (ids.some(id => !actual.some(child => child.id === id))) throw new CommunityError("Данные детей изменились. Обновите страницу.");
      await tx.insert(kidsApplications).values({ programTitle: data.programTitle, parentFirstName: fresh.firstName || "",
        parentLastName: fresh.lastName || "", email: fresh.email, phone: fresh.phone || "", children: ids.map(id => actual.find(child => child.id === id)!), userId: actor.id });
    });
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
