// app/dashboard/videos/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getVideos } from "@/actions/video";
import AdminVideosClient from "@/components/dashboard/admin-videos-client";

export default async function AdminVideosPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // === ПРОВЕРКА ПРАВ ДОСТУПА ===
  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));

  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "superadmin")) {
    redirect("/dashboard");
  }

  // 1. Получаем список всех видео
  const videosList = await getVideos();

  // 2. 🔥 Получаем список всех авторов (спикеров/раввинов)
  const authorsData = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.role, "author"));

  // Форматируем список авторов для селектора
  const authorsList = authorsData.map((a) => ({
    id: a.id,
    name: `${a.firstName || ""} ${a.lastName || ""}`.trim() || "Без имени",
  }));

  return <AdminVideosClient initialVideos={videosList} authors={authorsList} />;
}
