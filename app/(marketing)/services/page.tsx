import { Metadata } from "next";
import {
  getPublicServicesPaginated,
  getActivePublicServiceCategories,
} from "@/actions/service";
import ServicesPageClient from "@/components/services/services-page-client";
import { auth } from "@clerk/nextjs/server";

// 1. СТАТИЧЕСКАЯ МЕТАДАТА ДЛЯ СТРАНИЦЫ УСЛУГ
export const metadata: Metadata = {
  title: "Услуги общины",
  description:
    "Духовная поддержка, консультации, образовательные программы и социальная помощь в Menorah Center Ришон ле-Цион. Узнайте, как мы можем помочь вам.",
  openGraph: {
    title: "Услуги | Menorah Center",
    description: "Поддержка и услуги нашего центра для каждого члена общины.",
    images: ["/og-default.jpg"],
  },
};

export default async function PublicServicesPage() {
  const { userId } = await auth();

  // Получаем начальные данные для услуг и их категории
  const [initialData, categories] = await Promise.all([
    getPublicServicesPaginated(1, 100, null),
    getActivePublicServiceCategories(),
  ]);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://menora-rishon.com";

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20 relative overflow-hidden">
      {/* 2. JSON-LD СХЕМА: ОПИСАНИЕ УСЛУГ ДЛЯ GOOGLE (Service & ItemList) */}
      {initialData.services.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "Услуги Menorah Center",
              description:
                "Список доступных услуг и программ поддержки общинного центра.",
              itemListElement: initialData.services.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "Service",
                  name: item.service.title,
                  description:
                    item.service.description || "Услуга общинного центра",
                  provider: {
                    "@type": "Organization",
                    name: "Menorah Center",
                  },
                  areaServed: {
                    "@type": "City",
                    name: "Rishon LeZion",
                  },
                },
              })),
            }),
          }}
        />
      )}

      {/* Сетка Aceternity на фоне */}
      <div className="absolute inset-0 h-full w-full bg-white dark:bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Заголовок страницы (Серверный рендер для SEO) */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-black text-neutral-900 dark:text-white tracking-tighter mb-6">
            Наши{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              Услуги
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
            Мы здесь, чтобы поддержать вас в любой ситуации. От духовных
            консультаций до практической помощи — выберите то, что важно для вас
            сегодня.
          </p>
        </div>

        {/* Клиентская часть с фильтрами и списком */}
        <ServicesPageClient
          initialServices={initialData.services}
          categories={categories}
          userId={userId}
        />
      </div>
    </main>
  );
}
