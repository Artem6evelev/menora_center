"use server";

import { db } from "@/lib/db";
import { kidsApplications } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitKidsApplication(data: {
  programTitle: string;
  parentFirstName: string;
  parentLastName: string;
  email: string;
  phone: string;
  // 🔥 Добавили birthDate в тип
  children: { name: string; age: number | string; birthDate: string }[];
}) {
  const { userId } = await auth();

  try {
    await db.insert(kidsApplications).values({
      ...data,
      userId: userId || null,
    });

    revalidatePath("/dashboard/kids");
    return { success: true };
  } catch (error) {
    console.error("Ошибка при сохранении заявки Menorah Kids:", error);
    return { success: false, error: "Не удалось сохранить заявку" };
  }
}

export async function getKidsApplications() {
  try {
    return await db
      .select()
      .from(kidsApplications)
      .orderBy(desc(kidsApplications.createdAt));
  } catch (error) {
    console.error("Ошибка получения заявок Menorah Kids:", error);
    return [];
  }
}

export async function deleteKidsApplication(id: string) {
  try {
    await db.delete(kidsApplications).where(eq(kidsApplications.id, id));
    revalidatePath("/dashboard/kids");
    return { success: true };
  } catch (error) {
    console.error("Ошибка удаления заявки Menorah Kids:", error);
    return { success: false, error: "Не удалось удалить" };
  }
}
