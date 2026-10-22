import { requireDashboardFilter } from "@/lib/community/server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUsersPaginated } from "@/actions/user";
import Link from "next/link";
import CrmTableClient from "@/components/dashboard/users/crm-table.client";

export default async function CrmPage() {
  await requireDashboardFilter();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "superadmin")) {
    redirect("/dashboard");
  }

  // Грузим только 1-ю страницу при первой загрузке (остальное будет грузить клиент)
  const initialData = await getUsersPaginated(1, 20, "");

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/telegram"
        className="inline-block border rounded-xl px-4 py-3"
      >
        Telegram-аудитория и рассылки
      </Link>
      <CrmTableClient initialData={initialData} currentUserRole={dbUser.role} />
    </div>
  );
}
