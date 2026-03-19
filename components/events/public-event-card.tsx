"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, Check, Loader2, ArrowRight, X } from "lucide-react";
import { registerForEvent, checkRegistration } from "@/actions/event";
import { useRouter } from "next/navigation";
import { useRegistrationStore } from "@/store/useRegistrationStore";

export default function PublicEventCard({
  item,
  userId,
}: {
  item: any;
  userId?: string | null;
}) {
  const { event, category } = item;
  const router = useRouter();

  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Состояния для телефона
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phone, setPhone] = useState("");

  const { setPendingEvent } = useRegistrationStore();
  const eventImageUrl = event.imageUrl || "/default-event-poster.png";

  useEffect(() => {
    setMounted(true);
    const checkStatus = async () => {
      if (userId) {
        const status = await checkRegistration(event.id, userId);
        setIsRegistered(status);
      }
      setIsLoading(false);
    };
    checkStatus();
  }, [event.id, userId]);

  const handleRegisterClick = () => {
    if (!userId) {
      setPendingEvent(event.id);
      router.push("/sign-in?redirect_url=/dashboard/my-events");
      return;
    }
    setShowPhoneModal(true);
  };

  const submitRegistration = async () => {
    if (!phone.trim() || !userId) return;
    setIsRegistering(true);
    const res = await registerForEvent(event.id, userId, phone);
    if (res.success) {
      setIsRegistered(true);
      setShowPhoneModal(false);
    }
    setIsRegistering(false);
  };

  useEffect(() => {
    if (isModalOpen || showPhoneModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, showPhoneModal]);

  // ИСПРАВЛЕННОЕ ФОРМАТИРОВАНИЕ ДАТЫ И ВРЕМЕНИ
  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      }) + (event.time ? `, ${event.time}` : "")
    : "Дата не указана";

  // МОДАЛКА ВВОДА ТЕЛЕФОНА
  const phoneModalContent = showPhoneModal ? (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
      onClick={() => setShowPhoneModal(false)}
    >
      <div
        className="bg-white p-8 rounded-[32px] max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-black text-neutral-900 mb-2 tracking-tighter">
          Ваш контакт
        </h3>
        <p className="text-neutral-500 text-sm mb-6 font-medium">
          Укажите номер телефона для связи с вами по поводу мероприятия.
        </p>
        <input
          type="tel"
          placeholder="+972 5X XXX XXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-neutral-50 border-2 border-neutral-200 p-4 rounded-2xl mb-6 focus:border-neutral-900 focus:ring-0 outline-none transition-all font-medium"
          autoFocus
        />
        <div className="flex gap-3 flex-col sm:flex-row">
          <button
            onClick={() => setShowPhoneModal(false)}
            className="flex-1 py-4 bg-neutral-100 hover:bg-neutral-200 rounded-2xl font-bold text-neutral-600 transition-colors text-sm"
          >
            Отмена
          </button>
          <button
            onClick={submitRegistration}
            disabled={!phone.trim() || isRegistering}
            className="flex-1 py-4 bg-neutral-900 hover:bg-black text-white rounded-2xl font-bold disabled:opacity-50 transition-all active:scale-95 flex justify-center items-center text-sm"
          >
            {isRegistering ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Подтвердить"
            )}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ОСНОВНАЯ МОДАЛКА ОПИСАНИЯ
  const modalContent = isModalOpen ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 md:p-6"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 border border-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-4 right-4 z-20 p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-colors"
        >
          <X size={20} />
        </button>

        <div className="relative w-full h-56 sm:h-72 shrink-0">
          <img
            src={eventImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest mb-3 border border-white/20">
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight">
              {event.title}
            </h2>
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-4">
            О мероприятии
          </h3>
          <p className="text-neutral-600 leading-relaxed font-medium whitespace-pre-wrap">
            {event.description}
          </p>
        </div>

        <div className="p-6 border-t border-neutral-100 bg-neutral-50 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
          {!isLoading && (
            <button
              onClick={handleRegisterClick}
              disabled={isRegistered || isRegistering}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                isRegistered
                  ? "bg-green-100 text-green-700 cursor-default border-2 border-green-200"
                  : !userId
                    ? "bg-white text-neutral-900 border-2 border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50"
                    : "bg-neutral-900 text-white hover:bg-black shadow-xl shadow-black/10"
              }`}
            >
              {isRegistered ? (
                <>
                  <Check size={16} /> Вы записаны
                </>
              ) : !userId ? (
                <>
                  Войти для записи <ArrowRight size={14} />
                </>
              ) : (
                "Записаться на событие"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* КАРТОЧКА СОБЫТИЯ */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="group relative rounded-[32px] overflow-hidden aspect-[3/4] bg-neutral-100 shadow-sm transition-all duration-500 hover:shadow-2xl cursor-pointer isolate"
      >
        <img
          src={eventImageUrl}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 -z-10"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent -z-10" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
          <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            <p className="text-[#FFB800] text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Calendar size={14} />
              {formattedDate.split(",")[0]}
            </p>
            <h3 className="text-white text-2xl font-black tracking-tighter leading-tight mb-4">
              {event.title}
            </h3>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 md:block hidden">
              <button className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors border border-white/20">
                Узнать подробности
              </button>
            </div>
          </div>
        </div>
      </div>

      {mounted && createPortal(modalContent, document.body)}
      {mounted && createPortal(phoneModalContent, document.body)}
    </>
  );
}
