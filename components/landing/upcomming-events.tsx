import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import PublicEventCard from "@/components/events/public-event-card";
import { index } from "drizzle-orm/gel-core";

export const UpcomingEvents = ({
  events,
  userId,
}: {
  events: any[];
  userId: string | null;
}) => {
  if (!events || events.length === 0) return null;

  return (
    <section className="py-24 relative bg-white dark:bg-neutral-900/30 border-t border-neutral-100 dark:border-neutral-800/50 w-full">
      {/* ВОТ ЗДЕСЬ ШИРИНА КАК У HERO */}
      <div className="max-w-[1440px] w-full mx-auto px-6 md:px-10">
        {/* Шапка секции */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-black uppercase tracking-widest text-[#FFB800] mb-4 shadow-sm">
              <CalendarDays size={14} />
              Афиша
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
              Ближайшие события
            </h2>
          </div>

          <Link
            href="/events"
            className="group flex items-center gap-3 text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Все мероприятия
            <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center group-hover:bg-[#FFB800] group-hover:border-[#FFB800] group-hover:text-black transition-all shadow-sm">
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </Link>
        </div>

        {/* Сетка событий */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {events.map((event) => (
            <PublicEventCard
              key={event?.id || index} // <-- Добавили fallback на index
              item={event}
              userId={userId}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
