import { Metadata } from "next";
import { getNewsBySlug } from "@/actions/news";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft, Calendar, Eye, UserRound } from "lucide-react";

import CommentsSection from "@/components/dashboard/news/comments-section";
import ArticleContent from "@/components/news/article-content";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>?/gm, "").substring(0, 160) + "...";
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const slug = decodeURIComponent(params.slug);
  const article = await getNewsBySlug(slug);

  if (!article) return { title: "Новость не найдена" };

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://menorah-rishon.com";
  return {
    title: article.title,
    description: stripHtml(article.content),
    openGraph: {
      images: [{ url: article.imageUrl || `${baseUrl}/og-default.jpg` }],
    },
  };
}

export default async function NewsArticlePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const slug = decodeURIComponent(params.slug);
  const { userId } = await auth();

  const article = await getNewsBySlug(slug);
  if (!article) return notFound();

  let currentUser = null;
  if (userId) {
    currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
  }

  const formattedDate = new Date(article.createdAt).toLocaleDateString(
    "ru-RU",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-24 md:pt-32 pb-20 relative overflow-x-hidden">
      {/* Сетка фона */}
      <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-bold transition-colors mb-10 md:mb-16 group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Ко всем новостям
        </Link>

        <header className="mb-12 md:mb-16">
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-neutral-900 dark:text-white tracking-tighter leading-[1.05] mb-8">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-widest mb-8">
            <span className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900 px-4 py-2 rounded-full">
              <Calendar size={14} className="text-[#FFB800]" /> {formattedDate}
            </span>
            <span className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900 px-4 py-2 rounded-full">
              <Eye size={14} className="text-[#FFB800]" /> {article.views}{" "}
              Просмотров
            </span>
          </div>

          {/* 🔥 БЛОК АВТОРА */}
          {article.author && (
            <div className="mt-8">
              {article.author.authorProfile ? (
                <Link
                  href={`/authors/${article.author.authorProfile.slug}`}
                  className="inline-flex items-center gap-4 p-2 pr-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-full border border-neutral-200 dark:border-neutral-800 hover:border-[#FFB800]/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0">
                    {article.author.imageUrl ? (
                      <img
                        src={article.author.imageUrl}
                        alt="Автор"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserRound className="w-full h-full p-3 text-neutral-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">
                      Лектор общины
                    </p>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-[#FFB800] transition-colors">
                      {article.author.firstName} {article.author.lastName}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="inline-flex items-center gap-4 p-2 pr-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-full border border-neutral-200 dark:border-neutral-800">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0">
                    {article.author.imageUrl ? (
                      <img
                        src={article.author.imageUrl}
                        alt="Автор"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserRound className="w-full h-full p-3 text-neutral-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">
                      Публикация от
                    </p>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white">
                      {article.author.firstName} {article.author.lastName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </header>

        {article.imageUrl && (
          <div className="w-full aspect-video rounded-[24px] md:rounded-[48px] overflow-hidden mb-16 shadow-2xl border border-neutral-100 dark:border-neutral-800">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        )}

        <ArticleContent content={article.content} />

        <footer className="mt-24 pt-16 border-t border-neutral-100 dark:border-neutral-800">
          <CommentsSection
            newsId={article.id}
            initialComments={article.comments}
            currentUser={currentUser}
          />
        </footer>
      </div>
    </main>
  );
}
