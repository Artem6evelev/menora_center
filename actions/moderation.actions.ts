// app/actions/moderation.actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { news, videos, users, notifications } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// 1. Получение контента автора (для Кабинета Автора)
export async function getAuthorContent(authorUserId: string) {
  const authorNews = await db.query.news.findMany({
    where: eq(news.authorId, authorUserId),
    orderBy: [desc(news.createdAt)],
  });

  const authorVideos = await db.query.videos.findMany({
    where: eq(videos.authorId, authorUserId),
    orderBy: [desc(videos.createdAt)],
  });

  return { articles: authorNews, videos: authorVideos };
}

export async function submitForReview(id: string, type: "news" | "video") {
  const { userId } = await auth();
  if (!userId) throw new Error("Не авторизован");

  const table = type === "news" ? news : videos;

  // 1. Меняем статус на "pending"
  await db
    .update(table as any)
    .set({
      status: "pending",
      rejectionReason: null,
      isPublished: false,
    })
    .where(eq((table as any).id, id));

  // 2. Ищем суперадмина (или админов), чтобы отправить им уведомление
  const adminUsers = await db
    .select()
    .from(users)
    .where(eq(users.role, "superadmin"));

  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  const authorName =
    `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim();

  // 3. Создаем уведомление для каждого суперадмина
  if (adminUsers.length > 0) {
    const notificationsToInsert = adminUsers.map((admin) => ({
      userId: admin.id,
      senderId: userId,
      title: "Новый материал на модерацию",
      message: `Спикер ${authorName} отправил ${type === "news" ? "статью" : "видео"} на проверку.`,
      link: "/dashboard/moderation",
      type: "system",
      isRead: false,
    }));

    await db.insert(notifications).values(notificationsToInsert);
  }

  revalidatePath("/dashboard/author-profile");
  revalidatePath("/dashboard/moderation"); // Обновляем страницу модерации
  return { success: true };
}

// 3. Получение всего контента, ожидающего проверку (Для Суперадмина)
export async function getPendingContent() {
  const pendingNews = await db.query.news.findMany({
    where: eq(news.status, "pending"),
    with: { author: true },
    orderBy: [desc(news.createdAt)],
  });

  const pendingVideos = await db.query.videos.findMany({
    where: eq(videos.status, "pending"),
    with: { author: true },
    orderBy: [desc(videos.createdAt)],
  });

  return { articles: pendingNews, videos: pendingVideos };
}

// 4. Решение Суперадмина (Одобрить или Отклонить)
export async function moderateContent(
  id: string,
  type: "news" | "video",
  action: "approve" | "reject",
  comment?: string,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Не авторизован");

  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
  if (dbUser?.role !== "superadmin" && dbUser?.role !== "admin") {
    throw new Error("Нет прав");
  }

  const table = type === "news" ? news : videos;

  if (action === "approve") {
    await db
      .update(table as any)
      .set({ status: "published", isPublished: true, rejectionReason: null })
      .where(eq((table as any).id, id));
  } else {
    await db
      .update(table as any)
      .set({ status: "rejected", isPublished: false, rejectionReason: comment })
      .where(eq((table as any).id, id));
  }

  revalidatePath("/dashboard/moderation");
  revalidatePath("/dashboard/author-cabinet");
  return { success: true };
}

// app/actions/moderation.actions.ts (добавь в конец файла)

export async function authorCreateVideo(
  title: string,
  link: string,
  category: string,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Не авторизован");

  try {
    await db.insert(videos).values({
      title,
      link,
      category: category || null,
      authorId: userId,
      status: "draft", // Автор всегда создает черновик
      isPublished: false,
    });
    revalidatePath("/dashboard/author-profile");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function authorDeleteContent(id: string, type: "news" | "video") {
  const { userId } = await auth();
  if (!userId) throw new Error("Не авторизован");

  try {
    const table = type === "news" ? news : videos;
    // Удаляем только если это контент текущего автора
    await db
      .delete(table as any)
      .where(
        and(eq((table as any).id, id), eq((table as any).authorId, userId)),
      );
    revalidatePath("/dashboard/author-profile");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 🔥 НОВАЯ ФУНКЦИЯ ДЛЯ САЙДБАРА: Подсчет материалов на проверке
export async function getPendingCount() {
  const pendingNews = await db
    .select()
    .from(news)
    .where(eq(news.status, "pending"));
  const pendingVideos = await db
    .select()
    .from(videos)
    .where(eq(videos.status, "pending"));

  return pendingNews.length + pendingVideos.length;
}
