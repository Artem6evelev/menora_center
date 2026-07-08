// actions/video.ts
"use server";

import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getVideos() {
  try {
    const allVideos = await db.query.videos.findMany({
      orderBy: [desc(videos.createdAt)],
      with: {
        author: {
          with: { authorProfile: true },
        },
      },
    });

    return allVideos.map((video) => ({
      id: video.id,
      title: video.title,
      link: video.link,
      description: video.description,
      category: video.category || null, // Теперь без "as any"
      authorId: video.authorId || "",
      speaker: video.author
        ? `${video.author.firstName || ""} ${video.author.lastName || ""}`.trim()
        : null,
      authorSlug: video.author?.authorProfile?.slug || null,
    }));
  } catch (error) {
    console.error("Ошибка при получении видео:", error);
    return [];
  }
}

export async function addVideo(
  title: string,
  link: string,
  authorId?: string | null,
  category?: string | null,
) {
  try {
    await db.insert(videos).values({
      title,
      link,
      authorId: authorId || null,
      category: category || null,
    });

    revalidatePath("/dashboard/videos");
    revalidatePath("/lessons");
    revalidatePath("/authors");
    return { success: true };
  } catch (error) {
    console.error("Ошибка при добавлении видео:", error);
    return { success: false, error: "Не удалось добавить видео" };
  }
}

export async function updateVideo(
  id: string,
  title: string,
  link: string,
  authorId?: string | null,
  category?: string | null,
) {
  try {
    await db
      .update(videos)
      .set({
        title,
        link,
        authorId: authorId || null,
        category: category || null,
      })
      .where(eq(videos.id, id));

    revalidatePath("/dashboard/videos");
    revalidatePath("/lessons");
    revalidatePath("/authors");
    return { success: true };
  } catch (error) {
    console.error("Ошибка при обновлении видео:", error);
    return { success: false, error: "Не удалось обновить видео" };
  }
}

export async function deleteVideo(id: string) {
  try {
    await db.delete(videos).where(eq(videos.id, id));
    revalidatePath("/dashboard/videos");
    revalidatePath("/lessons");
    revalidatePath("/authors");
    return { success: true };
  } catch (error) {
    console.error("Ошибка при удалении видео:", error);
    return { success: false, error: "Не удалось удалить видео" };
  }
}
