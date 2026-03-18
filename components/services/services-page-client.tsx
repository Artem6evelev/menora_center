"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useServicesDiscovery } from "@/store/useServiceDiscovery";
import PublicServiceCard from "./public-service-card"; // Путь к твоей обновленной карточке
import { Search, RotateCcw, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPublicServicesPaginated } from "@/actions/service";

export default function ServicesPageClient({
  initialServices,
  categories,
  userId,
}: {
  initialServices: any[];
  categories: any[];
  userId: string | null;
}) {
  const {
    activeCategory,
    setCategory,
    searchQuery,
    setSearch,
    priceType,
    setPriceType,
    resetFilters,
  } = useServicesDiscovery();

  const [services, setServices] = useState(initialServices || []);

  // Если меняется категория - подтягиваем услуги с сервера (чтобы логика совпадала с events)
  useEffect(() => {
    const filterFromDB = async () => {
      try {
        const data = await getPublicServicesPaginated(1, 100, activeCategory);
        setServices(data?.services || []);
      } catch (e) {
        console.error(e);
      }
    };
    if (activeCategory !== null) filterFromDB();
    else setServices(initialServices || []);
  }, [activeCategory, initialServices]);

  // Локальная фильтрация по поиску и цене
  const filteredServices = useMemo(() => {
    return services.filter((item: any) => {
      const s = item.service;

      // Поиск по названию
      const titleMatch = (s?.title || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Фильтр по цене (если price пустой/null - считаем бесплатным)
      const isFree =
        !s.price ||
        s.price.trim() === "" ||
        s.price.toLowerCase().includes("бесплатно");

      const priceMatch =
        priceType === "all" ? true : priceType === "free" ? isFree : !isFree;

      return titleMatch && priceMatch;
    });
  }, [services, searchQuery, priceType]);

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* ЗАГОЛОВОК (Идентичный событиям) */}
      <div className="flex flex-col items-center text-center mb-12">
        <motion.h1
          className="text-6xl md:text-8xl font-black text-neutral-900 dark:text-white tracking-tighter"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Услуги{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
            Центра
          </span>
        </motion.h1>
      </div>

      {/* COMPACT FILTER BAR */}
      <div className="sticky top-24 z-40 mb-12 px-4 py-2.5 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-neutral-200/50 shadow-sm flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        {/* Категории */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCategory(null)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2",
              activeCategory === null
                ? "bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20"
                : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800",
            )}
          >
            <HeartHandshake size={16} />
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
                  : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Фильтры цены и сброс */}
        <div className="flex items-center gap-3 shrink-0">
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

          {(activeCategory || searchQuery || priceType !== "all") && (
            <button
              onClick={resetFilters}
              className="p-2.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
              title="Сбросить фильтры"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>

        {/* Поиск */}
        <div className="relative w-48 shrink-0 hidden md:block">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            size={16}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск услуг..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm outline-none focus:ring-2 ring-[#FFB800]/20 transition-all border-transparent focus:bg-white dark:focus:bg-neutral-700"
          />
        </div>
      </div>

      {/* GRID */}
      {filteredServices.length === 0 ? (
        <div className="w-full py-20 flex flex-col items-center justify-center text-center opacity-50">
          <HeartHandshake size={48} className="mb-4 text-neutral-400" />
          <p className="text-xl font-bold text-neutral-500">
            По вашему запросу ничего не найдено
          </p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20"
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.map((item: any) => (
              <motion.div
                key={item.service.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <PublicServiceCard item={item} userId={userId} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
