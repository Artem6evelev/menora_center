"use client";
import React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const SkeletonThree = () => {
  return (
    <div className="h-full w-full sm:w-[80%] mx-auto bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-2xl mt-10 group rounded-2xl overflow-hidden relative z-10">
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white via-white dark:from-neutral-900 dark:via-neutral-900 to-transparent w-full pointer-events-none z-[11]" />

      <div className="flex flex-1 w-full h-full flex-col space-y-2">
        <div className="flex justify-between border-b dark:border-neutral-800 pb-2 p-4 items-center">
          <p className="text-neutral-500 text-sm font-bold dark:text-neutral-400">
            Каталог услуг
          </p>
          <p className="text-white text-xs px-3 py-1.5 rounded-full flex space-x-1 items-center bg-black dark:bg-[#FFB800] dark:text-black font-bold">
            Все услуги <ArrowRight size={12} />
          </p>
        </div>
        <div className="flex flex-col space-y-3 p-4">
          <Row title="Проверка тфилина и мезуз" status="Доступно" active />
          <Row title="Консультация с раввином" status="Онлайн / Офлайн" />
          <Row title="Организация Хупы" status="Запись открыта" active />
          <Row title="Кошерный кейтеринг" status="Доставка" />
          <Row title="Помощь общины" status="Фонд" active />
        </div>
      </div>
    </div>
  );
};

export const Row = ({
  title,
  status,
  active = false,
}: {
  title: string;
  status: string;
  active?: boolean;
}) => {
  return (
    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
      <div className="flex space-x-3 items-center">
        <CheckCircle2
          size={16}
          className={
            active ? "text-[#FFB800]" : "text-neutral-300 dark:text-neutral-700"
          }
        />
        <p className="text-neutral-800 dark:text-neutral-200 text-sm font-medium">
          {title}
        </p>
      </div>
      <p className="text-neutral-400 dark:text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
        {status}
      </p>
    </div>
  );
};
