"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const SkeletonOne = () => {
  return (
    <div className="relative flex p-8 gap-10 h-full overflow-hidden">
      {/* Задний план: Чат (Имитация обсуждения праздника) */}
      <div className="w-full md:w-[90%] p-5 mx-auto bg-white dark:bg-neutral-900 shadow-2xl group h-full opacity-50 dark:opacity-40 blur-[1px] transition-all duration-500 group-hover:blur-0 group-hover:opacity-100">
        <div className="flex flex-1 w-full h-full flex-col space-y-4">
          <UserMessage>
            Шалом! Во сколько начинается Каббалат Шаббат в эту пятницу?
          </UserMessage>
          <CommunityMessage>
            Привет! Ждем всех к 19:30. Будет зажигание свечей и кидуш. 🕯️
          </CommunityMessage>
          <UserMessage>
            Отлично, мы придем всей семьей. Нужно что-то принести?
          </UserMessage>
          <CommunityMessage>
            Только хорошее настроение! Халы и вино уже готовы. 🍷
          </CommunityMessage>
          <UserMessage>Договорились! До встречи в синагоге.</UserMessage>
          <CommunityMessage>Шаббат Шалом! Ждем вас!</CommunityMessage>
        </div>
      </div>

      {/* Передний план: Парящие фотографии */}
      <div className="flex flex-col gap-4 absolute inset-0 items-center justify-center z-20 pointer-events-none">
        {/* Фото 1: Халы (Сдвинуто влево и наклонено) */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-4 md:left-10 top-10 md:top-20 transform -rotate-6 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500"
        >
          <div className="p-2 border border-white/20 bg-white/10 backdrop-blur-md rounded-[24px] shadow-2xl">
            <div className="relative h-[180px] w-[180px] md:h-[220px] md:w-[220px] rounded-[20px] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1490914327627-9fe8d52f4d90?q=80&w=800&auto=format&fit=crop" // Халы
                alt="Shabbat Challah"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </motion.div>

        {/* Фото 2: Свечи/Праздник (Сдвинуто вправо и наклонено в другую сторону) */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute right-4 md:right-10 bottom-10 md:bottom-20 transform rotate-3 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500"
        >
          <div className="p-2 border border-white/20 bg-white/10 backdrop-blur-md rounded-[24px] shadow-2xl">
            <div className="relative h-[200px] w-[200px] md:h-[240px] md:w-[240px] rounded-[20px] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1601886163353-84729f250392?q=80&w=800&auto=format&fit=crop" // Свечи/Ханукия
                alt="Holiday Lights"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Градиенты для плавного исчезновения чата */}
      <div className="absolute bottom-0 z-40 inset-x-0 h-32 bg-gradient-to-t from-white dark:from-neutral-950 to-transparent w-full pointer-events-none" />
      <div className="absolute top-0 z-40 inset-x-0 h-32 bg-gradient-to-b from-white dark:from-neutral-950 to-transparent w-full pointer-events-none" />
    </div>
  );
};

// --- Компоненты сообщений ---

const UserMessage = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-row items-end justify-end space-x-2">
      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 p-3 rounded-2xl rounded-tr-sm text-xs sm:text-sm font-medium shadow-sm max-w-[80%]">
        {children}
      </div>
      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-neutral-800 overflow-hidden border border-white dark:border-neutral-700 flex-shrink-0">
        {/* Аватар пользователя */}
        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400" />
      </div>
    </div>
  );
};

const CommunityMessage = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-row items-end justify-start space-x-2">
      <div className="h-8 w-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
        {/* Иконка сообщества */}
        <span className="text-xs">✡️</span>
      </div>
      <div className="bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 p-3 rounded-2xl rounded-tl-sm text-xs sm:text-sm font-medium shadow-sm max-w-[80%]">
        {children}
      </div>
    </div>
  );
};
