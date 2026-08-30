"use client";

import { useState } from "react";
import { Loader2, Check, Plus, Trash2 } from "lucide-react";
import { completeUserProfile } from "@/actions/user";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function OnboardingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneCode: "+972",
    phone: "",
    dateOfBirth: "",
    city: "",
    maritalStatus: "",
    hasChildren: "",
    jewishStatus: "",
    source: "",
  });

  // 🔥 НОВЫЕ СТЕЙТЫ ДЛЯ СЕМЬИ
  const [spouseName, setSpouseName] = useState("");
  const [childrenList, setChildrenList] = useState([
    { name: "", dateOfBirth: "" },
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNums = e.target.value.replace(/[^0-9]/g, "");
    setFormData({ ...formData, phone: onlyNums });
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
    if (!agreed) return;
    setIsSubmitting(true);

    // Подготавливаем данные для БД
    const submitData = {
      ...formData,
      spouseName: formData.maritalStatus === "married" ? spouseName : null,
      childrenData: formData.hasChildren === "yes" ? childrenList : [],
    };

    const res = await completeUserProfile(userId, submitData);
    if (res.success) {
      router.refresh();
    } else {
      alert(`Ошибка базы данных:\n${res.message}`);
      setIsSubmitting(false);
    }
  };

  // Валидация
  const isChildrenValid =
    formData.hasChildren === "yes"
      ? childrenList.every((c) => c.name.trim().length > 1 && c.dateOfBirth)
      : true;

  const isSpouseValid =
    formData.maritalStatus === "married" ? spouseName.trim().length > 1 : true;

  const isFormValid =
    formData.firstName.trim().length >= 2 &&
    formData.lastName.trim().length >= 2 &&
    formData.phone.trim().length >= 7 &&
    formData.dateOfBirth &&
    formData.city.trim() &&
    formData.maritalStatus &&
    formData.hasChildren &&
    formData.jewishStatus &&
    isChildrenValid &&
    isSpouseValid &&
    agreed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl rounded-[40px] p-8 md:p-12 w-full border border-neutral-200/50 dark:border-neutral-800/50 relative overflow-hidden"
    >
      <div className="text-center mb-10 relative z-10">
        <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter mb-3">
          Добро{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
            пожаловать
          </span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium">
          Почти готово! Укажите ваши данные для общины.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 relative z-10 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">
              Имя *
            </label>
            <input
              required
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Иван"
              className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">
              Фамилия *
            </label>
            <input
              required
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Иванов"
              className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">
            Номер телефона *
          </label>
          <div className="flex gap-2">
            <select
              name="phoneCode"
              value={formData.phoneCode}
              onChange={handleChange}
              className="w-[110px] p-4 bg-neutral-100/50 border border-neutral-200 rounded-2xl font-medium"
            >
              <option value="+972">🇮🇱 +972</option>
              <option value="+7">🇷🇺 +7</option>
              <option value="+380">🇺🇦 +380</option>
            </select>
            <input
              required
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="5X XXX XXXX"
              className="flex-1 p-4 bg-neutral-100/50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">
            Ваш статус *
          </label>
          <select
            required
            name="jewishStatus"
            value={formData.jewishStatus}
            onChange={handleChange}
            className="w-full p-4 bg-neutral-100/50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 font-medium"
          >
            <option value="" disabled>
              Выберите...
            </option>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">
              Дата рождения *
            </label>
            <input
              required
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full p-4 bg-neutral-100/50 border border-neutral-200 rounded-2xl"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">
              Город проживания *
            </label>
            <input
              required
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Напр: Ришон ле-Цион"
              className="w-full p-4 bg-neutral-100/50 border border-neutral-200 rounded-2xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">
              Семейное положение *
            </label>
            <select
              required
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              className="w-full p-4 bg-neutral-100/50 border border-neutral-200 rounded-2xl"
            >
              <option value="" disabled>
                Выберите...
              </option>
              <option value="single">Холост / Не замужем</option>
              <option value="married">В браке</option>
              <option value="divorced">В разводе</option>
              <option value="widowed">Вдовец / Вдова</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">
              Есть ли дети? *
            </label>
            <select
              required
              name="hasChildren"
              value={formData.hasChildren}
              onChange={handleChange}
              className="w-full p-4 bg-neutral-100/50 border border-neutral-200 rounded-2xl"
            >
              <option value="" disabled>
                Выберите...
              </option>
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>
        </div>

        {/* 🔥 ДИНАМИЧЕСКИЕ ПОЛЯ ДЛЯ СУПРУГА И ДЕТЕЙ */}
        <AnimatePresence>
          {formData.maritalStatus === "married" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">
                Имя супруга/и *
              </label>
              <input
                required
                type="text"
                value={spouseName}
                onChange={(e) => setSpouseName(e.target.value)}
                placeholder="Имя супруга/и"
                className="w-full p-4 bg-orange-50/50 border border-orange-200 rounded-2xl outline-none focus:border-orange-400"
              />
            </motion.div>
          )}

          {formData.hasChildren === "yes" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden pt-2"
            >
              <div className="flex items-center justify-between pl-1">
                <label className="text-xs font-black uppercase tracking-widest text-neutral-500">
                  Данные детей *
                </label>
                <button
                  type="button"
                  onClick={addChild}
                  className="text-[#FFB800] text-xs font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} /> Добавить ребенка
                </button>
              </div>

              {childrenList.map((child, index) => (
                <div
                  key={index}
                  className="flex gap-3 items-start bg-orange-50/30 p-4 rounded-2xl border border-orange-100"
                >
                  <div className="flex-1 space-y-3">
                    <input
                      required
                      type="text"
                      placeholder="Имя ребенка"
                      value={child.name}
                      onChange={(e) =>
                        handleChildChange(index, "name", e.target.value)
                      }
                      className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-[#FFB800] text-sm"
                    />
                    <input
                      required
                      type="date"
                      value={child.dateOfBirth}
                      onChange={(e) =>
                        handleChildChange(index, "dateOfBirth", e.target.value)
                      }
                      className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none focus:border-[#FFB800] text-sm text-neutral-500"
                    />
                  </div>
                  {childrenList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChild(index)}
                      className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* СОГЛАСИЕ И КНОПКА ОТПРАВКИ */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-1 shrink-0">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer appearance-none w-5 h-5 border-2 border-neutral-300 rounded cursor-pointer checked:bg-[#FFB800] checked:border-[#FFB800] transition-all"
              />
              <Check
                size={14}
                className="absolute text-black opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3]"
              />
            </div>
            <span className="text-sm font-medium text-neutral-600 leading-snug">
              Я соглашаюсь с Политикой конфиденциальности.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className="w-full py-4 mt-4 bg-[#FFB800] hover:bg-[#E5A600] text-black rounded-2xl font-black uppercase tracking-[0.1em] transition-all disabled:opacity-50 flex justify-center items-center active:scale-[0.98]"
        >
          {isSubmitting ? (
            <Loader2 size={24} className="animate-spin text-black" />
          ) : (
            "Завершить регистрацию"
          )}
        </button>
      </form>
    </motion.div>
  );
}
