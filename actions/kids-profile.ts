"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateUserChildren(childrenData: any[]) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Не авторизован" };

  try {
    await db
      .update(users)
      .set({
        childrenData,
        hasChildren: childrenData.length > 0, // Автоматически обновляем статус
      })
      .where(eq(users.id, userId));

    revalidatePath("/dashboard/kids");
    return { success: true };
  } catch (error) {
    console.error("Ошибка обновления детей:", error);
    return { success: false, error: "Ошибка БД" };
  }
}
