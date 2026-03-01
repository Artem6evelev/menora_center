"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  IconDots,
  IconPlus,
  IconBook,
  IconCalendar,
} from "@tabler/icons-react"; // Добавил иконки
import { Switch } from "../switch";
import { cn } from "@/lib/utils";

export const SkeletonThree = () => {
  return (
    <div className="h-full w-full sm:w-[80%] mx-auto bg-white dark:bg-neutral-900 shadow-2xl dark:shadow-white/10 mt-10 group rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Градиент внизу для плавного исчезновения */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white via-white dark:from-neutral-900 dark:via-neutral-900 to-transparent w-full pointer-events-none z-[11]" />

      <div className="flex flex-1 w-full h-full flex-col">
        {/* Хедер карточки */}
        <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3 p-5 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <IconBook className="w-5 h-5 text-blue-600" />
            <p className="text-neutral-700 dark:text-neutral-200 text-sm font-bold">
              Мои курсы
            </p>
          </div>
          <button className="shadow-sm text-neutral-500 dark:text-neutral-400 hover:text-blue-600 transition-colors text-xs px-2 py-1.5 rounded-md flex space-x-1 items-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <IconPlus className="h-3.5 w-3.5" />
            <span>Каталог</span>
          </button>
        </div>

        {/* Список уроков */}
        <div className="flex flex-col space-y-4 p-5">
          <Row
            title="Недельная глава"
            time="Среда, 19:00"
            tag="Тора"
            tagColor="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            active={true}
          />
          <Row
            title="Тайны Каббалы"
            time="Четверг, 20:00"
            tag="Глубина"
            tagColor="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            active={true}
          />
          <Row
            title="Женский клуб"
            time="Рош Ходеш"
            tag="Община"
            tagColor="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
            active={false}
          />
          <Row
            title="История евреев"
            time="Воскресенье, 18:00"
            tag="История"
            tagColor="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            active={true}
          />
          <Row
            title="Иврит с нуля"
            time="Вторник, 19:30"
            tag="Язык"
            tagColor="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
            active={false}
          />
        </div>
      </div>
    </div>
  );
};

export const Row = ({
  title,
  time,
  tag,
  tagColor,
  active = false,
}: {
  title: string;
  time: string;
  tag: string;
  tagColor: string;
  active?: boolean;
}) => {
  const [checked, setChecked] = useState(active);

  return (
    <div className="flex justify-between items-center group/row">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
        {/* Название и Тег */}
        <div className="flex items-center gap-2">
          <p className="text-neutral-700 dark:text-neutral-200 text-sm font-medium">
            {title}
          </p>
          <span
            className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
              tagColor,
            )}
          >
            {tag}
          </span>
        </div>

        {/* Время */}
        <div className="flex items-center gap-1 text-neutral-400">
          <IconCalendar className="w-3 h-3" />
          <p className="text-[11px] font-medium">{time}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch checked={checked} setChecked={setChecked} />
        <IconDots className="h-4 w-4 text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors opacity-0 group-hover/row:opacity-100" />
      </div>
    </div>
  );
};
