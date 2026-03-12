"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Моковые данные
const NEWS_POSTS = [
  {
    id: "pesach-prep-2026",
    title:
      "Как правильно подготовить кухню к Песаху: пошаговая инструкция от Раввина",
    category: "Статья",
    date: "20 Марта 2026",
    image: "/images/news-1.webp",
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "youth-shabbat-recap",
    title: "Молодежный Шаббат собрал рекордное количество студентов",
    category: "Фотоотчет",
    date: "10 Марта 2026",
    image: "/images/news-2.webp",
    color: "bg-purple-100 text-purple-700",
  },
  {
    id: "new-torah-scroll",
    title: "Внесение нового Свитка Торы: исторический день для Ришон ле-Циона",
    category: "Событие",
    date: "28 Февраля 2026",
    image: "/images/news-3.webp",
    color: "bg-amber-100 text-amber-700",
  },
  {
    id: "chesed-volunteers",
    title: "Наши волонтеры развезли 150 продуктовых наборов к празднику",
    category: "Хесед",
    date: "25 Февраля 2026",
    image: "/images/news-4.webp",
    color: "bg-rose-100 text-rose-700",
  },
  {
    id: "womens-club-challah",
    title: "Мастер-класс по выпечке Халы в женском клубе",
    category: "Фотоотчет",
    date: "18 Февраля 2026",
    image: "/images/news-5.webp",
    color: "bg-purple-100 text-purple-700",
  },
  {
    id: "daily-minyan",
    title: "Запускаем ежедневный утренний миньян (Шахарит). Присоединяйтесь!",
    category: "Анонс",
    date: "10 Февраля 2026",
    image: "/images/news-6.webp",
    color: "bg-emerald-100 text-emerald-700",
  },
];

const CATEGORIES = ["Все", "Фотоотчет", "Статья", "Анонс", "Хесед", "Событие"];

export const NewsGrid = () => {
  const [activeCategory, setActiveCategory] = useState("Все");

  // Простая фильтрация на клиенте
  const filteredPosts =
    activeCategory === "Все"
      ? NEWS_POSTS
      : NEWS_POSTS.filter((post) => post.category === activeCategory);

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6">
      {/* Фильтры */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-10 pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
              activeCategory === cat
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Сетка постов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.5,
              delay: index * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="group flex flex-col transform-gpu will-change-transform"
          >
            <Link href={`/news/${post.id}`} className="flex flex-col h-full">
              {/* Картинка */}
              <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-neutral-100 mb-5 border border-neutral-100 shadow-sm transition-shadow duration-300 group-hover:shadow-md">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Бейдж */}
                <div className="absolute top-4 left-4 z-10">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md bg-white/90",
                      post.color,
                    )}
                  >
                    {post.category}
                  </span>
                </div>
              </div>

              {/* Текст */}
              <div className="flex flex-col flex-1 px-1">
                <div className="flex items-center text-xs text-neutral-400 font-medium mb-3">
                  <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                  {post.date}
                </div>

                <h3 className="text-xl font-bold text-neutral-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors line-clamp-3">
                  {post.title}
                </h3>

                <div className="mt-auto pt-2 flex items-center text-sm font-bold text-neutral-400 group-hover:text-blue-600 transition-colors">
                  Читать
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
