import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getPublicNews } from "@/actions/news";
import { getPublicEventsPaginated } from "@/actions/event";
import { getVideos } from "@/actions/video"; // <-- ИМПОРТ ВИДЕО

import { Container } from "@/components/container";
import { Hero, CarouselItem } from "@/components/landing/hero";
import { Background } from "@/components/background";
import { Features } from "@/components/features";
import { GridFeatures } from "@/components/grid-features";
// import { Testimonials } from "@/components/testimonials";
import { CTA } from "@/components/cta";

// Секции
import { UpcomingEvents } from "@/components/landing/upcomming-events";
import { ServicesSection } from "@/components/sections/service-section";

export const metadata: Metadata = {
  title: "Menorah Center | Еврейский общинный центр в Ришон ле-Ционе",
  description:
    "Еврейский общинный центр в Ришон ле-Ционе. Мероприятия, духовная поддержка, изучение Торы и услуги для всей семьи.",
  openGraph: {
    title: "Menorah Center | Ришон ле-Цион",
    description:
      "Еврейский общинный центр в Ришон ле-Ционе. Мероприятия, духовная поддержка, изучение Торы.",
    url: "https://menorah-rishon.com",
    images: [
      {
        url: "/public/seo/main.webp",
        width: 1200,
        height: 630,
        alt: "Menorah Center",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Menorah Center | Ришон ле-Цион",
    description: "Еврейский общинный центр в Ришон ле-Ционе.",
    images: ["/public/seo/main.webp"],
  },
};

export const revalidate = 60;

// Утилита для извлечения обложки из YouTube
const getYoutubeThumbnail = (url: string) => {
  if (!url)
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80";
  try {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([^?&/]+)/,
    );
    const id = match?.[1]?.length === 11 ? match[1] : null;
    return id
      ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80";
  } catch {
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80";
  }
};

export default async function Home() {
  const { userId } = await auth();

  // 1. ПАРАЛЛЕЛЬНО ЗАПРАШИВАЕМ 3 ТИПА ДАННЫХ
  const [allNews, eventsData, videosData] = await Promise.all([
    getPublicNews(),
    getPublicEventsPaginated(1, 3, null),
    getVideos(),
  ]);

  const upcomingEvents = eventsData?.events || [];
  const latestVideos = videosData || [];

  // 2. ФОРМИРУЕМ КАРТОЧКИ ДЛЯ КАРУСЕЛИ

  // А) Последнее событие (Синий цвет)
  const eventItem: CarouselItem | null =
    upcomingEvents.length > 0
      ? {
          type: "Событие",
          title: upcomingEvents[0].event.title,
          date: upcomingEvents[0].event.date
            ? new Date(upcomingEvents[0].event.date).toLocaleDateString(
                "ru-RU",
                { day: "numeric", month: "long" },
              )
            : "Дата уточняется",
          iconName: "calendar",
          color: "bg-indigo-500",
          image:
            upcomingEvents[0].event.imageUrl ||
            "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
          link: "/events",
        }
      : null;

  // Б) Последняя новость (Желтый цвет)
  const newsItem: CarouselItem | null =
    allNews.length > 0
      ? {
          type: "Новость",
          title: allNews[0].title,
          date: allNews[0].createdAt
            ? new Date(allNews[0].createdAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
              })
            : "Недавно",
          iconName: "newspaper",
          color: "bg-[#FFB800]",
          image:
            allNews[0].imageUrl ||
            "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
          link: `/news/${allNews[0].slug}`,
        }
      : null;

  // В) Последний видеоурок (Красный цвет)
  const videoItem: CarouselItem | null =
    latestVideos.length > 0
      ? {
          type: "Видеоурок",
          title: latestVideos[0].title,
          date: latestVideos[0].speaker || "Урок Торы",
          iconName: "youtube",
          color: "bg-red-500",
          image: getYoutubeThumbnail(latestVideos[0].link),
          link: "/lessons",
        }
      : null;

  // 3. СОБИРАЕМ 3 КАРТОЧКИ И ФИЛЬТРУЕМ ПУСТЫЕ (если в базе чего-то нет)
  const heroItems = [eventItem, newsItem, videoItem].filter(
    Boolean,
  ) as CarouselItem[];

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://menorah-rishon.com/#website",
                url: "https://menorah-rishon.com",
                name: "Menorah Center",
                description: "Еврейский общинный центр в Ришон ле-Ционе.",
                potentialAction: {
                  "@type": "SearchAction",
                  target:
                    "https://menorah-rishon.com/search?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "Organization",
                "@id": "https://menorah-rishon.com/#organization",
                name: "Menorah Center Ришон ле-Цион",
                url: "https://menorah-rishon.com",
                logo: "https://menorah-rishon.com/logo.png",
                sameAs: [
                  "https://t.me/menorah_rishon",
                  "https://www.instagram.com/menorah.center.rishon/?hl=en",
                ],
              },
            ],
          }),
        }}
      />

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
