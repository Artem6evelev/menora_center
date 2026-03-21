"use client";

import { useState, useEffect } from "react";
import { useCrmStore } from "@/store/useCrmStore";
import {
  Search,
  Mail,
  MessageCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Filter,
  FilterX,
} from "lucide-react";
import { getUsersPaginated } from "@/actions/user";
import UserSlider from "./user-slider";
import BulkMessageModal from "./bulk-message-modal";
import { motion, AnimatePresence, easeInOut } from "framer-motion";
import { cn } from "@/lib/utils";
import dayjs from "dayjs"; // Используем для удобного вывода даты/возраста (установи: npm i dayjs)

export default function CrmTableClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData.users);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [totalUsers, setTotalUsers] = useState(initialData.totalUsers);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    selectedUserIds,
    toggleUserSelection,
    selectAll,
    clearSelection,
    openSlider,
    openBulkModal,
    isFiltersOpen,
    toggleFilters,
    activeFilters,
    setFilter,
    clearFilters,
  } = useCrmStore();

  const springTransition = { duration: 0.5, ease: easeInOut };

  // Функция для расчета возраста из даты
  const calculateAge = (dob: string | null) => {
    if (!dob) return "—";
    const age = dayjs().diff(dayjs(dob), "year");
    return `${age} лет`;
  };

  // Перевод статуса брака для вывода
  const translateMarital = (status: string) => {
    const dict: Record<string, string> = {
      single: "Холост/Не замужем",
      married: "В браке",
      divorced: "В разводе",
      widowed: "Вдова/Вдовец",
    };
    return dict[status] || status || "—";
  };

  // Эффект перезагрузки данных при изменении поиска, страницы или фильтров
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      const res = await getUsersPaginated(page, 20, search, activeFilters);
      setData(res.users);
      setTotalPages(res.totalPages);
      setTotalUsers(res.totalUsers);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, page, activeFilters]);

  return (
    <div className="max-w-[1400px] mx-auto w-full pb-32 relative min-h-[80vh]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springTransition}
        >
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
            База{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              Резидентов
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-3 text-neutral-500 font-medium text-lg">
            <Users size={18} className="text-[#FFB800]" />
            Всего:{" "}
            <span className="font-bold text-neutral-900 dark:text-white">
              {totalUsers}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, ...springTransition }}
          className="flex gap-3 w-full md:w-auto"
        >
          {/* ПОИСК */}
          <div className="relative flex-1 md:w-80 shrink-0">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Поиск (имя, тел, город)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-12 py-3.5 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all shadow-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
            />
            {isLoading && (
              <Loader2
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#FFB800] animate-spin"
                size={18}
              />
            )}
          </div>

          {/* КНОПКА ФИЛЬТРОВ */}
          <button
            onClick={toggleFilters}
            className={cn(
              "p-3.5 rounded-2xl border transition-all active:scale-95 flex items-center gap-2 font-bold text-sm",
              isFiltersOpen ||
                Object.values(activeFilters).some((v) => v !== "")
                ? "bg-[#FFB800]/10 border-[#FFB800]/30 text-[#FFB800]"
                : "bg-white/80 dark:bg-neutral-900/80 border-neutral-200/50 dark:border-neutral-800/50 text-neutral-600 hover:bg-neutral-50",
            )}
          >
            <Filter size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Фильтры</span>
          </button>
        </motion.div>
      </div>

      {/* ПАНЕЛЬ ФИЛЬТРОВ (Выезжает) */}
      <AnimatePresence>
        {isFiltersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl p-6 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Еврейский статус
                </label>
                <select
                  value={activeFilters.jewishStatus}
                  onChange={(e) => {
                    setFilter("jewishStatus", e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-3 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none font-medium text-sm"
                >
                  <option value="">Все статусы</option>
                  <option value="Соблюдающий еврей">Соблюдающий еврей</option>
                  <option value="Светский еврей">Светский еврей</option>
                  <option value="Еврей по отцовской линии">
                    Еврей по отцовской линии
                  </option>
                  <option value="Готовлюсь к Гиюру">Готовлюсь к Гиюру</option>
                  <option value="Прошел гиюр">Прошел гиюр</option>
                  <option value="Интересуюсь иудаизмом">
                    Интересуюсь иудаизмом
                  </option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 min-w-[150px] flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Семья
                </label>
                <select
                  value={activeFilters.maritalStatus}
                  onChange={(e) => {
                    setFilter("maritalStatus", e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-3 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none font-medium text-sm"
                >
                  <option value="">Любое</option>
                  <option value="single">Холост / Не замужем</option>
                  <option value="married">В браке</option>
                  <option value="divorced">В разводе</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 min-w-[150px] flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Дети
                </label>
                <select
                  value={activeFilters.hasChildren}
                  onChange={(e) => {
                    setFilter("hasChildren", e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-3 bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none font-medium text-sm"
                >
                  <option value="">Не важно</option>
                  <option value="yes">Есть дети</option>
                  <option value="no">Нет детей</option>
                </select>
              </div>

              <button
                onClick={clearFilters}
                className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
              >
                <FilterX size={18} /> Сбросить
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ТАБЛИЦА */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...springTransition }}
        className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl rounded-[32px] shadow-sm border border-neutral-200/50 dark:border-neutral-800/50 overflow-hidden relative"
      >
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-neutral-50/50 dark:bg-neutral-950/50 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/50">
              <tr className="text-[10px] uppercase tracking-widest font-black text-neutral-400">
                <th className="p-6 w-16 text-center">
                  <input
                    type="checkbox"
                    checked={
                      data.length > 0 && selectedUserIds.length === data.length
                    }
                    onChange={(e) =>
                      e.target.checked
                        ? selectAll(data.map((u: any) => u.id))
                        : clearSelection()
                    }
                    className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-[#FFB800] focus:ring-[#FFB800] cursor-pointer bg-neutral-100 dark:bg-neutral-800 accent-[#FFB800]"
                  />
                </th>
                <th className="py-6 px-4">Резидент</th>
                <th className="py-6 px-4">Контакты & Город</th>
                <th className="py-6 px-4">Семья & Возраст</th>
                <th className="py-6 px-4">Статус</th>
                <th className="py-6 px-8 text-right">Карточка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
              {data.map((user: any) => {
                const userTags = JSON.parse(user.tags || "[]");
                const isSelected = selectedUserIds.includes(user.id);

                return (
                  <tr
                    key={user.id}
                    className={cn(
                      "group transition-colors",
                      isSelected
                        ? "bg-[#FFB800]/5 hover:bg-[#FFB800]/10"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/30",
                    )}
                  >
                    <td className="p-6 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-[#FFB800] focus:ring-[#FFB800] cursor-pointer accent-[#FFB800]"
                      />
                    </td>

                    {/* ИМЯ И ТЕГИ */}
                    <td className="py-4 px-4">
                      <div
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => openSlider(user.id)}
                      >
                        <img
                          src={user.imageUrl || "/default-avatar.png"}
                          className="w-12 h-12 rounded-full object-cover bg-neutral-100 dark:border-neutral-700"
                        />
                        <div>
                          <div className="font-bold text-neutral-900 dark:text-white text-base leading-tight mb-1.5 group-hover:text-[#FFB800] transition-colors">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {userTags.slice(0, 2).map((t: string) => (
                              <span
                                key={t}
                                className="text-[9px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-md font-bold uppercase tracking-widest"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ТЕЛЕФОН И ГОРОД */}
                    <td className="py-4 px-4">
                      <div className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        {user.phone || "—"}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        {user.city || "Город не указан"}
                      </div>
                    </td>

                    {/* СЕМЬЯ И ВОЗРАСТ */}
                    <td className="py-4 px-4">
                      <div className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-2">
                        {translateMarital(user.maritalStatus)}
                        {user.hasChildren && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                            title="Есть дети"
                          ></span>
                        )}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        {calculateAge(user.dateOfBirth)}
                      </div>
                    </td>

                    {/* СТАТУС */}
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          "text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest",
                          user.jewishStatus
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-neutral-100 text-neutral-400",
                        )}
                      >
                        {user.jewishStatus || "Не указан"}
                      </span>
                    </td>

                    {/* КНОПКА */}
                    <td className="py-4 px-8 text-right">
                      <button
                        onClick={() => openSlider(user.id)}
                        className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-[#FFB800] rounded-xl transition-all shadow-sm active:scale-95"
                      >
                        <MessageCircle size={18} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ПАГИНАЦИЯ */}
        <div className="p-6 border-t border-neutral-200/50 flex justify-between">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            Страница <span className="text-neutral-900">{page}</span> из{" "}
            {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 bg-white border rounded-xl disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 bg-white border rounded-xl disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ОСТАЛЬНОЕ БЕЗ ИЗМЕНЕНИЙ (Модалка и Слайдер) ... */}
      <AnimatePresence>
        {selectedUserIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
            className="fixed bottom-10 left-1/2 bg-neutral-900/90 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 z-[100]"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-[#FFB800] rounded-full flex items-center justify-center text-xs font-black text-black">
                {selectedUserIds.length}
              </span>
              <span className="text-xs font-black uppercase tracking-widest opacity-80">
                выбрано
              </span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <button
              onClick={openBulkModal}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-[#FFB800] transition-colors"
            >
              <Mail size={16} strokeWidth={2.5} /> Написать всем
            </button>
            <button
              onClick={clearSelection}
              className="p-1.5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <UserSlider users={data} />
      <BulkMessageModal />
    </div>
  );
}
