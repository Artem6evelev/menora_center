// --- skeletons/first.tsx ---
"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export const SkeletonOne = () => {
  return (
    <div className="relative flex p-4 sm:p-8 gap-10 h-full overflow-hidden min-h-[300px]">
      {/* Задний план: Чат */}
      <div className="w-full md:w-[90%] p-5 mx-auto bg-white shadow-2xl group h-full opacity-60 blur-[1px] transition-all duration-500 hover:blur-0 hover:opacity-100 border border-neutral-100 rounded-2xl">
        <div className="flex flex-1 w-full h-full flex-col space-y-4">
          <UserMessage>
            Шалом! Во сколько начинается Каббалат Шаббат в эту пятницу?
          </UserMessage>
          <CommunityMessage>
            Привет! Ждем всех к 19:30. Будет зажигание свечей и кидуш. 🕯️
          </CommunityMessage>
          <UserMessage>Отлично, мы придем всей семьей.</UserMessage>
        </div>
      </div>

      {/* Передний план: Парящие фотографии на GPU */}
      <div className="flex flex-col gap-4 absolute inset-0 items-center justify-center z-20 pointer-events-none">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          // 🚀 PERFORMANCE: will-change-transform критичен для зацикленных анимаций
          className="absolute left-2 md:left-10 top-10 transform -rotate-6 transition-transform duration-500 transform-gpu will-change-transform"
        >
          <div className="p-2 border border-white/40 bg-white/30 backdrop-blur-md rounded-[24px] shadow-xl">
            <div className="relative h-[150px] w-[150px] md:h-[200px] md:w-[200px] rounded-[20px] overflow-hidden bg-neutral-100">
              <Image
                src="/images/shabbat-challah.webp" // <-- Локальный WebP!
                alt="Shabbat Challah"
                fill
                sizes="(max-width: 768px) 150px, 200px"
                loading="lazy"
                className="object-cover"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute right-2 md:right-10 bottom-10 transform rotate-3 transition-transform duration-500 transform-gpu will-change-transform"
        >
          <div className="p-2 border border-white/40 bg-white/30 backdrop-blur-md rounded-[24px] shadow-xl">
            <div className="relative h-[160px] w-[160px] md:h-[220px] md:w-[220px] rounded-[20px] overflow-hidden bg-neutral-100">
              <Image
                src="/images/shabbat-candles.webp" // <-- Локальный WebP!
                alt="Holiday Lights"
                fill
                sizes="(max-width: 768px) 160px, 220px"
                loading="lazy"
                className="object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 z-40 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent w-full pointer-events-none" />
    </div>
  );
};

const UserMessage = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-row items-end justify-end space-x-2">
    <div className="bg-blue-50 text-blue-900 p-3 rounded-2xl rounded-tr-sm text-xs sm:text-sm font-medium shadow-sm max-w-[80%] border border-blue-100">
      {children}
    </div>
  </div>
);

const CommunityMessage = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-row items-end justify-start space-x-2">
    <div className="h-8 w-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
      <span className="text-xs">✡️</span>
    </div>
    <div className="bg-white border border-neutral-200 text-neutral-800 p-3 rounded-2xl rounded-tl-sm text-xs sm:text-sm font-medium shadow-sm max-w-[80%]">
      {children}
    </div>
  </div>
);

// --- skeletons/second.tsx ---
// (Остальное аналогично: вырезаны все dark: классы, оставлена светлая тема)
// ...
