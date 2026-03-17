// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db"; // Проверь путь к твоему файлу инициализации БД
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

// Эта строка отключает кэширование, чтобы данные всегда были свежими
export const revalidate = 0;

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Делаем прямой запрос в Supabase через Drizzle
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  return (
    <div className="p-8">
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h1 className="text-2xl font-bold mb-2">Кабинет прихожанина</h1>
        <p className="text-gray-500">Управление профилем и семьей</p>
      </div>

      <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">
          Шалом, {user?.firstName || "друг"}!
        </h2>
        <div className="flex items-center gap-2">
          <span>Ваша текущая роль в системе:</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-bold ${
              user?.role === "superadmin"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {user?.role || "client"}
          </span>
        </div>
      </div>
    </div>
  );
}
