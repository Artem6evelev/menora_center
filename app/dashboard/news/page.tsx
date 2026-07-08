// app/dashboard/news/page.tsx
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

  if (
    !currentUser ||
    (currentUser.role !== "admin" &&
      currentUser.role !== "superadmin" &&
      currentUser.role !== "author")
  ) {
    redirect("/dashboard");
  }

  // Получаем список новостей
  // Если это автор, показываем только ЕГО статьи. Если админ - все.
  let initialNews;
  if (currentUser.role === "author") {
    initialNews = await db.query.news.findMany({
      where: eq(news.authorId, userId),
      orderBy: [desc(news.createdAt)],
    });
  } else {
    initialNews = await db.query.news.findMany({
      orderBy: [desc(news.createdAt)],
    });
  }

  // Получаем список всех авторов (ТОЛЬКО ДЛЯ АДМИНА)
  let authorsList: { id: string; name: string }[] = [];
  if (currentUser.role === "admin" || currentUser.role === "superadmin") {
    const fetchedAuthors = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.role, "author"));

    authorsList = fetchedAuthors.map((a) => ({
      id: a.id,
      name: `${a.firstName || ""} ${a.lastName || ""}`.trim() || "Без имени",
    }));
  }

  return (
    <AdminNewsClient
      initialNews={initialNews}
      authors={authorsList}
      currentUserRole={currentUser.role}
    />
  );
}
