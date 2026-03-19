"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
// ^ Убедись, что этот компонент у тебя есть по этому пути!

export const SkeletonFour = () => {
  return (
    <div className="h-full flex flex-col items-center relative bg-transparent mt-10">
      <InfiniteMovingCards speed="fast" direction="left">
        <MovingNewsRowOne />
      </InfiniteMovingCards>
      <InfiniteMovingCards speed="slow" direction="right">
        <MovingNewsRowTwo />
      </InfiniteMovingCards>
      <InfiniteMovingCards speed="slow" direction="right">
        <MovingNewsRowThree />
      </InfiniteMovingCards>
    </div>
  );
};

const MovingNewsRowOne = () => {
  return (
    <div className="flex space-x-4 flex-shrink-0 mb-4 relative z-40">
      <NewsChip tag="АКТУАЛЬНО" text="Открытие нового детского сада" />
      <NewsChip tag="ПРАЗДНИК" text="Расписание молитв на Песах" />
      <NewsChip tag="ОБЩИНА" text="Благотворительный сбор успешно завершен" />
      <NewsChip tag="УРОКИ" text="Старт нового курса по изучению Иврита" />
      <NewsChip tag="ТОРА" text="Еженедельный урок по недельной главе" />
    </div>
  );
};

const MovingNewsRowTwo = () => {
  return (
    <div className="flex space-x-4 flex-shrink-0 mb-4 relative z-40">
      <NewsChip tag="СОБЫТИЕ" text="Большой хасидский фарбренген в четверг" />
      <NewsChip tag="УСЛУГИ" text="Открыт заказ кошерного мяса и птицы" />
      <NewsChip tag="ВАЖНО" text="Изменения в расписании зажигания свечей" />
      <NewsChip tag="ДЕТЯМ" text="Воскресная школа: набор в новые группы" />
      <NewsChip
        tag="ЖЕНСКИЙ КЛУБ"
        text="Мастер-класс по выпечке праздничных хал"
      />
    </div>
  );
};

const MovingNewsRowThree = () => {
  return (
    <div className="flex space-x-4 flex-shrink-0 mb-4 relative z-40">
      <NewsChip tag="МОЛОДЕЖЬ" text="Поездка студентов по программе STARS" />
      <NewsChip tag="ИНФРАСТРУКТУРА" text="Завершено обновление миквы" />
      <NewsChip tag="ГОСТЬ" text="Специальная лекция приглашенного раввина" />
      <NewsChip tag="ДОБРО" text="Волонтеры развезли 100 продуктовых наборов" />
      <NewsChip tag="МЕДИА" text="Слушайте новый выпуск общинного подкаста" />
    </div>
  );
};

const NewsChip = ({ tag, text }: { tag: string; text: string }) => {
  return (
    <span
      className={cn(
        "flex flex-col justify-center bg-white dark:bg-neutral-900 px-5 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm min-w-[200px]",
      )}
    >
      <span className="text-[9px] font-black uppercase tracking-widest text-[#FFB800] mb-1">
        {tag}
      </span>
      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
        {text}
      </span>
    </span>
  );
};
