"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Balancer from "react-wrap-balancer";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Моковые данные для календаря
const CALENDAR_EVENTS: Record<
  number,
  { id: string; title: string; time: string; type: string }[]
> = {
  3: [
    {
      id: "e1",
      title: "Большой Пурим в Меноре",
      time: "19:00",
      type: "Праздник",
    },
  ],
  13: [
    { id: "e2", title: "Шаббатон с Раввином", time: "18:30", type: "Шаббат" },
  ],
  14: [
    {
      id: "e3",
      title: "Молодежный Авдала-Клуб",
      time: "21:00",
      type: "Молодежь",
    },
    { id: "e4", title: "Урок: Недельная глава", time: "10:00", type: "Урок" },
    {
      id: "e4-extra",
      title: "Детская программа",
      time: "11:00",
      type: "Детям",
    },
    { id: "e4-extra2", title: "Фарбренген", time: "20:00", type: "Встреча" }, // Добавил для теста скролла
  ],
  25: [
    { id: "e5", title: "Женский клуб: Хала", time: "18:30", type: "Встреча" },
  ],
};

export const EventsHero = () => {
  const [selectedDate, setSelectedDate] = useState<number>(14);
  const selectedEvents = CALENDAR_EVENTS[selectedDate] || [];

  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden max-w-7xl mx-auto px-4 sm:px-6">
      {/* Меняем grid на flex, чтобы лучше контролировать ширину блоков на десктопе */}
      <div className="flex flex-col xl:flex-row gap-12 xl:gap-8 items-center xl:items-start justify-between">
        {/* --- ЛЕВАЯ ЧАСТЬ: ТЕКСТ --- */}
        <div className="flex flex-col items-center xl:items-start text-center xl:text-left z-10 flex-1 w-full max-w-2xl xl:sticky xl:top-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6"
          >
            <span className="text-sm font-semibold text-blue-800 tracking-wide uppercase">
              Жизнь общины
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 mb-6"
          >
            <Balancer>
              Афиша и <span className="text-blue-600">расписание</span>
            </Balancer>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-lg text-neutral-500 font-medium leading-relaxed mb-8"
          >
            <Balancer>
              Следите за нашими праздниками, молодежными встречами и расписанием
              уроков Торы. Добавляйте события в свой календарь и будьте в центре
              еврейской жизни.
            </Balancer>
          </motion.p>
        </div>

        {/* --- ПРАВАЯ ЧАСТЬ: ВИДЖЕТЫ (СПИСОК + КАЛЕНДАРЬ) --- */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full xl:w-auto transform-gpu will-change-transform z-10"
        >
          {/* Декоративное свечение на оба блока */}
          <div className="absolute inset-0 -mx-10 -my-10 bg-gradient-to-tr from-blue-100/80 to-amber-50/80 rounded-[4rem] blur-3xl opacity-50 -z-10" />

          {/* Контейнер для карточек. 
              items-stretch - заставляет обе карточки быть одинаковой высоты.
              flex-col-reverse на мобильных (календарь сверху, список снизу).
          */}
          <div className="flex flex-col-reverse lg:flex-row items-stretch gap-4 md:gap-6 justify-end w-full">
            {/* 1. ПАНЕЛЬ СОБЫТИЙ (СЛЕВА ОТ КАЛЕНДАРЯ) */}
            <div className="bg-white border border-neutral-200 rounded-[2rem] p-6 shadow-xl shadow-neutral-200/40 flex flex-col w-full lg:w-[320px] shrink-0">
              {/* Шапка списка (не скроллится) */}
              <div className="mb-4 shrink-0 pb-4 border-b border-neutral-100">
                <h4 className="text-sm font-bold text-neutral-900 flex items-center justify-between">
                  События на {selectedDate} марта
                  <span className="text-xs font-normal text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {selectedEvents.length}
                  </span>
                </h4>
              </div>

              {/* Скроллируемая область. 
                  min-h-0 нужен, чтобы flexbox правильно рассчитал высоту и включил overflow.
                  custom-scrollbar - класс для красивого скролла.
              */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                <AnimatePresence mode="popLayout">
                  {selectedEvents.length > 0 ? (
                    selectedEvents.map((ev, idx) => (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50/50 hover:bg-blue-50/50 border border-neutral-100 hover:border-blue-100 transition-colors cursor-pointer group"
                      >
                        <div className="flex flex-col items-center min-w-[44px] pt-0.5">
                          <span className="text-[11px] font-bold text-blue-600">
                            {ev.time}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-neutral-900 group-hover:text-blue-700 transition-colors leading-tight">
                            {ev.title}
                          </h5>
                          <span className="text-[10px] uppercase tracking-wider text-neutral-400 mt-1.5 block font-medium">
                            {ev.type}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center py-10 opacity-60"
                    >
                      <span className="text-2xl mb-2">📅</span>
                      <p className="text-sm text-neutral-500">
                        В этот день нет
                        <br />
                        запланированных событий
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 2. КАЛЕНДАРЬ (СПРАВА) */}
            <div className="bg-white border border-neutral-200 rounded-[2rem] p-6 md:p-8 shadow-xl shadow-neutral-200/40 flex flex-col w-full lg:w-[360px] shrink-0 h-max lg:h-auto">
              {/* Хедер календаря */}
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-xl font-bold text-neutral-900">
                  Март 2026
                </h3>
                <div className="flex gap-2">
                  <button className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-600">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-600">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Дни недели */}
              <div className="grid grid-cols-7 gap-1 text-center mb-4 shrink-0">
                {["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map((day) => (
                  <div
                    key={day}
                    className="text-xs font-semibold text-neutral-400 uppercase tracking-wider"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Сетка дней */}
              <div className="grid grid-cols-7 gap-y-2 gap-x-1 shrink-0">
                {Array.from({ length: 31 }).map((_, i) => {
                  const day = i + 1;
                  const hasEvent = !!CALENDAR_EVENTS[day];
                  const isSelected = day === selectedDate;

                  return (
                    <div
                      key={day}
                      className="aspect-square flex items-center justify-center relative"
                    >
                      <button
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                          isSelected
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105"
                            : "text-neutral-700 hover:bg-neutral-100",
                          hasEvent &&
                            !isSelected &&
                            "font-bold text-neutral-900",
                        )}
                      >
                        {day}
                      </button>
                      {/* Точка события */}
                      {hasEvent && !isSelected && (
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-500" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Легенда (push to bottom, чтобы заполнить пространство) */}
              <div className="mt-auto pt-6 flex items-center justify-between text-xs text-neutral-500 font-medium shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />{" "}
                  Мероприятие
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600" /> Выбранный
                  день
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
