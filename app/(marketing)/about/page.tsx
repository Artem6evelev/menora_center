import { Metadata } from "next";
import { TeamGrid } from "./team-grid";

export const metadata: Metadata = {
  title: "О нас",
  description:
    "Познакомьтесь с командой и духовными наставниками нашей общины Menorah Center. Люди, которые каждый день создают атмосферу тепла и принятия.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20 relative overflow-hidden">
      {/* JSON-LD Schema для страницы "О нас" и Команды */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            mainEntity: {
              "@type": "Organization",
              name: "Menorah Center",
              employee: [
                {
                  "@type": "Person",
                  name: "Рав Алекс и Ента",
                  jobTitle: "Раввин общины и ребецн",
                },
                {
                  "@type": "Person",
                  name: "Рав Гай и Марина",
                  jobTitle: "Коэн общины",
                },
                {
                  "@type": "Person",
                  name: "Рав Элияу",
                  jobTitle: "Преподаватель Тании",
                },
                { "@type": "Person", name: "Хана Зельцер", jobTitle: "Лектор" },
                { "@type": "Person", name: "Бася", jobTitle: "Администратор" },
                {
                  "@type": "Person",
                  name: "Марк",
                  jobTitle: "Координатор общины",
                },
              ],
            },
          }),
        }}
      />

      {/* Фоновая сетка */}
      <div className="absolute inset-0 h-full w-full bg-white dark:bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Заголовок */}
        <div className="flex flex-col items-center text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-[#FFB800] animate-pulse" />
            Кто мы
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-neutral-900 dark:text-white tracking-tighter mb-6">
            Люди{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              Menorah Center
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
            Наша община — это не просто стены, это большая семья. Познакомьтесь
            с теми, кто каждый день вкладывает душу в развитие нашего центра,
            передает знания и создает атмосферу тепла и принятия.
          </p>
        </div>

        {/* Интерактивная Сетка Команды (Client Component) */}
        <TeamGrid />
      </div>
    </main>
  );
}
