// @/components/dashboard/main/onboarding-form.tsx
"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { completeUserProfile } from "@/actions/user";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function OnboardingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "", // НОВОЕ
    lastName: "", // НОВОЕ
    phoneCode: "+972",
    phone: "",
    dateOfBirth: "",
    city: "",
    maritalStatus: "",
    hasChildren: "",
    jewishStatus: "",
    source: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNums = e.target.value.replace(/[^0-9]/g, "");
    setFormData({ ...formData, phone: onlyNums });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setIsSubmitting(true);

    const res = await completeUserProfile(userId, formData);
    if (res.success) {
      router.refresh();
    } else {
      alert(`Ошибка базы данных:\n${res.message}`);
      setIsSubmitting(false);
    }
  };

  // Валидация: добавили проверку Имени и Фамилии
  const isFormValid =
    formData.firstName.trim().length >= 2 &&
    formData.lastName.trim().length >= 2 &&
    formData.phone.trim().length >= 7 &&
    formData.dateOfBirth &&
    formData.city.trim() &&
    formData.maritalStatus &&
    formData.hasChildren &&
    formData.jewishStatus &&
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

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        {/* НОВЫЙ БЛОК: ИМЯ И ФАМИЛИЯ */}
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
              className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all text-neutral-900 dark:text-white"
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
              className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all text-neutral-900 dark:text-white"
            />
          </div>
        </div>

        {/* НОМЕР ТЕЛЕФОНА */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">
            Номер телефона *
          </label>
          <div className="flex gap-2">
            <select
              name="phoneCode"
              value={formData.phoneCode}
              onChange={handleChange}
              className="w-[110px] p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 rounded-2xl font-medium text-neutral-900 dark:text-white"
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
              className="flex-1 p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all"
            />
          </div>
        </div>

        {/* СТАТУС (ОСТАВЛЯЕМ БЕЗ ИЗМЕНЕНИЙ) */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">
            Ваш статус *
          </label>
          <select
            required
            name="jewishStatus"
            value={formData.jewishStatus}
            onChange={handleChange}
            className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium text-neutral-900 dark:text-white appearance-none"
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
            <option value="Прошел гиюр">
              Прошел гиюр (ортодоксальный/неортодоксальный)
            </option>
            <option value="Интересуюсь иудаизмом">
              Не имею еврейских корней, но интересуюсь иудаизмом :)
            </option>
          </select>
        </div>

        {/* ДАТА РОЖДЕНИЯ И ГОРОД */}
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
              className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 rounded-2xl text-neutral-900 dark:text-white"
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
              className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 rounded-2xl text-neutral-900 dark:text-white"
            />
          </div>
        </div>

        {/* СЕМЕЙНОЕ ПОЛОЖЕНИЕ И ДЕТИ */}
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
              className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 rounded-2xl text-neutral-900 dark:text-white appearance-none"
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
              className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 rounded-2xl text-neutral-900 dark:text-white appearance-none"
            >
              <option value="" disabled>
                Выберите...
              </option>
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>
        </div>

        {/* ИСТОЧНИК */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">
            Откуда вы о нас узнали?
          </label>
          <input
            type="text"
            name="source"
            value={formData.source}
            onChange={handleChange}
            placeholder="Друзья, Instagram, Facebook..."
            className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 rounded-2xl text-neutral-900 dark:text-white"
          />
        </div>

        {/* СОГЛАСИЕ */}
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
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 leading-snug">
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
