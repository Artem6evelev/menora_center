"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, Check, Loader2, ArrowRight, X, MapPin } from "lucide-react";
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
    // Если юзер авторизован - показываем модалку для ввода телефона
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

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Дата не указана";

  // МОДАЛКА ВВОДА ТЕЛЕФОНА
  const phoneModalContent = showPhoneModal ? (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => setShowPhoneModal(false)}
    >
      <div
        className="bg-white p-6 md:p-8 rounded-3xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Оставьте контакт
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Укажите номер телефона для связи с вами по поводу мероприятия.
        </p>
        <input
          type="tel"
          placeholder="+972 5X XXX XXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-gray-300 p-3.5 rounded-xl mb-6 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={() => setShowPhoneModal(false)}
            className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={submitRegistration}
            disabled={!phone.trim() || isRegistering}
            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-colors flex justify-center items-center"
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
  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors"
        >
          <X size={20} />
        </button>
        <div className="relative w-full h-48 sm:h-64 shrink-0">
          <img
            src={eventImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">
            {event.title}
          </h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
            {event.description}
          </p>
        </div>
        <div className="p-6 border-t border-gray-100 bg-white shrink-0 flex justify-between items-center gap-4">
          {!isLoading && (
            <button
              onClick={handleRegisterClick}
              disabled={isRegistered || isRegistering}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isRegistered
                  ? "bg-green-50 text-green-600 cursor-default border border-green-200"
                  : !userId
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg"
              }`}
            >
              {isRegistered ? (
                <>
                  <Check size={18} /> Вы успешно записаны
                </>
              ) : !userId ? (
                <>
                  Войти для записи <ArrowRight size={16} />
                </>
              ) : (
                "Записаться на событие"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group relative rounded-3xl overflow-hidden aspect-[3/4] bg-gray-100 shadow-sm transition-all hover:shadow-xl border border-gray-100 cursor-pointer"
      >
        <img
          src={eventImageUrl}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
          <h3 className="text-white text-xl font-bold mb-2">{event.title}</h3>
          <button className="w-full py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors border border-white/20">
            Подробнее
          </button>
        </div>
      </div>
      {isModalOpen && mounted && createPortal(modalContent, document.body)}
      {showPhoneModal &&
        mounted &&
        createPortal(phoneModalContent, document.body)}
    </>
  );
}
