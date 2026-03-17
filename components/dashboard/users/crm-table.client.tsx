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
} from "lucide-react";
import { getUsersPaginated } from "@/actions/user";
import UserSlider from "./user-slider";
import BulkMessageModal from "./bulk-message-modal";
import { motion, AnimatePresence, easeInOut } from "framer-motion";
import { cn } from "@/lib/utils";

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
  } = useCrmStore();

  const springTransition = { duration: 0.5, ease: easeInOut };

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      const res = await getUsersPaginated(page, 20, search);
      setData(res.users);
      setTotalPages(res.totalPages);
      setTotalUsers(res.totalUsers);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, page]);

  return (
    <div className="max-w-7xl mx-auto w-full pb-32 relative min-h-[80vh]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
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
          <div className="flex items-center gap-2 mt-3 text-neutral-500 dark:text-neutral-400 font-medium text-lg">
            <Users size={18} className="text-[#FFB800]" />
            Всего контактов:{" "}
            <span className="font-bold text-neutral-900 dark:text-white">
              {totalUsers}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, ...springTransition }}
          className="relative w-full md:w-96 shrink-0"
        >
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Поиск по имени, телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all shadow-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
          />
          {isLoading && (
            <Loader2
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#FFB800] animate-spin"
              size={18}
            />
          )}
        </motion.div>
      </div>

      {/* ТАБЛИЦА */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...springTransition }}
        className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl rounded-[32px] shadow-sm border border-neutral-200/50 dark:border-neutral-800/50 overflow-hidden relative"
      >
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#FFB800]/5 rounded-full blur-[100px] pointer-events-none" />

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
                <th className="py-6 px-4">Резидент / Теги</th>
                <th className="py-6 px-4">Контакты</th>
                <th className="py-6 px-4">Информация</th>
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
                    <td className="py-4 px-4">
                      <div
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => openSlider(user.id)}
                      >
                        <img
                          src={user.imageUrl || "/default-avatar.png"}
                          className="w-12 h-12 rounded-full object-cover bg-neutral-100 dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700"
                        />
                        <div>
                          <div className="font-bold text-neutral-900 dark:text-white text-base leading-tight mb-1.5 group-hover:text-[#FFB800] transition-colors duration-300">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                            {userTags.slice(0, 2).map((t: string) => (
                              <span
                                key={t}
                                className="text-[9px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-md font-bold uppercase tracking-widest shadow-sm"
                              >
                                {t}
                              </span>
                            ))}
                            {userTags.length > 2 && (
                              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">
                                +{userTags.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        {user.phone || "—"}
                      </div>
                      <div className="text-xs font-medium text-neutral-400">
                        {user.email}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1">
                        {user.city || "Город не указан"}
                      </div>
                      <div className="text-[9px] text-neutral-400 uppercase font-black tracking-widest">
                        {user.maritalStatus || "—"}
                      </div>
                    </td>
                    <td className="py-4 px-8 text-right">
                      <button
                        onClick={() => openSlider(user.id)}
                        className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-[#FFB800] hover:bg-[#FFB800]/10 rounded-xl transition-all shadow-sm active:scale-95"
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
        <div className="p-6 border-t border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between relative z-10">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            Страница{" "}
            <span className="text-neutral-900 dark:text-white">{page}</span> из{" "}
            {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 transition-all shadow-sm active:scale-95 text-neutral-700 dark:text-neutral-300"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 transition-all shadow-sm active:scale-95 text-neutral-700 dark:text-neutral-300"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* FLOATING ACTION BAR (Массовые действия) */}
      <AnimatePresence>
        {selectedUserIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
            transition={springTransition}
            className="fixed bottom-10 left-1/2 bg-neutral-900/90 dark:bg-neutral-100/90 backdrop-blur-xl text-white dark:text-black px-6 py-4 rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] flex items-center gap-6 z-[100] border border-white/10 dark:border-black/10"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-[#FFB800] rounded-full flex items-center justify-center text-xs font-black text-black shadow-inner">
                {selectedUserIds.length}
              </span>
              <span className="text-xs font-black uppercase tracking-widest opacity-80">
                выбрано
              </span>
            </div>

            <div className="h-8 w-px bg-white/20 dark:bg-black/20" />

            <button
              onClick={openBulkModal}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white dark:text-black hover:text-[#FFB800] dark:hover:text-[#FFB800] transition-colors active:scale-95"
            >
              <Mail size={16} strokeWidth={2.5} /> Написать всем
            </button>

            <button
              onClick={clearSelection}
              className="p-1.5 hover:bg-white/10 dark:hover:bg-black/10 rounded-full text-white/50 dark:text-black/50 hover:text-white dark:hover:text-black transition-all active:scale-95"
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
