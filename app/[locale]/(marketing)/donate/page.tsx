import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Metadata } from "next";

// 🚀 LCP: Окно пожертвования и Hero грузятся сразу
import { DonateHero } from "@/components/donate/donate-hero";

// 🚀 PERFORMANCE: Ленивая загрузка блока доверия
const DonateImpact = dynamic(() =>
  import("@/components/donate/donate-impact").then((mod) => mod.DonateImpact),
);

export const metadata: Metadata = {
  title: "Цдака и Поддержка Общины | Menora Center",
  description:
    "Поддержите еврейскую жизнь в Ришон ле-Ционе. Ваша Цдака идет на помощь нуждающимся, образовательные программы и развитие общины.",
};

const SectionSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto h-[300px] animate-pulse bg-neutral-50 rounded-2xl mt-16" />
);

export default function DonatePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-white">
      <div className="relative z-10 w-full pb-20">
        {/* Главный блок с формой оплаты */}
        <DonateHero />

        {/* На что идут средства */}
        <Suspense fallback={<SectionSkeleton />}>
          <DonateImpact />
        </Suspense>
      </div>
    </main>
  );
}
