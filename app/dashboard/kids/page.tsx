import { requireDashboardFilter } from "@/lib/community/server";
import { profileChildren } from "@/lib/community/children";
// app/dashboard/kids/page.tsx
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, kidsApplications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import KidsDashboardClient from "@/components/dashboard/kids/kids-dashboard-client";

export default async function DashboardKidsPage() {
  await requireDashboardFilter();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Получаем профиль родителя (включая массив детей)
  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
  if (!dbUser) redirect("/dashboard");

  // Получаем активные заявки, чтобы показать статус "Вы уже записаны"
  const myApplications = await db
    .select()
    .from(kidsApplications)
    .where(eq(kidsApplications.userId, userId));

  return <KidsDashboardClient user={{ ...dbUser, childrenData: profileChildren(userId, dbUser.childrenData) }} applications={myApplications} />;
}
