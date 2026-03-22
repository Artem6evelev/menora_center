import { MetadataRoute } from "next";
import { getPublicNews } from "@/actions/news";
import { getPublicEventsPaginated } from "@/actions/event";
// Если у услуг есть отдельные страницы (например /services/[id]),
// можно импортировать и их экшен. Пока берем новости и события.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Базовый URL берем из переменных окружения или ставим хардкод для продакшена
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://menorah-rishon.com";

  // 1. СТАТИЧЕСКИЕ СТРАНИЦЫ
  // Это основные разделы сайта, они имеют самый высокий приоритет
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    // 2. ДИНАМИЧЕСКИЕ СТРАНИЦЫ ИЗ БАЗЫ ДАННЫХ (Параллельный запрос для скорости)
    const [newsData, eventsData] = await Promise.all([
      getPublicNews(),
      getPublicEventsPaginated(1, 100, null), // Берем до 100 актуальных событий
    ]);

    // Генерируем ссылки для каждой отдельной новости
    const dynamicNewsRoutes: MetadataRoute.Sitemap = newsData.map(
      (newsItem) => ({
        url: `${baseUrl}/news/${newsItem.slug}`,
        // Если есть дата обновления - берем её, если нет - дату создания
        lastModified: newsItem.updatedAt
          ? new Date(newsItem.updatedAt)
          : new Date(newsItem.createdAt),
        changeFrequency: "weekly",
        priority: 0.7, // Приоритет чуть ниже главных страниц, но высокий
      }),
    );

    // Генерируем ссылки для каждого отдельного мероприятия
    const dynamicEventRoutes: MetadataRoute.Sitemap = (
      eventsData?.events || []
    ).map(({ event }) => ({
      url: `${baseUrl}/events/${event.id}`,
      // ИСПРАВЛЕНИЕ: Проверяем, есть ли event.date, прежде чем передавать в new Date()
      lastModified: event.date ? new Date(event.date) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    // Объединяем статику и динамику в один массив
    return [...staticRoutes, ...dynamicNewsRoutes, ...dynamicEventRoutes];
  } catch (error) {
    console.error("Ошибка генерации Sitemap:", error);
    // Если база данных недоступна, возвращаем хотя бы статические страницы (чтобы SEO не упало)
    return staticRoutes;
  }
}
