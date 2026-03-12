"use client";

import { Button } from "@/components/ui/button";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroCarousel } from "./marketing/hero-carousel";

// 🚀 PERFORMANCE: Добавляем will-change для подсказки браузеру о грядущих трансформациях
const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
    willChange: "transform, opacity", // Разгружаем Main Thread
  }),
};

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 md:pt-28 pb-16 overflow-hidden w-full bg-white">
      {/* 🚀 PERFORMANCE: Заменили дорогие DOM-узлы с mix-blend-mode на легкие CSS-градиенты */}
      <div
        className="absolute inset-0 w-full h-full -z-10 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 20%, rgba(251, 191, 36, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 85% 80%, rgba(249, 115, 22, 0.1) 0%, transparent 40%)
          `,
        }}
        aria-hidden="true"
      />

      <div className="container w-full mx-auto px-4 md:px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* --- ЛЕВАЯ ЧАСТЬ --- */}
          <div className="flex flex-col items-start text-left max-w-2xl z-10">
            {/* Бейдж */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
              className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-white/80 border border-amber-200 backdrop-blur-sm shadow-sm mb-4 md:mb-6 transform-gpu"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-xs md:text-sm font-semibold text-amber-800 tracking-wide uppercase">
                Менора Центр • г. Ришон ле-Цион
              </span>
            </motion.div>

            {/* Заголовок */}
            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 leading-[1.1] mb-4 md:mb-6 transform-gpu"
            >
              Свет традиции, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">
                тепло семьи.
              </span>
            </motion.h1>

            {/* Описание */}
            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
              className="text-base md:text-xl text-zinc-600 leading-relaxed mb-6 md:mb-8 max-w-lg font-light transform-gpu"
            >
              Центр еврейской жизни в Ришон ле-Ционе. Мы строим общину, где
              каждый чувствует себя как дома.
            </motion.p>

            {/* Кнопки */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
              className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 mb-8 md:mb-12 w-full sm:w-auto transform-gpu"
            >
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-full h-12 px-8 text-base bg-blue-900 hover:bg-blue-800 text-white shadow-xl transition-transform hover:-translate-y-0.5 font-semibold"
                >
                  Вступить
                </Button>
              </Link>
              <Link href="/contact" className="w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto rounded-full h-12 px-8 text-base text-zinc-700 border border-transparent hover:border-zinc-200 hover:bg-zinc-50"
                >
                  Написать Раввину
                  <ArrowRight className="ml-2 w-4 h-4 opacity-60" />
                </Button>
              </Link>
            </motion.div>

            {/* Статистика */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
              className="w-full border-t border-zinc-200 pt-6 transform-gpu"
            >
              <div className="grid grid-cols-3 gap-2 md:gap-8">
                <div>
                  <p className="text-xl md:text-3xl font-bold text-zinc-900">
                    500+
                  </p>
                  <p className="text-[10px] md:text-sm text-zinc-500 mt-0.5 font-medium leading-tight">
                    Семей в общине
                  </p>
                </div>
                <div className="border-l border-zinc-200 pl-3 md:pl-8">
                  <p className="text-xl md:text-3xl font-bold text-zinc-900">
                    25+
                  </p>
                  <p className="text-[10px] md:text-sm text-zinc-500 mt-0.5 font-medium leading-tight">
                    Уроков в неделю
                  </p>
                </div>
                <div className="border-l border-zinc-200 pl-3 md:pl-8">
                  <p className="text-xl md:text-3xl font-bold text-zinc-900">
                    3
                  </p>
                  <p className="text-[10px] md:text-sm text-zinc-500 mt-0.5 font-medium leading-tight">
                    Миньяна ежедневно
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* --- ПРАВАЯ ЧАСТЬ: КАРУСЕЛЬ --- */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full mt-8 lg:mt-0 transform-gpu"
          >
            <HeroCarousel />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
