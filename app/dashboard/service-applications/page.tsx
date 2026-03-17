import { getServices } from "@/actions/service";
import ServiceApplicationsClient from "@/components/dashboard/service/service-applications-client";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function ServiceApplicationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Проверка роли (только админы и суперадмины)
  const dbUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (
    !dbUser.length ||
    (dbUser[0].role !== "admin" && dbUser[0].role !== "superadmin")
  ) {
    redirect("/dashboard");
  }

  // Получаем список всех услуг для селекта в таблице
  const servicesData = await getServices();
  const allServices = servicesData.map((s) => s.service);

  return <ServiceApplicationsClient services={allServices} />;
}
