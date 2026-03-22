import { auth } from "@clerk/nextjs/server";
import { getPublicNews } from "@/actions/news";
import { getPublicEventsPaginated } from "@/actions/event";
import { getPublicServicesPaginated } from "@/actions/service";

import { Container } from "@/components/container";
import { Hero, CarouselItem } from "@/components/landing/hero";
import { Background } from "@/components/background";
import { Features } from "@/components/features";
import { GridFeatures } from "@/components/grid-features";
import { Testimonials } from "@/components/testimonials";
import { CTA } from "@/components/cta";

// Секции
import { UpcomingEvents } from "@/components/landing/upcomming-events";
import { ServicesSection } from "@/components/sections/service-section";

export const revalidate = 60;

export default async function Home() {
  const { userId } = await auth();

  // 1. ПАРАЛЛЕЛЬНО ЗАПРАШИВАЕМ ВСЕ ДАННЫЕ ИЗ БД (События, Новости, Услуги)
  const [allNews, eventsData, servicesData] = await Promise.all([
    getPublicNews(),
    getPublicEventsPaginated(1, 3, null),
    getPublicServicesPaginated(1, 1, null), // Запрашиваем 1 последнюю услугу
  ]);

  const upcomingEvents = eventsData?.events || [];
  const latestServices = servicesData?.services || [];

  // 2. ФОРМИРУЕМ КАРТОЧКИ ДЛЯ КАРУСЕЛИ (Hero)

  // А) Последнее событие (если есть)
  const eventItem: CarouselItem | null =
    upcomingEvents.length > 0
      ? {
          type: "Событие",
          title: upcomingEvents[0].event.title,
          date: upcomingEvents[0].event.date || "Дата уточняется",
          iconName: "calendar",
          color: "bg-blue-500",
          image:
            upcomingEvents[0].event.imageUrl ||
            "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
          link: "/events", // Жесткая ссылка на раздел событий
        }
      : null;

  // Б) Последняя услуга (если есть)
  const serviceItem: CarouselItem | null =
    latestServices.length > 0
      ? {
          type: "Услуга",
          title: latestServices[0].service.title,
          date: latestServices[0].category?.name || "Доступно для записи",
          iconName: "hearthandshake",
          color: "bg-green-500",
          image:
            latestServices[0].service.imageUrl ||
            "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
          link: "/services", // Жесткая ссылка на раздел услуг
        }
      : null;

  // В) Последние 2 новости (если есть)
  const newsItems: CarouselItem[] = allNews.slice(0, 2).map((newsItem) => ({
    type: "Новость",
    title: newsItem.title,
    date: newsItem.createdAt
      ? new Date(newsItem.createdAt).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
        })
      : "Недавно",
    iconName: "newspaper",
    color: "bg-[#FFB800]",
    image:
      newsItem.imageUrl ||
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
    link: "/news", // Жесткая ссылка на раздел новостей
  }));

  // 3. СОБИРАЕМ ВСЕ КАРТОЧКИ И ФИЛЬТРУЕМ NULL
  const heroItems = [eventItem, serviceItem, ...newsItems].filter(
    Boolean,
  ) as CarouselItem[];

  return (
    <div className="relative">
      {/* Главный экран с каруселью */}
      <section className="relative z-10 w-full">
        <Hero items={heroItems} />
      </section>

      {/* Основной контент страницы */}
      <Container className="flex flex-col items-center justify-between relative z-10">
        <Features />
        <UpcomingEvents events={upcomingEvents} userId={userId} />
        <ServicesSection />
        <GridFeatures />
        <Testimonials />
      </Container>

      {/* Подвал с призывом к действию */}
      <div className="relative">
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <Background />
        </div>
        <CTA />
      </div>
    </div>
  );
}
