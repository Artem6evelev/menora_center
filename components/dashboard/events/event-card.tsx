"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Edit,
  Lock,
  Check,
  Loader2,
  X,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { registerForEvent, checkRegistration } from "@/actions/event";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { cn } from "@/lib/utils";

dayjs.locale("ru");

export default function EventCard({
  item,
  onEdit,
  isAdmin,
}: {
  item: any;
  onEdit: (item: any) => void;
  isAdmin: boolean;
}) {
  const { event } = item;
  const { user } = useUser();
  const userId = user?.id;

  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phone, setPhone] = useState("");

  const isClosed = event.isRegistrationClosed;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAdmin && userId && isModalOpen) {
      checkRegistration(event.id, userId).then(setIsRegistered);
    }
  }, [event.id, userId, isAdmin, isModalOpen]);

  useEffect(() => {
    if (isModalOpen || showPhoneModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, showPhoneModal]);

  // 🔥 Если запись закрыта и это не админ — карточка не рендерится
  if (!isAdmin && isClosed) {
    return null;
  }

  const handleClick = () => {
    if (isAdmin) {
      onEdit(item);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleRegister = async () => {
    if (!phone.trim() || !userId) return;
    setIsRegistering(true);
    const res = await registerForEvent(event.id, userId, phone);
    if (res.success) {
      setIsRegistered(true);
      setShowPhoneModal(false);
    }
    setIsRegistering(false);
  };

  const modalContent = (
    <AnimatePresence>
      {!isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] z-10 border border-neutral-200 dark:border-neutral-800"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-50 p-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-full md:w-[45%] bg-neutral-100 dark:bg-neutral-950 relative shrink-0">
              <img
                src={event.imageUrl || "/default-event-poster.png"}
                alt={event.title}
                className="w-full h-full object-cover absolute inset-0"
              />
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFB800]/10 text-[#FFB800] text-[10px] font-black uppercase tracking-widest mb-6">
                  <Calendar size={14} />
                  {event.date
                    ? dayjs(event.date).format("DD MMM YYYY")
                    : "Дата не указана"}
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-white tracking-tighter leading-tight mb-6">
                  {event.title}
                </h2>
                <p className="text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed font-medium">
                  {event.description}
                </p>
              </div>

              <div className="p-6 md:px-10 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
                {showPhoneModal ? (
                  <div className="flex flex-col gap-3">
                    <input
                      type="tel"
                      placeholder="Номер телефона (+972...)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 outline-none focus:border-[#FFB800] font-medium transition-colors"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPhoneModal(false)}
                        className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors active:scale-95"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={handleRegister}
                        disabled={!phone || isRegistering}
                        className="flex-[2] py-3.5 rounded-2xl font-bold text-sm bg-[#FFB800] text-black flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
                      >
                        {isRegistering ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          "Подтвердить запись"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      isRegistered || isClosed ? null : setShowPhoneModal(true)
                    }
                    disabled={isRegistered || isClosed}
                    className={cn(
                      "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg",
                      isClosed
                        ? "bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-100 dark:border-red-500/20 shadow-none cursor-not-allowed"
                        : isRegistered
                          ? "bg-green-500 text-white shadow-green-500/30 cursor-default"
                          : "bg-[#FFB800] text-black hover:bg-amber-400 active:scale-95 shadow-[#FFB800]/20",
                    )}
                  >
                    {isClosed ? (
                      <>
                        <Lock size={16} /> Запись закрыта
                      </>
                    ) : isRegistered ? (
                      <>
                        <Check size={16} /> Вы записаны
                      </>
                    ) : (
                      "Записаться на событие"
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <motion.div
        layout
        onClick={handleClick}
        className="group relative rounded-[32px] overflow-hidden aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 shadow-sm transition-all duration-500 hover:shadow-2xl cursor-pointer isolate"
      >
        <img
          src={event.imageUrl || "/default-event-poster.png"}
          alt={event.title}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 -z-10",
            isClosed && "grayscale-[30%] opacity-80",
          )}
        />

        {/* БЕЙДЖ "ЗАПИСЬ ЗАКРЫТА" ТОЛЬКО ДЛЯ АДМИНА, так как клиенты скрытые карточки не видят */}
        {isAdmin && isClosed && (
          <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-red-500/90 backdrop-blur-md rounded-full flex items-center gap-1.5 shadow-lg border border-red-400/20">
            <Lock size={12} strokeWidth={3} className="text-white" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white">
              Запись закрыта
            </span>
          </div>
        )}

        {/* КНОПКА "РЕДАКТИРОВАТЬ" ДЛЯ АДМИНА */}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 dark:bg-black/90 backdrop-blur-md text-neutral-900 dark:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <Edit size={16} />
          </div>
        )}

        {/* НИЖНИЙ ГРАДИЕНТ И ТЕКСТ (Как афиша) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent -z-10" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
          <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            <p className="text-[#FFB800] text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Calendar size={14} />
              {event.date
                ? dayjs(event.date).format("DD MMM YYYY")
                : "Дата не указана"}
            </p>
            <h3 className="text-white text-2xl font-black tracking-tighter leading-tight mb-4 line-clamp-3">
              {event.title}
            </h3>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block">
              <button className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors border border-white/20 pointer-events-none flex items-center justify-center gap-2">
                {isAdmin ? (
                  "Редактировать событие"
                ) : (
                  <>
                    Узнать подробности <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}
