import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { authorProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createProfile } from "@/actions/authors.actions";
import { getAuthorContent } from "@/actions/moderation.actions";
import AuthorProfileForm from "@/components/dashboard/AuthorProfileForm";
import AuthorContentList from "@/components/dashboard/AuthorContentList";
import { PenTool, Newspaper, Video, AlertCircle, Lock } from "lucide-react";
import Link from "next/link";

export default async function AuthorCabinetPage({
  searchParams,
}: {
  // 🔥 Обновленная типизация для Next.js 15+
  searchParams: Promise<{ tab?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // 🔥 Обязательный await для searchParams в новых версиях Next.js
  const resolvedSearchParams = await searchParams;
  const urlTab = resolvedSearchParams?.tab || "profile";

  let profile = await db.query.authorProfiles.findFirst({
    where: eq(authorProfiles.userId, userId),
    with: { user: true },
  });

  if (!profile) {
    await createProfile(userId);
    redirect("/dashboard/author-profile");
  }

  // === ПРОВЕРКА ЗАПОЛНЕННОСТИ ПРОФИЛЯ ===
  const isProfileComplete = Boolean(
    profile.shortBio && profile.shortBio.trim().length > 0,
  );

  // Если профиль не заполнен, принудительно блокируем пользователя на вкладке "profile"
  const currentTab = isProfileComplete ? urlTab : "profile";

  // Получаем контент только если профиль заполнен
  const { articles, videos } = isProfileComplete
    ? await getAuthorContent(userId)
    : { articles: [], videos: [] };

  return (
    <div className="max-w-5xl mx-auto w-full p-6">
      {/* 🔴 ПРЕДУПРЕЖДЕНИЕ, ЕСЛИ ПРОФИЛЬ НЕ ЗАПОЛНЕН */}
      {!isProfileComplete && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-amber-600 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-500">
              Заполните профиль спикера
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Чтобы получить возможность публиковать статьи и видео, вам
              необходимо добавить короткую биографию.
            </p>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* ФОТОГРАФИЯ ПОЛЬЗОВАТЕЛЯ ИЛИ ЗАГЛУШКА */}
          {profile.user?.imageUrl ? (
            <img
              src={profile.user.imageUrl}
              alt="Фото профиля"
              className="w-12 h-12 rounded-2xl object-cover border border-neutral-200 dark:border-neutral-800 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
              <PenTool size={24} />
            </div>
          )}
          <h1 className="text-3xl font-black">Кабинет Спикера</h1>
        </div>

        {/* НАВИГАЦИЯ ПО ВКЛАДКАМ */}
        <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl">
          <Link
            href="?tab=profile"
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              currentTab === "profile"
                ? "bg-white dark:bg-neutral-800 shadow-sm text-amber-500"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Мой Профиль
          </Link>

          {isProfileComplete ? (
            <>
              <Link
                href="?tab=articles"
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                  currentTab === "articles"
                    ? "bg-white dark:bg-neutral-800 shadow-sm text-amber-500"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <Newspaper size={16} /> Мои Статьи
              </Link>
              <Link
                href="?tab=videos"
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                  currentTab === "videos"
                    ? "bg-white dark:bg-neutral-800 shadow-sm text-amber-500"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <Video size={16} /> Мои Видео
              </Link>
            </>
          ) : (
            <>
              {/* ЗАБЛОКИРОВАННЫЕ ВКЛАДКИ */}
              <div
                className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 text-neutral-400 cursor-not-allowed opacity-60"
                title="Сначала заполните профиль"
              >
                <Lock size={14} /> Мои Статьи
              </div>
              <div
                className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 text-neutral-400 cursor-not-allowed opacity-60"
                title="Сначала заполните профиль"
              >
                <Lock size={14} /> Мои Видео
              </div>
            </>
          )}
        </div>
      </div>

      {/* КОНТЕНТ ВКЛАДОК */}
      {currentTab === "profile" && <AuthorProfileForm initialData={profile!} />}
      {currentTab === "articles" && (
        <AuthorContentList items={articles} type="news" />
      )}
      {currentTab === "videos" && (
        <AuthorContentList items={videos} type="video" />
      )}
    </div>
  );
}
