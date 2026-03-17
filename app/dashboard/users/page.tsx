import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUsersPaginated } from "@/actions/user"; // <-- Изменили название функции
import CrmTableClient from "@/components/dashboard/users/crm-table.client";

export default async function CrmPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "superadmin")) {
    redirect("/dashboard");
  }

  // Грузим только 1-ю страницу при первой загрузке (остальное будет грузить клиент)
  const initialData = await getUsersPaginated(1, 20, "");

  return <CrmTableClient initialData={initialData} />;
}
