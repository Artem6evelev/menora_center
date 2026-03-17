"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, X, CheckCircle2 } from "lucide-react";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/actions/notification";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    const data = await getUserNotifications(userId);
    setNotifications(data);
  };

  useEffect(() => {
    fetchNotifs();

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchNotifs();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Закрытие при клике вне меню
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleToggleBell = async () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen && unreadCount > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await markAllAsRead(userId);
    }
  };

  const handleClick = async (n: any) => {
    if (!n.isRead) await markAsRead(n.id);
    setIsOpen(false);
    if (n.link) router.push(n.link);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotification(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleBell}
        className={cn(
          "p-2.5 rounded-full transition-all duration-300 relative focus:outline-none",
          isOpen
            ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white",
        )}
      >
        <Bell
          size={20}
          className={cn(
            "transition-transform duration-300",
            isOpen && "scale-110",
          )}
        />

        {/* Анимированный красный бейдж */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-neutral-950"
            />
          )}
        </AnimatePresence>
      </button>

      {/* Выпадающее меню */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border border-neutral-200/50 dark:border-neutral-800/50 z-50 overflow-hidden"
          >
            {/* Шапка меню */}
            <div className="p-5 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-950/50 flex justify-between items-center backdrop-blur-md">
              <span className="font-black text-sm uppercase tracking-widest text-neutral-900 dark:text-white">
                Уведомления
              </span>
              {notifications.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded-full text-neutral-500">
                  {notifications.length}
                </span>
              )}
            </div>

            {/* Список уведомлений */}
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="text-sm font-bold text-neutral-500">
                    Нет новых уведомлений
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <AnimatePresence>
                    {notifications.map((n) => (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => handleClick(n)}
                        className={cn(
                          "group p-4 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 cursor-pointer transition-colors relative",
                          !n.isRead
                            ? "bg-[#FFB800]/5 hover:bg-[#FFB800]/10"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                        )}
                      >
                        <div className="flex justify-between items-start gap-3 pr-6">
                          {/* Индикатор непрочитанного */}
                          {!n.isRead && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800] mt-1.5 shrink-0 shadow-[0_0_8px_rgba(255,184,0,0.5)]" />
                          )}

                          <div className="flex-1">
                            <p
                              className={cn(
                                "text-sm mb-1 leading-tight",
                                !n.isRead
                                  ? "font-bold text-neutral-900 dark:text-white"
                                  : "font-medium text-neutral-600 dark:text-neutral-400",
                              )}
                            >
                              {n.title}
                            </p>
                            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                          </div>

                          {/* Кнопка удаления */}
                          <button
                            onClick={(e) => handleDelete(e, n.id)}
                            className="absolute right-3 top-4 p-1.5 rounded-full text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95"
                          >
                            <X size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
