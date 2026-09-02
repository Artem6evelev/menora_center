import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getEventById } from "@/actions/event";

// Подключаем новый единый клиентский компонент
import SingleEventClient from "@/components/events/single-event-client";

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

  // Получаем userId на сервере
  const { userId } = await auth();

  return <SingleEventClient eventData={eventData} userId={userId} />;
}
