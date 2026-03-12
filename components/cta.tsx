"use client";

import React from "react";
import Balancer from "react-wrap-balancer";
import Link from "next/link";
import { Button } from "./button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const CTA = () => {
  return (
    <section className="py-12 md:py-20 lg:py-32 w-full overflow-hidden relative z-30 bg-white">
      <div className="px-4 md:px-8 max-w-6xl mx-auto w-full">
        {/* 🚀 PERFORMANCE & UX: Плавное появление всего блока CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          // 🚀 Используем кастомный Easing (Apple/Linear style)
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 w-full bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl transform-gpu will-change-transform"
        >
          <div className="relative px-6 py-12 md:py-20 lg:px-20 text-center">
            {/* Текстура шума 
                🚀 Убрали сложный maskImage, используем mix-blend-overlay для более дешевого рендера шума
            */}
            <div
              className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: "url(/noise.webp)",
                backgroundSize: "150px", // Фиксированный размер для тайлинга быстрее рендерится
                backgroundRepeat: "repeat",
              }}
              aria-hidden="true"
            />

            {/* Золотое свечение */}
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-full h-full select-none overflow-hidden rounded-2xl transform-gpu"
              style={{
                background:
                  "radial-gradient(circle at 100% 0%, rgba(251, 191, 36, 0.25) 0%, transparent 60%)",
              }}
              aria-hidden="true"
            />

            {/* Дополнительное свечение для мобильных снизу 
                🚀 Добавили transform-gpu и will-change-transform для blur 
            */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/20 blur-[60px] md:hidden transform-gpu will-change-transform pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                <Balancer>
                  Станьте частью нашей <br className="hidden sm:block" />
                  <span className="text-amber-400">еврейской семьи</span>
                </Balancer>
              </h2>

              <p className="mt-2 md:mt-4 max-w-[32rem] text-center text-sm md:text-base/7 text-blue-100 font-medium opacity-90">
                <Balancer>
                  Неважно, ищете ли вы знания, духовную поддержку или просто
                  друзей. В Менора Центре вас всегда ждут. Вместе мы делаем этот
                  мир светлее.
                </Balancer>
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 md:mt-12 w-full sm:w-auto">
                {/* Кнопка 1: Вступить */}
                <Link href="/join" className="w-full sm:w-auto">
                  <Button
                    className={cn(
                      "w-full sm:w-auto bg-white text-blue-900 hover:bg-blue-50 font-bold px-8 h-12 text-base rounded-xl",
                      "shadow-[0_0_20px_rgba(255,255,255,0.15)]",
                      "transition-transform duration-300 hover:-translate-y-1 transform-gpu will-change-transform", // 🚀 Аппаратное ускорение ховера
                    )}
                  >
                    Вступить в общину
                  </Button>
                </Link>

                {/* Кнопка 2: Цдака */}
                <Link href="/donate" className="w-full sm:w-auto">
                  <button
                    className={cn(
                      "w-full sm:w-auto px-8 h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2",
                      "text-amber-100 border border-amber-500/30",
                      "hover:bg-amber-500/10 hover:border-amber-400",
                      "transition-all duration-300 transform-gpu will-change-transform hover:-translate-y-0.5", // 🚀 Микро-анимация для второй кнопки
                    )}
                  >
                    Дать Цдаку <span>❤️</span>
                  </button>
                </Link>
              </div>

              {/* Мелкий текст */}
              <p className="text-blue-200/40 text-[10px] md:text-xs mt-10 md:mt-14 uppercase tracking-widest font-semibold letter-spacing-2">
                Ришон ле-Цион • Menorah Center
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
