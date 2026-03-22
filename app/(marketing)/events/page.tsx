import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import {
  getPublicEventsPaginated,
  getActivePublicCategories,
} from "@/actions/event";
import EventsPageClient from "@/components/events/events-page-client";

// 1. СТАТИЧЕСКАЯ МЕТАДАТА ДЛЯ СТРАНИЦЫ
export const metadata: Metadata = {
  title: "Мероприятия",
  description:
    "Расписание ближайших Шаббатов, уроков Торы, еврейских праздников и поездок общины Menorah Center в Ришон ле-Ционе.",
  openGraph: {
    title: "Мероприятия | Menorah Center",
    description:
      "Присоединяйтесь к нашим событиям. Расписание Шаббатов, уроков и праздников.",
    images: ["/og-default.jpg"], // Замени на красивое фото зала или Шаббата
  },
};

export default async function PublicEventsPage() {
  const { userId } = await auth();

  // Параллельный фетчинг данных
  const [initialData, categories] = await Promise.all([
    getPublicEventsPaginated(1, 12, null),
    getActivePublicCategories(),
  ]);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://menorah-rishon.com";

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20 relative overflow-hidden">
      {/* 2. JSON-LD СХЕМА: ИНДЕКСАЦИЯ СПИСКА МЕРОПРИЯТИЙ (ItemList) */}
      {initialData.events.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: initialData.events.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "Event",
                  name: item.event.title,
                  url: `${baseUrl}/events/${item.event.id}`,
                  startDate: item.event.date
                    ? new Date(item.event.date).toISOString()
                    : undefined,
                  location: {
                    "@type": "Place",
                    name: "Menorah Center",
                    address: "Ришон ле-Цион, Израиль",
                  },
                },
              })),
            }),
          }}
        />
      )}

      {/* Фоновая сетка Aceternity */}
      <div className="absolute inset-0 h-full w-full bg-white dark:bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Клиентский компонент (Фильтры, Пагинация, Рендер карточек) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-black text-neutral-900 dark:text-white tracking-tighter mb-4">
            Ближайшие{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              События
            </span>
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium max-w-2xl">
            Присоединяйтесь к жизни общины. Здесь вы найдете расписание
            Шаббатов, образовательных программ и специальных встреч.
          </p>
        </div>

        <EventsPageClient
          initialEvents={initialData.events}
          initialHasMore={initialData.hasMore}
          categories={categories}
          userId={userId}
        />
      </div>
    </main>
  );
}
