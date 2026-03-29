"use server";

import { db } from "@/lib/db";
import { news, newsCategories, newsComments } from "@/lib/db/schema";
import { desc, eq, sql, isNotNull, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// --- НОВАЯ ФУНКЦИЯ ДЛЯ ТРАНСЛИТЕРАЦИИ (Без сторонних библиотек) ---
function transliterate(word: string) {
  const answer = [];
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

  for (let i = 0; i < word.length; ++i) {
    const char = word[i].toLowerCase();
    answer.push(converter[char] !== undefined ? converter[char] : char);
  }

  return answer.join("");
}
// -----------------------------------------------------------------

// 1. Получение всех новостей для Админки
export async function getAdminNews() {
  try {
    return await db.query.news.findMany({
      orderBy: [desc(news.createdAt)],
    });
  } catch (error) {
    console.error("Ошибка при получении новостей:", error);
    return [];
  }
}

// 2. Получение только опубликованных новостей для сайта (с фильтрацией)
export async function getPublicNews(categorySlug?: string) {
  try {
    let condition = eq(news.isPublished, true);

    if (categorySlug) {
      const category = await db.query.newsCategories.findFirst({
        where: eq(newsCategories.slug, categorySlug),
      });

      if (category) {
        condition = and(
          eq(news.isPublished, true),
          eq(news.categoryId, category.id),
        ) as any;
      }
    }

    return await db.query.news.findMany({
      where: condition,
      orderBy: [desc(news.isPinned), desc(news.createdAt)],
    });
  } catch (error) {
    console.error("Ошибка при получении публичных новостей:", error);
    return [];
  }
}

// 3. Создание новой новости
export async function createNews(data: {
  title: string;
  content: string;
  imageUrl?: string;
  isPublished: boolean;
  isPinned: boolean;
  authorId: string;
  categoryId?: string | null;
}) {
  try {
    // ИСПОЛЬЗУЕМ ТРАНСЛИТЕРАЦИЮ ЗДЕСЬ
    const transliteratedTitle = transliterate(data.title);

    const baseSlug = transliteratedTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // Оставляем только латиницу и цифры
      .replace(/(^-|-$)+/g, "");

    const slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;

    await db.insert(news).values({
      ...data,
      slug,
    });

    revalidatePath("/dashboard/news");
    revalidatePath("/news");
    return { success: true };
  } catch (error) {
    console.error("Ошибка создания новости:", error);
    return { success: false, error: "Не удалось сохранить новость" };
  }
}

// 4. Удаление новости
export async function deleteNews(id: string) {
  try {
    await db.delete(news).where(eq(news.id, id));
    revalidatePath("/dashboard/news");
    revalidatePath("/news");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ошибка при удалении" };
  }
}

export async function uploadImageAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "Файл не найден" };

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `news/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Обновление существующей новости
export async function updateNews(
  id: string,
  data: {
    title: string;
    content: string;
    imageUrl?: string;
    isPublished: boolean;
    isPinned: boolean;
    categoryId?: string | null;
  },
) {
  try {
    await db
      .update(news)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(news.id, id));

    revalidatePath("/dashboard/news");
    revalidatePath("/news");
    return { success: true };
  } catch (error: any) {
    console.error("Ошибка обновления новости:", error);
    return { success: false, error: "Не удалось обновить новость" };
  }
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
      },
    });

    return article;
  } catch (error) {
    console.error("Ошибка загрузки статьи:", error);
    return null;
  }
}

// 2. Добавить комментарий
export async function addNewsComment(
  newsId: string,
  userId: string,
  content: string,
) {
  try {
    const [newComment] = await db
      .insert(newsComments)
      .values({
        newsId,
        userId,
        content,
      })
      .returning();

    revalidatePath(`/news`);
    return { success: true, commentId: newComment.id };
  } catch (error) {
    return { success: false, error: "Ошибка при отправке" };
  }
}

// 3. Удалить комментарий
export async function deleteNewsComment(commentId: string) {
  try {
    await db.delete(newsComments).where(eq(newsComments.id, commentId));
    revalidatePath(`/news`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ошибка при удалении" };
  }
}

// Получаем данные для выпадающего меню
export async function getNavbarNewsData() {
  try {
    const latestArticle = await db.query.news.findFirst({
      where: eq(news.isPublished, true),
      orderBy: [desc(news.createdAt)],
    });

    const categories = await db.query.newsCategories.findMany({
      limit: 4,
      orderBy: [desc(newsCategories.updatedAt)],
    });

    return { latestArticle, categories };
  } catch (error) {
    console.error("Ошибка загрузки данных для навбара:", error);
    return { latestArticle: null, categories: [] };
  }
}

// 1. Получить все категории
export async function getNewsCategories() {
  return await db.query.newsCategories.findMany({
    orderBy: [desc(newsCategories.updatedAt)],
  });
}

// 2. Создать категорию
export async function createNewsCategory(data: {
  name: string;
  description?: string;
  icon?: string;
}) {
  try {
    // ИСПОЛЬЗУЕМ ТРАНСЛИТЕРАЦИЮ ЗДЕСЬ
    const transliteratedName = transliterate(data.name);

    const slug = transliteratedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    await db.insert(newsCategories).values({
      name: data.name,
      description: data.description || "",
      icon: data.icon || "newspaper",
      slug,
    });
    revalidatePath("/dashboard/news");
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

// 3. Удалить категорию
export async function deleteNewsCategory(id: string) {
  await db.delete(newsCategories).where(eq(newsCategories.id, id));
  revalidatePath("/dashboard/news");
  return { success: true };
}
