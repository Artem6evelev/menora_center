"use client";

import { useState } from "react";
import {
  User,
  Phone,
  MapPin,
  Heart,
  Baby,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
  Loader2,
  Mail,
} from "lucide-react";
import { updateUserProfile } from "@/actions/user";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// --- Вспомогательные функции для расчета возраста ---
function getPlural(number: number, words: string[]) {
  const cases = [2, 0, 1, 1, 1, 2];
  return words[
    number % 100 > 4 && number % 100 < 20
      ? 2
      : cases[number % 10 < 5 ? number % 10 : 5]
  ];
}

function calculateAge(dateString: string | Date | null) {
  if (!dateString) return "Возраст не указан";
  const birthDate = new Date(dateString);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 0) return "Ещё не родился";

  if (age === 0) {
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0) months += 12;
    if (today.getDate() < birthDate.getDate()) months--;

    if (months <= 0) return "Меньше месяца";
    return `${months} ${getPlural(months, ["месяц", "месяца", "месяцев"])}`;
  }

  return `${age} ${getPlural(age, ["год", "года", "лет"])}`;
}
// ----------------------------------------------------

export default function ProfileManager({ user }: { user: any }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Форматируем дату для input type="date"
  const formatDateForInput = (dateString: string | Date | null) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    dateOfBirth: formatDateForInput(user.dateOfBirth),
    city: user.city || "",
    maritalStatus: user.maritalStatus || "",
    jewishStatus: user.jewishStatus || "",
    hasChildren: user.hasChildren ? "yes" : "no",
  });

  const [spouseName, setSpouseName] = useState(user.spouseName || "");
  const [childrenList, setChildrenList] = useState<any[]>(
    Array.isArray(user.childrenData) && user.childrenData.length > 0
      ? user.childrenData
      : [{ name: "", dateOfBirth: "" }],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleChildChange = (
    index: number,
    field: "name" | "dateOfBirth",
    value: string,
  ) => {
    const newList = [...childrenList];
    newList[index][field] = value;
    setChildrenList(newList);
  };

  const addChild = () =>
    setChildrenList([...childrenList, { name: "", dateOfBirth: "" }]);
  const removeChild = (index: number) => {
    if (childrenList.length > 1) {
      setChildrenList(childrenList.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitData = {
      ...formData,
      spouseName,
      childrenData: childrenList,
    };

    const res = await updateUserProfile(user.id, submitData);
    if (res.success) {
      setIsEditing(false);
      router.refresh();
    } else {
      alert("Ошибка при сохранении профиля");
    }
    setIsSubmitting(false);
  };

  // ==========================================
  // РЕЖИМ ПРОСМОТРА ПРОФИЛЯ
  // ==========================================
  if (!isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-[32px] p-6 md:p-8 shadow-sm relative overflow-hidden"
      >
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-[#FFB800]/10 text-[#FFB800] rounded-xl">
              <User size={24} />
            </div>
            Мой Профиль
          </h2>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            <Edit2 size={16} />{" "}
            <span className="hidden sm:inline">Изменить</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <InfoRow
              icon={User}
              label="ФИО"
              value={`${user.firstName} ${user.lastName || ""}`}
            />
            <InfoRow
              icon={Mail}
              label="Email (не редактируется)"
              value={user.email}
            />
            <InfoRow icon={Phone} label="Телефон" value={user.phone} />
            <InfoRow icon={MapPin} label="Город" value={user.city} />
          </div>

          <div className="bg-orange-50/50 dark:bg-orange-950/20 p-6 md:p-8 rounded-3xl border border-orange-100 dark:border-orange-900/30 flex flex-col h-full">
            <h3 className="font-black text-sm uppercase tracking-widest text-neutral-500 mb-6">
              Семья
            </h3>
            <InfoRow
              icon={Heart}
              label="Статус"
              value={
                user.maritalStatus === "married"
                  ? `В браке (${user.spouseName || "Имя не указано"})`
                  : user.maritalStatus === "single"
                    ? "Холост / Не замужем"
                    : user.maritalStatus === "divorced"
                      ? "В разводе"
                      : user.maritalStatus === "widowed"
                        ? "Вдовец / Вдова"
                        : "Не указано"
              }
            />

            {user.hasChildren &&
              user.childrenData &&
              user.childrenData.length > 0 && (
                <div className="mt-6 pt-6 border-t border-orange-200/50 dark:border-orange-800/50 flex-1">
                  <div className="flex items-center gap-2 text-neutral-500 mb-4">
                    <Baby size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Дети ({user.childrenData.length})
                    </span>
                  </div>

                  {/* Адаптивная сетка карточек детей */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {user.childrenData.map((child: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white/60 dark:bg-neutral-900/50 border border-orange-200/50 dark:border-orange-800/50 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-neutral-900 dark:text-white text-sm truncate">
                            {child.name}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-medium mt-0.5">
                            {child.dateOfBirth
                              ? new Date(child.dateOfBirth).toLocaleDateString(
                                  "ru-RU",
                                )
                              : "Дата не указана"}
                          </div>
                        </div>
                        <div className="text-[11px] font-black px-2.5 py-1.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-lg shrink-0 text-center">
                          {calculateAge(child.dateOfBirth)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // РЕЖИМ РЕДАКТИРОВАНИЯ
  // ==========================================
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-neutral-900 border-2 border-[#FFB800] rounded-[32px] p-6 md:p-8 shadow-xl relative"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
          Редактирование профиля
        </h2>
        <button
          onClick={() => setIsEditing(false)}
          className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase ml-1">
              Имя
            </label>
            <input
              required
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full mt-1 p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#FFB800] transition-colors font-medium"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase ml-1">
              Фамилия
            </label>
            <input
              required
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full mt-1 p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#FFB800] transition-colors font-medium"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase ml-1">
              Телефон
            </label>
            <input
              required
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full mt-1 p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#FFB800] transition-colors font-medium"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase ml-1">
              Дата рождения
            </label>
            <input
              required
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full mt-1 p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#FFB800] transition-colors font-medium text-neutral-700 dark:text-neutral-300"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase ml-1">
              Город
            </label>
            <input
              required
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full mt-1 p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#FFB800] transition-colors font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase ml-1">
              Еврейский статус
            </label>
            <select
              required
              name="jewishStatus"
              value={formData.jewishStatus}
              onChange={handleChange}
              className="w-full mt-1 p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#FFB800] transition-colors font-medium"
            >
              <option value="Соблюдающий еврей">Соблюдающий еврей</option>
              <option value="Светский еврей">Светский еврей</option>
              <option value="Еврей по отцовской линии">
                Еврей по отцовской линии
              </option>
              <option value="Готовлюсь к Гиюру">Готовлюсь к Гиюру</option>
              <option value="Прошел гиюр">Прошел гиюр</option>
              <option value="Интересуюсь иудаизмом">
                Не имею еврейских корней, но интересуюсь
              </option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase ml-1">
              Семейное положение
            </label>
            <select
              required
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              className="w-full mt-1 p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#FFB800] transition-colors font-medium"
            >
              <option value="single">Холост / Не замужем</option>
              <option value="married">В браке</option>
              <option value="divorced">В разводе</option>
              <option value="widowed">Вдовец / Вдова</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase ml-1">
              Есть ли дети?
            </label>
            <select
              required
              name="hasChildren"
              value={formData.hasChildren}
              onChange={handleChange}
              className="w-full mt-1 p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#FFB800] transition-colors font-medium"
            >
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>
        </div>

        {/* Динамические поля семьи */}
        <AnimatePresence>
          {formData.maritalStatus === "married" && (
            <motion.div
              key="spouse-field"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-2"
            >
              <label className="text-xs font-bold text-neutral-500 uppercase ml-1">
                Имя супруга/и
              </label>
              <input
                required
                type="text"
                value={spouseName}
                onChange={(e) => setSpouseName(e.target.value)}
                className="w-full mt-1 p-3.5 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-xl outline-none focus:border-orange-400 font-medium"
              />
            </motion.div>
          )}

          {formData.hasChildren === "yes" && (
            <motion.div
              key="children-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden pt-6 border-t border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-500 uppercase ml-1">
                  Данные детей
                </label>
                <button
                  type="button"
                  onClick={addChild}
                  className="text-[#FFB800] bg-[#FFB800]/10 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 hover:bg-[#FFB800]/20 transition-colors"
                >
                  <Plus size={14} strokeWidth={3} /> Добавить
                </button>
              </div>

              <div className="space-y-3">
                {childrenList.map((child, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30"
                  >
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        required
                        type="text"
                        placeholder="Имя ребенка"
                        value={child.name}
                        onChange={(e) =>
                          handleChildChange(index, "name", e.target.value)
                        }
                        className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#FFB800] text-sm font-medium"
                      />
                      <input
                        required
                        type="date"
                        value={child.dateOfBirth}
                        onChange={(e) =>
                          handleChildChange(
                            index,
                            "dateOfBirth",
                            e.target.value,
                          )
                        }
                        className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-[#FFB800] text-sm font-medium text-neutral-700 dark:text-neutral-300"
                      />
                    </div>
                    {childrenList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChild(index)}
                        className="w-full sm:w-auto p-3 text-red-400 hover:text-red-600 bg-white dark:bg-neutral-900 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl border border-neutral-200 dark:border-neutral-800 transition-colors flex justify-center items-center"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800 mt-8">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black tracking-wide bg-[#FFB800] text-black hover:bg-[#E5A600] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-[#FFB800]/20"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Check size={18} strokeWidth={3} /> Сохранить профиль
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// Строка информации для режима просмотра
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | undefined | null;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-11 h-11 rounded-[14px] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">
          {label}
        </div>
        <div className="font-bold text-neutral-900 dark:text-white leading-tight">
          {value || "Не указано"}
        </div>
      </div>
    </div>
  );
}
