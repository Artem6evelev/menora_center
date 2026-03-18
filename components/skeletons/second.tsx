"use client";
import { stagger, useAnimate } from "framer-motion";
import React, { useState } from "react";

export const SkeletonTwo = () => {
  const [scope, animate] = useAnimate();
  const [animating, setAnimating] = useState(false);

  const handleAnimation = async () => {
    if (animating) return;

    setAnimating(true);
    await animate(
      ".message",
      { opacity: [0, 1], y: [20, 0] },
      { delay: stagger(0.4) },
    );
    setAnimating(false);
  };

  return (
    <div className="relative h-full w-full mt-4">
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white via-white dark:from-black dark:via-black to-transparent w-full pointer-events-none z-10" />

      <div className="p-4 border border-neutral-200 bg-[#E4EDE7] dark:bg-[#1E2C24] dark:border-neutral-800 rounded-[32px] h-full z-20 overflow-hidden">
        <div className="p-4 bg-white dark:bg-black dark:border-neutral-800 border border-neutral-200 rounded-[24px] flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#FFB800] flex items-center justify-center font-black text-black">
            M
          </div>
          <div>
            <div className="font-bold text-sm dark:text-white">
              Хасидут с кофе ☕
            </div>
            <div className="text-[10px] text-neutral-500">1,204 участника</div>
          </div>
        </div>

        <div
          onMouseEnter={handleAnimation}
          ref={scope}
          className="content w-[90%] mx-auto flex flex-col gap-2"
        >
          <UserMessage>Бокер тов! Во сколько сегодня эфир?</UserMessage>
          <AdminMessage>Доброе утро! Через 10 минут начинаем ☕️📚</AdminMessage>
          <UserMessage>Супер, уже жду ссылку!</UserMessage>
          <AdminMessage>
            <span className="text-blue-500 underline cursor-pointer">
              Подключиться к трансляции
            </span>
          </AdminMessage>
        </div>
      </div>
    </div>
  );
};

const UserMessage = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="message self-start bg-white dark:bg-neutral-800 text-black dark:text-white p-3 text-xs rounded-2xl rounded-tl-sm shadow-sm max-w-[85%]">
      {children}
    </div>
  );
};

const AdminMessage = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="message self-end bg-[#EEFFDE] dark:bg-[#2A5233] text-black dark:text-white p-3 text-xs rounded-2xl rounded-tr-sm shadow-sm max-w-[85%]">
      {children}
    </div>
  );
};
