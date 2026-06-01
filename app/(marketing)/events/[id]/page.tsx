// app/(marketing)/events/[id]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getEventById } from "@/actions/event";

// 1. ИСПРАВЛЕНИЕ: Теперь params — это Promise
interface Props {
  params: Promise<{ id: string }>;
}

// 2. ГЕНЕРАЦИЯ МЕТАДАННЫХ ДЛЯ TELEGRAM/WHATSAPP
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // 3. ИСПРАВЛЕНИЕ: Обязательно "ждем" параметры перед использованием
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

// 4. САМА СТРАНИЦА СОБЫТИЯ
export default async function SingleEventPage({ params }: Props) {
  // 5. ИСПРАВЛЕНИЕ: Здесь тоже "ждем" параметры
  const resolvedParams = await params;
  const eventData = await getEventById(resolvedParams.id);

  if (!eventData) {
    notFound(); // Покажет страницу 404, если такого ID нет
  }

  const title = eventData.title || "Без названия";

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl overflow-hidden border border-neutral-200">
          <div className="relative h-[400px] w-full bg-neutral-100">
            <Image
              src={eventData.imageUrl || "/default-event-poster.png"}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">{title}</h1>
            <p className="text-neutral-600 whitespace-pre-wrap">
              {eventData.description || "Описание пока не добавлено."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
