"use server";

import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Получить все видео (сортировка от новых к старым)
export async function getVideos() {
  try {
    return await db.select().from(videos).orderBy(desc(videos.createdAt));
  } catch (error) {
    console.error("Ошибка при получении видео:", error);
    return [];
  }
}

// Добавить новое видео
export async function addVideo(title: string, link: string) {
  try {
    await db.insert(videos).values({ title, link });

    // Мгновенно обновляем кэш в админке и на публичной странице
    revalidatePath("/dashboard/videos");
    revalidatePath("/lessons");
    return { success: true };
  } catch (error) {
    console.error("Ошибка при добавлении видео:", error);
    return { success: false, error: "Не удалось добавить видео" };
  }
}

// Удалить видео
export async function deleteVideo(id: string) {
  try {
    await db.delete(videos).where(eq(videos.id, id));

    // Мгновенно обновляем кэш
    revalidatePath("/dashboard/videos");
    revalidatePath("/lessons");
    return { success: true };
  } catch (error) {
    console.error("Ошибка при удалении видео:", error);
    return { success: false, error: "Не удалось удалить видео" };
  }
}
