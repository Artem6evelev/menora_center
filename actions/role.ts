"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateUserRole(targetUserId: string, newRole: string) {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Не авторизован" };
  }

  // 1. Проверяем роль того, кто пытается внести изменения
  const [caller] = await db.select().from(users).where(eq(users.id, userId));
  if (!caller || caller.role !== "superadmin") {
    return { error: "Только superadmin может назначать роли" };
  }

  // 2. Находим пользователя, которому меняют роль
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId));
  if (!targetUser) {
    return { error: "Пользователь не найден" };
  }

  // 3. Жесткая блокировка изменения роли для главного аккаунта
  if (targetUser.email === "artemdev.isr@gmail.com") {
    return {
      error:
        "Роль этого пользователя защищена системой и не может быть изменена",
    };
  }

  // 4. Обновляем роль
  await db
    .update(users)
    .set({ role: newRole })
    .where(eq(users.id, targetUserId));

  revalidatePath("/dashboard/users"); // Укажи актуальный путь к таблице

  return { success: true };
}
