// app/(marketing)/events/[id]/page.tsx// app/(marketing)/events/[id]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { getEventById } from "@/actions/event";
import { Calendar } from "lucide-react";
// Импортируем наш новый клиентский компонент с кнопками:
import SingleEventActions from "@/components/events/single-event-action";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const eventData = await getEventById(resolvedParams.id);

  if (!eventData) {
    return { title: "Событие не найдено" };
  }

  const fallbackDescription =
    "Присоединяйтесь к нашему мероприятию в Menorah Center.";
  const description = eventData.description || fallbackDescription;
  const title = eventData.title || "Событие";

  return {
    title: `${title} | Menorah Center`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [eventData.imageUrl || "/og-default.jpg"],
    },
  };
}

export default async function SingleEventPage({ params }: Props) {
  const resolvedParams = await params;
  const eventData = await getEventById(resolvedParams.id);

  if (!eventData) {
    notFound();
  }

  // Получаем userId на сервере через Clerk
  const { userId } = await auth();

  const title = eventData.title || "Без названия";

  const formattedDate = eventData.date
    ? new Date(eventData.date).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      }) + (eventData.time ? `, ${eventData.time}` : "")
    : "Дата не указана";

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="bg-white dark:bg-neutral-900 rounded-[32px] shadow-xl overflow-hidden border border-neutral-200 flex flex-col md:flex-row">
          {/* Левая часть: Картинка (адаптивная, как в модалке) */}
          <div className="w-full md:w-[45%] lg:w-[40%] bg-neutral-50 p-6 md:p-10 flex items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-neutral-100 relative overflow-hidden">
            <Image
              src={eventData.imageUrl || "/default-event-poster.png"}
              alt={title}
              fill
              className="object-cover opacity-30 blur-2xl scale-110"
            />
            <div className="relative z-10 w-full h-[35vh] md:h-[60vh] max-h-[500px]">
              <Image
                src={eventData.imageUrl || "/default-event-poster.png"}
                alt={title}
                fill
                className="object-contain drop-shadow-2xl rounded-2xl"
              />
            </div>
          </div>

          {/* Правая часть: Контент */}
          <div className="w-full md:w-[55%] lg:w-[60%] flex flex-col p-6 md:p-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest mb-4 border border-orange-100">
                <Calendar size={14} />
                <span>{formattedDate}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black mb-6 tracking-tighter text-neutral-900">
                {title}
              </h1>

              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-4 mt-8">
                О мероприятии
              </h3>

              <p className="text-neutral-600 leading-relaxed font-medium whitespace-pre-wrap">
                {eventData.description || "Описание пока не добавлено."}
              </p>
            </div>

            {/* Вставляем наши интерактивные кнопки! */}
            <SingleEventActions event={eventData} userId={userId} />
          </div>
        </div>
      </div>
    </main>
  );
}
