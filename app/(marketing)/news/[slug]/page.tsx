import { getNewsBySlug } from "@/actions/news";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft, Calendar, Eye } from "lucide-react";

// ВАЖНО: На твоем скриншоте путь был "@/components/dashboard/news/comments-section".
// Если будет ошибка "Module not found", проверь, где именно лежит этот файл.
// Скорее всего он здесь:
import CommentsSection from "@/components/dashboard/news/comments-section";

// 1. Указываем TS, что params - это Promise (новое требование Next.js)
export default async function NewsArticlePage(props: {
  params: Promise<{ slug: string }>;
}) {
  // 2. Дожидаемся распаковки параметров
  const params = await props.params;

  // 3. Раскодируем кириллицу (превращаем абракадабру %D1%82... обратно в "тестовый-заголовок")
  const slug = decodeURIComponent(params.slug);

  const { userId } = await auth();

  // 4. Ищем статью в базе по нормальному, раскодированному slug
  const article = await getNewsBySlug(slug);

  // Если статья не найдена — отдаем страницу 404
  if (!article) {
    return notFound();
  }

  // 5. Ищем текущего пользователя (для блока комментариев)
  let currentUser = null;
  if (userId) {
    currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId), // Используем id, так как clerkId у нас нет
    });
  }

  // Красивое форматирование даты
  const formattedDate = new Date(article.createdAt).toLocaleDateString(
    "ru-RU",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20 relative overflow-hidden">
      {/* Красивая фоновая сетка */}
      <div className="absolute inset-0 h-full w-full bg-white dark:bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-bold transition-colors mb-12 group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Ко всем новостям
        </Link>

        {/* Шапка статьи */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-neutral-900 dark:text-white tracking-tighter leading-[1.1] mb-6">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-neutral-500 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-[#FFB800]" /> {formattedDate}
            </span>
            <span className="flex items-center gap-2">
              <Eye size={16} className="text-[#FFB800]" /> {article.views}{" "}
              просмотров
            </span>
          </div>
        </div>

        {/* Обложка */}
        {article.imageUrl && (
          <div className="w-full aspect-video rounded-[32px] overflow-hidden mb-12 shadow-2xl shadow-black/5 border border-neutral-100 dark:border-neutral-800 relative z-0">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Контент из визуального редактора */}
        <article
          className="prose prose-lg md:prose-xl prose-neutral dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-a:text-[#FFB800] prose-img:rounded-3xl"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Секция комментариев */}
        <CommentsSection
          newsId={article.id}
          initialComments={article.comments}
          currentUser={currentUser}
        />
      </div>
    </main>
  );
}
