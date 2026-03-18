import { auth } from "@clerk/nextjs/server";
import { getPublicNews } from "@/actions/news";
import { getPublicEventsPaginated } from "@/actions/event";

import { Container } from "@/components/container";
import { Hero, CarouselItem } from "@/components/landing/hero";
import { Background } from "@/components/background";
import { Features } from "@/components/features";
import { Companies } from "@/components/companies";
import { GridFeatures } from "@/components/grid-features";
import { Testimonials } from "@/components/testimonials";
import { CTA } from "@/components/cta";

// Секции с реальными данными
import { UpcomingEvents } from "@/components/landing/upcomming-events";
import { ServicesSection } from "@/components/sections/service-section";

export const revalidate = 60;

export default async function Home() {
  const { userId } = await auth();

  const [allNews, eventsData] = await Promise.all([
    getPublicNews(),
    getPublicEventsPaginated(1, 3, null),
  ]);

  const latestNews = allNews.slice(0, 2);
  const upcomingEvents = eventsData?.events || [];

  const newsItems: CarouselItem[] = latestNews.map((news) => ({
    type: "Новость",
    title: news.title,
    date: new Date(news.createdAt).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    }),
    iconName: "newspaper",
    color: "bg-[#FFB800]",
    image:
      news.imageUrl ||
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80",
    link: `/news/${news.slug}`,
  }));

  const eventItem: CarouselItem = {
    type: "Событие",
    title: "Большой Шаббат в общине",
    date: "24 Марта • 19:00",
    iconName: "calendar",
    color: "bg-blue-500",
    image:
      "https://images.unsplash.com/photo-1544723795-3ca315cadc20?w=500&q=80",
    link: "/events",
  };

  const serviceItem: CarouselItem = {
    type: "Услуга",
    title: "Консультация с раввином",
    date: "Доступно онлайн",
    iconName: "hearthandshake",
    color: "bg-green-500",
    image:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&q=80",
    link: "/services",
  };

  const heroItems = [eventItem, serviceItem, ...newsItems];

  return (
    <div className="relative">
      {/* <div className="absolute inset-0 h-full w-full overflow-hidden">
        <Background />
      </div> */}

      {/* HERO ВНЕ КОНТЕЙНЕРА ДЛЯ МАКСИМАЛЬНОЙ ШИРИНЫ */}
      <section className="relative z-10 w-full">
        <Hero items={heroItems} />
      </section>

      <Container className="flex flex-col items-center justify-between relative z-10">
        <Companies />
        <Features />

        <UpcomingEvents events={upcomingEvents} userId={userId} />

        <ServicesSection />
        <GridFeatures />
        <Testimonials />
      </Container>

      <div className="relative">
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <Background />
        </div>
        <CTA />
      </div>
    </div>
  );
}
