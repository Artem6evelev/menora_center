import { Metadata } from "next";
import { getNewsBySlug } from "@/actions/news";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft, Calendar, Eye } from "lucide-react";

import CommentsSection from "@/components/dashboard/news/comments-section";

// Вспомогательная функция для очистки HTML-тегов из контента (для мета-описания)
function stripHtml(html: string) {
  return html.replace(/<[^>]*>?/gm, "").substring(0, 160) + "...";
}

// 1. ДИНАМИЧЕСКАЯ ГЕНЕРАЦИЯ МЕТАДАТЫ (ДЛЯ TELEGRAM, WHATSAPP, GOOGLE)
export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const slug = decodeURIComponent(params.slug);
  const article = await getNewsBySlug(slug);

  if (!article) {
    return { title: "Новость не найдена | Menorah Center" };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://menorah-rishon.com";
  const plainTextDescription = stripHtml(article.content);

  return {
    title: article.title,
    description: plainTextDescription,
    openGraph: {
      title: article.title,
      description: plainTextDescription,
      type: "article",
      publishedTime: new Date(article.createdAt).toISOString(),
      url: `${baseUrl}/news/${article.slug}`,
      images: [
        {
          url: article.imageUrl || `${baseUrl}/og-default.jpg`,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: plainTextDescription,
      images: [article.imageUrl || `${baseUrl}/og-default.jpg`],
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

  if (!article) {
    return notFound();
  }

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
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20 relative overflow-hidden">
      {/* 2. JSON-LD СХЕМА СТАТЬИ ДЛЯ GOOGLE */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: article.title,
            image: article.imageUrl ? [article.imageUrl] : [],
            datePublished: new Date(article.createdAt).toISOString(),
            dateModified: article.updatedAt
              ? new Date(article.updatedAt).toISOString()
              : new Date(article.createdAt).toISOString(),
            author: [
              {
                "@type": "Organization",
                name: "Menorah Center",
                url: "https://menorah-rishon.com",
              },
            ],
            publisher: {
              "@type": "Organization",
              name: "Menorah Center",
              logo: {
                "@type": "ImageObject",
                url: "https://menorah-rishon.com/logo.png",
              },
            },
          }),
        }}
      />

      <div className="absolute inset-0 h-full w-full bg-white dark:bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

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

        {article.imageUrl && (
          <div className="w-full aspect-video rounded-[32px] overflow-hidden mb-12 shadow-2xl shadow-black/5 border border-neutral-100 dark:border-neutral-800 relative z-0">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <article
          className="prose prose-lg md:prose-xl prose-neutral dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-a:text-[#FFB800] prose-img:rounded-3xl relative z-10"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <CommentsSection
          newsId={article.id}
          initialComments={article.comments}
          currentUser={currentUser}
        />
      </div>
    </main>
  );
}
