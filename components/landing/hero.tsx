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
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [items, isPaused, nextSlide]);

  if (!items || items.length === 0) return null;

  return (
    <div className="relative min-h-[90vh] pt-32 pb-20 overflow-hidden bg-white dark:bg-neutral-950 flex items-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 md:px-10 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
        {/* ЛЕВАЯ ЧАСТЬ (Текст) */}
        <div className="w-full lg:w-[50%] flex flex-col items-start text-left z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-[#FFB800] animate-pulse shrink-0" />
            Каждую неделю к нам присоединяются новые люди
          </motion.div>

          {/* Заголовок */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-neutral-900 dark:text-white tracking-tighter leading-[1] mb-4 text-balance"
          >
            Menorah Center <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500 text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-2 block leading-[1.1]">
              Место, где создаются знакомства, семьи и сильное сообщество
            </span>
          </motion.h1>

          {/* Подзаголовок */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 font-medium mb-8 text-balance max-w-lg"
          >
            Для тех, кто ищет больше: общение, поддержку и настоящие связи 🤍
          </motion.p>

          {/* Компактный список (6 пунктов) */}
          <motion.ul
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-2.5 sm:gap-3 mb-10 max-w-xl w-full"
          >
            {[
              "Участвуйте в живых, тёплых мероприятиях",
              "Знакомьтесь с новыми людьми и находите свою среду",
              "Получайте поддержку - личную и общинную",
              "Узнавайте больше о еврейских традициях в лёгкой форме",
              "Участвуйте во встречах предпринимателей разных уровней",
              "Расширяйте круг общения через еврейский нетворкинг",
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800] mt-0.5">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className="text-sm sm:text-base font-bold text-neutral-700 dark:text-neutral-300 leading-snug">
                  {text}
                </span>
              </li>
            ))}
          </motion.ul>

          {/* Адаптивные кнопки */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link
              href="/dashboard"
              className="group w-full sm:w-auto px-8 py-3.5 bg-[#FFB800] hover:bg-orange-500 text-black font-black uppercase tracking-widest text-xs sm:text-sm rounded-full transition-all shadow-lg shadow-[#FFB800]/20 text-center flex items-center justify-center gap-2"
            >
              <Zap size={18} className="shrink-0" />
              Присоединиться к сообществу
            </Link>
            <Link
              href="/about"
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-xs sm:text-sm rounded-full transition-all"
            >
              Узнать больше
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform shrink-0"
              />
            </Link>
          </motion.div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ (Карусель) */}
        <div className="w-full lg:w-[45%] flex justify-center lg:justify-end perspective-1000 z-20 mt-10 lg:mt-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="relative w-full max-w-[420px] aspect-[4/5] sm:aspect-square lg:aspect-[4/5]"
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
                    "absolute inset-0 bg-neutral-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col transition-all duration-700 ease-in-out hover:ring-2 hover:ring-[#FFB800]/50",
                    isActive
                      ? "z-30 opacity-100 translate-y-0 scale-100 pointer-events-auto cursor-pointer"
                      : "pointer-events-none",
                    offset === 1 && "z-20 opacity-80 translate-y-6 scale-95",
                    offset === 2 && "z-10 opacity-40 translate-y-12 scale-90",
                    offset > 2 && "opacity-0 translate-y-16 scale-90",
                  )}
                  style={{ zIndex: items.length - offset }}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    priority={index === 0}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-10" />

                  <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/10 rounded-full shadow-sm z-20">
                    <div className={cn("w-2 h-2 rounded-full", item.color)} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                      {item.type}
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col z-20">
                    <div className="flex items-center gap-2 mb-3 text-white/80">
                      <Icon size={16} />
                      <span className="text-sm font-bold">{item.date}</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white leading-tight line-clamp-3">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              );
            })}

            {/* Индикаторы */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 cursor-pointer pointer-events-auto",
                    idx === activeIndex
                      ? "w-8 bg-[#FFB800]"
                      : "w-2 bg-neutral-300 dark:bg-neutral-700",
                  )}
                  aria-label={`Перейти к слайду ${idx + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
