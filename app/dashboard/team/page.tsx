import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAllUsers } from "@/actions/user";
import TeamTable from "@/components/dashboard/team-table";
import { Users } from "lucide-react";

export const revalidate = 0;

export default async function TeamPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Проверка безопасности: только superadmin может видеть список команды
  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (currentUser?.role !== "superadmin") {
    redirect("/dashboard");
  }

  // Получаем всех пользователей через наш серверный action
  const initialUsers = await getAllUsers();

  return (
    <div className="max-w-7xl mx-auto w-full pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
            Управление{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              Командой
            </span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2 text-lg">
            Назначайте администраторов и управляйте доступом к системе.
          </p>
        </div>

        {/* Премиальный счетчик пользователей */}
        <div className="inline-flex items-center gap-3 bg-[#FFB800]/10 dark:bg-[#FFB800]/5 px-5 py-3.5 rounded-2xl border border-[#FFB800]/20 shadow-sm shrink-0">
          <Users size={20} strokeWidth={2.5} className="text-[#FFB800]" />
          <span className="text-neutral-900 dark:text-white font-black uppercase tracking-widest text-xs">
            Всего пользователей: {initialUsers.length}
          </span>
        </div>
      </div>

      {/* Наша быстрая таблица на Zustand */}
      <TeamTable initialUsers={initialUsers} currentUserId={userId} />
    </div>
  );
}
