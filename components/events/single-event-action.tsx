"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Minus, X } from "lucide-react";
import {
  registerForEvent,
  getUserFamilyData,
} from "@/actions/event-registration";

// 🌟 Компонент сочной градиентной кнопки с бликом
const ShinyButton = ({
  onClick,
  text,
  disabled,
}: {
  onClick: () => void;
  text: string;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="relative overflow-hidden w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#FFB800] to-orange-500 text-white font-black uppercase tracking-widest transition-transform active:scale-95 disabled:opacity-50 group"
  >
    {/* Анимация блеска (ездящий белый градиент) */}
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />
    <span className="relative z-10">{text}</span>
  </button>
);

export default function SingleEventActions({
  event,
  userId,
}: {
  event: any;
  userId: string | null;
}) {
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Состояние для дополнительных гостей
  const [extraAdults, setExtraAdults] = useState(0);
  const [extraKids, setExtraKids] = useState(0);

  // Состояние для выбранных членов семьи (по умолчанию выбран сам пользователь)
  const [selectedFamily, setSelectedFamily] = useState<{
    [key: string]: boolean;
  }>({ self: true });

  useEffect(() => {
    if (userId && isRegModalOpen && !userData) {
      getUserFamilyData(userId).then(setUserData);
    }
  }, [userId, isRegModalOpen, userData]);

  const handleActionClick = () => {
    if (!userId) {
      setIsAuthModalOpen(true); // Показываем просьбу войти через Google
    } else {
      setIsRegModalOpen(true); // Показываем модалку выбора гостей
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    const extraData = {
      family: selectedFamily,
      extraAdults,
      extraKids,
    };

    const res = await registerForEvent(event.id, userId!, extraData);

    if (res.success && res.paymentUrl) {
      // Перекидываем на оплату Shutafim
      window.location.href = res.paymentUrl;
    } else {
      alert("Ошибка: " + res.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* ТРИ СОЧНЫЕ КНОПКИ (в начале, середине и конце контента) */}
      <div className="flex flex-col gap-4">
        <ShinyButton
          onClick={handleActionClick}
          text="Записаться на мероприятие"
        />
      </div>

      {/* 🛑 МОДАЛКА ДЛЯ НЕАВТОРИЗОВАННЫХ (Один шаг до регистрации) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 max-w-md w-full relative shadow-2xl">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900"
            >
              <X size={24} />
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-black mb-2">
                Один шаг до регистрации
              </h2>
              <p className="text-neutral-500 mb-6 text-sm">
                Войдите в свой аккаунт для завершения регистрации на наше
                замечательное мероприятие!
              </p>
              <button
                onClick={() => router.push("/sign-in")}
                className="w-full py-4 bg-neutral-100 hover:bg-neutral-200 text-black rounded-xl font-bold flex items-center justify-center gap-3 transition-colors"
              >
                Продолжить с Google
              </button>
              <p className="text-xs text-neutral-400 mt-4">
                Если у вас ещё нет аккаунта, просто войдите через Google, и мы
                создадим его за 15 секунд :)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ МОДАЛКА ДЛЯ АВТОРИЗОВАННЫХ (Выбор семьи и гостей) */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-md w-full relative shadow-2xl">
            <button
              onClick={() => setIsRegModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900"
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-black mb-1">
              Регистрация на {event.title}
            </h2>
            <p className="text-sm text-neutral-500 mb-6">
              {new Date(event.date).toLocaleDateString("ru-RU")}, {event.time}
            </p>

            {userData ? (
              <div className="space-y-6">
                {/* ВЫБОР СЕМЬИ */}
                <div>
                  <h3 className="font-bold text-sm mb-3">
                    Ваша семья (выберите участников):
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked
                        disabled
                        className="w-5 h-5 rounded text-[#FFB800]"
                      />
                      <span>{userData.firstName} (Вы)</span>
                    </label>

                    {userData.spouseName && (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded text-[#FFB800]"
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
                            className="w-5 h-5 rounded text-[#FFB800]"
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

                {/* ДОПОЛНИТЕЛЬНЫЕ ГОСТИ */}
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
                    <span className="text-sm">Дети (до 13 лет, гости)</span>
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
                    className="flex-1 py-3 rounded-xl bg-neutral-100 text-neutral-600 font-bold"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl bg-[#FFB800] text-black font-bold flex justify-center items-center"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      "Зарегистрироваться"
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
    </div>
  );
}
