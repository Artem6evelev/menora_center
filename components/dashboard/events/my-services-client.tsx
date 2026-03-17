"use client";

import { useEffect, useState } from "react";
import { useServiceRegistrationStore } from "@/store/useServiceRegistration";
import { registerForService } from "@/actions/service";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Phone,
  Clock,
  Banknote,
  Briefcase,
} from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import { cn } from "@/lib/utils";

export default function MyServicesClient({
  initialServices,
  userId,
}: {
  initialServices: any[];
  userId: string;
}) {
  const router = useRouter();
  const { pendingServiceId, clearPendingService } =
    useServiceRegistrationStore();

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const springTransition = {
    duration: 0.5,
    ease: cubicBezier(0.22, 1, 0.36, 1),
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pendingServiceId && userId) {
      setShowPhoneModal(true);
    }
  }, [pendingServiceId, userId]);

  const confirmRegistration = async () => {
    if (!phone.trim() || !pendingServiceId) return;
    setIsProcessing(true);

    const res = await registerForService(pendingServiceId, userId, phone);

    if (res.success) {
      if (res.message === "already_registered") {
        alert("Вы уже были записаны на эту услугу.");
      } else {
        setShowSuccessModal(true);
      }
      clearPendingService();
      router.refresh();
    } else {
      alert("Произошла ошибка при записи. Попробуйте еще раз.");
    }

    setShowPhoneModal(false);
    setIsProcessing(false);
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
  };

  // МОДАЛКА: Запрос телефона
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
              clearPendingService();
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
              Завершение{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
                записи
              </span>
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 font-medium">
              Пожалуйста, укажите контактный телефон. Специалист свяжется с вами
              для уточнения деталей.
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
                  clearPendingService();
                }}
                className="flex-1 py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95"
              >
                Отмена
              </button>
              <button
                onClick={confirmRegistration}
                disabled={!phone.trim() || isProcessing}
                className="flex-[2] py-4 bg-[#FFB800] hover:bg-[#E5A600] text-black rounded-2xl font-black uppercase tracking-widest text-xs disabled:opacity-50 transition-all shadow-lg shadow-[#FFB800]/20 flex justify-center items-center active:scale-95"
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Подтвердить"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // МОДАЛКА: Успех
  const successModalContent = mounted && (
    <AnimatePresence>
      {showSuccessModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={handleCloseSuccess}
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
              Успешно!
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-8 leading-relaxed">
              Спасибо за регистрацию на услугу. Ваша заявка принята, и мы скоро
              свяжемся с вами.
            </p>
            <button
              onClick={handleCloseSuccess}
              className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black py-4 rounded-2xl font-black uppercase tracking-[0.1em] transition-all shadow-xl shadow-[#FFB800]/20 active:scale-95"
            >
              Отлично
            </button>
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
            Услуги
          </span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2 text-lg">
          Здесь отображаются все услуги и консультации, на которые вы записаны.
        </p>
      </motion.div>

      {/* CONTENT */}
      {initialServices.length === 0 ? (
        // EMPTY STATE
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-[40px] p-16 text-center flex flex-col items-center justify-center shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FFB800]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 w-24 h-24 bg-neutral-100 dark:bg-neutral-950 rounded-3xl flex items-center justify-center text-neutral-400 mb-6">
            <Briefcase size={40} strokeWidth={1.5} />
          </div>
          <h3 className="relative z-10 text-3xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight">
            Вы пока не записаны на услуги
          </h3>
          <p className="relative z-10 text-neutral-500 dark:text-neutral-400 font-medium max-w-md text-lg leading-relaxed">
            Перейдите в раздел «Услуги Общины», чтобы выбрать подходящую
            консультацию или помощь.
          </p>
        </motion.div>
      ) : (
        // GRID КАРТОЧЕК
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {initialServices.map((item, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, ...springTransition }}
              key={item.participant.id}
              className="group bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-[32px] p-5 shadow-sm hover:shadow-xl hover:shadow-[#FFB800]/5 hover:-translate-y-1 transition-all duration-500 flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="flex flex-col gap-4 mb-4 relative z-10">
                <div className="w-full h-40 rounded-2xl overflow-hidden relative shrink-0">
                  <img
                    src={item.service.imageUrl || "/default-service.png"}
                    alt="Cover"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white">
                      Заявка активна
                    </span>
                  </div>
                </div>

                <div>
                  {item.category && (
                    <span
                      className="text-[9px] font-black uppercase tracking-widest mb-1.5 inline-block"
                      style={{ color: item.category.color || "#FFB800" }}
                    >
                      {item.category.name}
                    </span>
                  )}
                  <h3 className="text-xl font-black leading-tight line-clamp-2 text-neutral-900 dark:text-white group-hover:text-[#FFB800] transition-colors duration-300">
                    {item.service.title}
                  </h3>
                </div>
              </div>

              {/* Информация о заявке */}
              <div className="mt-auto space-y-2.5 pt-4 border-t border-neutral-100 dark:border-neutral-800/50 relative z-10">
                {item.service.price > 0 && (
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-600 dark:text-neutral-400">
                    <Banknote size={16} className="text-emerald-500" />
                    {item.service.price} ₪
                  </div>
                )}
                {item.service.price === 0 && (
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-600 dark:text-neutral-400">
                    <Banknote size={16} className="text-emerald-500" />
                    Бесплатно
                  </div>
                )}
                {item.service.duration && (
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-600 dark:text-neutral-400">
                    <Clock size={16} className="text-blue-500" />
                    {item.service.duration}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 pt-1">
                  <Phone size={16} className="text-[#FFB800]" />
                  <span className="opacity-80 font-medium">
                    Ваш номер:
                  </span>{" "}
                  {item.participant.phone}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Порталы */}
      {mounted && createPortal(phoneModalContent, document.body)}
      {mounted && createPortal(successModalContent, document.body)}
    </div>
  );
}
