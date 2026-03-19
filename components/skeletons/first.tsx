"use client";

import React from "react";
import { motion } from "framer-motion";
import { BlurImage } from "@/components/blur-image"; // Проверь, что путь к BlurImage верный для твоей структуры
import { Clock, MapPin } from "lucide-react";

export const SkeletonOne = () => {
  return (
    <div className="relative flex p-4 md:p-8 gap-10 h-full overflow-hidden">
      {/* Контейнер с расписанием */}
      {/* На мобилках добавили mt-12, чтобы текст не прилипал к верхнему краю, где висит картинка */}
      <div className="w-full md:w-[90%] p-3 md:p-5 mx-auto bg-white dark:bg-neutral-900 shadow-2xl group h-full rounded-2xl border border-neutral-100 dark:border-neutral-800 relative z-10 mt-12 md:mt-0">
        <div className="flex flex-1 w-full h-full flex-col space-y-2 md:space-y-4 opacity-80">
          <EventRow
            title="Большой Шаббат"
            time="Пт, 19:00"
            location="Главный зал"
          />
          <EventRow
            title="Урок: Недельная глава"
            time="Пн, 20:00"
            location="Библиотека"
          />
          <EventRow
            title="Женский клуб"
            time="Ср, 18:30"
            location="Зал мероприятий"
          />
          <EventRow title="Фарбренген" time="Чт, 21:00" location="Кафетерий" />
        </div>
      </div>

      {/* Контейнер картинки: ПРАВЫЙ ВЕРХНИЙ УГОЛ на мобилках (items-start justify-end p-4) */}
      <div className="absolute inset-0 flex items-start justify-end p-4 md:p-0 md:items-center md:justify-end md:pr-10 pointer-events-none z-20">
        {/* Размеры картинки меняются от 120px на телефоне до 300px на десктопе */}
        <div className="p-1.5 md:p-2 border border-neutral-200 bg-neutral-100/80 dark:bg-neutral-800/80 backdrop-blur-sm dark:border-neutral-700 rounded-[16px] md:rounded-[32px] h-[120px] w-[120px] sm:h-[160px] sm:w-[160px] md:h-[300px] md:w-[300px] flex-shrink-0 group-hover:scale-[1.05] transition duration-500 shadow-2xl pointer-events-auto">
          <div className="p-1.5 md:p-2 bg-white dark:bg-black dark:border-neutral-700 border border-neutral-200 rounded-[12px] md:rounded-[24px] flex-shrink-0 w-full h-full">
            <BlurImage
              src="/landing/landing-event.webp" // Исправленный путь (без /public)
              alt="Событие"
              width={800}
              height={800}
              className="rounded-[8px] md:rounded-[20px] w-full h-full object-cover group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Градиенты для плавного растворения краев (сверху и снизу) */}
      <div className="absolute bottom-0 z-30 inset-x-0 h-20 md:h-40 bg-gradient-to-t from-white dark:from-neutral-950 to-transparent w-full pointer-events-none" />
      <div className="absolute top-0 z-30 inset-x-0 h-20 md:h-40 bg-gradient-to-b from-white dark:from-neutral-950 to-transparent w-full pointer-events-none" />
    </div>
  );
};

// Компонент отдельной строки расписания
const EventRow = ({
  title,
  time,
  location,
}: {
  title: string;
  time: string;
  location: string;
}) => {
  return (
    <motion.div
      whileHover={{ x: 5 }}
      className="flex flex-col rounded-xl p-3 md:p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800"
    >
      <p className="text-xs md:text-sm font-bold text-neutral-900 dark:text-white mb-1.5 md:mb-2">
        {title}
      </p>
      <div className="flex gap-3 md:gap-4 text-[10px] md:text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <Clock size={12} /> {time}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={12} /> {location}
        </span>
      </div>
    </motion.div>
  );
};
