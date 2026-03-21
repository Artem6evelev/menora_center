"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { completeUserProfile } from "@/actions/user";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function OnboardingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false); // Согласие с правилами

  const [formData, setFormData] = useState({
    phoneCode: "+972",
    phone: "",
    dateOfBirth: "",
    city: "",
    maritalStatus: "",
    hasChildren: "",
    jewishStatus: "", // Новое поле
    source: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Жесткая валидация: оставляем ТОЛЬКО цифры для телефона
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNums = e.target.value.replace(/[^0-9]/g, "");
    setFormData({ ...formData, phone: onlyNums });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return; // Защита на всякий случай
    setIsSubmitting(true);

    const res = await completeUserProfile(userId, formData);
    if (res.success) {
      router.refresh();
    } else {
      alert(`Ошибка базы данных:\n${res.message}`);
      setIsSubmitting(false);
    }
  };

  // Кнопка активна только если все обязательные поля заполнены и нажата галочка
  const isFormValid =
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
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] p-8 md:p-12 w-full border border-neutral-200/50 dark:border-neutral-800/50 relative overflow-hidden"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#FFB800]/10 blur-[60px] pointer-events-none rounded-full" />

      <div className="text-center mb-10 relative z-10">
        <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter mb-3">
          Добро{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
            пожаловать
          </span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium">
          Заполните небольшую анкету для завершения регистрации в Menora Center.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        {/* ТЕЛЕФОН С КОДОМ СТРАНЫ */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2 pl-1">
            Номер телефона *
          </label>
          <div className="flex gap-2">
            <select
              name="phoneCode"
              value={formData.phoneCode}
              onChange={handleChange}
              className="w-[110px] p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium text-neutral-900 dark:text-white cursor-pointer appearance-none text-center"
            >
              <option value="+972">🇮🇱 +972</option>
              <option value="+7">🇷🇺 +7</option>
              <option value="+380">🇺🇦 +380</option>
              <option value="+1">🇺🇸 +1</option>
            </select>
            <input
              required
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="5X XXX XXXX"
              className="flex-1 p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium text-neutral-900 dark:text-white"
            />
          </div>
        </div>

        {/* НОВОЕ ПОЛЕ: СТАТУС */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2 pl-1">
            Ваш статус *
          </label>
          <select
            required
            name="jewishStatus"
            value={formData.jewishStatus}
            onChange={handleChange}
            className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium text-neutral-900 dark:text-white cursor-pointer appearance-none"
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
              Не имею еврейских корней, но очень интересуюсь иудаизмом :)
            </option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2 pl-1">
              Дата рождения *
            </label>
            <input
              required
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium text-neutral-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2 pl-1">
              Город проживания *
            </label>
            <input
              required
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Напр: Ришон ле-Цион"
              className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium text-neutral-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2 pl-1">
              Семейное положение *
            </label>
            <select
              required
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium text-neutral-900 dark:text-white cursor-pointer appearance-none"
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
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2 pl-1">
              Есть ли дети? *
            </label>
            <select
              required
              name="hasChildren"
              value={formData.hasChildren}
              onChange={handleChange}
              className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium text-neutral-900 dark:text-white cursor-pointer appearance-none"
            >
              <option value="" disabled>
                Выберите...
              </option>
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2 pl-1 flex items-center gap-2">
            Откуда вы о нас узнали?{" "}
            <span className="text-[10px] bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-500 normal-case tracking-normal">
              Необязательно
            </span>
          </label>
          <input
            type="text"
            name="source"
            value={formData.source}
            onChange={handleChange}
            placeholder="Друзья, Instagram, Facebook..."
            className="w-full p-4 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all font-medium text-neutral-900 dark:text-white"
          />
        </div>

        {/* ГАЛОЧКА СОГЛАСИЯ */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-1 shrink-0">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer appearance-none w-5 h-5 border-2 border-neutral-300 dark:border-neutral-600 rounded cursor-pointer checked:bg-[#FFB800] checked:border-[#FFB800] transition-all"
              />
              <Check
                size={14}
                className="absolute text-black opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3]"
              />
            </div>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 leading-snug">
              Я соглашаюсь с{" "}
              <a
                href="/privacy"
                target="_blank"
                className="text-black dark:text-white underline decoration-[#FFB800] underline-offset-2 hover:text-[#FFB800] transition-colors"
              >
                Политикой конфиденциальности
              </a>{" "}
              и правилами обработки персональных данных.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className="w-full py-4 mt-4 bg-[#FFB800] hover:bg-[#E5A600] text-black rounded-2xl font-black uppercase tracking-[0.1em] transition-all duration-300 disabled:opacity-50 disabled:hover:bg-[#FFB800] disabled:cursor-not-allowed flex justify-center items-center shadow-xl shadow-[#FFB800]/20 active:scale-[0.98]"
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
