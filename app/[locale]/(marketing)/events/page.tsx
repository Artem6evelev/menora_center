import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Metadata } from "next";

// 🚀 LCP: Hero грузится мгновенно
import { EventsHero } from "@/components/event/events-hero";

// 🚀 PERFORMANCE: Ленивая загрузка рядов с карточками
const EventCategory = dynamic(() =>
  import("@/components/event/event-category").then((mod) => mod.EventCategory),
);
const CTA = dynamic(() => import("@/components/cta").then((mod) => mod.CTA));

export const metadata: Metadata = {
  title: "Афиша и Расписание | Menora Center",
  description:
    "Календарь еврейских праздников, мероприятий и регулярных уроков Торы в Ришон ле-Ционе.",
};

// Моковые данные (в будущем заменим на fetch из Supabase)
const specialEvents = [
  {
    id: "purim-2026",
    title: "Большой Пурим в Меноре",
    date: "3 Марта 2026",
    time: "19:00",
    location: "Menora Center, Главный зал",
    image: "/images/event-purim.webp", // Заглушка
    type: "Праздник",
    color: "bg-purple-100 text-purple-700",
  },
  {
    id: "shabbat-guest",
    title: "Шаббатон с Раввином Лазаром",
    date: "13 Марта 2026",
    time: "18:30",
    location: "Menora Center",
    image: "/images/event-shabbat.webp",
    type: "Шаббат",
    color: "bg-amber-100 text-amber-700",
  },
  {
    id: "youth-party",
    title: "Молодежный Авдала-Клуб",
    date: "14 Марта 2026",
    time: "21:00",
    location: "Крыша Менора Центра",
    image: "/images/event-youth.webp",
    type: "Молодежь",
    color: "bg-blue-100 text-blue-700",
  },
];

const regularLessons = [
  {
    id: "tanya",
    title: "Уроки Тании для начинающих",
    date: "Каждый Вторник",
    time: "19:30 - 20:30",
    location: "Библиотека / Zoom",
    image: "/images/event-tanya.webp",
    type: "Хасидизм",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    id: "parasha",
    title: "Недельная глава Торы",
    date: "Каждый Четверг",
    time: "19:00 - 20:00",
    location: "Главный зал",
    image: "/images/event-parasha.webp",
    type: "Тора",
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "womens-club",
    title: "Женский клуб: Хала и Традиции",
    date: "Среда (раз в 2 недели)",
    time: "10:30 - 12:00",
    location: "Кафетерий",
    image: "/images/event-womens-club.webp",
    type: "Женщинам",
    color: "bg-rose-100 text-rose-700",
  },
];

const SectionSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto h-[400px] animate-pulse bg-neutral-50 rounded-2xl mt-16" />
);

export default function EventsPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-white">
      <div className="relative z-10 w-full pb-20">
        {/* 1. Hero с календарем */}
        <EventsHero />

        {/* 2. Ряд 1: Мероприятия */}
        <Suspense fallback={<SectionSkeleton />}>
          <EventCategory
            title="Предстоящие события"
            description="Праздники, фарбрейнгены и масштабные встречи общины."
            events={specialEvents}
          />
        </Suspense>

        {/* 3. Ряд 2: Регулярные уроки */}
        <Suspense fallback={<SectionSkeleton />}>
          <EventCategory
            title="Регулярные уроки"
            description="Растите духовно каждый день. Присоединяйтесь к нашим постоянным классам."
            events={regularLessons}
          />
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
