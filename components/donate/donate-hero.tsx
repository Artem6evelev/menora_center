"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Balancer from "react-wrap-balancer";
import { Heart, CreditCard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// Суммы в шекелях (кратные 18 - "Хай" / Жизнь)
const PRESET_AMOUNTS = [180, 360, 1800, 3600];

export const DonateHero = () => {
  const [isRecurring, setIsRecurring] = useState(true); // По умолчанию предлагаем подписку (лучшая практика)
  const [amount, setAmount] = useState<number | "custom">(360);
  const [customAmount, setCustomAmount] = useState<string>("");

  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden max-w-7xl mx-auto px-4 sm:px-6">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* --- ЛЕВАЯ ЧАСТЬ: ТЕКСТ И СМЫСЛЫ --- */}
        <div className="flex flex-col items-start text-left z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 mb-6"
          >
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span className="text-sm font-semibold text-rose-800 tracking-wide uppercase">
              Сила отдачи
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 mb-6"
          >
            <Balancer>
              Мир держится на{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-rose-500">
                добрых делах
              </span>
            </Balancer>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-lg text-neutral-500 font-medium leading-relaxed max-w-lg mb-8"
          >
            <Balancer>
              Каждый шекель вашей Цдаки превращается в горячий обед для пожилого
              человека, урок Торы для ребенка и светлый праздник для всей
              общины. Станьте партнером в нашем святом деле.
            </Balancer>
          </motion.p>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-4 text-sm font-semibold text-neutral-400"
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Безопасный платеж
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-5 h-5 text-blue-500" />
              Все карты и Bit
            </div>
          </motion.div>
        </div>

        {/* --- ПРАВАЯ ЧАСТЬ: ИНТЕРАКТИВНЫЙ ВИДЖЕТ --- */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md mx-auto lg:ml-auto lg:mr-0 transform-gpu will-change-transform z-10"
        >
          {/* Декоративный фон виджета */}
          <div className="absolute inset-0 -mx-6 -my-6 bg-gradient-to-tr from-rose-100/60 to-amber-50/60 rounded-[3rem] blur-2xl opacity-60 -z-10" />

          <div className="bg-white border border-neutral-200 rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-neutral-200/50 flex flex-col relative overflow-hidden">
            {/* Переключатель: Разово / Ежемесячно */}
            <div className="flex p-1 bg-neutral-100 rounded-xl mb-8 relative z-10">
              <button
                onClick={() => setIsRecurring(false)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 z-10",
                  !isRecurring
                    ? "text-neutral-900 shadow-sm bg-white"
                    : "text-neutral-500 hover:text-neutral-700",
                )}
              >
                Разово
              </button>
              <button
                onClick={() => setIsRecurring(true)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 z-10",
                  isRecurring
                    ? "text-neutral-900 shadow-sm bg-white"
                    : "text-neutral-500 hover:text-neutral-700",
                )}
              >
                Ежемесячно ❤️
              </button>
            </div>

            {/* Выбор суммы */}
            <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={cn(
                    "py-4 rounded-xl border-2 font-bold text-lg transition-all duration-200",
                    amount === preset
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-neutral-100 bg-white text-neutral-700 hover:border-neutral-200 hover:bg-neutral-50",
                  )}
                >
                  ₪ {preset}
                </button>
              ))}

              {/* Кнопка "Другая сумма" */}
              <button
                onClick={() => setAmount("custom")}
                className={cn(
                  "py-4 rounded-xl border-2 font-bold text-base transition-all duration-200 col-span-2",
                  amount === "custom"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-neutral-100 bg-white text-neutral-700 hover:border-neutral-200 hover:bg-neutral-50",
                )}
              >
                Другая сумма
              </button>
            </div>

            {/* Поле ввода кастомной суммы (Анимированное появление) */}
            <AnimatePresence>
              {amount === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="relative z-10 overflow-hidden"
                >
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-neutral-500 font-bold text-lg">
                      ₪
                    </span>
                    <input
                      type="number"
                      placeholder="Введите сумму"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full bg-white border-2 border-neutral-200 rounded-xl py-4 pl-10 pr-4 text-lg font-bold text-neutral-900 outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Итоговая кнопка оплаты */}
            <div className="mt-8 relative z-10">
              <button
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2",
                  "bg-neutral-900 text-white shadow-lg shadow-neutral-900/20",
                  "transition-all duration-300 hover:bg-neutral-800 hover:-translate-y-0.5 transform-gpu will-change-transform",
                )}
              >
                Пожертвовать{" "}
                {amount !== "custom" && amount > 0
                  ? `₪${amount}`
                  : customAmount
                    ? `₪${customAmount}`
                    : ""}
              </button>
              <p className="text-center text-xs text-neutral-400 mt-4 font-medium">
                Нажимая на кнопку, вы перейдете на защищенную страницу оплаты.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
