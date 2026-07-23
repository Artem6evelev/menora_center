"use server";

import { db } from "@/lib/db";
import { news, newsCategories, newsComments } from "@/lib/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

// --- УТИЛИТА ТРАНСЛИТЕРАЦИИ ---
function transliterate(word: string) {
  const converter: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ь: "",
    ы: "y",
    ъ: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  return word
    .toLowerCase()
    .split("")
    .map((char) => converter[char] || char)
    .join("");
}

// 1. Получение новостей для Админки
export async function getAdminNews() {
  return await db.query.news.findMany({ orderBy: [desc(news.createdAt)] });
}

// 2. Создание новости (С ПОДДЕРЖКОЙ АВТОРА И СТАТУСОВ)
export async function createNews(data: {
  title: string;
  content: string;
  imageUrl?: string;
  isPublished?: boolean; // Сделали опциональным
  isPinned: boolean;
  targetAuthorId?: string | null;
  categoryId?: string | null;
  status?: "draft" | "pending" | "published" | "rejected"; // <-- НОВОЕ ПОЛЕ
}) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Не авторизован" };

  try {
    const slug = `${transliterate(data.title).replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

    // Определяем статус: если передан явно - берем его, иначе смотрим на isPublished
    const finalStatus =
      data.status || (data.isPublished ? "published" : "draft");

    await db.insert(news).values({
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl,
      isPublished: finalStatus === "published", // Синхронизируем старое поле с новым статусом
      isPinned: data.isPinned,
      categoryId: data.categoryId,
      authorId: data.targetAuthorId || userId,
      status: finalStatus, // <-- СОХРАНЯЕМ СТАТУС
      slug,
    });

    revalidatePath("/dashboard/news");
    revalidatePath("/news");
    revalidatePath("/dashboard/author-profile");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Не удалось сохранить новость" };
  }
}

// Вспомогательная функция для проверки прав (Добавь ее перед updateNews)
async function hasEditPermissions(articleId: string) {
  const { userId } = await auth();
  if (!userId) return false;

  // 1. Ищем пользователя, чтобы узнать его роль
  const { users } = await import("@/lib/db/schema");
  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  // 2. Если это админ или суперадмин — разрешаем всё!
  if (currentUser?.role === "admin" || currentUser?.role === "superadmin") {
    return true;
  }

  // 3. Иначе проверяем, является ли пользователь автором конкретно этой статьи
  const article = await db.query.news.findFirst({
    where: eq(news.id, articleId),
  });

  return article?.authorId === userId;
}

// 🔥 ОБНОВЛЕННАЯ ФУНКЦИЯ UPDATE
export async function updateNews(
  id: string,
  data: {
    title: string;
    content: string;
    imageUrl?: string;
    isPublished: boolean;
    isPinned: boolean;
    targetAuthorId?: string | null;
    categoryId?: string | null;
  },
) {
  try {
    // ПРОВЕРКА ПРАВ: Если нет прав - отклоняем запрос
    const canEdit = await hasEditPermissions(id);
    if (!canEdit) {
      return {
        success: false,
        error: "У вас нет прав на редактирование этой статьи",
      };
    }

    const updatePayload: any = {
      ...data,
      updatedAt: new Date(),
    };

    // Если суперадмин решил сменить автора статьи - сохраняем
    if (data.targetAuthorId) {
      updatePayload.authorId = data.targetAuthorId;
    }

    await db.update(news).set(updatePayload).where(eq(news.id, id));

    revalidatePath("/dashboard/news");
    revalidatePath("/news");
    return { success: true };
  } catch (error: any) {
    console.error("Ошибка обновления новости:", error);
    return { success: false, error: "Не удалось обновить новость" };
  }
}

// 🔥 ОБНОВЛЕННАЯ ФУНКЦИЯ DELETE
export async function deleteNews(id: string) {
  try {
    // ПРОВЕРКА ПРАВ: Если нет прав - отклоняем запрос
    const canEdit = await hasEditPermissions(id);
    if (!canEdit) {
      return {
        success: false,
        error: "У вас нет прав на удаление этой статьи",
      };
    }

    await db.delete(news).where(eq(news.id, id));
    revalidatePath("/dashboard/news");
    revalidatePath("/news");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ошибка при удалении" };
  }
}

export async function getPublicNews(categorySlug?: string) {
  let condition = eq(news.isPublished, true);
  if (categorySlug) {
    const cat = await db.query.newsCategories.findFirst({
      where: eq(newsCategories.slug, categorySlug),
    });
    if (cat) condition = and(condition, eq(news.categoryId, cat.id)) as any;
  }
  return await db.query.news.findMany({
    where: condition,
    orderBy: [desc(news.isPinned), desc(news.createdAt)],
  });
}

// actions/news.ts

export async function uploadImageAction(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return { success: false, error: "Файл не найден" };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 1. Берем только расширение файла (например, "png" или "jpg")
  const fileExt = file.name.split(".").pop();

  // 2. Генерируем полностью безопасное имя файла из цифр и случайных букв
  const safeFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  // 3. Путь, куда сохраняем
  const filePath = `news/${safeFilename}`;

  const { error } = await supabase.storage
    .from("images") // Имя корзины в Supabase
    .upload(filePath, file);

  if (error) {
    console.error("Supabase Upload Error:", error);
    return { success: false, error: error.message };
  }

  const { data } = supabase.storage.from("images").getPublicUrl(filePath);
  return { success: true, url: data.publicUrl };
}

// 1. Получить статью по Slug
export async function getNewsBySlug(slug: string) {
  try {
    await db
      .update(news)
      .set({ views: sql`${news.views} + 1` })
      .where(eq(news.slug, slug));

    const article = await db.query.news.findFirst({
      where: eq(news.slug, slug),
      with: {
        comments: {
          with: { user: true },
          orderBy: [desc(newsComments.createdAt)],
        },
        // 🔥 ДОБАВЛЯЕМ ЭТУ СТРОКУ, ЧТОБЫ ПОДТЯНУТЬ АВТОРА
        author: {
          with: { authorProfile: true },
        },
      },
    });

    return article;
  } catch (error) {
    console.error("Ошибка загрузки статьи:", error);
    return null;
  }
}

export async function addNewsComment(
  newsId: string,
  userId: string,
  content: string,
) {
  await db.insert(newsComments).values({ newsId, userId, content });
  revalidatePath(`/news/${newsId}`);
  return { success: true };
}

export async function deleteNewsComment(id: string) {
  await db.delete(newsComments).where(eq(newsComments.id, id));
  revalidatePath(`/news`);
  return { success: true };
}

export async function getNavbarNewsData() {
  const latestArticle = await db.query.news.findFirst({
    where: eq(news.isPublished, true),
    orderBy: [desc(news.createdAt)],
  });
  const categories = await db.query.newsCategories.findMany({
    limit: 4,
    orderBy: [desc(newsCategories.updatedAt)],
  });
  return { latestArticle, categories };
}

export async function getNewsCategories() {
  return await db.query.newsCategories.findMany({
    orderBy: [desc(newsCategories.updatedAt)],
  });
}

export async function createNewsCategory(data: {
  name: string;
  description?: string;
  icon?: string;
}) {
  await db.insert(newsCategories).values({
    ...data,
    slug: transliterate(data.name).replace(/[^a-z0-9]+/g, "-"),
  });
  revalidatePath("/dashboard/news");
  return { success: true };
}

export async function deleteNewsCategory(id: string) {
  await db.delete(newsCategories).where(eq(newsCategories.id, id));
  revalidatePath("/dashboard/news");
  return { success: true };
}
