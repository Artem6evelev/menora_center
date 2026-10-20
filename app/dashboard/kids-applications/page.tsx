import { requireDashboardFilter } from "@/lib/community/server";
// app/dashboard/kids-applications/page.tsx
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getKidsApplications } from "@/actions/kids.actions";
import KidsApplicationsClient from "@/components/dashboard/kids-applications/kids-applications-client";

export default async function KidsApplicationsPage() {
  await requireDashboardFilter();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
  const role =
    dbUser?.role;

  if (role !== "admin" && role !== "superadmin") {
    redirect("/dashboard");
  }

  // Получаем все заявки из БД через серверный экшен
  const initialData = await getKidsApplications();

  return <><a href="/dashboard/kids/manual" className="inline-block mb-6 rounded-2xl bg-[#FFB800] text-black px-5 py-3 font-bold">Ручная запись ребёнка</a><KidsApplicationsClient initialData={initialData} /></>;
}
