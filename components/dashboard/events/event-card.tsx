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
  Plus,
  Minus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import {
  registerForEvent,
  checkRegistration,
  getUserFamilyData,
} from "@/actions/event";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { cn } from "@/lib/utils";

dayjs.locale("ru");

// Вспомогательная функция для расчета возраста
const getAge = (dob: string) => {
  if (!dob) return "";
  const ageDifMs = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

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

  // Стейты для регистрации с семьей
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [selectedFamily, setSelectedFamily] = useState<{
    [key: string]: boolean;
  }>({ self: true });
  const [extraAdults, setExtraAdults] = useState(0);
  const [extraKids, setExtraKids] = useState(0);

  const isClosed = event.isRegistrationClosed;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Проверка статуса регистрации
  useEffect(() => {
    if (!isAdmin && userId && isModalOpen) {
      checkRegistration(event.id, userId).then(setIsRegistered);
    }
  }, [event.id, userId, isAdmin, isModalOpen]);

  // Подгрузка данных семьи при открытии модалки
  useEffect(() => {
    if (showFamilyModal && userId && !userData) {
      getUserFamilyData(userId).then(setUserData);
    }
  }, [showFamilyModal, userId, userData]);

  useEffect(() => {
    if (isModalOpen || showFamilyModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, showFamilyModal]);

  if (!isAdmin && isClosed) return null;

  const handleClick = () => {
    if (isAdmin) onEdit(item);
    else setIsModalOpen(true);
  };

  const handleRegister = async () => {
    if (!userId) return;
    setIsRegistering(true);

    const extraData = {
      family: selectedFamily,
      extraAdults,
      extraKids,
    };

    const res = await registerForEvent(
      event.id,
      userId,
      userData?.phone,
      extraData,
    );
    if (res.success) {
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        setIsRegistered(true);
        setShowFamilyModal(false);
      }
    } else {
      alert("Ошибка при регистрации: " + res.message);
    }
    setIsRegistering(false);
  };

  // МОДАЛКА ВЫБОРА СЕМЬИ И ГОСТЕЙ
  const familyModalContent = (
    <AnimatePresence>
      {showFamilyModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowFamilyModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-2xl border border-neutral-200 dark:border-neutral-800"
          >
            <button
              onClick={() => setShowFamilyModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-black mb-1 text-neutral-900 dark:text-white">
              Регистрация на мероприятие
            </h2>
            <p className="text-sm text-neutral-500 mb-6 font-medium">
              "{event.title}"<br />
              {event.date ? dayjs(event.date).format("D MMMM, HH:mm") : ""}
            </p>

            {userData ? (
              <div className="space-y-6">
                {/* СПИСОК СЕМЬИ */}
                <div>
                  <h3 className="font-bold text-sm mb-3 text-neutral-900 dark:text-white">
                    Ваша семья (выберите участников):
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked
                        disabled
                        className="w-5 h-5 rounded text-[#FFB800] accent-[#FFB800]"
                      />
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {userData.firstName} (Вы)
                      </span>
                    </label>

                    {userData.spouseName && (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded text-[#FFB800] accent-[#FFB800]"
                          checked={!!selectedFamily.spouse}
                          onChange={(e) =>
                            setSelectedFamily({
                              ...selectedFamily,
                              spouse: e.target.checked,
                            })
                          }
                        />
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          {userData.spouseName} (Супруг/а)
                        </span>
                      </label>
                    )}

                    {(userData.childrenData || []).map(
                      (child: any, idx: number) => (
                        <label
                          key={idx}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded text-[#FFB800] accent-[#FFB800]"
                            checked={!!selectedFamily[`child_${idx}`]}
                            onChange={(e) =>
                              setSelectedFamily({
                                ...selectedFamily,
                                [`child_${idx}`]: e.target.checked,
                              })
                            }
                          />
                          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                            {child.name}{" "}
                            <span className="text-neutral-400">
                              ({getAge(child.dateOfBirth)} лет)
                            </span>
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                </div>

                {/* ДОПОЛНИТЕЛЬНЫЕ ГОСТИ */}
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <h3 className="font-bold text-sm mb-4 text-neutral-900 dark:text-white">
                    Дополнительные гости:
                  </h3>
                  <p className="text-xs text-neutral-400 mb-3">
                    Укажите количество других гостей:
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-1 border border-neutral-200 dark:border-neutral-700">
                      <button
                        onClick={() =>
                          setExtraAdults(Math.max(0, extraAdults - 1))
                        }
                        className="p-1.5 hover:text-[#FFB800] transition-colors"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <span className="font-black w-4 text-center">
                        {extraAdults}
                      </span>
                      <button
                        onClick={() => setExtraAdults(extraAdults + 1)}
                        className="p-1.5 hover:text-[#FFB800] transition-colors"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300 text-right">
                      Взрослые (гости)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-1 border border-neutral-200 dark:border-neutral-700">
                      <button
                        onClick={() => setExtraKids(Math.max(0, extraKids - 1))}
                        className="p-1.5 hover:text-[#FFB800] transition-colors"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <span className="font-black w-4 text-center">
                        {extraKids}
                      </span>
                      <button
                        onClick={() => setExtraKids(extraKids + 1)}
                        className="p-1.5 hover:text-[#FFB800] transition-colors"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300 text-right">
                      Дети (до 13 лет, гости)
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowFamilyModal(false)}
                    className="flex-1 py-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-[#FFB800] to-orange-500 text-white font-bold flex justify-center items-center shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isRegistering ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      "Зарегистрироваться"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#FFB800]" size={32} />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // ГЛАВНАЯ МОДАЛКА КАРТОЧКИ (Описание события)
  const modalContent = (
    <AnimatePresence>
      {!isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
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
                <button
                  onClick={() =>
                    isRegistered || isClosed ? null : setShowFamilyModal(true)
                  }
                  disabled={isRegistered || isClosed}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg",
                    isClosed
                      ? "bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-100 dark:border-red-500/20 shadow-none cursor-not-allowed"
                      : isRegistered
                        ? "bg-green-500 text-white shadow-green-500/30 cursor-default"
                        : "bg-gradient-to-r from-[#FFB800] to-orange-500 text-white hover:opacity-90 active:scale-95 shadow-[#FFB800]/20",
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
        {isAdmin && isClosed && (
          <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-red-500/90 backdrop-blur-md rounded-full flex items-center gap-1.5 shadow-lg border border-red-400/20">
            <Lock size={12} strokeWidth={3} className="text-white" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white">
              Запись закрыта
            </span>
          </div>
        )}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 dark:bg-black/90 backdrop-blur-md text-neutral-900 dark:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <Edit size={16} />
          </div>
        )}
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
                    <ArrowRight size={16} /> Узнать подробности
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      {mounted && createPortal(modalContent, document.body)}
      {mounted && createPortal(familyModalContent, document.body)}
    </>
  );
}
