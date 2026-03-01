"use client";
import { stagger, useAnimate } from "framer-motion";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

export const SkeletonTwo = () => {
  const [scope, animate] = useAnimate();
  const [animating, setAnimating] = useState(false);

  const handleAnimation = async () => {
    if (animating) return;

    setAnimating(true);
    // Сбрасываем прозрачность перед началом
    await animate(".message", { opacity: 0, y: 10 }, { duration: 0 });

    await animate(
      ".message",
      {
        opacity: [0, 1],
        y: [20, 0],
      },
      {
        delay: stagger(0.4),
        duration: 0.5,
      },
    );
    setAnimating(false);
  };

  return (
    <div className="relative h-full w-full mt-4">
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white via-white dark:from-black dark:via-black to-transparent w-full pointer-events-none z-10" />

      {/* Рамка телефона */}
      <div className="p-4 border border-neutral-200 bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 rounded-[32px] h-full z-20 overflow-hidden">
        <div className="p-2 bg-white dark:bg-zinc-950 dark:border-neutral-700 border border-neutral-200 rounded-[24px] h-full flex flex-col">
          {/* Хедер чата */}
          <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-2 px-2 pt-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs">
              🚀
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Menora Youth Club
              </div>
              <div className="text-[10px] text-green-500">5 online</div>
            </div>
          </div>

          <div
            onMouseEnter={handleAnimation}
            ref={scope}
            className="content mt-2 w-full px-2 flex flex-col gap-3 overflow-hidden pb-10"
          >
            <InboundMessage>Ребята, кто сегодня идет в клуб? 👋</InboundMessage>

            <OutboundMessage>
              Я буду! Слышал, сегодня крутой спикер.
            </OutboundMessage>

            <InboundMessage>
              Да, раввин говорит про бизнес и этику. Плюс пицца будет 🍕
            </InboundMessage>

            <OutboundMessage>
              Ого, тема топ. Я друга с собой возьму, ок?
            </OutboundMessage>

            <InboundMessage>
              Конечно! Места всем хватит. Ждем к 20:00!
            </InboundMessage>

            <OutboundMessage>Договорились, скоро будем! 🚕</OutboundMessage>
          </div>
        </div>
      </div>
    </div>
  );
};

// Сообщение от "собеседника" (Слева, серое)
const InboundMessage = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="message self-start bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 text-neutral-800 p-3 rounded-2xl rounded-tl-none text-xs max-w-[85%] shadow-sm">
      {children}
    </div>
  );
};

// Сообщение от "меня" (Справа, цветное - фирменный синий/индиго)
const OutboundMessage = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="message self-end bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none text-xs max-w-[85%] shadow-md">
      {children}
    </div>
  );
};
