"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEventsDiscovery } from "@/store/useEventsDiscovery";
import { getPublicEventsPaginated } from "@/actions/event";
import PublicEventCard from "./public-event-card";
import {
  Search,
  Calendar as CalendarIcon,
  Users,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";

export default function EventsPageClient({
  initialEvents,
  categories,
  userId,
}: any) {
  const {
    activeCategory,
    setCategory,
    searchQuery,
    setSearch,
    selectedDate,
    setDate,
    priceType,
    setPriceType,
    womenOnly,
    setWomenOnly,
  } = useEventsDiscovery();

  const [events, setEvents] = useState(initialEvents || []);

  // Точки на календаре для всех дат, где есть события
  const eventDates = useMemo(() => {
    if (!initialEvents) return [];
    return initialEvents
      .filter((item: any) => item.event?.date)
      .map((item: any) => new Date(item.event.date));
  }, [initialEvents]);

  useEffect(() => {
    const filterFromDB = async () => {
      try {
        const data = await getPublicEventsPaginated(1, 100, activeCategory);
        setEvents(data?.events || []);
      } catch (e) {
        console.error(e);
      }
    };
    if (activeCategory !== null) filterFromDB();
    else setEvents(initialEvents || []);
  }, [activeCategory, initialEvents]);

  // Логика фильтрации на клиенте
  const filteredEvents = useMemo(() => {
    return events.filter((item: any) => {
      const ev = item.event;
      if (!ev) return false;

      // 1. Поиск
      const titleMatch = (ev.title || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // 2. Цена (Смотрим на новое поле isFree)
      const priceMatch =
        priceType === "all"
          ? true
          : priceType === "free"
            ? ev.isFree === true
            : ev.isFree === false;

      // 3. Аудитория (Смотрим на новое поле audience)
      const womenMatch = womenOnly
        ? ev.audience === "women" || ev.audience === "all"
        : true;

      // 4. Дата (Смотрим на новое поле date)
      const dateMatch = selectedDate
        ? ev.date && isSameDay(new Date(ev.date), selectedDate)
        : true;

      return titleMatch && priceMatch && womenMatch && dateMatch;
    });
  }, [events, searchQuery, priceType, womenOnly, selectedDate]);

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col items-center text-center mb-12">
        <motion.h1
          className="text-6xl md:text-8xl font-black text-neutral-900 dark:text-white tracking-tighter"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          События{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
            Menora
          </span>
        </motion.h1>
      </div>

      {/* COMPACT FILTER BAR */}
      <div className="sticky top-24 z-40 mb-12 px-4 py-2.5 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-neutral-200/50 shadow-sm flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCategory(null)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-bold transition-all",
              activeCategory === null
                ? "bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20"
                : "text-neutral-500 hover:bg-neutral-100",
            )}
          >
            Все
          </button>
          {categories?.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-bold transition-all",
                activeCategory === cat.id
                  ? "bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20"
                  : "text-neutral-500 hover:bg-neutral-100",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all",
                  selectedDate
                    ? "border-[#FFB800] bg-[#FFB800]/10 text-[#FFB800]"
                    : "bg-white dark:bg-neutral-950 border-neutral-200 text-neutral-600",
                )}
              >
                <CalendarIcon size={16} />
                {selectedDate
                  ? format(selectedDate, "d MMM", { locale: ru })
                  : "Дата"}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 rounded-[32px] shadow-2xl border-none overflow-hidden"
              align="center"
            >
              <Calendar
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(date) => setDate(date || null)}
                locale={ru}
                eventDates={eventDates}
              />
            </PopoverContent>
          </Popover>

          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full border border-neutral-200/50">
            {["all", "free", "paid"].map((t) => (
              <button
                key={t}
                onClick={() => setPriceType(t as any)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all",
                  priceType === t
                    ? "bg-white dark:bg-neutral-700 shadow-sm text-black dark:text-white"
                    : "text-neutral-500",
                )}
              >
                {t === "all" ? "Все" : t === "free" ? "Бесплатно" : "Платно"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setWomenOnly(!womenOnly)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all",
              womenOnly
                ? "bg-pink-500/10 border-pink-500 text-pink-500"
                : "bg-white dark:bg-neutral-950 border-neutral-200 text-neutral-600",
            )}
          >
            <Users size={16} />{" "}
            <span className="hidden sm:inline">Для женщин</span>
          </button>

          {(selectedDate ||
            activeCategory ||
            searchQuery ||
            womenOnly ||
            priceType !== "all") && (
            <button
              onClick={() => {
                setDate(null);
                setCategory(null);
                setSearch("");
                setWomenOnly(false);
                setPriceType("all");
              }}
              className="p-2.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>

        <div className="relative w-48 shrink-0 hidden md:block">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            size={16}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm outline-none focus:ring-2 ring-[#FFB800]/20 transition-all border-transparent focus:bg-white"
          />
        </div>
      </div>

      {/* GRID */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((item: any) => (
            <motion.div
              key={item.event.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PublicEventCard item={item} userId={userId} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
