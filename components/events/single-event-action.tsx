"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, ArrowRight, Share2, X, Lock } from "lucide-react"; // Добавили Lock
import { registerForEvent, checkRegistration } from "@/actions/event";
import { useRouter } from "next/navigation";
import { useRegistrationStore } from "@/store/useRegistrationStore";

export default function SingleEventActions({
  event,
  userId,
}: {
  event: any;
  userId?: string | null;
}) {
  const router = useRouter();

  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [isCopied, setIsCopied] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phone, setPhone] = useState("");

  const { setPendingEvent } = useRegistrationStore();

  // Проверяем статус закрытия
  const isClosed = event.isRegistrationClosed === true;

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

  useEffect(() => {
    if (showPhoneModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showPhoneModal]);

  const handleShare = async () => {
    const url = `${window.location.origin}/events/${event.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: url,
        });
      } catch (err) {
        console.log("Пользователь отменил шеринг", err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleRegisterClick = () => {
    if (isClosed) return; // Если закрыто, блокируем нажатие
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

  const phoneModalContent = showPhoneModal ? (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
      onClick={() => setShowPhoneModal(false)}
    >
      <div
        className="bg-white p-8 rounded-[32px] max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-neutral-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowPhoneModal(false)}
          className="absolute top-4 right-4 p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
        <h3 className="text-2xl font-black text-neutral-900 mb-2 tracking-tighter mt-2">
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

  return (
    <>
      <div className="flex gap-3 mt-8 pt-6 border-t border-neutral-100">
        <button
          onClick={handleShare}
          className="h-[52px] w-[52px] rounded-2xl bg-white border-2 border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 text-neutral-900 transition-all flex items-center justify-center shrink-0 active:scale-95 shadow-sm"
          title="Поделиться"
        >
          {isCopied ? (
            <Check size={20} className="text-green-600" />
          ) : (
            <Share2 size={20} />
          )}
        </button>

        {!isLoading && (
          <button
            onClick={handleRegisterClick}
            disabled={isRegistered || isRegistering || isClosed}
            className={`h-[52px] flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${
              isClosed
                ? "bg-red-50 text-red-500 cursor-not-allowed border-2 border-red-100"
                : isRegistered
                  ? "bg-green-100 text-green-700 cursor-default border-2 border-green-200"
                  : !userId
                    ? "bg-white text-neutral-900 border-2 border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50"
                    : "bg-neutral-900 text-white hover:bg-black shadow-xl shadow-black/10"
            }`}
          >
            {isClosed ? (
              <>
                <Lock size={16} /> Запись закрыта
              </>
            ) : isRegistered ? (
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

      {mounted && createPortal(phoneModalContent, document.body)}
    </>
  );
}
