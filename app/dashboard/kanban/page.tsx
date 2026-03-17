import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAllTasks } from "@/actions/task";
import { getAllUsers } from "@/actions/user";
import KanbanBoard from "@/components/dashboard/kanban/kanban-board";
import { Trello } from "lucide-react";

export const revalidate = 0;

export default async function KanbanPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (currentUser?.role !== "superadmin" && currentUser?.role !== "admin") {
    redirect("/dashboard");
  }

  const initialTasks = await getAllTasks();

  const allUsers = await getAllUsers();
  // Фильтруем команду (только админы и суперадмины могут получать задачи)
  const teamMembers = allUsers.filter(
    (u) => u.role === "admin" || u.role === "superadmin",
  );

  return (
    // Используем max-w-[1600px], чтобы доске было куда расти на больших экранах,
    // и жестко фиксируем высоту, чтобы скроллились только колонки внутри
    <div className="max-w-[1600px] mx-auto w-full h-[calc(100vh-100px)] flex flex-col pb-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-white tracking-tighter">
            Канбан{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              Доска
            </span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-1 text-sm md:text-base">
            Управление процессами, поручениями и подготовкой к мероприятиям.
          </p>
        </div>

        {/* Премиальный бейдж */}
        <div className="hidden sm:inline-flex items-center gap-2.5 bg-[#FFB800]/10 dark:bg-[#FFB800]/5 px-4 py-2.5 rounded-xl border border-[#FFB800]/20 shadow-sm shrink-0">
          <Trello size={18} strokeWidth={2.5} className="text-[#FFB800]" />
          <span className="text-neutral-900 dark:text-white font-black uppercase tracking-widest text-[10px]">
            Рабочее пространство
          </span>
        </div>
      </div>

      {/* KANBAN BOARD CONTAINER */}
      <div className="flex-1 overflow-hidden relative">
        <KanbanBoard
          initialTasks={initialTasks}
          currentUserId={userId}
          userRole={currentUser?.role}
          initialTeamMembers={teamMembers}
        />
      </div>
    </div>
  );
}
