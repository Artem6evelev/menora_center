import { getLatestEvents } from "@/actions/event";
import PublicEventCard from "../events/public-event-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export async function EventsSection() {
  // 1. Получаем 4 последних актуальных события из базы
  const latestEvents = await getLatestEvents();

  // 2. Получаем ID текущего пользователя (чтобы карточка знала, залогинен ли он)
  // ВНИМАНИЕ: Подставь сюда свою функцию авторизации.
  // Если у тебя Clerk: const { userId } = auth();
  // Если Supabase/NextAuth: получи сессию и достань ID.
  const userId = null; // <--- ЗАМЕНИ НА РЕАЛЬНЫЙ ID ЮЗЕРА

  // Если событий пока нет вообще, просто не показываем эту секцию
  if (latestEvents.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-20 z-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Предстоящие события
          </h2>
          <p className="text-gray-600 max-w-2xl text-lg">
            Присоединяйтесь к нашим ближайшим мероприятиям, урокам и праздникам
            общины.
          </p>
        </div>

        <Link
          href="/events"
          className="hidden md:flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors bg-indigo-50 px-5 py-2.5 rounded-full hover:bg-indigo-100"
        >
          Смотреть все <ArrowRight size={18} />
        </Link>
      </div>

      {/* Сетка из 4 карточек */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {latestEvents.map((item) => (
          <PublicEventCard key={item.event.id} item={item} userId={userId} />
        ))}
      </div>

      {/* Кнопка "Смотреть все" для мобильных устройств (внизу) */}
      <div className="mt-8 flex justify-center md:hidden w-full">
        <Link
          href="/events"
          className="flex items-center justify-center gap-2 text-indigo-600 font-medium transition-colors bg-indigo-50 px-6 py-3 rounded-xl w-full"
        >
          Смотреть все <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
