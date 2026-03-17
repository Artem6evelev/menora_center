"use client";

import { useEffect, useState } from "react";
import { useRegistrationStore } from "@/store/useRegistrationStore";
import { registerForEvent, cancelRegistration } from "@/actions/event";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  X,
  Info,
  Trash2,
  Loader2,
  Ticket,
} from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, easeInOut } from "framer-motion";
import { cn } from "@/lib/utils";

export default function MyEventsClient({
  initialEvents,
  userId,
}: {
  initialEvents: any[];
  userId: string;
}) {
  const router = useRouter();
  const { pendingEventId, clearPendingEvent } = useRegistrationStore();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Телефон
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phone, setPhone] = useState("");

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Пружинная анимация Apple
  const springTransition = { duration: 0.5, ease: easeInOut };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pendingEventId && userId && !isProcessing) {
      setShowPhoneModal(true);
    }
  }, [pendingEventId, userId]);

  const confirmPendingRegistration = async () => {
    if (!phone.trim() || !pendingEventId) return;
    setIsProcessing(true);

    const res = await registerForEvent(pendingEventId, userId, phone);
    if (res.success && res.message !== "already_registered") {
      setShowSuccessModal(true);
    }
    clearPendingEvent();
    setShowPhoneModal(false);
    router.refresh();
    setIsProcessing(false);
  };

  const handleCancel = async (eventId: string, title: string) => {
    if (confirm(`Вы уверены, что хотите отменить запись на "${title}"?`)) {
      setCancelingId(eventId);
      await cancelRegistration(eventId, userId);
      setCancelingId(null);
      router.refresh();
      setSelectedEvent(null);
    }
  };

  // МОДАЛКА ТЕЛЕФОНА
  const phoneModalContent = mounted && (
    <AnimatePresence>
      {showPhoneModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => {
              setShowPhoneModal(false);
              clearPendingEvent();
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springTransition}
            className="bg-white dark:bg-neutral-900 p-8 md:p-10 rounded-[40px] max-w-sm w-full shadow-2xl relative z-10 border border-neutral-200/50 dark:border-neutral-800/50"
          >
            <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-2 tracking-tight">
              Ваш{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
                контакт
              </span>
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 font-medium">
              Для завершения регистрации на событие укажите ваш номер телефона.
            </p>
            <input
              type="tel"
              placeholder="+972 5X XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl mb-6 focus:ring-2 focus:ring-[#FFB800]/50 outline-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPhoneModal(false);
                  clearPendingEvent();
                }}
                className="flex-1 py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                Отмена
              </button>
              <button
                onClick={confirmPendingRegistration}
                disabled={!phone.trim() || isProcessing}
                className="flex-1 py-4 bg-[#FFB800] hover:bg-[#E5A600] text-black rounded-2xl font-black uppercase tracking-widest text-xs disabled:opacity-50 transition-all shadow-lg shadow-[#FFB800]/20 flex justify-center items-center"
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Отправить"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // МОДАЛКА УСПЕХА
  const successModalContent = mounted && (
    <AnimatePresence>
      {showSuccessModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setShowSuccessModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={springTransition}
            className="bg-white dark:bg-neutral-900 rounded-[40px] p-10 text-center max-w-sm w-full relative z-10 shadow-2xl border border-neutral-200/50 dark:border-neutral-800/50"
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-3xl font-black mb-3 text-neutral-900 dark:text-white tracking-tight">
              Отлично!
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-8">
              Ваша запись успешно подтверждена. Ждем вас на мероприятии.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black py-4 rounded-2xl font-black uppercase tracking-[0.1em] transition-all shadow-xl shadow-[#FFB800]/20"
            >
              Закрыть
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // МОДАЛКА ДЕТАЛЕЙ СОБЫТИЯ
  const detailsModalContent = mounted && (
    <AnimatePresence>
      {selectedEvent && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setSelectedEvent(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springTransition}
            className="bg-white dark:bg-neutral-900 rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative z-10 border border-neutral-200/50 dark:border-neutral-800/50"
          >
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-5 right-5 z-20 p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full transition-all active:scale-95"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
            <div className="relative w-full h-56 shrink-0">
              <img
                src={
                  selectedEvent.event.imageUrl || "/default-event-poster.png"
                }
                alt={selectedEvent.event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-80" />
            </div>
            <div className="p-8 overflow-y-auto flex-1 no-scrollbar">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4">
                ✓ Билет активен
              </div>
              <h2 className="text-3xl font-black mb-6 text-neutral-900 dark:text-white tracking-tight leading-tight">
                {selectedEvent.event.title}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap font-medium leading-relaxed">
                {selectedEvent.event.description}
              </p>
            </div>
            <div className="p-6 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200/50 dark:border-neutral-800/50 flex justify-end">
              <button
                onClick={() =>
                  handleCancel(
                    selectedEvent.event.id,
                    selectedEvent.event.title,
                  )
                }
                disabled={cancelingId === selectedEvent.event.id}
                className="px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 flex gap-2 items-center transition-colors disabled:opacity-50"
              >
                {cancelingId === selectedEvent.event.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} strokeWidth={2.5} />
                )}
                Отменить участие
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="max-w-7xl mx-auto w-full pb-12">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={springTransition}
        className="mb-10"
      >
        <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
          Мои{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
            Билеты
          </span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2 text-lg">
          Здесь хранятся ваши регистрации на предстоящие события.
        </p>
      </motion.div>

      {initialEvents.length === 0 ? (
        // EMPTY STATE
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-[40px] p-16 text-center flex flex-col items-center justify-center shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FFB800]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 w-24 h-24 bg-neutral-100 dark:bg-neutral-950 rounded-3xl flex items-center justify-center text-neutral-400 mb-6">
            <Ticket size={40} strokeWidth={1.5} />
          </div>
          <h3 className="relative z-10 text-3xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight">
            У вас пока нет билетов
          </h3>
          <p className="relative z-10 text-neutral-500 dark:text-neutral-400 font-medium max-w-md text-lg leading-relaxed">
            Перейдите в раздел «События Общины», чтобы выбрать интересные
            мероприятия и записаться на них.
          </p>
        </motion.div>
      ) : (
        // GRID КАРТОЧЕК
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {initialEvents.map((item, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, ...springTransition }}
              key={item.participant.id}
              className="group bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-[32px] p-5 shadow-sm hover:shadow-xl hover:shadow-[#FFB800]/5 hover:-translate-y-1 transition-all duration-500 flex flex-col relative overflow-hidden"
            >
              {/* Блик при наведении */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="flex flex-col gap-4 mb-6 relative z-10">
                <div className="w-full h-40 rounded-2xl overflow-hidden relative shrink-0">
                  <img
                    src={item.event.imageUrl || "/default-event-poster.png"}
                    alt="Poster"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white">
                      Записаны
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black leading-tight line-clamp-2 text-neutral-900 dark:text-white group-hover:text-[#FFB800] transition-colors duration-300">
                    {item.event.title}
                  </h3>
                </div>
              </div>

              <div className="flex gap-2 mt-auto pt-5 border-t border-neutral-100 dark:border-neutral-800/50 relative z-10">
                <button
                  onClick={() => setSelectedEvent(item)}
                  className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-950 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
                >
                  <Info size={16} strokeWidth={2.5} /> Билет
                </button>
                <button
                  onClick={() => handleCancel(item.event.id, item.event.title)}
                  className="w-12 flex-shrink-0 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors active:scale-95"
                  title="Отменить участие"
                >
                  <Trash2 size={16} strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Порталы для модалок, чтобы они всегда были поверх всего интерфейса */}
      {mounted && createPortal(phoneModalContent, document.body)}
      {mounted && createPortal(successModalContent, document.body)}
      {mounted && createPortal(detailsModalContent, document.body)}
    </div>
  );
}
