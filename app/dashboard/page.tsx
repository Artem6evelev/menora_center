import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Trello,
  Calendar,
  ShieldCheck,
  Ticket,
  HeartHandshake,
  Briefcase,
  MessageSquare,
  ClipboardList,
  ArrowUpRight,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ИМПОРТИРУЕМ НАШИ НОВЫЕ ГРАФИКИ И ЭКШЕН
import { getDashboardStats } from "@/actions/dashboard";
import DashboardClient from "@/components/dashboard/dashboard-client";

export const revalidate = 0;

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
  const role = dbUser?.role || "client";

  // Проверяем, является ли пользователь администратором
  const isAdmin = role === "superadmin" || role === "admin";

  // Загружаем статистику ТОЛЬКО если это админ (чтобы не грузить базу для обычных клиентов)
  let stats = null;
  if (isAdmin) {
    stats = await getDashboardStats();
  }

  // Массив всех разделов системы
  const sections = [
    {
      title: "События Общины",
      description:
        "Афиша мероприятий, праздников и встреч. Будьте в центре событий.",
      icon: Calendar,
      href: "/dashboard/events",
      roles: ["client", "admin", "superadmin"],
      span: "col-span-1 md:col-span-2", // Широкая карточка
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Мои Билеты",
      description: "Ваши бронирования и билеты на мероприятия.",
      icon: Ticket,
      href: "/dashboard/my-events",
      roles: ["client", "admin", "superadmin"],
      span: "col-span-1",
      color: "text-[#FFB800]",
      bg: "bg-[#FFB800]/10",
    },
    {
      title: "Услуги",
      description: "Запись на консультации, помощь и сервисы общины.",
      icon: HeartHandshake,
      href: "/dashboard/services",
      roles: ["client", "admin", "superadmin"],
      span: "col-span-1 md:col-span-2", // Широкая карточка
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      title: "Мои Услуги",
      description: "Статус ваших активных заявок.",
      icon: Briefcase,
      href: "/dashboard/my-services",
      roles: ["client", "admin", "superadmin"],
      span: "col-span-1",
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
    {
      title: "Сообщения",
      description: "Связь с администрацией и поддержка.",
      icon: MessageSquare,
      href: "/dashboard/chat",
      roles: ["client", "admin", "superadmin"],
      span: "col-span-1 md:col-span-3", // Очень широкая карточка на всю строку
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    // --- АДМИН ПАНЕЛЬ ---
    {
      title: "Канбан-доска",
      description: "Управление задачами и организация мероприятий.",
      icon: Trello,
      href: "/dashboard/kanban",
      roles: ["admin", "superadmin"],
      span: "col-span-1 md:col-span-2",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      isAdmin: true,
    },
    {
      title: "Заявки",
      description: "Обработка входящих запросов.",
      icon: ClipboardList,
      href: "/dashboard/applications",
      roles: ["admin", "superadmin"],
      span: "col-span-1",
      color: "text-teal-500",
      bg: "bg-teal-500/10",
      isAdmin: true,
    },
    {
      title: "Пользователи",
      description: "База данных клиентов.",
      icon: UsersRound,
      href: "/dashboard/users",
      roles: ["admin", "superadmin"],
      span: "col-span-1",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      isAdmin: true,
    },
    {
      title: "Команда",
      description: "Управление администраторами и ролями.",
      icon: Users,
      href: "/dashboard/team",
      roles: ["superadmin"],
      span: "col-span-1 md:col-span-2",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      isAdmin: true,
    },
  ];

  // Фильтруем то, что можно видеть пользователю
  const visibleSections = sections.filter((s) => s.roles.includes(role));

  return (
    <div className="max-w-7xl mx-auto w-full pb-12">
      {/* ПРИВЕТСТВЕННЫЙ БЛОК (HERO) */}
      <div className="relative overflow-hidden bg-neutral-900 dark:bg-neutral-950 rounded-[32px] p-8 md:p-12 text-white shadow-2xl mb-10 border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Ацетернити-сетка на фоне героя */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,184,0,0.15)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 w-full">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFB800] mb-6">
            Menora Center CRM
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tighter leading-tight">
            Шалом, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              {dbUser?.firstName || "друг"}!
            </span>
          </h1>

          <p className="text-neutral-400 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
            Добро пожаловать в единую систему управления общиной. Выберите
            нужный раздел для начала работы.
          </p>
        </div>

        {/* Блок роли внутри Hero (Компактный) */}
        <div className="relative z-10 shrink-0 bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-[24px] flex items-center gap-5 w-full md:w-auto">
          <div className="w-12 h-12 bg-[#FFB800]/20 rounded-full flex items-center justify-center text-[#FFB800]">
            <ShieldCheck size={24} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">
              Ваша роль
            </div>
            <div className="text-2xl font-black capitalize tracking-tight">
              {role}
            </div>
          </div>
        </div>
      </div>

      {/* АНАЛИТИКА И ГРАФИКИ (Отображаются только для администраторов) */}
      {isAdmin && stats && (
        <div className="mb-12">
          <DashboardClient stats={stats} />
        </div>
      )}

      {/* ЗАГОЛОВОК ДЛЯ РАЗДЕЛОВ (Разделяем визуально) */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-2 h-8 bg-[#FFB800] rounded-r-full" />
        <h2 className="text-3xl font-black tracking-tighter text-neutral-900 dark:text-white">
          Разделы системы
        </h2>
      </div>

      {/* BENTO GRID (СЕТКА РАЗДЕЛОВ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleSections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <Link
              key={idx}
              href={section.href}
              className={cn(
                "group relative bg-white dark:bg-neutral-900 p-8 rounded-[32px] border border-neutral-200/60 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col",
                section.span,
                section.isAdmin ? "bg-neutral-50 dark:bg-neutral-950/50" : "", // Админские панели чуть темнее
              )}
            >
              {/* Фоновый градиент при наведении */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div
                  className={cn(
                    "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 transition-colors",
                    section.bg,
                  )}
                />
              </div>

              {/* Иконка и стрелочка */}
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-500",
                    section.bg,
                    section.color,
                    "group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black",
                  )}
                >
                  <Icon size={28} strokeWidth={1.5} />
                </div>

                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 group-hover:bg-[#FFB800] group-hover:text-black">
                  <ArrowUpRight size={20} strokeWidth={2.5} />
                </div>
              </div>

              {/* Текст */}
              <div className="relative z-10 flex-1 flex flex-col">
                {section.isAdmin && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">
                    Управление
                  </span>
                )}
                <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-2 tracking-tight group-hover:text-[#FFB800] transition-colors duration-300">
                  {section.title}
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed mt-auto">
                  {section.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
