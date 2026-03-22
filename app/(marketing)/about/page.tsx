import React from "react";
import {
  Star,
  BookHeart,
  Sparkles,
  ShieldCheck,
  Users,
  HeartHandshake,
} from "lucide-react";

export const metadata = {
  title: "О нас | Menorah Center",
  description:
    "Познакомьтесь с командой и духовными наставниками нашей общины.",
};

export default function AboutPage() {
  // Массив нашей команды
  const team = [
    {
      name: "Рав Алекс и Ента",
      role: "Раввин общины и ребецн",
      description:
        "Духовные лидеры нашей общины. Хранители традиций, к которым всегда можно обратиться за советом, поддержкой и мудростью.",
      icon: Star,
      // Вставь сюда прямую ссылку на их фото
      image:
        "https://images.unsplash.com/photo-1544723795-3ca315cadc20?w=500&q=80",
    },
    {
      name: "Рав Гай и Марина",
      role: "Коэн общины и его супруга",
      description:
        "Несут в общину свет благословения коэнов. Помогают в организации духовной жизни и поддержании теплой семейной атмосферы.",
      icon: Sparkles,
      image:
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&q=80",
    },
    {
      name: "Рав Элияу",
      role: "Преподаватель Тании",
      description:
        "Глубокий мыслитель и потрясающий учитель. На его уроках хасидизма и книги Тания раскрываются самые сокровенные тайны Торы.",
      icon: BookHeart,
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80",
    },
    {
      name: "Хана Зельцер",
      role: "Блогер, лектор женских уроков",
      description:
        "Вдохновляющий спикер и автор. Ведет популярные женские программы, объединяя современный мир и вечные еврейские ценности.",
      icon: Users,
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80",
    },
    {
      name: "Бася",
      role: "Администратор",
      description:
        "Сердце нашего центра. Человек, который знает ответы на все вопросы, координирует расписание и заботится о том, чтобы всем было комфортно.",
      icon: ShieldCheck,
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80",
    },
    {
      name: "Марк",
      role: "Координатор общины",
      description:
        "Следит за тем, чтобы все проекты, мероприятия и технические процессы в Menorah Center работали как швейцарские часы.",
      icon: HeartHandshake,
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&q=80",
    },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20 relative overflow-hidden">
      {/* Фоновая сетка */}
      <div className="absolute inset-0 h-full w-full bg-white dark:bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Заголовок */}
        <div className="flex flex-col items-center text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <span>Кто мы</span>
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

        {/* Сетка Команды */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((person, idx) => {
            const Icon = person.icon;
            return (
              <div
                key={idx}
                className="group bg-white dark:bg-neutral-900 rounded-[32px] p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
              >
                {/* Фото */}
                <div className="w-full h-64 rounded-2xl overflow-hidden mb-6 relative bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={person.image}
                    alt={person.name}
                    className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                  {/* Иконка роли (поверх фото) */}
                  <div className="absolute top-4 right-4 w-10 h-10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md rounded-xl flex items-center justify-center text-[#FFB800] shadow-lg">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                </div>

                {/* Инфо */}
                <div className="px-4 pb-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] mb-2">
                    {person.role}
                  </div>
                  <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight group-hover:text-[#FFB800] transition-colors">
                    {person.name}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                    {person.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
