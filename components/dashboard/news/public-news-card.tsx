"use client";

import Link from "next/link";
import { Pin, Calendar, ArrowRight, UserRound } from "lucide-react";

export default function PublicNewsCard({ item }: { item: any }) {
  const formattedDate = new Date(item.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link
      href={`/news/${item.slug}`}
      className="group flex flex-col bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
    >
      {/* Обложка */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
            <span className="text-neutral-400 font-bold tracking-widest uppercase text-xs">
              Нет обложки
            </span>
          </div>
        )}

        {/* Бейдж "Закреплено" */}
        {item.isPinned && (
          <div className="absolute top-4 left-4 bg-[#FFB800] text-black px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest shadow-lg">
            <Pin size={12} className="fill-black" />
            Важное
          </div>
        )}
      </div>

      {/* Текстовая часть */}
      <div className="p-6 md:p-8 flex flex-col flex-1">
        {/* АВТОР И ДАТА */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          {item.author && (
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0">
                {item.author.imageUrl ? (
                  <img
                    src={item.author.imageUrl}
                    alt="Автор"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserRound className="w-full h-full p-1 text-neutral-400" />
                )}
              </div>
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                {item.author.firstName} {item.author.lastName}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-bold tracking-widest uppercase ml-auto">
            <Calendar size={14} />
            {formattedDate}
          </div>
        </div>

        <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter leading-tight mb-4 group-hover:text-[#FFB800] transition-colors">
          {item.title}
        </h3>

        <div className="mt-auto pt-4 flex items-center text-sm font-bold text-neutral-900 dark:text-white group-hover:text-[#FFB800] transition-colors">
          Читать статью{" "}
          <ArrowRight
            size={16}
            className="ml-2 group-hover:translate-x-1 transition-transform"
          />
        </div>
      </div>
    </Link>
  );
}
