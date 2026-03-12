"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Flame, BookOpen, Heart, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// 🚀 PERFORMANCE: Переходим на локальные ассеты. Никаких внешних URL для LCP.
const SLIDES = [
  {
    id: "shabbat",
    category: "Шаббат",
    title: "Тепло еврейского дома",
    desc: "Каждую пятницу мы собираемся вместе, чтобы встретить Царицу-Субботу. Зажигание свечей, кидуш и душевная трапеза.",
    image: "/images/hero-shabbat.webp", // <-- Положи сжатые WebP в public/images/
    link: "/events",
    buttonText: "Записаться",
    color: "bg-amber-100",
    accent: "text-amber-600",
    icon: Flame,
  },
  {
    id: "education",
    category: "Тора",
    title: "Источник мудрости",
    desc: "Уроки для мужчин и женщин. От недельной главы до глубин Каббалы. Найдите ответы на главные вопросы жизни.",
    image: "/images/hero-education.webp",
    link: "/torah",
    buttonText: "Расписание",
    color: "bg-blue-100",
    accent: "text-blue-600",
    icon: BookOpen,
  },
  {
    id: "chesed",
    category: "Хесед",
    title: "Рука помощи",
    desc: "Никто не должен оставаться один. Наш волонтерский центр помогает пожилым и нуждающимся семьям.",
    image: "/images/hero-chesed.webp",
    link: "/donate",
    buttonText: "Помочь",
    color: "bg-rose-100",
    accent: "text-rose-600",
    icon: Heart,
  },
  {
    id: "youth",
    category: "Молодежь",
    title: "Будущее здесь",
    desc: "Энергия, знакомства и еврейская гордость. Программы для студентов и молодых профессионалов.",
    image: "/images/hero-youth.webp",
    link: "/events",
    buttonText: "Клуб",
    color: "bg-indigo-100",
    accent: "text-indigo-600",
    icon: Zap,
  },
];

export const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // 🚀 UX & PERFORMANCE: Пауза карусели при наведении
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [isHovered, nextSlide]);

  const IconComponent = SLIDES[currentSlide].icon;

  return (
    <div
      className="relative flex flex-col lg:flex-row items-center gap-4 lg:gap-6 w-full max-w-[600px] mx-auto lg:ml-auto lg:mr-0 h-auto lg:h-[500px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-[400px] sm:h-[450px] lg:h-full perspective-1000 z-10">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={currentSlide}
            initial={{ y: "15%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-15%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            // 🚀 PERFORMANCE: transform-gpu переносит рендер анимации на видеокарту
            className="absolute inset-0 w-full h-full flex items-center justify-center transform-gpu will-change-transform"
          >
            <div className="relative w-full h-full lg:h-[420px]">
              {/* Подложка */}
              <div
                className={cn(
                  "absolute inset-0 rounded-[32px] lg:rounded-[40px] transform rotate-2 lg:rotate-3 scale-105 opacity-60 transition-colors duration-500",
                  SLIDES[currentSlide].color,
                )}
              />

              {/* Основное изображение */}
              <div className="absolute inset-0 rounded-[24px] lg:rounded-[32px] overflow-hidden shadow-xl border-4 border-white bg-white">
                <Image
                  src={SLIDES[currentSlide].image}
                  alt={SLIDES[currentSlide].title}
                  fill
                  // 🚀 PERFORMANCE: Правильные sizes и fetchPriority для первого слайда
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  priority={currentSlide === 0}
                  fetchPriority={currentSlide === 0 ? "high" : "auto"}
                  className="object-cover transition-transform duration-[8000ms] ease-linear hover:scale-110 will-change-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>

              {/* Плавающая карточка */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:-bottom-6 lg:-right-4 w-[90%] lg:w-[280px] bg-white p-4 lg:p-5 rounded-2xl shadow-xl border border-zinc-100 z-20 transform-gpu"
              >
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

                <h3 className="text-base lg:text-lg font-bold leading-tight mb-1 lg:mb-2 text-zinc-900">
                  {SLIDES[currentSlide].title}
                </h3>
                <p className="text-xs text-zinc-500 line-clamp-2 lg:line-clamp-3 leading-relaxed mb-3 lg:mb-4">
                  {SLIDES[currentSlide].desc}
                </p>

                <Link href={SLIDES[currentSlide].link} className="w-full">
                  <Button
                    size="sm"
                    className="w-full rounded-lg text-xs font-bold h-8 lg:h-9 bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
                  >
                    {SLIDES[currentSlide].buttonText}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </motion.div>

              {/* Номер слайда */}
              <div className="absolute top-4 left-4 lg:-top-4 lg:-left-4 bg-white p-2 lg:p-3 rounded-2xl shadow-lg border border-zinc-100 z-10 hidden sm:block">
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
                className="absolute inset-0 rounded-full border border-zinc-400"
                transition={{ duration: 0.3 }}
              />
            )}
            <div
              className={cn(
                "rounded-full transition-all duration-300",
                currentSlide === idx
                  ? "w-2 h-2 bg-zinc-900"
                  : "w-1.5 h-1.5 bg-zinc-300 group-hover:bg-zinc-400",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
