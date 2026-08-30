"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Check,
  Loader2,
  ArrowRight,
  X,
  Plus,
  Minus,
  UserPlus,
} from "lucide-react";
import {
  registerForEvent,
  checkRegistration,
  getUserFamilyData,
} from "@/actions/event";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/ru";

dayjs.locale("ru");

// УМНАЯ ФУНКЦИЯ ВОЗРАСТА (Ищет все возможные ключи из разных форм)
const getAge = (child: any) => {
  if (!child) return "?";
  if (child.age) return child.age; // Если возраст уже передан числом

  const dobString = child.dateOfBirth || child.birthDate;
  if (!dobString) return "?";

  const ageDifMs = Date.now() - new Date(dobString).getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export default function PublicEventCard({
  item,
  userId,
}: {
  item: any;
  userId?: string | null;
}) {
  const { event } = item;
  const router = useRouter();

  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Стейты семьи
  const [userData, setUserData] = useState<any>(null);
  const [selectedFamily, setSelectedFamily] = useState<{
    [key: string]: boolean;
  }>({ self: true });
  const [extraAdults, setExtraAdults] = useState(0);
  const [extraKids, setExtraKids] = useState(0);

  // 🔥 НОВЫЕ СТЕЙТЫ ДЛЯ ДОБАВЛЕНИЯ В ПРОФИЛЬ
  const [isAddingSpouse, setIsAddingSpouse] = useState(false);
  const [newSpouseName, setNewSpouseName] = useState("");
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildDob, setNewChildDob] = useState("");

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

  useEffect(() => {
    if (showFamilyModal && userId && !userData) {
      getUserFamilyData(userId).then(setUserData);
    }
  }, [showFamilyModal, userId, userData]);

  useEffect(() => {
    if (isModalOpen || showAuthModal || showFamilyModal)
      document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, showAuthModal, showFamilyModal]);

  const handleRegisterClick = () => {
    if (event.isRegistrationClosed || isRegistered) return;
    if (!userId) setShowAuthModal(true);
    else setShowFamilyModal(true);
  };

  const submitRegistration = async () => {
    if (!userId) return;
    setIsRegistering(true);

    // Формируем JSON гостей
    const extraData = { family: selectedFamily, extraAdults, extraKids };

    // Формируем дополнения для профиля (если пользователь заполнил новые поля)
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

      // Автоматически отмечаем их галочками для этого ивента
      if (profileUpdates.newSpouseName) extraData.family.spouse = true;
      if (profileUpdates.newChild) {
        const newChildIdx = userData?.childrenData?.length || 0;
        extraData.family[`child_${newChildIdx}`] = true;
      }
    }

    const res = await registerForEvent(
      event.id,
      userId,
      userData?.phone,
      extraData,
      profileUpdates,
    );

    if (res.success) {
      if (res.paymentUrl) window.location.href = res.paymentUrl;
      else {
        setIsRegistered(true);
        setShowFamilyModal(false);
      }
    } else {
      alert("Ошибка при регистрации: " + res.message);
    }
    setIsRegistering(false);
  };

  const authModalContent = showAuthModal ? (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => setShowAuthModal(false)}
    >
      <div
        className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-black mb-2 text-neutral-900">
          Один шаг до регистрации
        </h2>
        <p className="text-neutral-500 mb-6 text-sm font-medium">
          Войдите в свой аккаунт для завершения регистрации на наше
          замечательное мероприятие!
        </p>
        <button
          onClick={() => router.push("/sign-in?redirect_url=/events")}
          className="w-full py-4 bg-neutral-100 hover:bg-neutral-200 text-black rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors"
        >
          Продолжить с Google
        </button>
      </div>
    </div>
  ) : null;

  const familyModalContent = showFamilyModal ? (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setShowFamilyModal(false)}
    >
      <div
        className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowFamilyModal(false)}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 shrink-0 z-10"
        >
          <X size={24} />
        </button>

        <div className="shrink-0 mb-4">
          <h2 className="text-xl font-black mb-1 text-neutral-900">
            Регистрация на мероприятие
          </h2>
          <p className="text-sm text-neutral-500 font-medium line-clamp-1">
            "{event.title}"
          </p>
          <p className="text-xs text-neutral-400">
            {event.date ? dayjs(event.date).format("D MMMM, HH:mm") : ""}
          </p>
        </div>

        {userData ? (
          <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 space-y-6">
            <div>
              <h3 className="font-bold text-sm mb-3 text-neutral-900">
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
                  <span className="text-sm font-medium text-neutral-800">
                    {userData.firstName} (Вы)
                  </span>
                </label>

                {/* СУПРУГ(А) */}
                {userData.spouseName ? (
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
                    <span className="text-sm font-medium text-neutral-800">
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
                      <div className="flex items-center gap-2 mt-2 bg-orange-50/50 p-2 rounded-xl border border-orange-100">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Имя супруга/и"
                          value={newSpouseName}
                          onChange={(e) => setNewSpouseName(e.target.value)}
                          className="w-full bg-white border border-neutral-200 rounded-lg p-2 text-sm outline-none focus:border-[#FFB800]"
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
                        className="w-5 h-5 rounded text-[#FFB800] accent-[#FFB800]"
                        checked={!!selectedFamily[`child_${idx}`]}
                        onChange={(e) =>
                          setSelectedFamily({
                            ...selectedFamily,
                            [`child_${idx}`]: e.target.checked,
                          })
                        }
                      />
                      <span className="text-sm font-medium text-neutral-800">
                        {child.name}{" "}
                        <span className="text-neutral-400">
                          ({getAge(child)} лет)
                        </span>
                      </span>
                    </label>
                  ),
                )}

                {/* ДОБАВЛЕНИЕ НОВОГО РЕБЕНКА */}
                <div>
                  {!isAddingChild ? (
                    <button
                      onClick={() => setIsAddingChild(true)}
                      className="flex items-center gap-2 text-xs font-bold text-[#FFB800] hover:underline mt-2"
                    >
                      <UserPlus size={14} /> Добавить ребенка
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 mt-2 bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Имя ребенка"
                          value={newChildName}
                          onChange={(e) => setNewChildName(e.target.value)}
                          className="w-full bg-white border border-neutral-200 rounded-lg p-2 text-sm outline-none focus:border-[#FFB800]"
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
                        className="w-full bg-white border border-neutral-200 rounded-lg p-2 text-sm outline-none focus:border-[#FFB800] text-neutral-500"
                      />
                      <p className="text-[10px] text-neutral-400">
                        Дата рождения нужна для определения группы.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100">
              <h3 className="font-bold text-sm mb-4 text-neutral-900">
                Дополнительные гости:
              </h3>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 bg-neutral-100 rounded-full px-2 py-1 border border-neutral-200">
                  <button
                    onClick={() => setExtraAdults(Math.max(0, extraAdults - 1))}
                    className="p-1.5 hover:text-[#FFB800]"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="font-black w-4 text-center">
                    {extraAdults}
                  </span>
                  <button
                    onClick={() => setExtraAdults(extraAdults + 1)}
                    className="p-1.5 hover:text-[#FFB800]"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
                <span className="text-sm font-medium text-neutral-600">
                  Взрослые (гости)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 bg-neutral-100 rounded-full px-2 py-1 border border-neutral-200">
                  <button
                    onClick={() => setExtraKids(Math.max(0, extraKids - 1))}
                    className="p-1.5 hover:text-[#FFB800]"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="font-black w-4 text-center">
                    {extraKids}
                  </span>
                  <button
                    onClick={() => setExtraKids(extraKids + 1)}
                    className="p-1.5 hover:text-[#FFB800]"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
                <span className="text-sm font-medium text-neutral-600">
                  Дети (до 13 лет)
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-12 flex-1">
            <Loader2 className="animate-spin text-[#FFB800]" size={32} />
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-neutral-100 shrink-0 mt-4">
          <button
            onClick={() => setShowFamilyModal(false)}
            className="flex-1 py-3.5 rounded-xl bg-neutral-100 text-neutral-600 font-bold"
          >
            Отмена
          </button>
          <button
            onClick={submitRegistration}
            disabled={isRegistering}
            className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-[#FFB800] to-orange-500 text-white font-bold flex justify-center items-center shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isRegistering ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Зарегистрироваться"
            )}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col md:flex-row overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-4 right-4 z-50 p-2.5 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        <div className="w-full md:w-[45%] h-64 md:h-auto bg-neutral-100 relative shrink-0">
          <img
            src={eventImageUrl}
            alt={event.title}
            className="w-full h-full object-cover absolute inset-0"
          />
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFB800]/10 text-[#FFB800] text-[10px] font-black uppercase tracking-widest mb-6">
              <Calendar size={14} />{" "}
              {event.date
                ? dayjs(event.date).format("DD MMM YYYY")
                : "Дата не указана"}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tighter leading-tight mb-6">
              {event.title}
            </h2>
            <p className="text-neutral-600 whitespace-pre-wrap leading-relaxed font-medium">
              {event.description}
            </p>
          </div>
          <div className="p-6 md:px-10 border-t border-neutral-100 bg-neutral-50">
            {!isLoading && (
              <button
                onClick={handleRegisterClick}
                disabled={isRegistered || event.isRegistrationClosed}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                  event.isRegistrationClosed
                    ? "bg-red-50 text-red-500 border border-red-100 shadow-none cursor-not-allowed"
                    : isRegistered
                      ? "bg-green-500 text-white shadow-green-500/30 cursor-default"
                      : "bg-gradient-to-r from-[#FFB800] to-orange-500 text-white hover:opacity-90 active:scale-95 shadow-[#FFB800]/20"
                }`}
              >
                {event.isRegistrationClosed ? (
                  <>
                    <Check size={16} /> Запись закрыта
                  </>
                ) : isRegistered ? (
                  <>
                    <Check size={16} /> Вы записаны
                  </>
                ) : (
                  "Записаться на событие"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group relative rounded-[32px] overflow-hidden aspect-[3/4] bg-neutral-100 shadow-sm transition-all duration-500 hover:shadow-2xl cursor-pointer"
      >
        <img
          src={eventImageUrl}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
          <p className="text-[#FFB800] text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Calendar size={14} />{" "}
            {event.date ? dayjs(event.date).format("DD MMM") : ""}
          </p>
          <h3 className="text-white text-2xl font-black tracking-tighter leading-tight mb-4">
            {event.title}
          </h3>
          <button className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors border border-white/20 flex items-center justify-center gap-2">
            <ArrowRight size={16} /> Узнать подробности
          </button>
        </div>
      </div>

      {isModalOpen && mounted && createPortal(modalContent, document.body)}
      {mounted && createPortal(authModalContent, document.body)}
      {mounted && createPortal(familyModalContent, document.body)}
    </>
  );
}
