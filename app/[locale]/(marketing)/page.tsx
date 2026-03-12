import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Container } from "@/components/container";
import { Hero } from "@/components/hero";
// Если фон тяжелый (анимации, WebGL, частицы), его ТОЖЕ нужно грузить динамически
// import { Background } from "@/components/ui/background";

// 🚀 PERFORMANCE: Ленивая загрузка тяжелых секций ниже первого экрана.
// Мы разделяем бандл, чтобы Main Thread не блокировался рендерингом скрытого контента.
const Features = dynamic(() =>
  import("@/components/features").then((mod) => mod.Features),
);
const GridFeatures = dynamic(() =>
  import("@/components/grid-features").then((mod) => mod.GridFeatures),
);
const Testimonials = dynamic(() =>
  import("@/components/testimonials").then((mod) => mod.Testimonials),
);
const CTA = dynamic(() => import("@/components/cta").then((mod) => mod.CTA));

// Скелетоны для плавного появления (CLS оптимизация)
const SectionSkeleton = () => (
  <div className="w-full h-[400px] animate-pulse bg-neutral-100 dark:bg-neutral-900 rounded-2xl mt-16" />
);

export default function Home() {
  return (
    // overflow-x-hidden предотвращает горизонтальный скролл на мобилках.
    // bg-background гарантирует, что тема подцепится мгновенно.
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      {/* 1. ФОН: Если возвращаешь Background, убедись, что у него стоит pointer-events-none */}
      {/* <div className="fixed inset-0 z-0 pointer-events-none">
            <Background />
          </div> */}

      {/* 2. Основной контент */}
      <div className="relative z-10 w-full">
        <Container className="flex flex-col items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Hero грузится сразу (Static/Server Component). LCP должен быть идеальным. */}
          <Hero />

          {/* Suspense boundaries предотвращают блокировку гидратации всей страницы */}
          <Suspense fallback={<SectionSkeleton />}>
            <Features />
          </Suspense>

          <Suspense fallback={<SectionSkeleton />}>
            <GridFeatures />
          </Suspense>

          <Suspense fallback={<SectionSkeleton />}>
            <Testimonials />
          </Suspense>
        </Container>

        {/* CTA на всю ширину. Отделяем логически. */}
        <div className="relative w-full mt-24">
          <Suspense
            fallback={
              <div className="w-full h-[300px] animate-pulse bg-neutral-100 dark:bg-neutral-900" />
            }
          >
            <CTA />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
