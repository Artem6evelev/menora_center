"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Trello,
  Calendar,
  LogOut,
  Ticket,
  ClipboardList,
  HeartHandshake,
  MessageSquare,
  Briefcase,
  UsersRound,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Автоматически закрываем меню на мобилках при переходе по ссылке
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Блокируем скролл страницы, когда мобильное меню открыто
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const routes = [
    {
      label: "Мой кабинет",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
      roles: ["superadmin", "admin", "client"],
    },
    {
      label: "Команда",
      icon: Users,
      href: "/dashboard/team",
      active: pathname === "/dashboard/team",
      roles: ["superadmin"],
    },
    {
      label: "Канбан-доска",
      icon: Trello,
      href: "/dashboard/kanban",
      active: pathname === "/dashboard/kanban",
      roles: ["superadmin", "admin"],
    },
    {
      label: "События",
      icon: Calendar,
      href: "/dashboard/events",
      active: pathname === "/dashboard/events",
      roles: ["superadmin", "admin", "client"],
    },
    {
      label: "Мои события",
      icon: Ticket,
      href: "/dashboard/my-events",
      active: pathname === "/dashboard/my-events",
      roles: ["superadmin", "admin", "client"],
    },
    {
      label: "Заявки",
      icon: ClipboardList,
      href: "/dashboard/applications",
      active: pathname === "/dashboard/applications",
      roles: ["superadmin", "admin"],
    },
    {
      label: "Услуги",
      icon: HeartHandshake,
      href: "/dashboard/services",
      active: pathname === "/dashboard/services",
      roles: ["superadmin", "admin", "client"],
    },
    {
      label: "Мои услуги",
      icon: Briefcase,
      href: "/dashboard/my-services",
      active: pathname === "/dashboard/my-services",
      roles: ["superadmin", "admin", "client"],
    },
    {
      label: "Пользователи",
      icon: UsersRound,
      href: "/dashboard/users",
      active: pathname === "/dashboard/users",
      roles: ["superadmin", "admin"],
    },
    {
      label: "Сообщения",
      icon: MessageSquare,
      href: "/dashboard/chat",
      active: pathname === "/dashboard/chat",
      roles: ["client", "admin", "superadmin"],
    },
  ];

  const filteredRoutes = routes.filter((route) =>
    route.roles.includes(userRole),
  );

  return (
    <>
      {/* Кнопка открытия меню (гамбургер) — ВИДНА ТОЛЬКО НА МОБИЛКАХ */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2.5 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl shadow-lg text-neutral-700 dark:text-neutral-200 hover:text-[#FFB800] dark:hover:text-[#FFB800] transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* Затемнение фона при открытом меню на мобилках */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[65]"
          />
        )}
      </AnimatePresence>

      {/* САМ САЙДБАР */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[70] w-[280px] bg-white/95 dark:bg-neutral-950/95 backdrop-blur-2xl border-r border-neutral-200/50 dark:border-neutral-800/50 flex flex-col shadow-2xl lg:shadow-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full", // Прячем на мобилках, если закрыт
        )}
      >
        {/* Шапка сайдбара */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <Link href="/" className="flex flex-col">
            <span className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter leading-none">
              Menora
            </span>
            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500 uppercase tracking-[0.2em] mt-1">
              Center CRM
            </span>
          </Link>

          {/* Кнопка закрытия (крестик) — ВИДНА ТОЛЬКО НА МОБИЛКАХ внутри меню */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-neutral-400 hover:text-red-500 bg-neutral-100 dark:bg-neutral-900 rounded-full transition-colors active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Роль пользователя (бейдж) */}
        <div className="px-8 pb-6">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div
              className={cn(
                "w-2 h-2 rounded-full mr-2 shadow-sm",
                userRole === "superadmin"
                  ? "bg-purple-500 shadow-purple-500/50"
                  : userRole === "admin"
                    ? "bg-blue-500 shadow-blue-500/50"
                    : "bg-[#FFB800] shadow-[#FFB800]/50",
              )}
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              {userRole}
            </span>
          </div>
        </div>

        {/* Навигация */}
        <div className="flex flex-col w-full flex-1 px-4 gap-1.5 overflow-y-auto no-scrollbar pb-6">
          {filteredRoutes.map((route) => {
            const isActive = route.active;
            const Icon = route.icon;

            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "group flex items-center gap-x-3 text-[15px] font-bold px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden",
                  isActive
                    ? "text-black dark:text-white bg-neutral-100 dark:bg-neutral-800/50"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#FFB800] rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div
                  className={cn(
                    "transition-colors duration-300",
                    isActive
                      ? "text-[#FFB800]"
                      : "text-neutral-400 group-hover:text-[#FFB800]",
                  )}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="z-10 relative">{route.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Кнопка ВЫХОДА */}
        <div className="p-4 mt-auto border-t border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50">
          <SignOutButton redirectUrl="/sign-in">
            <button className="group flex items-center justify-center gap-x-3 text-[15px] font-bold text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-4 rounded-2xl w-full transition-all duration-300 border border-transparent hover:border-red-100 dark:hover:border-red-500/20 active:scale-95">
              <LogOut
                size={20}
                className="transition-transform group-hover:-translate-x-1"
              />
              <span>Выйти из системы</span>
            </button>
          </SignOutButton>
        </div>
      </div>
    </>
  );
}
