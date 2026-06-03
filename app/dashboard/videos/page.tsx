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

  // Если пользователя нет в базе или он не админ/суперадмин — выкидываем на главную панель
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "superadmin")) {
    redirect("/dashboard");
  }

  // Если проверки пройдены, получаем список видео из БД
  const videosList = await getVideos();

  return <AdminVideosClient initialVideos={videosList} />;
}
