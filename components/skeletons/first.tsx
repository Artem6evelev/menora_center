"use client";
import React from "react";
import { motion } from "framer-motion";
import { BlurImage } from "@/components/blur-image"; // Убедись, что путь правильный
import { CalendarDays, Clock, MapPin } from "lucide-react";

export const SkeletonOne = () => {
  return (
    <div className="relative flex p-8 gap-10 h-full">
      <div className="w-full md:w-[90%] p-5 mx-auto bg-white dark:bg-neutral-900 shadow-2xl group h-full rounded-2xl border border-neutral-100 dark:border-neutral-800">
        <div className="flex flex-1 w-full h-full flex-col space-y-4 opacity-80">
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

      <div className="flex flex-col gap-4 absolute inset-0">
        <div className="p-2 border border-neutral-200 bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 rounded-[32px] h-[250px] w-[250px] md:h-[300px] md:w-[300px] mx-auto flex-shrink-0 z-20 group-hover:scale-[1.02] transition duration-200 ml-auto mr-10 mt-10 shadow-2xl">
          <div className="p-2 bg-white dark:bg-black dark:border-neutral-700 border border-neutral-200 rounded-[24px] flex-shrink-0 w-full h-full">
            <BlurImage
              src="https://images.unsplash.com/photo-1544723795-3ca315cadc20?w=800&q=80"
              alt="Событие"
              width={800}
              height={800}
              className="rounded-[20px] w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 z-40 inset-x-0 h-40 bg-gradient-to-t from-white dark:from-black to-transparent w-full pointer-events-none" />
      <div className="absolute top-0 z-40 inset-x-0 h-40 bg-gradient-to-b from-white dark:from-black to-transparent w-full pointer-events-none" />
    </div>
  );
};

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
      className="flex flex-col rounded-xl p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800"
    >
      <p className="text-sm font-bold text-neutral-900 dark:text-white mb-2">
        {title}
      </p>
      <div className="flex gap-4 text-xs text-neutral-500">
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
