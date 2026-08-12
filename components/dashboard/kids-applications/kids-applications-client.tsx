"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Baby,
  Search,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  Mail,
  ChevronDown,
  UserCircle2,
  MessageCircle,
  Filter,
  FilterX,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  updateKidsApplicationStatus,
  deleteKidsApplication,
} from "@/actions/kids.actions";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { cn } from "@/lib/utils";

dayjs.locale("ru");

// 1. КАСТОМНЫЙ КОМПОНЕНТ ДЛЯ ФИЛЬТРОВ
const CustomFilterSelect = ({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-3.5 bg-white dark:bg-neutral-950/50 border rounded-xl outline-none font-medium text-sm transition-all duration-200 text-left",
          isOpen
            ? "border-pink-500 shadow-[0_0_0_4px_rgba(236,72,153,0.1)]"
            : "border-neutral-200 dark:border-neutral-800 hover:border-pink-500/50",
        )}
      >
        <span
          className={cn(
            "truncate pr-4",
            value ? "text-neutral-900 dark:text-white" : "text-neutral-500",
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-neutral-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            // 🔥 z-[9999] ГАРАНТИРУЕТ, ЧТО МЕНЮ БУДЕТ ПОВЕРХ ВСЕГО
            className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] z-[9999] flex flex-col p-1.5 max-h-[280px] overflow-y-auto custom-scrollbar"
          >
            <button
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 text-sm font-medium text-left rounded-xl transition-colors",
                value === ""
                  ? "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400"
                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white",
              )}
            >
              <span className="truncate">{placeholder}</span>
              {value === "" && <Check size={14} />}
            </button>

            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 text-sm font-medium text-left rounded-xl transition-colors",
                  value === o.value
                    ? "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400"
                    : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white",
                )}
              >
                <span className="truncate">{o.label}</span>
                {value === o.value && <Check size={14} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 2. КАСТОМНЫЙ КОМПОНЕНТ ДЛЯ ТАБЛИЦЫ (СТАТУСЫ)
const StatusSelect = ({
  currentStatus,
  onChange,
}: {
  currentStatus: string;
  onChange: (s: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statuses = [
    {
      value: "pending",
      label: "Ожидает",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      value: "in_progress",
      label: "В работе",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      value: "approved",
      label: "Одобрено",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      value: "rejected",
      label: "Отклонено",
      color: "text-red-500",
      bg: "bg-red-50",
    },
  ];

  const current =
    statuses.find((s) => s.value === currentStatus) || statuses[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-[120px] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
          current.bg,
          current.color,
          "hover:brightness-95 active:scale-95",
        )}
      >
        <span>{current.label}</span>
        <ChevronDown
          size={14}
          className={cn("transition-transform", isOpen && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[calc(100%+8px)] w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] z-50 flex flex-col p-1.5"
          >
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  onChange(s.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-left rounded-xl transition-colors",
                  currentStatus === s.value
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white",
                )}
              >
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    s.value === "pending"
                      ? "bg-amber-500"
                      : s.value === "in_progress"
                        ? "bg-blue-500"
                        : s.value === "approved"
                          ? "bg-green-500"
                          : "bg-red-500",
                  )}
                />
                {s.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function KidsApplicationsClient({
  initialData,
}: {
  initialData: any[];
}) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    program: "",
    jewishStatus: "",
    ageMin: "",
    ageMax: "",
  });

  const uniquePrograms = useMemo(() => {
    return Array.from(new Set(data.map((app) => app.programTitle)));
  }, [data]);

  const isChildMatchingAge = (childAgeStr: string) => {
    if (!filters.ageMin && !filters.ageMax) return true;

    const age = parseInt(childAgeStr);
    if (isNaN(age)) return false;

    const min = filters.ageMin !== "" ? parseInt(filters.ageMin) : 0;
    const max = filters.ageMax !== "" ? parseInt(filters.ageMax) : Infinity;

    return age >= min && age <= max;
  };

  const filteredData = data.filter((app) => {
    const q = search.toLowerCase();
    const parentName =
      `${app.parentFirstName} ${app.parentLastName}`.toLowerCase();
    const matchesSearch =
      parentName.includes(q) ||
      app.email.toLowerCase().includes(q) ||
      app.phone.includes(q) ||
      app.programTitle.toLowerCase().includes(q);
    const matchesStatus = filters.status ? app.status === filters.status : true;
    const matchesProgram = filters.program
      ? app.programTitle === filters.program
      : true;

    let matchesJewish = true;
    if (filters.jewishStatus) {
      if (filters.jewishStatus === "guest") matchesJewish = !app.userId;
      else if (filters.jewishStatus === "empty")
        matchesJewish = app.userId && !app.parentJewishStatus;
      else matchesJewish = app.parentJewishStatus === filters.jewishStatus;
    }

    let matchesAge = true;
    if ((filters.ageMin || filters.ageMax) && app.children) {
      matchesAge = app.children.some((child: any) =>
        isChildMatchingAge(child.age),
      );
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProgram &&
      matchesJewish &&
      matchesAge
    );
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    setData(
      data.map((app) => (app.id === id ? { ...app, status: newStatus } : app)),
    );
    await updateKidsApplicationStatus(id, newStatus);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту заявку?")) return;
    setData(data.filter((app) => app.id !== id));
    await deleteKidsApplication(id);
  };

  const clearFilters = () =>
    setFilters({
      status: "",
      program: "",
      jewishStatus: "",
      ageMin: "",
      ageMax: "",
    });

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest border border-green-100">
            <CheckCircle2 size={12} /> Одобрено
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-100">
            <XCircle size={12} /> Отклонено
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
            <MessageCircle size={12} /> В работе
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100">
            <Clock size={12} /> Ожидает
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
            Заявки{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
              Kids
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-3 text-neutral-500 font-medium text-lg">
            <Baby size={18} className="text-pink-500" />
            Всего заявок:{" "}
            <span className="font-bold text-neutral-900 dark:text-white">
              {filteredData.length}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex gap-3 w-full md:w-auto"
        >
          <div className="relative flex-1 md:w-80 shrink-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Поиск (имя, тел, почта)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/50 transition-all shadow-sm font-medium"
            />
          </div>

          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={cn(
              "p-3.5 rounded-2xl border transition-all active:scale-95 flex items-center gap-2 font-bold text-sm shrink-0",
              isFiltersOpen || Object.values(filters).some((v) => v !== "")
                ? "bg-pink-500/10 border-pink-500/30 text-pink-600"
                : "bg-white/80 dark:bg-neutral-900/80 border-neutral-200/50 dark:border-neutral-800/50 text-neutral-600 hover:bg-neutral-50",
            )}
          >
            <Filter size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Фильтры</span>
          </button>
        </motion.div>
      </div>

      {/* ПАНЕЛЬ ФИЛЬТРОВ БЕЗ OVERFLOW HIDDEN */}
      <AnimatePresence>
        {isFiltersOpen && (
          <motion.div
            layout // Позволяет элементам под панелью плавно съезжать вниз
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-50 mb-6" // Явно ставим высокий z-index
          >
            <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl p-6 rounded-[24px] border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1.5 min-w-[160px] flex-1 relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                  Статус заявки
                </label>
                <CustomFilterSelect
                  value={filters.status}
                  onChange={(v) => setFilters({ ...filters, status: v })}
                  placeholder="Все статусы"
                  options={[
                    { value: "pending", label: "Ожидает" },
                    { value: "in_progress", label: "В работе" },
                    { value: "approved", label: "Одобрена" },
                    { value: "rejected", label: "Отклонена" },
                  ]}
                />
              </div>

              <div className="flex flex-col gap-1.5 min-w-[200px] flex-[2] relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                  Программа
                </label>
                <CustomFilterSelect
                  value={filters.program}
                  onChange={(v) => setFilters({ ...filters, program: v })}
                  placeholder="Любая программа"
                  options={uniquePrograms.map((prog) => ({
                    value: prog as string,
                    label: prog as string,
                  }))}
                />
              </div>

              <div className="flex flex-col gap-1.5 min-w-[220px] flex-[1.5] relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                  Семья / Еврейство
                </label>
                <CustomFilterSelect
                  value={filters.jewishStatus}
                  onChange={(v) => setFilters({ ...filters, jewishStatus: v })}
                  placeholder="Не важно"
                  options={[
                    { value: "Соблюдающий еврей", label: "Соблюдающий еврей" },
                    { value: "Светский еврей", label: "Светский еврей" },
                    {
                      value: "Еврей по отцовской линии",
                      label: "Еврей по отцовской линии",
                    },
                    { value: "Прошел гиюр", label: "Прошел гиюр" },
                    { value: "empty", label: "Резидент без статуса" },
                    { value: "guest", label: "Гость (Без аккаунта)" },
                  ]}
                />
              </div>

              <div className="flex flex-col gap-1.5 min-w-[180px] flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                  Возраст детей
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-bold">
                      От
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="18"
                      value={filters.ageMin}
                      onChange={(e) =>
                        setFilters({ ...filters, ageMin: e.target.value })
                      }
                      className="w-full pl-8 pr-3 py-3.5 bg-white dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none font-medium text-sm focus:border-pink-500 hover:border-pink-500/50 transition-all text-neutral-900 dark:text-white placeholder:text-neutral-400"
                      placeholder="-"
                    />
                  </div>
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-bold">
                      До
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="18"
                      value={filters.ageMax}
                      onChange={(e) =>
                        setFilters({ ...filters, ageMax: e.target.value })
                      }
                      className="w-full pl-8 pr-3 py-3.5 bg-white dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none font-medium text-sm focus:border-pink-500 hover:border-pink-500/50 transition-all text-neutral-900 dark:text-white placeholder:text-neutral-400"
                      placeholder="-"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={clearFilters}
                className="p-3.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shrink-0 h-[48px] px-6"
              >
                <FilterX size={18} />{" "}
                <span className="hidden sm:inline">Сбросить</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ТАБЛИЦА */}
      {/* Добавляем layout сюда, чтобы таблица плавно отъезжала вниз */}
      <motion.div
        layout
        className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm relative z-10"
      >
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-neutral-50 dark:bg-neutral-950/50 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-20">
              <tr className="text-[10px] uppercase tracking-widest font-black text-neutral-400">
                <th className="py-6 px-6">Дата заявки</th>
                <th className="py-6 px-6">Программа</th>
                <th className="py-6 px-6">Родитель & Контакты</th>
                <th className="py-6 px-6">Дети</th>
                <th className="py-6 px-6">Статус</th>
                <th className="py-6 px-6 text-right">Управление</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
              <AnimatePresence>
                {filteredData.map((app) => (
                  <motion.tr
                    key={app.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="p-6">
                      <div className="text-sm font-bold text-neutral-900 dark:text-white">
                        {dayjs(app.createdAt).format("DD MMM YYYY")}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-black tracking-widest mt-1">
                        {dayjs(app.createdAt).format("HH:mm")}
                      </div>
                    </td>

                    <td className="p-6">
                      <div
                        className="text-sm font-bold text-neutral-900 dark:text-white whitespace-normal max-w-[220px] leading-tight"
                        title={app.programTitle}
                      >
                        {app.programTitle}
                      </div>
                    </td>

                    <td className="p-6">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                          <UserCircle2 size={16} />
                        </div>
                        <div className="font-bold text-neutral-900 dark:text-white text-sm">
                          {app.parentFirstName} {app.parentLastName}
                        </div>
                      </div>

                      <div className="pl-11 mb-2">
                        {app.parentJewishStatus ? (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest border border-blue-500/20">
                            {app.parentJewishStatus}
                          </span>
                        ) : (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-black uppercase tracking-widest border border-neutral-200 dark:border-neutral-700">
                            {app.userId
                              ? "Статус не указан"
                              : "Гость (Без аккаунта)"}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 text-[11px] text-neutral-500 font-medium pl-11">
                        <a
                          href={`tel:${app.phone}`}
                          className="flex items-center gap-1.5 hover:text-blue-500 transition-colors w-fit"
                        >
                          <Phone size={12} /> {app.phone}
                        </a>
                        <a
                          href={`mailto:${app.email}`}
                          className="flex items-center gap-1.5 hover:text-blue-500 transition-colors w-fit"
                        >
                          <Mail size={12} /> {app.email}
                        </a>
                      </div>
                    </td>

                    <td className="p-6">
                      <div className="flex flex-col gap-2">
                        {app.children?.map((child: any, idx: number) => {
                          const hasAgeFilter =
                            filters.ageMin !== "" || filters.ageMax !== "";
                          const isMatch = hasAgeFilter
                            ? isChildMatchingAge(child.age)
                            : true;

                          return (
                            <div
                              key={idx}
                              className={cn(
                                "flex flex-col px-4 py-2.5 rounded-xl border w-fit transition-all duration-300",
                                isMatch
                                  ? "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700"
                                  : "bg-transparent border-transparent opacity-30 grayscale",
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={cn(
                                    "text-sm font-bold",
                                    isMatch
                                      ? "text-neutral-900 dark:text-white"
                                      : "text-neutral-500",
                                  )}
                                >
                                  {child.name}
                                </span>
                                <span
                                  className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase shadow-sm",
                                    isMatch
                                      ? "bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                                      : "bg-neutral-100 text-neutral-400",
                                  )}
                                >
                                  {child.age} лет
                                </span>
                              </div>
                              {child.birthDate && (
                                <span
                                  className={cn(
                                    "text-[10px] font-medium tracking-wide",
                                    isMatch
                                      ? "text-neutral-400"
                                      : "text-neutral-400/50",
                                  )}
                                >
                                  Дата рожд:{" "}
                                  {dayjs(child.birthDate).format("DD.MM.YYYY")}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="p-6">
                      <StatusBadge status={app.status} />
                    </td>

                    <td className="p-6 text-right relative">
                      <div className="flex items-center justify-end gap-3">
                        <StatusSelect
                          currentStatus={app.status}
                          onChange={(s) => handleStatusChange(app.id, s)}
                        />

                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Удалить заявку"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 mb-4">
                <Search size={24} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                Ничего не найдено
              </h3>
              <p className="text-neutral-500 text-sm">
                По вашему запросу нет заявок.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
