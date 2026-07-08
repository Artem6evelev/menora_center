// app/dashboard/authors/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAdminAuthorsList } from "@/actions/authors.actions";
import AdminAuthorsClient from "@/components/dashboard/authors/admin-authors-client";

export default async function AdminAuthorsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // === ПРОВЕРКА ПРАВ ДОСТУПА ===
  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));

  // Пускаем сюда только админов и суперадминов
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "superadmin")) {
    redirect("/dashboard");
  }

  const authorsList = await getAdminAuthorsList();

  return <AdminAuthorsClient authors={authorsList} />;
}
