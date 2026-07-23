import { db } from "@/lib/db";
import { authorProfiles, news, videos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import AuthorSidebar from "@/components/authors/AuthorSidebar";
import ContentTabs from "@/components/authors/ContentTabs";

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 🔥 1. Обязательно декодируем ссылку, чтобы русские символы читались базой данных
  const decodedSlug = decodeURIComponent(slug);

  const authorProfile = await db.query.authorProfiles.findFirst({
    where: eq(authorProfiles.slug, decodedSlug),
    with: { user: true },
  });

  // Если профиля нет или он отключен - показываем 404
  if (!authorProfile || !authorProfile.isActive) {
    notFound();
  }

  // 🔥 2. Выводим ТОЛЬКО опубликованные материалы (status === "published")
  const authorArticles = await db.query.news.findMany({
    where: and(
      eq(news.authorId, authorProfile.userId),
      eq(news.status, "published"),
    ),
  });

  const authorVideos = await db.query.videos.findMany({
    where: and(
      eq(videos.authorId, authorProfile.userId),
      eq(videos.status, "published"),
    ),
  });

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-24 relative overflow-hidden">
      {/* Фоновая сетка Aceternity */}
      <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row gap-10">
        {/* ЛЕВЫЙ САЙДБАР (Информация об авторе) */}
        <aside className="w-full lg:w-1/3 xl:w-[320px] shrink-0">
          <AuthorSidebar profile={authorProfile} user={authorProfile.user} />
        </aside>

        {/* ПРАВАЯ ЧАСТЬ (Контент) */}
        <div className="w-full lg:flex-1">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <span>Авторские материалы</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-neutral-900 dark:text-white tracking-tighter leading-tight">
              Материалы от{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
                {authorProfile.user?.firstName || "Спикера"}{" "}
                {authorProfile.user?.lastName || ""}
              </span>
            </h1>
          </div>

          {/* ТАБЫ (Статьи / Видео) */}
          <ContentTabs articles={authorArticles} videos={authorVideos} />
        </div>
      </div>
    </main>
  );
}
