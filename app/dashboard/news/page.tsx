import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { news, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import AdminNewsClient from "@/components/dashboard/news/admin-news-client";

export default async function DashboardNewsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  // 🔥 Если это автор, принудительно отправляем его в Кабинет
  if (currentUser?.role === "author") {
    redirect("/dashboard/author-profile");
  }

  // Оставляем доступ только админам и суперадминам
  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "superadmin")
  ) {
    redirect("/dashboard");
  }

  // Админы видят все новости
  const initialNews = await db.query.news.findMany({
    orderBy: [desc(news.createdAt)],
  });

  // Получаем список всех авторов для админов (по наличию профиля)
  const fetchedProfiles = await db.query.authorProfiles.findMany({
    with: { user: true },
  });

  const authorsList = fetchedProfiles.map((profile) => ({
    id: profile.userId,
    name:
      `${profile.user?.firstName || ""} ${profile.user?.lastName || ""}`.trim() ||
      "Без имени",
  }));

  return (
    <AdminNewsClient
      initialNews={initialNews}
      authors={authorsList}
      currentUserRole={currentUser.role}
    />
  );
}
