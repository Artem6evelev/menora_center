"use client";

import { motion } from "framer-motion";
import { Link } from "next-view-transitions";
import Image from "next/image";
import {
  Check,
  ArrowRight,
  Calendar,
  HeartHandshake,
  Newspaper,
  Zap,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

const IconMap: Record<string, any> = {
  calendar: Calendar,
  hearthandshake: HeartHandshake,
  newspaper: Newspaper,
};

export type CarouselItem = {
  type: string;
  title: string;
  date: string;
  iconName: string;
  color: string;
  image: string;
  link: string;
};

export const Hero = ({ items }: { items: CarouselItem[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setActiveIndex((current) => (current + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (!items || items.length === 0 || isPaused) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [items, isPaused, nextSlide]);

  if (!items || items.length === 0) return null;

  return (
    <div className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-white dark:bg-neutral-950">
      <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="max-w-[1440px] w-full mx-auto px-6 md:px-10 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* ЛЕВАЯ ЧАСТЬ (Текст) */}
        {/* ИСПРАВЛЕНИЕ 1: Вместо flex-[1.2] задаем точную ширину */}
        <div className="w-full lg:w-[55%] flex flex-col items-start text-left z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-[#FFB800] animate-pulse" />
            Присоединяйтесь к нам
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[clamp(48px,7vw,92px)] font-black text-neutral-900 dark:text-white tracking-tighter leading-[0.92] mb-8"
          >
            Духовный рост. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              В единой общине.
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 mb-12 max-w-xl"
          >
            {[
              "Участвуйте в вдохновляющих мероприятиях",
              "Получайте духовную и материальную поддержку",
              "Изучайте Тору с лучшими наставниками",
              "Будьте в курсе событий через личный кабинет",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800]">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-base lg:text-lg font-bold text-neutral-600 dark:text-neutral-300">
                  {text}
                </span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link
              href="/dashboard"
              className="group w-full sm:w-auto px-8 py-5 bg-[#FFB800] hover:bg-orange-500 text-black font-black uppercase tracking-widest text-sm rounded-full transition-all shadow-lg shadow-[#FFB800]/20 text-center flex items-center justify-center gap-3"
            >
              <Zap size={18} />
              Стать резидентом
            </Link>
            <Link
              href="/about"
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-sm rounded-full transition-all"
            >
              Узнать больше
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </motion.div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ (Карусель) */}
        {/* ИСПРАВЛЕНИЕ 2: Убрал flex-1, добавил строгую высоту 450px для телефона и mt-12 (отступ от текста) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-full lg:w-[45%] max-w-[450px] mx-auto relative h-[450px] md:h-[550px] mt-16 lg:mt-0 shrink-0 block"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            const Icon = IconMap[item.iconName] || Newspaper;

            let offset = index - activeIndex;
            if (offset < 0) offset += items.length;

            return (
              <Link
                key={index}
                href={item.link}
                className={cn(
                  "absolute inset-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[40px] overflow-hidden shadow-2xl flex flex-col cursor-pointer transition-all duration-700 origin-bottom hover:ring-2 hover:ring-[#FFB800]/50",
                  isActive ? "z-30 opacity-100" : "z-20 pointer-events-none",
                  // ИСПРАВЛЕНИЕ 3: Немного уменьшили отлет карт вверх на телефоне, чтобы они не наезжали на кнопки
                  offset === 1 &&
                    "z-20 scale-95 -translate-y-6 md:-translate-y-8 opacity-80",
                  offset === 2 &&
                    "z-10 scale-90 -translate-y-12 md:-translate-y-16 opacity-40",
                  offset > 2 &&
                    "scale-90 -translate-y-16 md:-translate-y-20 opacity-0",
                )}
                style={{ zIndex: items.length - offset }}
              >
                <div className="relative w-full h-[55%] min-h-[200px] md:min-h-[300px] shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    priority={index === 0 || index === 1}
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />

                  <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/95 dark:bg-black/95 backdrop-blur-md rounded-full shadow-lg">
                    <div className={cn("w-2 h-2 rounded-full", item.color)} />
                    <span className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-white">
                      {item.type}
                    </span>
                  </div>
                </div>

                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center bg-white dark:bg-neutral-900">
                  <div className="flex items-center gap-3 mb-2 text-neutral-500">
                    <Icon size={16} />
                    <span className="text-sm font-bold">{item.date}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white leading-tight line-clamp-2">
                    {item.title}
                  </h3>
                </div>
              </Link>
            );
          })}

          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === activeIndex
                    ? "w-8 bg-[#FFB800]"
                    : "w-2 bg-neutral-300 dark:bg-neutral-700",
                )}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
