// app/actions/authors.actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
// 🔥 Добавили news и videos в импорт схемы
import { users, authorProfiles, news, videos } from "@/lib/db/schema";
// 🔥 Добавили sql и desc для сортировки и подсчета
import { eq, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Простая функция для перевода русских имен в английскую ссылку (транслитерация)
const transliterate = (text: string) => {
  const cyrillicToLatin: Record<string, string> = {
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
    ц: "c",
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

  return text
    .toLowerCase()
    .split("")
    .map((char) => cyrillicToLatin[char] || char)
    .join("")
    .replace(/[^a-z0-9]/g, "-") // Заменяем пробелы и спецсимволы на дефисы
    .replace(/-+/g, "-") // Убираем двойные дефисы
    .replace(/^-|-$/g, ""); // Убираем дефисы по краям
};

export async function makeUserAuthor(targetUserId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Не авторизован");

  // 1. Проверяем, что тот, кто нажимает кнопку — суперадмин
  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));
  if (currentUser?.role !== "superadmin") {
    throw new Error("Нет прав для выполнения этого действия");
  }

  // 2. Находим юзера, которого хотим сделать автором
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId));
  if (!targetUser) throw new Error("Пользователь не найден");

  // 3. Обновляем роль
  await db
    .update(users)
    .set({ role: "author" })
    .where(eq(users.id, targetUserId));

  // 4. Проверяем, нет ли у него уже профиля (на случай если роль туда-сюда меняли)
  const [existingProfile] = await db
    .select()
    .from(authorProfiles)
    .where(eq(authorProfiles.userId, targetUserId));

  // 5. Если профиля нет — создаем
  if (!existingProfile) {
    const rawName =
      `${targetUser.firstName || "author"} ${targetUser.lastName || ""}`.trim();
    // Генерируем slug (например: pinhas-vishedski)
    let baseSlug = transliterate(rawName) || `author-${Date.now()}`;

    // Добавляем случайные цифры в конец, чтобы избежать дублей (если два Ивана Иванова)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const finalSlug = `${baseSlug}-${randomSuffix}`;

    await db.insert(authorProfiles).values({
      userId: targetUserId,
      slug: finalSlug,
    });
  }

  // Обновляем кэш админки
  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function createProfile(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return;
  const slug = `${user.firstName?.toLowerCase() || "author"}-${Date.now()}`;
  await db.insert(authorProfiles).values({ userId, slug });
}

// ==========================================
// 🔥 НОВЫЕ ФУНКЦИИ ДЛЯ СТРАНИЦЫ АДМИНА
// ==========================================

export async function getAdminAuthorsList() {
  try {
    const profiles = await db.query.authorProfiles.findMany({
      with: { user: true },
      orderBy: [desc(authorProfiles.createdAt)],
    });

    // Считаем количество статей и видео для каждого автора
    const result = await Promise.all(
      profiles.map(async (profile) => {
        const articles = await db
          .select({ count: sql<number>`count(*)` })
          .from(news)
          .where(eq(news.authorId, profile.userId));

        const videoList = await db
          .select({ count: sql<number>`count(*)` })
          .from(videos)
          .where(eq(videos.authorId, profile.userId));

        return {
          ...profile,
          articlesCount: Number(articles[0]?.count || 0),
          videosCount: Number(videoList[0]?.count || 0),
        };
      }),
    );

    return result;
  } catch (error) {
    console.error("Ошибка при загрузке списка авторов:", error);
    return [];
  }
}

export async function deleteAuthorProfile(userId: string) {
  try {
    // 1. Удаляем публичный профиль Спикера
    await db.delete(authorProfiles).where(eq(authorProfiles.userId, userId));

    // 2. Возвращаем обычную роль (если он был author)
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user && user.role === "author") {
      await db.update(users).set({ role: "user" }).where(eq(users.id, userId));
    }

    revalidatePath("/dashboard/authors");
    revalidatePath("/authors");
    return { success: true };
  } catch (error) {
    console.error("Ошибка при удалении профиля:", error);
    return { success: false, error: "Не удалось удалить профиль" };
  }
}
