import { Metadata } from "next";
import { getPublicNews, getNewsCategories } from "@/actions/news";
import PublicNewsCard from "@/components/dashboard/news/public-news-card";
import Link from "next/link";
import { cn } from "@/lib/utils";

// 1. СТАТИЧЕСКАЯ МЕТАДАТА ДЛЯ РАЗДЕЛА НОВОСТЕЙ
export const metadata: Metadata = {
  title: "Новости общины",
  description:
    "Главные события, объявления и статьи еврейской общины Menorah Center в Ришон ле-Ционе.",
  openGraph: {
    title: "Новости | Menorah Center",
    description: "Читайте последние новости, объявления и статьи нашей общины.",
    images: ["/og-default.jpg"],
  },
};

export default async function NewsPage(props: {
  searchParams: Promise<{ category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const currentCategorySlug = searchParams.category;

  const [news, categories] = await Promise.all([
    getPublicNews(currentCategorySlug),
    getNewsCategories(),
  ]);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://menorahcenter.com";

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20 relative overflow-hidden">
      {/* 2. JSON-LD СХЕМА: ИНДЕКСАЦИЯ СПИСКА НОВОСТЕЙ (ItemList) */}
      {news.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: news.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "NewsArticle",
                  headline: item.title,
                  url: `${baseUrl}/news/${item.slug}`,
                  datePublished: new Date(item.createdAt).toISOString(),
                  image: item.imageUrl ? [item.imageUrl] : [],
                },
              })),
            }),
          }}
        />
      )}

      <div className="absolute inset-0 h-full w-full bg-white dark:bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <span>Блог общины</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-neutral-900 dark:text-white tracking-tighter mb-6">
            Наши{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              Новости
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <Link
            href="/news"
            className={cn(
              "px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300",
              !currentCategorySlug
                ? "bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20 scale-105"
                : "bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800",
            )}
          >
            Все новости
          </Link>

          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/news?category=${cat.slug}`}
              className={cn(
                "px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300",
                currentCategorySlug === cat.slug
                  ? "bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20 scale-105"
                  : "bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800",
              )}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {news.length === 0 ? (
          <div className="w-full py-24 flex flex-col items-center justify-center text-center bg-neutral-50 dark:bg-neutral-900/50 rounded-[32px] border-2 border-dashed border-neutral-200 dark:border-neutral-800">
            <p className="text-xl font-bold text-neutral-400">
              В этой категории пока нет новостей
            </p>
            <Link
              href="/news"
              className="mt-4 text-[#FFB800] font-bold hover:underline underline-offset-4"
            >
              Сбросить фильтр
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item) => (
              <PublicNewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
