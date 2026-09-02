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
  UserPlus,
} from "lucide-react";
import {
  registerForEvent,
  getUserFamilyData,
  checkRegistration,
} from "@/actions/event";
import { useClerk } from "@clerk/nextjs";

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

// Функция расчета возраста
const getAge = (child: any) => {
  if (!child) return "?";
  if (child.age) return child.age;
  const dobString = child.dateOfBirth || child.birthDate;
  if (!dobString) return "?";
  const ageDifMs = Date.now() - new Date(dobString).getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export default function SingleEventClient({
  eventData,
  userId,
}: {
  eventData: any;
  userId: string | null;
}) {
  const router = useRouter();
  const clerk = useClerk();

  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const [extraAdults, setExtraAdults] = useState(0);
  const [extraKids, setExtraKids] = useState(0);
  const [selectedFamily, setSelectedFamily] = useState<{
    [key: string]: boolean;
  }>({ self: true });

  // 🔥 СТЕЙТЫ ДЛЯ ДОБАВЛЕНИЯ В ПРОФИЛЬ
  const [isAddingSpouse, setIsAddingSpouse] = useState(false);
  const [newSpouseName, setNewSpouseName] = useState("");

  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildDob, setNewChildDob] = useState("");

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

  const handleGoogleDirectLogin = async () => {
    setIsGoogleRedirecting(true);
    try {
      // @ts-ignore
      await clerk.client.signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-in",
        redirectUrlComplete: `/events/${eventData.id}`,
      });
    } catch (error) {
      console.error("Ошибка редиректа:", error);
      setIsGoogleRedirecting(false);
    }
  };

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

  const handleRegisterClick = () => {
    if (eventData.isRegistrationClosed || isRegistered) return;
    setIsRegModalOpen(true);
  };

  const handleRegisterSubmit = async () => {
    setIsLoading(true);

    // Подготовка экстра-данных
    const extraData: any = {
      family: { ...selectedFamily },
      extraAdults,
      extraKids,
    };

    // Подготовка обновлений профиля (если юзер ввел новые данные в модалке)
    let profileUpdates: any = undefined;
    if (
      (isAddingSpouse && newSpouseName.trim()) ||
      (isAddingChild && newChildName.trim() && newChildDob)
    ) {
      profileUpdates = {
        newSpouseName:
          isAddingSpouse && newSpouseName.trim() ? newSpouseName : undefined,
        newChild:
          isAddingChild && newChildName.trim() && newChildDob
            ? { name: newChildName, dateOfBirth: newChildDob }
            : undefined,
      };

      // Автоматически ставим им галочки для этого конкретного ивента
      if (profileUpdates.newSpouseName) extraData.family.spouse = true;
      if (profileUpdates.newChild) {
        const newChildIdx = userData?.childrenData?.length || 0;
        extraData.family[`child_${newChildIdx}`] = true;
      }
    }

    const res = await registerForEvent(
      eventData.id,
      userId,
      userData?.phone,
      extraData,
      profileUpdates,
    );

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

      {/* МОДАЛКА РЕГИСТРАЦИИ (ВЫБОР СЕМЬИ + ДОБАВЛЕНИЕ) */}
      {isRegModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsRegModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsRegModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white shrink-0 z-10"
            >
              <X size={24} />
            </button>

            <div className="shrink-0 mb-6">
              <h2 className="text-xl font-black mb-1 line-clamp-2 pr-6">
                Регистрация на {eventData.title}
              </h2>
              <p className="text-sm text-neutral-500">{formattedDate}</p>
            </div>

            {userData ? (
              <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 space-y-6">
                {/* СЕКЦИЯ: ВАША СЕМЬЯ */}
                <div>
                  <h3 className="font-bold text-sm mb-3">Ваша семья:</h3>
                  <div className="space-y-3">
                    {/* Вы сами */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked
                        disabled
                        className="w-5 h-5 rounded accent-[#FFB800]"
                      />
                      <span className="text-sm font-medium">
                        {userData.firstName} (Вы)
                      </span>
                    </label>

                    {/* СУПРУГ(А) */}
                    {userData.spouseName ? (
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
                        <span className="text-sm font-medium">
                          {userData.spouseName} (Супруг/а)
                        </span>
                      </label>
                    ) : (
                      <div>
                        {!isAddingSpouse ? (
                          <button
                            onClick={() => setIsAddingSpouse(true)}
                            className="flex items-center gap-2 text-xs font-bold text-[#FFB800] hover:underline mt-2"
                          >
                            <UserPlus size={14} /> Указать супруга/у
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 mt-2 bg-orange-50/50 dark:bg-orange-950/20 p-2 rounded-xl border border-orange-100 dark:border-orange-900/30">
                            <input
                              autoFocus
                              type="text"
                              placeholder="Имя супруга/и"
                              value={newSpouseName}
                              onChange={(e) => setNewSpouseName(e.target.value)}
                              className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 text-sm outline-none focus:border-[#FFB800]"
                            />
                            <button
                              onClick={() => {
                                setIsAddingSpouse(false);
                                setNewSpouseName("");
                              }}
                              className="p-2 text-neutral-400 hover:text-red-500"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ДЕТИ */}
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
                          <span className="text-sm font-medium">
                            {child.name}{" "}
                            <span className="text-neutral-400 font-normal">
                              ({getAge(child)} лет)
                            </span>
                          </span>
                        </label>
                      ),
                    )}

                    {/* ДОБАВИТЬ НОВОГО РЕБЕНКА */}
                    <div>
                      {!isAddingChild ? (
                        <button
                          onClick={() => setIsAddingChild(true)}
                          className="flex items-center gap-2 text-xs font-bold text-[#FFB800] hover:underline mt-2"
                        >
                          <UserPlus size={14} /> Добавить ребенка
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2 mt-2 bg-orange-50/50 dark:bg-orange-950/20 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30">
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              type="text"
                              placeholder="Имя ребенка"
                              value={newChildName}
                              onChange={(e) => setNewChildName(e.target.value)}
                              className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 text-sm outline-none focus:border-[#FFB800]"
                            />
                            <button
                              onClick={() => {
                                setIsAddingChild(false);
                                setNewChildName("");
                                setNewChildDob("");
                              }}
                              className="p-2 text-neutral-400 hover:text-red-500 shrink-0"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <input
                            type="date"
                            value={newChildDob}
                            onChange={(e) => setNewChildDob(e.target.value)}
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 text-sm outline-none focus:border-[#FFB800] text-neutral-500"
                          />
                          <p className="text-[10px] text-neutral-400 leading-tight">
                            Укажите дату рождения, она навсегда сохранится в
                            профиле для записи в детские группы.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* СЕКЦИЯ: ДОПОЛНИТЕЛЬНЫЕ ГОСТИ */}
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <h3 className="font-bold text-sm mb-4">
                    Дополнительные гости:
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">
                      Взрослые (гости)
                    </span>
                    <div className="flex items-center gap-4 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-1">
                      <button
                        onClick={() =>
                          setExtraAdults(Math.max(0, extraAdults - 1))
                        }
                        className="p-1 hover:text-[#FFB800]"
                      >
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <span className="font-black w-4 text-center">
                        {extraAdults}
                      </span>
                      <button
                        onClick={() => setExtraAdults(extraAdults + 1)}
                        className="p-1 hover:text-[#FFB800]"
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Дети (до 13 лет)
                    </span>
                    <div className="flex items-center gap-4 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-1">
                      <button
                        onClick={() => setExtraKids(Math.max(0, extraKids - 1))}
                        className="p-1 hover:text-[#FFB800]"
                      >
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <span className="font-black w-4 text-center">
                        {extraKids}
                      </span>
                      <button
                        onClick={() => setExtraKids(extraKids + 1)}
                        className="p-1 hover:text-[#FFB800]"
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-12 flex-1">
                <Loader2 className="animate-spin text-[#FFB800]" size={32} />
              </div>
            )}

            {/* КНОПКИ УПРАВЛЕНИЯ */}
            <div className="flex gap-3 pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
              <button
                onClick={() => setIsRegModalOpen(false)}
                className="flex-1 py-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-600 dark:text-neutral-300"
              >
                Отмена
              </button>
              <button
                onClick={handleRegisterSubmit}
                disabled={isLoading}
                className="flex-[1.5] py-3.5 rounded-xl bg-gradient-to-r from-[#FFB800] to-orange-500 text-white font-black uppercase tracking-widest flex justify-center items-center shadow-lg active:scale-95 text-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "Записаться"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
