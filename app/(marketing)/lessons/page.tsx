import { getVideos } from "@/actions/video";
import LessonsClient from "@/components/lessons/lessons-client";

export const metadata = {
  title: "Видеоуроки | Menorah Center Rishon Lezion",
  description:
    "Бесплатные видеоуроки, лекции и вебинары Menorah Center Rishon Lezion по Торе, хасидуту и еврейской жизни.",
};

// Делаем страницу динамической, чтобы новые видео появлялись сразу без пересборки сайта
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const videos = await getVideos();

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-28 pb-16 px-4 sm:px-6">
      {/* HERO-БЛОК */}
      <section className="max-w-7xl mx-auto w-full mb-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#FFB800]/20 blur-3xl rounded-full translate-x-24 -translate-y-24" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-500/10 blur-3xl rounded-full -translate-x-24 translate-y-24" />

          <div className="relative p-8 md:p-12 lg:p-14">
            <div className="max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#FFB800] mb-4">
                Menorah Center Rishon Lezion
              </p>

              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-neutral-950 dark:text-white mb-6">
                Видеоуроки, лекции и вебинары
              </h1>

              <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-3xl">
                Здесь собраны бесплатные материалы для тех, кто хочет глубже
                понимать Тору, хасидут, еврейские традиции и практическую
                духовную жизнь. Смотрите уроки прямо на сайте — без перехода на
                YouTube.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
              <div className="rounded-3xl bg-neutral-50/80 dark:bg-neutral-950/70 border border-neutral-200/60 dark:border-neutral-800/60 p-6">
                <h3 className="font-black text-neutral-950 dark:text-white mb-2">
                  Живые уроки Торы
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Понятные объяснения недельных глав, праздников, молитв и основ
                  еврейской жизни.
                </p>
              </div>

              <div className="rounded-3xl bg-neutral-50/80 dark:bg-neutral-950/70 border border-neutral-200/60 dark:border-neutral-800/60 p-6">
                <h3 className="font-black text-neutral-950 dark:text-white mb-2">
                  Хасидут и вдохновение
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Материалы, которые помогают видеть больше света, смысла и
                  внутренней силы в повседневной жизни.
                </p>
              </div>

              <div className="rounded-3xl bg-neutral-50/80 dark:bg-neutral-950/70 border border-neutral-200/60 dark:border-neutral-800/60 p-6">
                <h3 className="font-black text-neutral-950 dark:text-white mb-2">
                  Удобный просмотр
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Видео открываются прямо на странице во всплывающем окне, без
                  перехода на другие сайты.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LessonsClient initialVideos={videos ?? []} />
    </main>
  );
}
