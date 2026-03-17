import { getServices, getServiceCategories } from "@/actions/service";
import ServicesClient from "@/components/dashboard/service/service-client";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function ServicesPage() {
  const servicesData = await getServices();
  const categories = await getServiceCategories();
  const { userId } = await auth();

  const dbUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId!))
    .limit(1);
  const isAdmin =
    dbUser[0]?.role === "admin" || dbUser[0]?.role === "superadmin";

  return (
    <ServicesClient
      initialServices={servicesData}
      categories={categories}
      isAdmin={isAdmin}
    />
  );
}
