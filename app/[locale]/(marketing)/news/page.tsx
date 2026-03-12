import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Metadata } from "next";
import { NewsHero } from "@/components/news/news-hero";

// Ленивая загрузка сетки новостей
const NewsGrid = dynamic(() =>
  import("@/components/news/news-grid").then((mod) => mod.NewsGrid),
);
const CTA = dynamic(() => import("@/components/cta").then((mod) => mod.CTA));

export const metadata: Metadata = {
  title: "Жизнь Общины | Новости Menora Center",
  description:
    "Фотоотчеты с праздников, итоги уроков Торы и главные события еврейской общины в Ришон ле-Ционе.",
};

const SectionSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto h-[500px] animate-pulse bg-neutral-50 rounded-2xl mt-16" />
);

export default function NewsPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-white">
      <div className="relative z-10 w-full pb-20 pt-32 md:pt-40">
        {/* Заголовок страницы */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 mb-4">
            Жизнь общины
          </h1>
          <p className="text-lg text-neutral-500 max-w-2xl">
            Хроники Менора Центра: отчеты с праздников, важные анонсы и истории
            наших людей.
          </p>
        </div>

        {/* Главная (Featured) новость */}
        <NewsHero />

        {/* Сетка остальных новостей */}
        <Suspense fallback={<SectionSkeleton />}>
          <NewsGrid />
        </Suspense>

        <div className="relative w-full mt-24">
          <Suspense fallback={<SectionSkeleton />}>
            <CTA />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
