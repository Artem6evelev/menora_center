import { getLatestEvents } from "@/actions/event";
import PublicEventCard from "../events/public-event-card";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { auth } from "@clerk/nextjs/server"; // Импортируем Clerk

export async function EventsSection() {
  // 1. Получаем 4 последних актуальных события из базы
  const latestEvents = await getLatestEvents();

  // 2. Получаем реальный ID текущего пользователя через Clerk
  const { userId } = await auth();

  // Если событий пока нет вообще, просто не показываем эту секцию
  if (!latestEvents || latestEvents.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Шапка секции */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="max-w-2xl">
            {/* Стильный бейджик сверху */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 text-[10px] font-black uppercase tracking-widest mb-6">
              <CalendarDays size={14} />
              <span>Афиша общины</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tighter mb-4 leading-tight">
              Предстоящие <span className="text-neutral-400">события</span>
            </h2>
            <p className="text-neutral-500 text-lg font-medium leading-relaxed">
              Присоединяйтесь к нашим ближайшим мероприятиям, урокам и
              праздникам. Мы всегда рады видеть вас.
            </p>
          </div>

          {/* Десктопная кнопка (стиль Outline) */}
          <Link
            href="/events"
            className="hidden md:flex items-center gap-2 text-neutral-900 font-bold bg-white border-2 border-neutral-200 px-6 py-3 rounded-full hover:border-neutral-900 hover:bg-neutral-50 transition-all active:scale-95 shadow-sm"
          >
            Все события <ArrowRight size={18} />
          </Link>
        </div>

        {/* Сетка из 4 карточек */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestEvents.map((item) => (
            <PublicEventCard key={item.event.id} item={item} userId={userId} />
          ))}
        </div>

        {/* Мобильная кнопка (внизу, широкая) */}
        <div className="mt-10 flex justify-center md:hidden w-full">
          <Link
            href="/events"
            className="flex items-center justify-center gap-2 text-neutral-900 font-bold bg-white border-2 border-neutral-200 px-6 py-4 rounded-2xl w-full hover:border-neutral-900 active:scale-95 transition-all shadow-sm"
          >
            Смотреть все события <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
