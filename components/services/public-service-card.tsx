"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, ArrowRight, X, Clock, Banknote } from "lucide-react";
import {
  registerForService,
  checkServiceRegistration,
} from "@/actions/service";
import { useRouter } from "next/navigation";
import { useServiceRegistrationStore } from "@/store/useServiceRegistration";

export default function PublicServiceCard({
  item,
  userId,
}: {
  item: any;
  userId?: string | null;
}) {
  const { service, category } = item;
  const router = useRouter();

  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phone, setPhone] = useState("");

  const { setPendingService } = useServiceRegistrationStore();
  const serviceImageUrl =
    service.imageUrl ||
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop";

  useEffect(() => {
    setMounted(true);
    const checkStatus = async () => {
      if (userId) {
        const status = await checkServiceRegistration(service.id, userId);
        setIsRegistered(status);
      }
      setIsLoading(false);
    };
    checkStatus();
  }, [service.id, userId]);

  const handleRegisterClick = () => {
    if (!userId) {
      setPendingService(service.id);
      // При успешном логине возвращаем в "Мои услуги", где встретит модалка телефона
      router.push("/sign-in?redirect_url=/dashboard/my-services");
      return;
    }
    setShowPhoneModal(true);
  };

  const submitRegistration = async () => {
    if (!phone.trim() || !userId) return;
    setIsRegistering(true);
    const res = await registerForService(service.id, userId, phone);
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
          Укажите номер телефона для связи с вами.
        </p>
        <input
          type="tel"
          placeholder="+972 5X XXX XXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-gray-300 p-3.5 rounded-xl mb-6 focus:ring-2 focus:ring-indigo-600 outline-none"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={() => setShowPhoneModal(false)}
            className="flex-1 py-3.5 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200"
          >
            Отмена
          </button>
          <button
            onClick={submitRegistration}
            disabled={!phone.trim() || isRegistering}
            className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex justify-center"
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

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full"
        >
          <X size={20} />
        </button>

        <div className="relative w-full h-48 sm:h-64 shrink-0">
          <img
            src={serviceImageUrl}
            alt={service.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {category && (
            <span
              className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 mb-4 inline-block"
              style={{ color: category.color }}
            >
              {category.name}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">
            {service.title}
          </h2>

          <div className="flex flex-wrap gap-4 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            {service.price && (
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <Banknote size={18} />
                </div>
                <span>{service.price}</span>
              </div>
            )}
            {service.duration && (
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Clock size={18} />
                </div>
                <span>{service.duration}</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
            {service.description}
          </p>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white shrink-0 flex justify-end">
          {!isLoading && (
            <button
              onClick={handleRegisterClick}
              disabled={isRegistered || isRegistering}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isRegistered
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : !userId
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isRegistered ? (
                <>
                  <Check size={18} /> Вы записаны
                </>
              ) : !userId ? (
                <>
                  Войти для записи <ArrowRight size={16} />
                </>
              ) : (
                "Записаться на услугу"
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
          src={serviceImageUrl}
          alt={service.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
          {category && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/80 mb-2">
              {category.name}
            </span>
          )}
          <h3 className="text-white text-xl font-bold mb-2">{service.title}</h3>
          <div className="flex items-center gap-3 mb-4">
            {service.price && (
              <span className="text-green-400 text-xs font-bold">
                {service.price}
              </span>
            )}
            {service.duration && (
              <span className="text-blue-300 text-xs font-medium">
                {service.duration}
              </span>
            )}
          </div>
          <button className="w-full py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20">
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
