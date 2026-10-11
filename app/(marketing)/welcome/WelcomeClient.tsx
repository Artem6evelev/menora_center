"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import {
  CalendarDays,
  Baby,
  PlayCircle,
  Newspaper,
  MapPin,
  Heart,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

export default function WelcomeClient() {
  // Анимации для последовательного появления карточек
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // Основные ссылки навигации
  const quickLinks = [
    {
      title: "Ближайшие мероприятия",
      desc: "Шаббаты, праздники и встречи",
      href: "/events",
      icon: CalendarDays,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      title: "Menorah Kids",
      desc: "Детский центр и программы развития",
      href: "/kids",
      icon: Baby,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "Новости общины",
      desc: "Что происходит в нашем центре",
      href: "/news",
      icon: Newspaper,
      color: "text-[#FFB800]",
      bg: "bg-[#FFB800]/10",
      border: "border-[#FFB800]/20",
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-24 pb-16 px-4 flex flex-col items-center selection:bg-[#FFB800] selection:text-black">
      {/* Декоративный фон */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FFB800]/10 dark:bg-[#FFB800]/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-lg mx-auto flex flex-col gap-8">
        {/* Шапка приветствия */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center p-4 bg-white dark:bg-neutral-900 rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-neutral-100 dark:border-neutral-800 mb-2">
            <span className="text-4xl">🕎</span>
          </div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Шалом! Добро пожаловать
          </h1>
          <p className="text-neutral-500 text-sm font-medium px-4">
            Мы рады видеть вас. Выберите, что вас интересует, чтобы узнать
            больше о Menorah Center.
          </p>
        </motion.div>

        {/* Сетка навигации */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-3"
        >
          {quickLinks.map((link, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Link href={link.href} className="block group">
                <div className="flex items-center bg-white dark:bg-neutral-900 p-4 rounded-[24px] border border-neutral-100 dark:border-neutral-800 shadow-sm group-hover:shadow-md transition-all duration-300">
                  <div
                    className={`w-14 h-14 rounded-[18px] flex items-center justify-center shrink-0 ${link.bg} ${link.color} ${link.border} border`}
                  >
                    <link.icon size={24} />
                  </div>

                  <div className="ml-4 flex-1">
                    <h3 className="font-bold text-neutral-900 dark:text-white text-[15px] group-hover:text-[#FFB800] transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">
                      {link.desc}
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-400 group-hover:text-black group-hover:bg-[#FFB800] transition-all duration-300 group-hover:translate-x-1 shrink-0">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Дополнительные действия (Контакты / Поддержка) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3 mt-2"
        >
          <motion.div variants={itemVariants}>
            <a
              href="https://t.me/menorah_rishon"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-5 bg-white dark:bg-neutral-900 rounded-[24px] border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-[#FFB800]/50 transition-colors text-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle size={20} />
              </div>
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Наш Telegram
              </span>
            </a>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link
              href="/contacts"
              className="flex flex-col items-center justify-center p-5 bg-white dark:bg-neutral-900 rounded-[24px] border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-[#FFB800]/50 transition-colors text-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin size={20} />
              </div>
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Где мы находимся
              </span>
            </Link>
          </motion.div>
        </motion.div>

        {/* CTA Пожертвования */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <a
            href="https://shutaf.im/cba301" // Твоя ссылка на пожертвования из кода Kids
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-1 pl-1 pr-5 bg-neutral-900 dark:bg-white rounded-[24px] group shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-[20px] bg-[#FFB800] text-black flex items-center justify-center shrink-0">
                <Heart size={20} fill="currentColor" />
              </div>
              <div>
                <div className="text-white dark:text-neutral-900 text-sm font-bold">
                  Поддержать центр
                </div>
                <div className="text-neutral-400 dark:text-neutral-500 text-[10px] font-black uppercase tracking-widest">
                  Сделать цдаку
                </div>
              </div>
            </div>
            <ChevronRight
              size={18}
              className="text-neutral-500 group-hover:translate-x-1 group-hover:text-[#FFB800] dark:group-hover:text-black transition-all"
            />
          </a>
        </motion.div>
      </div>
    </main>
  );
}
