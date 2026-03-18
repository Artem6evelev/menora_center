"use server";

import { db } from "@/lib/db";
import { users, events, news } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";

export async function getDashboardStats() {
  try {
    // 1. Считаем общее количество резидентов (пользователей)
    const totalUsers = await db.select({ value: count() }).from(users);

    // 2. Считаем количество опубликованных новостей
    const publishedNews = await db
      .select({ value: count() })
      .from(news)
      .where(eq(news.isPublished, true));

    // 3. Считаем количество событий (для примера берем все, но можно фильтровать по будущим)
    const totalEvents = await db.select({ value: count() }).from(events);

    // 4. Генерируем данные для красивого графика активности (пока моковые, потом привяжем к реальным заявкам)
    const activityData = [
      { name: "Пн", users: 4, events: 2 },
      { name: "Вт", users: 7, events: 3 },
      { name: "Ср", users: 5, events: 1 },
      { name: "Чт", users: 12, events: 5 },
      { name: "Пт", users: 15, events: 8 },
      { name: "Сб", users: 8, events: 4 },
      { name: "Вс", users: 10, events: 6 },
    ];

    return {
      users: totalUsers[0].value || 0,
      news: publishedNews[0].value || 0,
      events: totalEvents[0].value || 0,
      chartData: activityData,
    };
  } catch (error) {
    console.error("Ошибка при загрузке статистики:", error);
    return { users: 0, news: 0, events: 0, chartData: [] };
  }
}
