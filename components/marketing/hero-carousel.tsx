"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Flame, BookOpen, Heart, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
  // Данные оставляем те же
  {
    id: "shabbat",
    category: "Шаббат",
    title: "Тепло еврейского дома",
    desc: "Каждую пятницу мы собираемся вместе, чтобы встретить Царицу-Субботу. Зажигание свечей, кидуш и душевная трапеза.",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop",
    link: "/events",
    buttonText: "Записаться",
    color: "bg-amber-100 dark:bg-amber-900/30",
    accent: "text-amber-600",
    icon: Flame,
  },
  {
    id: "education",
    category: "Тора",
    title: "Источник мудрости",
    desc: "Уроки для мужчин и женщин. От недельной главы до глубин Каббалы. Найдите ответы на главные вопросы жизни.",
    image:
      "https://images.unsplash.com/photo-1453749024028-0185d189cbda?q=80&w=2070&auto=format&fit=crop",
    link: "/torah",
    buttonText: "Расписание",
    color: "bg-blue-100 dark:bg-blue-900/30",
    accent: "text-blue-600",
    icon: BookOpen,
  },
  {
    id: "chesed",
    category: "Хесед",
    title: "Рука помощи",
    desc: "Никто не должен оставаться один. Наш волонтерский центр помогает пожилым и нуждающимся семьям.",
    image:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop",
    link: "/donate",
    buttonText: "Помочь",
    color: "bg-rose-100 dark:bg-rose-900/30",
    accent: "text-rose-600",
    icon: Heart,
  },
  {
    id: "youth",
    category: "Молодежь",
    title: "Будущее здесь",
    desc: "Энергия, знакомства и еврейская гордость. Программы для студентов и молодых профессионалов.",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2832&auto=format&fit=crop",
    link: "/events",
    buttonText: "Клуб",
    color: "bg-indigo-100 dark:bg-indigo-900/30",
    accent: "text-indigo-600",
    icon: Zap,
  },
];

export const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000); // 6 секунд
    return () => clearInterval(timer);
  }, []);

  const IconComponent = SLIDES[currentSlide].icon;

  return (
    // ГЛАВНЫЙ КОНТЕЙНЕР:
    // Mobile: flex-col (слайдер сверху, точки снизу), h-auto
    // Desktop: flex-row (слайдер слева, точки справа), h-[500px]
    <div className="relative flex flex-col lg:flex-row items-center gap-4 lg:gap-6 w-full max-w-[600px] mx-auto lg:ml-auto lg:mr-0 h-auto lg:h-[500px]">
      {/* ОБЛАСТЬ СЛАЙДЕРА */}
      <div className="relative w-full h-[400px] sm:h-[450px] lg:h-full perspective-1000 z-10">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={currentSlide}
            initial={{ y: "20%", opacity: 0 }} // Уменьшил амплитуду для мобилок
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-20%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
          >
            {/* Внутренний контейнер слайда */}
            <div className="relative w-full h-full lg:h-[420px]">
              {/* 1. Цветная подложка (чуть меньше поворот на мобильном) */}
              <div
                className={cn(
                  "absolute inset-0 rounded-[32px] lg:rounded-[40px] transform rotate-2 lg:rotate-3 scale-105 opacity-60 transition-colors duration-500",
                  SLIDES[currentSlide].color,
                )}
              />

              {/* 2. Основное изображение */}
              <div className="absolute inset-0 rounded-[24px] lg:rounded-[32px] overflow-hidden shadow-xl border-4 border-white dark:border-zinc-800 bg-white">
                <Image
                  src={SLIDES[currentSlide].image}
                  alt={SLIDES[currentSlide].title}
                  fill
                  className="object-cover transition-transform duration-[8000ms] ease-linear hover:scale-110"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>

              {/* 3. Плавающая карточка (АДАПТИВ) */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                // Mobile: w-[90%], снизу, по центру. Desktop: w-[280px], справа-снизу
                className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:-bottom-6 lg:-right-4 w-[90%] lg:w-[280px] bg-white dark:bg-zinc-900 p-4 lg:p-5 rounded-2xl shadow-xl border border-black/5 dark:border-white/10 z-20"
              >
                {/* Хедер карточки */}
                <div className="flex items-center justify-between mb-2 lg:mb-3">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-opacity-20",
                      SLIDES[currentSlide].color,
                      SLIDES[currentSlide].accent,
                    )}
                  >
                    {SLIDES[currentSlide].category}
                  </span>
                  <div
                    className={cn(
                      "p-1.5 rounded-full bg-opacity-10",
                      SLIDES[currentSlide].color,
                    )}
                  >
                    <IconComponent
                      className={cn(
                        "w-3 h-3 lg:w-4 lg:h-4",
                        SLIDES[currentSlide].accent,
                      )}
                    />
                  </div>
                </div>

                {/* Текст */}
                <h3 className="text-base lg:text-lg font-bold leading-tight mb-1 lg:mb-2 text-zinc-900 dark:text-zinc-100">
                  {SLIDES[currentSlide].title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 lg:line-clamp-3 leading-relaxed mb-3 lg:mb-4">
                  {SLIDES[currentSlide].desc}
                </p>

                {/* Кнопка */}
                <Link href={SLIDES[currentSlide].link} className="w-full">
                  <Button
                    size="sm"
                    className={cn(
                      "w-full rounded-lg text-xs font-bold h-8 lg:h-9",
                      "bg-zinc-900 text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity",
                    )}
                  >
                    {SLIDES[currentSlide].buttonText}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </motion.div>

              {/* 4. Номер слайда (Убираем на мобильных, чтобы не загромождать, или уменьшаем) */}
              <div className="absolute top-4 left-4 lg:-top-4 lg:-left-4 bg-white dark:bg-zinc-800 p-2 lg:p-3 rounded-2xl shadow-lg border border-black/5 z-10 hidden sm:block">
                <div
                  className={cn(
                    "w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center font-bold text-xs lg:text-sm text-white",
                    SLIDES[currentSlide].accent.replace("text-", "bg-"),
                  )}
                >
                  {currentSlide + 1}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* --- НАВИГАЦИЯ --- */}
      {/* Mobile: горизонтально по центру. Desktop: вертикально справа */}
      <div className="flex flex-row lg:flex-col gap-3 py-2 justify-center lg:justify-start">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className="group relative flex items-center justify-center w-4 h-4"
            aria-label={`Слайд ${idx + 1}`}
          >
            {currentSlide === idx && (
              <motion.div
                layoutId="active-dot"
                className="absolute inset-0 rounded-full border border-zinc-400 dark:border-zinc-600"
                transition={{ duration: 0.3 }}
              />
            )}
            <div
              className={cn(
                "rounded-full transition-all duration-300",
                currentSlide === idx
                  ? "w-2 h-2 bg-zinc-900 dark:bg-white"
                  : "w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-400",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
