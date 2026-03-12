import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Metadata } from "next";

// 🚀 LCP: Hero грузится сразу
import { ServicesHero } from "@/components/services/services-hero";

// 🚀 PERFORMANCE: Ленивая загрузка
const ServicesGrid = dynamic(() =>
  import("@/components/services/services-grid").then((mod) => mod.ServicesGrid),
);
const CTA = dynamic(() => import("@/components/cta").then((mod) => mod.CTA));

export const metadata: Metadata = {
  title: "Услуги общины | Menora Center",
  description:
    "Организация еврейских свадеб (Хупа), Бар/Бат Мицвы, проверка мезуз, кашерование кухни и другие услуги общины в Ришон ле-Ционе.",
};

const SectionSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto h-[600px] animate-pulse bg-neutral-50 rounded-2xl mt-16" />
);

export default function ServicesPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-white">
      <div className="relative z-10 w-full pb-20">
        <ServicesHero />

        <Suspense fallback={<SectionSkeleton />}>
          <ServicesGrid />
        </Suspense>

        <div className="relative w-full mt-32">
          <Suspense fallback={<SectionSkeleton />}>
            <CTA />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
