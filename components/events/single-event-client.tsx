"use client";

import { useState, useEffect } from "react";
import ChildEditor from "@/components/community/child-editor";
import { saveOwnChildren } from "@/actions/community-children";
import Link from "next/link";
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
  Lock,
} from "lucide-react";
import {
  registerForEvent,
  getUserFamilyData,
  checkRegistration,
} from "@/actions/event";
import AccessScreen from "@/components/community/access-screen";
import dayjs from "dayjs";
import "dayjs/locale/ru";

dayjs.locale("ru");

const ShinyButton = ({
  onClick,
  text,
  disabled,
  isSuccess,
  isClosed,
}: {
  onClick: () => void;
  text: string;
  disabled?: boolean;
  isSuccess?: boolean;
  isClosed?: boolean;
}) => {
  if (isClosed) {
    return (
      <button
        disabled
        className="w-full py-4 rounded-2xl text-red-500 font-black uppercase tracking-widest bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 shadow-none cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Lock size={18} /> Запись закрыта
      </button>
    );
  }

  return (
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
};

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
  canRegisterChildren = false,
  canRegisterSelf = true,
  canClarifyChildren = false,
}: {
  eventData: any;
  userId: string | null;
  canRegisterChildren?: boolean;
  canRegisterSelf?: boolean;
  canClarifyChildren?: boolean;
}) {
  const router = useRouter();

  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [familyError, setFamilyError] = useState(false);

  // 🔥 ВЕРНУЛИ СОСТОЯНИЕ IFRAME 🔥
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  const [extraAdults, setExtraAdults] = useState(0);
  const extraKids = 0;
  const [selectedFamily, setSelectedFamily] = useState<{
    [key: string]: boolean;
  }>({ self: true });

  const [isAddingSpouse, setIsAddingSpouse] = useState(false);
  const [newSpouseName, setNewSpouseName] = useState("");



  const eventImageUrl = eventData.imageUrl || "/default-event-poster.png";
  const isClosed = eventData.isRegistrationClosed;

  useEffect(() => {
    if (userId) {
      checkRegistration(eventData.id, userId).then(setIsRegistered);
    }
  }, [userId, eventData.id]);

  useEffect(() => {
    if (!isRegModalOpen || !userId) return;
    let cancelled = false;
    setFamilyError(false); setUserData(null);
    getUserFamilyData(userId).then(data => {
      if (!cancelled) { setUserData(data); setFamilyError(!data); }
    }).catch(() => { if (!cancelled) setFamilyError(true); });
    return () => { cancelled = true; };
  }, [isRegModalOpen, userId]);

  // 🔥 БЛОКИРУЕМ СКРОЛЛ ПРИ ОТКРЫТОМ IFRAME 🔥
  useEffect(() => {
    if (isRegModalOpen || iframeUrl) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isRegModalOpen, iframeUrl]);

  const calculateTotal = () => {
    if (eventData.isFree) return 0;

    const adultPrice = parseFloat(eventData.price) || 0;
    const childPrice = parseFloat(eventData.childPrice) || 0;

    let adultsCount = 1 + Number(isAddingSpouse && !!newSpouseName.trim());
    if (selectedFamily.spouse) adultsCount++;
    adultsCount += extraAdults;

    let kidsCount = 0;
    const kidsKeys = Object.keys(selectedFamily).filter((k) =>
      k.startsWith("child_"),
    );
    kidsKeys.forEach((k) => {
      if (selectedFamily[k]) kidsCount++;
    });

    return Math.round((adultsCount * adultPrice + kidsCount * childPrice) * 100) / 100;
  };

  const totalAmount = calculateTotal();

  const handleRegisterClick = () => {
    if (isClosed || isRegistered || !canRegisterSelf) return;
    setIsRegModalOpen(true);
  };

  const handleRegisterSubmit = async () => {
    setIsLoading(true);
    const extraData: any = {
      family: { ...selectedFamily },
      extraAdults,
      extraKids,
    };

    const profileUpdates = isAddingSpouse && newSpouseName.trim() ? { newSpouseName } : undefined;
    if (profileUpdates) extraData.family.spouse = true;
    try {
    const res = await registerForEvent(
      eventData.id,
      userId!,
      userData?.phone,
      extraData,
      profileUpdates,
      totalAmount,
    );

    if (res.success) {
      if (res.paymentUrl) {
        // 🔥 ОТКРЫВАЕМ IFRAME ВМЕСТО РЕДИРЕКТА 🔥
        setIsRegModalOpen(false);
        setIframeUrl(res.paymentUrl);
        setIsLoading(false);
      } else {
        setIsRegistered(true);
        setIsRegModalOpen(false);
        setIsLoading(false);
      }
    } else {
      alert("Ошибка: " + res.message);
      router.refresh();
    }
    } catch { alert("Не удалось отправить заявку. Попробуйте ещё раз."); }
    finally { setIsLoading(false); }
  };

  if (!userId) return <AccessScreen returnTo={`/events/${eventData.id}`} />;

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
    if (!canRegisterSelf) return { text: "Для записи заполните анкету", disabled: true, isSuccess: false, isClosed: false };
    if (isClosed)
      return {
        text: "Запись закрыта",
        disabled: true,
        isSuccess: false,
        isClosed: true,
      };
    if (isRegistered)
      return {
        text: "Вы успешно записаны",
        disabled: true,
        isSuccess: true,
        isClosed: false,
      };
    return {
      text: "Записаться на мероприятие",
      disabled: false,
      isSuccess: false,
      isClosed: false,
    };
  };

  const btnState = getButtonState();

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-24 md:pt-32 pb-20 relative">
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
                  isClosed={btnState.isClosed}
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
                  {eventData.isFree ? (
                    "Участие бесплатное"
                  ) : (
                    <div className="flex flex-col">
                      <span>
                        Взрослые:{" "}
                        {eventData.price ? `${eventData.price} ₪` : "0 ₪"}
                      </span>
                      {eventData.childPrice && (
                        <span className="text-neutral-500 text-xs">
                          Дети: {eventData.childPrice} ₪
                        </span>
                      )}
                    </div>
                  )}
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
                    isClosed={btnState.isClosed}
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
                isClosed={btnState.isClosed}
              />
            </div>
          </div>
        </div>
      </div>

      {/* МОДАЛКА РЕГИСТРАЦИИ (ВЫБОР СЕМЬИ) */}
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
              aria-label="Закрыть запись"
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white shrink-0 z-10"
            >
              <X size={24} />
            </button>

            <div className="shrink-0 mb-6 pr-6">
              <h2 className="text-xl font-black mb-1 line-clamp-2">
                Регистрация на {eventData.title}
              </h2>
              <p className="text-sm text-neutral-500">{formattedDate}</p>
            </div>

            {familyError ? <p role="alert" className="py-8 text-red-600">Не удалось загрузить профиль. Закройте окно и повторите попытку.</p> : userData ? (
              <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 space-y-6">
                {/* СЕКЦИЯ: ВАША СЕМЬЯ */}
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
                      <span className="text-sm font-medium">
                        {userData.firstName} (Вы)
                      </span>
                    </label>

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

                    {(canRegisterChildren ? userData.childrenData || [] : []).map(
                      (child: any, idx: number) => (
                        <label
                          key={idx}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded accent-[#FFB800]"
                            checked={!!selectedFamily[`child_${child.id}`]}
                            onChange={(e) =>
                              setSelectedFamily({
                                ...selectedFamily,
                                [`child_${child.id}`]: e.target.checked,
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

                    {canRegisterChildren && <ChildEditor items={userData.childrenData || []} onSave={async next => {
                      const result = await saveOwnChildren(next, userId!);
                      if (!result.success) throw new Error(result.error);
                      const previous = new Set((userData.childrenData || []).map((child: any) => child.id));
                      setUserData({ ...userData, childrenData: result.children });
                      setSelectedFamily(current => {
                        const selected = { self: true, ...(current.spouse ? { spouse: true } : {}) } as Record<string, boolean>;
                        result.children.forEach(child => { selected[`child_${child.id}`] = !previous.has(child.id) || !!current[`child_${child.id}`]; });
                        return selected;
                      });
                    }} />}
                    {canClarifyChildren && <Link className="block underline font-bold text-sm" href={`/dashboard/kids?returnTo=${encodeURIComponent(`/events/${eventData.id}`)}`}>Добавить или записать ребёнка — уточнить этап гиюра</Link>}
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
                        aria-label="Уменьшить количество взрослых"
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
                        aria-label="Увеличить количество взрослых"
                        onClick={() => setExtraAdults(extraAdults + 1)}
                        className="p-1 hover:text-[#FFB800]"
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-3">Дети записываются из связанного профиля мамы. Для исключения обратитесь к администратору.</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-12 flex-1">
                <Loader2 className="animate-spin text-[#FFB800]" size={32} />
              </div>
            )}

            {/* ИТОГ И КНОПКИ */}
            <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
              {!eventData.isFree && totalAmount > 0 && (
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black text-neutral-900 dark:text-white">
                    Итого к оплате:
                  </span>
                  <span className="text-2xl font-black text-[#FFB800]">
                    {totalAmount} ₪
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setIsRegModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-600 dark:text-neutral-300"
                >
                  Отмена
                </button>
                <button
                  onClick={handleRegisterSubmit}
                  disabled={isLoading || !userData || familyError}
                  className="flex-[1.5] py-3.5 rounded-xl bg-gradient-to-r from-[#FFB800] to-orange-500 text-white font-black uppercase tracking-widest flex justify-center items-center shadow-lg active:scale-95 text-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : eventData.isFree || totalAmount === 0 ? (
                    "Записаться"
                  ) : (
                    "Оплатить"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 ВЕРНУЛАСЬ МОДАЛКА С IFRAME 🔥 */}
      {iframeUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl h-[90vh] bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 md:p-5 bg-neutral-50 dark:bg-neutral-950 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="font-black text-lg text-neutral-900 dark:text-white leading-none mb-1">
                  Оплата участия
                </h3>
                <p className="text-xs font-bold text-[#FFB800] uppercase tracking-widest">
                  Secured by Shutafim
                </p>
              </div>
              <button
                aria-label="Закрыть окно оплаты"
                onClick={() => {
                  setIframeUrl(null);
                  setExtraAdults(0);
                  setSelectedFamily({ self: true });
                  setIsAddingSpouse(false);
                  setNewSpouseName("");
                }}
                className="p-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition active:scale-90"
              >
                <X
                  size={20}
                  className="text-neutral-600 dark:text-neutral-300"
                />
              </button>
            </div>

            <div className="flex-1 w-full bg-white relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-0">
                <Loader2
                  className="animate-spin text-[#FFB800] mb-4"
                  size={40}
                />
                <p className="text-neutral-500 font-medium">
                  Загрузка платежного шлюза...
                </p>
              </div>

              <iframe
                src={iframeUrl}
                className="w-full h-full relative z-10 border-none bg-white"
                allow="payment"
                title="Оплата Shutafim"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
