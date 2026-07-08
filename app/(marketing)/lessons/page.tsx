// app/lessons/page.tsx
import { getVideos } from "@/actions/video";
import LessonsClient from "@/components/lessons/lessons-client";

export const metadata = {
  title: "Видеоуроки | Menorah Center Rishon Lezion",
  description:
    "Бесплатные видеоуроки, лекции и вебинары Menorah Center Rishon Lezion по Торе, хасидуту и еврейской жизни.",
};

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const videos = await getVideos();

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20 relative overflow-hidden">
      {/* Фоновая сетка (как на странице мероприятий) */}
      <div className="absolute inset-0 h-full w-full bg-white dark:bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        {/* ЦЕНТРИРОВАННЫЙ ЗАГОЛОВОК */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <span>Библиотека знаний</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-neutral-900 dark:text-white tracking-tighter mb-6">
            Наши{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              Видеоуроки
            </span>
          </h1>

          <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium max-w-2xl leading-relaxed">
            Бесплатные видеоуроки, лекции и вебинары по Торе, хасидуту и
            еврейской жизни. Выберите видео из списка ниже и смотрите прямо на
            сайте.
          </p>
        </div>

        <LessonsClient initialVideos={videos ?? []} />
      </div>
    </main>
  );
}
