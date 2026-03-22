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
  Smartphone,
  Newspaper,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = userRole === "admin" || userRole === "superadmin";

  useEffect(() => setIsOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // ГРУППА 1: Для всех (Резиденты и Админы)
  const clientRoutes = [
    { label: "Мой кабинет", icon: LayoutDashboard, href: "/dashboard" },
    { label: "События", icon: Calendar, href: "/dashboard/events" },
    { label: "Мои билеты", icon: Ticket, href: "/dashboard/my-events" },
    { label: "Услуги", icon: HeartHandshake, href: "/dashboard/services" },
    { label: "Мои заявки", icon: Briefcase, href: "/dashboard/my-services" },
    { label: "Сообщения", icon: MessageSquare, href: "/dashboard/chat" },
  ];

  // ГРУППА 2: Только для администрации
  const adminRoutes = [
    {
      label: "Telegram Бот",
      icon: Smartphone,
      href: "/dashboard/telegram",
      roles: ["superadmin", "admin"],
    },
    {
      label: "Блог и Новости",
      icon: Newspaper,
      href: "/dashboard/news",
      roles: ["superadmin", "admin"],
    },
    {
      label: "База людей",
      icon: UsersRound,
      href: "/dashboard/users",
      roles: ["superadmin", "admin"],
    },
    {
      label: "Канбан-доска",
      icon: Trello,
      href: "/dashboard/kanban",
      roles: ["superadmin", "admin"],
    },
    {
      label: "Заявки",
      icon: ClipboardList,
      href: "/dashboard/applications",
      roles: ["superadmin", "admin"],
    },
    {
      label: "Команда",
      icon: Users,
      href: "/dashboard/team",
      roles: ["superadmin"],
    }, // Только супер
  ].filter((route) => route.roles.includes(userRole));

  // Вспомогательный компонент для рендеринга ссылки
  const NavLink = ({ route }: { route: any }) => {
    // Делаем активным и точные совпадения, и вложенные страницы (например /dashboard/news/create)
    const isActive =
      pathname === route.href || pathname.startsWith(`${route.href}/`);
    const Icon = route.icon;

    return (
      <Link
        href={route.href}
        className={cn(
          "group flex items-center gap-x-3 text-sm font-bold px-4 py-3 rounded-2xl transition-all duration-300 relative",
          isActive
            ? "bg-[#FFB800]/10 text-neutral-900 dark:text-white"
            : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white",
        )}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#FFB800] rounded-r-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <div
          className={cn(
            "transition-colors",
            isActive
              ? "text-[#FFB800]"
              : "text-neutral-400 group-hover:text-[#FFB800]",
          )}
        >
          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span>{route.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Кнопка открытия меню (гамбургер) — ВИДНА ТОЛЬКО НА МОБИЛКАХ */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2.5 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-lg"
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
          "fixed lg:sticky top-0 left-0 z-[70] h-[100dvh] w-[280px] bg-white dark:bg-neutral-950 border-r border-neutral-100 dark:border-neutral-800 flex flex-col transition-transform duration-500",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Шапка сайдбара */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#FFB800] rounded-xl flex items-center justify-center text-black font-black text-xl shadow-lg shadow-[#FFB800]/20 group-hover:scale-105 transition-transform">
              M
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-neutral-900 dark:text-white tracking-tighter leading-none">
                Menorah
              </span>
              <span className="text-[9px] font-black text-[#FFB800] uppercase tracking-widest mt-1">
                Workspace
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-neutral-400 bg-neutral-100 dark:bg-neutral-900 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        {/* Бейдж роли */}
        <div className="px-6 pb-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
            <ShieldCheck
              size={14}
              className={
                userRole === "superadmin"
                  ? "text-purple-500"
                  : userRole === "admin"
                    ? "text-blue-500"
                    : "text-[#FFB800]"
              }
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              {userRole}
            </span>
          </div>
        </div>

        {/* Навигация (Скроллируемая область) */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-6 pb-8">
          {/* Блок 1: Резидент */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 px-3">
              Меню резидента
            </div>
            <div className="flex flex-col gap-1">
              {clientRoutes.map((route) => (
                <NavLink key={route.href} route={route} />
              ))}
            </div>
          </div>

          {/* Блок 2: Админка */}
          {isAdmin && adminRoutes.length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-2 px-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Управление общиной
              </div>
              <div className="flex flex-col gap-1">
                {adminRoutes.map((route) => (
                  <NavLink key={route.href} route={route} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Кнопка ВЫХОДА в самом низу */}
        <div className="p-4 mt-auto border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <SignOutButton redirectUrl="/sign-in">
            <button className="flex w-full items-center justify-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300">
              <LogOut size={18} />
              <span>Выйти из системы</span>
            </button>
          </SignOutButton>
        </div>
      </div>
    </>
  );
}
