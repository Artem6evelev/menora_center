"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  Calendar,
  Plus,
  Minus,
  X,
  Coins,
  MapPin,
  Check,
} from "lucide-react";
import {
  registerForEvent,
  getUserFamilyData,
  checkRegistration,
} from "@/actions/event";
// 🔥 ИМПОРТИРУЕМ useClerk
import { useClerk } from "@clerk/nextjs";

// 🌟 Компонент сочной градиентной кнопки с бликом
const ShinyButton = ({
  onClick,
  text,
  disabled,
  isSuccess,
}: {
  onClick: () => void;
  text: string;
  disabled?: boolean;
  isSuccess?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`relative overflow-hidden w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest transition-all ${
      isSuccess
        ? "bg-green-500 shadow-lg shadow-green-500/30 cursor-default"
        : disabled
          ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
          : "bg-gradient-to-r from-[#FFB800] to-orange-500 active:scale-95 group shadow-lg shadow-[#FFB800]/20"
    }`}
  >
    {!isSuccess && !disabled && (
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />
    )}
    <span className="relative z-10 flex items-center justify-center gap-2">
      {isSuccess && <Check size={18} />} {text}
    </span>
  </button>
);

export default function SingleEventClient({
  eventData,
  userId,
}: {
  eventData: any;
  userId: string | null;
}) {
  const router = useRouter();

  // 🔥 ПОЛУЧАЕМ ГЛАВНЫЙ ОБЪЕКТ CLERK
  const clerk = useClerk();
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);

  // Состояния для авторизованных пользователей
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Состояния гостей
  const [extraAdults, setExtraAdults] = useState(0);
  const [extraKids, setExtraKids] = useState(0);
  const [selectedFamily, setSelectedFamily] = useState<{
    [key: string]: boolean;
  }>({ self: true });

  const eventImageUrl = eventData.imageUrl || "/default-event-poster.png";

  useEffect(() => {
    if (userId) {
      checkRegistration(eventData.id, userId).then(setIsRegistered);
      getUserFamilyData(userId).then(setUserData);
    }
  }, [userId, eventData.id]);

  useEffect(() => {
    if (isRegModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isRegModalOpen]);

  // 🔥 ФУНКЦИЯ ПРЯМОГО РЕДИРЕКТА В GOOGLE
  const handleGoogleDirectLogin = async () => {
    setIsGoogleRedirecting(true);
    try {
      // @ts-ignore - Игнорируем ошибку TS, метод существует в ядре Clerk
      await clerk.client.signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-in", // Стандартная страница входа отловит коллбэк от Google
        redirectUrlComplete: `/events/${eventData.id}`, // Куда вернуть после успеха
      });
    } catch (error) {
      console.error("Ошибка редиректа:", error);
      setIsGoogleRedirecting(false);
    }
  };

  // ==============================================================
  // ФЛОУ 1: ПОЛЬЗОВАТЕЛЬ НЕ АВТОРИЗОВАН (ЗАГЛУШКА ИЗ ТЗ)
  // ==============================================================
  if (!userId) {
    return (
      <main className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img
            src={eventImageUrl}
            alt="Background"
            className="w-full h-full object-cover opacity-50 blur-xl scale-110"
          />
        </div>

        <div className="relative z-10 bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-[32px] max-w-md w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-500">
          <h2 className="text-3xl font-black mb-3 text-neutral-900 dark:text-white">
            Один шаг до регистрации
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8 font-medium leading-relaxed">
            Войдите в свой Google-аккаунт для завершения регистрации на наше
            замечательное мероприятие!
          </p>

          <button
            onClick={handleGoogleDirectLogin}
            disabled={isGoogleRedirecting}
            className="w-full py-4 bg-gradient-to-r from-[#FFB800] to-orange-500 text-white rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-[#FFB800]/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
          >
            {isGoogleRedirecting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Продолжить с Google"
            )}
          </button>
        </div>
      </main>
    );
  }

  // ==============================================================
  // ФЛОУ 2: ПОЛЬЗОВАТЕЛЬ АВТОРИЗОВАН (ОСНОВНАЯ СТРАНИЦА)
  // ==============================================================
  const handleRegisterClick = () => {
    if (eventData.isRegistrationClosed || isRegistered) return;
    setIsRegModalOpen(true);
  };

  const handleRegisterSubmit = async () => {
    setIsLoading(true);
    const extraData = { family: selectedFamily, extraAdults, extraKids };
    const res = await registerForEvent(eventData.id, userId, null, extraData);

    if (res.success) {
      if (res.paymentUrl) window.location.href = res.paymentUrl;
      else {
        setIsRegistered(true);
        setIsRegModalOpen(false);
      }
    } else {
      alert("Ошибка: " + res.message);
    }
    setIsLoading(false);
  };

  const formattedDate = eventData.date
    ? new Date(eventData.date).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      }) + (eventData.time ? `, ${eventData.time}` : "")
    : "Дата не указана";

  const descText = eventData.description || "Описание пока не добавлено.";
  let part1 = descText;
  let part2 = "";
  if (descText.length > 200) {
    const splitIndex = descText.indexOf("\n", Math.floor(descText.length / 2));
    if (splitIndex !== -1) {
      part1 = descText.substring(0, splitIndex);
      part2 = descText.substring(splitIndex);
    }
  }

  const getButtonState = () => {
    if (eventData.isRegistrationClosed)
      return { text: "Запись закрыта", disabled: true, isSuccess: false };
    if (isRegistered)
      return { text: "Вы успешно записаны", disabled: true, isSuccess: true };
    return {
      text: "Записаться на мероприятие",
      disabled: false,
      isSuccess: false,
    };
  };

  const btnState = getButtonState();

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-24 md:pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="bg-white dark:bg-neutral-900 rounded-[32px] shadow-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row">
          <div className="w-full md:w-[45%] lg:w-[40%] bg-neutral-50 dark:bg-neutral-950 p-6 md:p-10 flex items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-neutral-100 dark:border-neutral-800 relative overflow-hidden">
            <Image
              src={eventImageUrl}
              alt="bg"
              fill
              className="object-cover opacity-30 blur-2xl scale-110"
            />
            <div className="relative z-10 w-full h-[35vh] md:h-[60vh] max-h-[500px]">
              <Image
                src={eventImageUrl}
                alt={eventData.title}
                fill
                className="object-contain drop-shadow-2xl rounded-2xl"
              />
            </div>
          </div>

          <div className="w-full md:w-[55%] lg:w-[60%] flex flex-col p-6 md:p-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest mb-4 border border-orange-100">
                <Calendar size={14} /> <span>{formattedDate}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black mb-6 tracking-tighter text-neutral-900 dark:text-white">
                {eventData.title}
              </h1>

              <div className="mb-8">
                <ShinyButton
                  onClick={handleRegisterClick}
                  text={btnState.text}
                  disabled={btnState.disabled}
                  isSuccess={btnState.isSuccess}
                />
              </div>

              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-4">
                Информация
              </h3>

              <div className="space-y-3 mb-8 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                {eventData.location && (
                  <div className="flex items-center gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <div className="p-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg text-neutral-500">
                      <MapPin size={16} />
                    </div>
                    {eventData.location}
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <div className="p-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg text-neutral-500">
                    <Coins size={16} />
                  </div>
                  {eventData.isFree
                    ? "Участие бесплатное"
                    : `Стоимость: ${eventData.price || "Уточняется"}`}
                </div>
              </div>

              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium whitespace-pre-wrap mb-8">
                {part1}
              </p>

              {part2 && (
                <div className="mb-8">
                  <ShinyButton
                    onClick={handleRegisterClick}
                    text={btnState.isSuccess ? btnState.text : "Хочу пойти!"}
                    disabled={btnState.disabled}
                    isSuccess={btnState.isSuccess}
                  />
                </div>
              )}

              {part2 && (
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium whitespace-pre-wrap mb-8">
                  {part2}
                </p>
              )}

              <ShinyButton
                onClick={handleRegisterClick}
                text={
                  btnState.isSuccess ? btnState.text : "Забронировать место"
                }
                disabled={btnState.disabled}
                isSuccess={btnState.isSuccess}
              />
            </div>
          </div>
        </div>
      </div>

      {isRegModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsRegModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsRegModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-black mb-1">
              Регистрация на {eventData.title}
            </h2>
            <p className="text-sm text-neutral-500 mb-6">{formattedDate}</p>

            {userData ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-sm mb-3">Ваша семья:</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked
                        disabled
                        className="w-5 h-5 rounded accent-[#FFB800]"
                      />
                      <span>{userData.firstName} (Вы)</span>
                    </label>

                    {userData.spouseName && (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded accent-[#FFB800]"
                          checked={!!selectedFamily.spouse}
                          onChange={(e) =>
                            setSelectedFamily({
                              ...selectedFamily,
                              spouse: e.target.checked,
                            })
                          }
                        />
                        <span>{userData.spouseName} (Супруг/а)</span>
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
                            className="w-5 h-5 rounded accent-[#FFB800]"
                            checked={!!selectedFamily[`child_${idx}`]}
                            onChange={(e) =>
                              setSelectedFamily({
                                ...selectedFamily,
                                [`child_${idx}`]: e.target.checked,
                              })
                            }
                          />
                          <span>{child.name} (Ребёнок)</span>
                        </label>
                      ),
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <h3 className="font-bold text-sm mb-4">
                    Дополнительные гости:
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm">Взрослые (гости)</span>
                    <div className="flex items-center gap-4 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-1">
                      <button
                        onClick={() =>
                          setExtraAdults(Math.max(0, extraAdults - 1))
                        }
                        className="p-1 hover:text-[#FFB800]"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-bold w-4 text-center">
                        {extraAdults}
                      </span>
                      <button
                        onClick={() => setExtraAdults(extraAdults + 1)}
                        className="p-1 hover:text-[#FFB800]"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Дети (гости)</span>
                    <div className="flex items-center gap-4 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-1">
                      <button
                        onClick={() => setExtraKids(Math.max(0, extraKids - 1))}
                        className="p-1 hover:text-[#FFB800]"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-bold w-4 text-center">
                        {extraKids}
                      </span>
                      <button
                        onClick={() => setExtraKids(extraKids + 1)}
                        className="p-1 hover:text-[#FFB800]"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsRegModalOpen(false)}
                    className="flex-1 py-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleRegisterSubmit}
                    disabled={isLoading}
                    className="flex-1 py-3.5 rounded-xl bg-[#FFB800] text-black font-bold flex justify-center items-center shadow-lg active:scale-95"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      "Записаться"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-[#FFB800]" size={32} />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
