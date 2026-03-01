"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { Globe } from "../globe";
import {
  IconBook,
  IconHeartHandshake,
  IconSchool,
  IconFlame,
  IconBuildingCommunity,
  IconStar,
} from "@tabler/icons-react";

export const SkeletonFour = () => {
  return (
    <div className="h-full flex flex-col items-center relative bg-white dark:bg-zinc-950 mt-10 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      {/* Заголовок внутри блока (Опционально) */}
      <div className="absolute top-4 left-0 right-0 z-20 text-center">
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
          Наши партнеры и проекты
        </p>
      </div>

      <div className="flex flex-col justify-center h-full w-full py-10 gap-6 z-10">
        <InfiniteMovingCards speed="fast" direction="left">
          <MovingGrid1 />
        </InfiniteMovingCards>
        <InfiniteMovingCards speed="slow" direction="right">
          <MovingGrid2 />
        </InfiniteMovingCards>
        <InfiniteMovingCards speed="normal" direction="left">
          <MovingGrid3 />
        </InfiniteMovingCards>
      </div>

      {/* Глобус в углу (Связь со всем миром) */}
      <Globe className="absolute -right-10 md:-right-40 -bottom-40 opacity-40 dark:opacity-60 pointer-events-none" />

      {/* Градиент снизу */}
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent z-20 pointer-events-none" />
    </div>
  );
};

// --- Группы карточек ---

// Группа 1: Образование
const MovingGrid1 = () => {
  return (
    <div className="flex space-x-4 flex-shrink-0 relative z-40">
      <Badge icon={<IconBook className="text-blue-500" />} text="Kolel Torah" />
      <Badge icon={<IconStar className="text-yellow-500" />} text="STARS" />
      <Badge icon={<IconSchool className="text-indigo-500" />} text="JLI" />
      <Badge icon={<IconBook className="text-blue-500" />} text="Yeshiva" />
    </div>
  );
};

// Группа 2: Молодежь и Сообщество
const MovingGrid2 = () => {
  return (
    <div className="flex space-x-4 flex-shrink-0 relative z-40">
      <Badge icon={<IconFlame className="text-orange-500" />} text="EnerJew" />
      <Badge
        icon={<IconBuildingCommunity className="text-green-500" />}
        text="Moishe House"
      />
      <Badge icon={<IconStar className="text-yellow-500" />} text="EuroStars" />
      <Badge icon={<IconFlame className="text-orange-500" />} text="CTeen" />
    </div>
  );
};

// Группа 3: Благотворительность
const MovingGrid3 = () => {
  return (
    <div className="flex space-x-4 flex-shrink-0 relative z-40">
      <Badge
        icon={<IconHeartHandshake className="text-red-500" />}
        text="Keren Yedidut"
      />
      <Badge
        icon={<IconBuildingCommunity className="text-blue-400" />}
        text="Joint"
      />
      <Badge
        icon={<IconHeartHandshake className="text-red-500" />}
        text="Lev Echad"
      />
      <Badge
        icon={<IconBuildingCommunity className="text-blue-400" />}
        text="Or Avner"
      />
    </div>
  );
};

// --- Компонент одной карточки (Badge) ---

const Badge = ({ icon, text }: { icon: React.ReactNode; text: string }) => {
  return (
    <span
      className={cn(
        "space-x-2 min-w-32 flex justify-center items-center bg-white dark:bg-neutral-900 px-3 py-2 text-sm font-medium rounded-lg border border-neutral-100 dark:border-neutral-800 shadow-sm transition-transform hover:scale-105 cursor-default",
      )}
    >
      <div className="h-4 w-4 flex items-center justify-center">{icon}</div>
      <span className="text-neutral-700 dark:text-neutral-300">{text}</span>
    </span>
  );
};
