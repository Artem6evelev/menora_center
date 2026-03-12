import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Metadata } from "next";

// 🚀 PERFORMANCE: Hero грузится мгновенно
import { AboutHero } from "@/components/about/about-hero";

// 🚀 PERFORMANCE: Ленивая загрузка секций ниже первого экрана
const ValuesGrid = dynamic(() =>
  import("@/components/about/values-grid").then((mod) => mod.ValuesGrid),
);
const Leadership = dynamic(() =>
  import("@/components/about/leadership").then((mod) => mod.Leadership),
);
const CTA = dynamic(() => import("@/components/cta").then((mod) => mod.CTA));

// SEO Метаданные (работают вместе с i18n, если нужно)
export const metadata: Metadata = {
  title: "О нас | Menora Center Ришон ле-Цион",
  description:
    "Узнайте больше о нашей общине, ценностях и раввине. Менора Центр — ваш еврейский дом в Ришон ле-Ционе.",
};

const SectionSkeleton = () => (
  <div className="w-full max-w-6xl mx-auto h-[400px] animate-pulse bg-neutral-50 rounded-2xl mt-16" />
);

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-white">
      <div className="relative z-10 w-full pb-20">
        <AboutHero />

        <Suspense fallback={<SectionSkeleton />}>
          <ValuesGrid />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <Leadership />
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
