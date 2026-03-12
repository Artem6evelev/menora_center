"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

// Моковые данные для главной новости
const featuredPost = {
  id: "purim-recap-2026",
  title: "Как мы отпраздновали самый масштабный Пурим в истории общины",
  excerpt:
    "Более 300 человек, чтение Мегилы нон-стоп, детская программа и настоящий хасидский фарбренген до утра. Смотрите большой фотоотчет с нашего праздника.",
  category: "Фотоотчет",
  date: "15 Марта 2026",
  image: "/images/news-featured.webp", // Заглушка
  color: "text-purple-700 bg-purple-100",
};

export const NewsHero = () => {
  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 mb-16 md:mb-24">
      <Link href={`/news/${featuredPost.id}`} className="group block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[2rem] overflow-hidden bg-neutral-100 aspect-square md:aspect-[21/9] w-full transform-gpu will-change-transform"
        >
          {/* 🚀 LCP Оптимизация: priority и sizes */}
          <Image
            src={featuredPost.image}
            alt={featuredPost.title}
            fill
            priority
            fetchPriority="high"
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 1200px"
          />

          {/* Градиент для читаемости текста */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Контент поверх фото */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 lg:p-12 flex flex-col justify-end">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full",
                  featuredPost.color,
                )}
              >
                {featuredPost.category}
              </span>
              <span className="text-white/80 text-sm font-medium flex items-center">
                <CalendarDays className="w-4 h-4 mr-2" />
                {featuredPost.date}
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight max-w-4xl group-hover:text-blue-200 transition-colors">
              {featuredPost.title}
            </h2>

            <p className="text-white/80 text-base md:text-lg max-w-2xl hidden md:block mb-6 line-clamp-2">
              {featuredPost.excerpt}
            </p>

            <div className="inline-flex items-center text-white font-semibold text-sm group/btn w-fit">
              Читать полностью
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
            </div>
          </div>
        </motion.div>
      </Link>
    </section>
  );
};
