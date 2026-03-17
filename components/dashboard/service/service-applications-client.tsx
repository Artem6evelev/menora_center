"use client";

import { useState, useEffect } from "react";
import { getServiceApplications } from "@/actions/service";
import { Loader2, Users, Phone, Mail, Calendar, Briefcase } from "lucide-react";
import { motion, AnimatePresence, easeInOut } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ServiceApplicationsClient({
  services,
}: {
  services: any[];
}) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services[0]?.id || "",
  );
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const springTransition = { duration: 0.5, ease: easeInOut };

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!selectedServiceId) return;
      setIsLoading(true);
      const data = await getServiceApplications(selectedServiceId);
      setParticipants(data);
      setIsLoading(false);
    };
    fetchParticipants();
  }, [selectedServiceId]);

  return (
    <div className="max-w-7xl mx-auto w-full pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springTransition}
        >
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
            Заявки на{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              Услуги
            </span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2 text-lg">
            Список пользователей, записавшихся на консультации и программы.
          </p>
        </motion.div>

        {/* Премиальный счетчик заявок */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, ...springTransition }}
          className="inline-flex items-center gap-3 bg-[#FFB800]/10 dark:bg-[#FFB800]/5 px-5 py-3.5 rounded-2xl border border-[#FFB800]/20 shadow-sm shrink-0"
        >
          <Users size={20} strokeWidth={2.5} className="text-[#FFB800]" />
          <span className="text-neutral-900 dark:text-white font-black uppercase tracking-widest text-xs">
            Всего заявок: {participants.length}
          </span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...springTransition }}
        className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl rounded-[32px] border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm overflow-hidden relative"
      >
        {/* Декоративное свечение */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#FFB800]/5 rounded-full blur-[100px] pointer-events-none" />

        {/* ФИЛЬТР */}
        <div className="p-6 md:p-8 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-950/50 relative z-10">
          <label className="block text-[10px] uppercase tracking-widest font-black text-neutral-500 dark:text-neutral-400 mb-3 pl-1">
            Выберите услугу для просмотра
          </label>
          <div className="relative w-full md:max-w-md">
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full appearance-none border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-4 pr-10 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-[#FFB800]/50 outline-none transition-all cursor-pointer font-bold text-neutral-900 dark:text-white"
            >
              {services.map((ser) => (
                <option
                  key={ser.id}
                  value={ser.id}
                  className="text-black bg-white"
                >
                  {ser.title}
                </option>
              ))}
            </select>
            {/* Своя иконка для селекта, раз мы убрали стандартную (appearance-none) */}
            <Briefcase
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
          </div>
        </div>

        {/* ТАБЛИЦА */}
        <div className="overflow-x-auto relative z-10">
          <AnimatePresence mode="wait">
            {isLoading ? (
              // Состояние загрузки
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 gap-5"
              >
                <Loader2
                  className="animate-spin text-[#FFB800]"
                  size={40}
                  strokeWidth={2}
                />
                <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">
                  Загрузка данных...
                </p>
              </motion.div>
            ) : participants.length === 0 ? (
              // Состояние: Нет данных
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-32 flex flex-col items-center justify-center"
              >
                <div className="bg-neutral-100 dark:bg-neutral-800 w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-inner">
                  <Users
                    className="text-neutral-300 dark:text-neutral-600"
                    size={32}
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
                  Заявок пока нет
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 font-medium max-w-sm">
                  На выбранную услугу еще никто не записался.
                </p>
              </motion.div>
            ) : (
              // Данные есть - рендерим таблицу
              <motion.table
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full text-left whitespace-nowrap"
              >
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-neutral-400 font-black border-b border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/30 dark:bg-neutral-950/30">
                    <th className="py-6 px-8">Клиент</th>
                    <th className="py-6 px-6">Контакты</th>
                    <th className="py-6 px-6">Дата заявки</th>
                    <th className="py-6 px-8 text-right">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  <AnimatePresence>
                    {participants.map((row, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05, ...springTransition }}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group"
                      >
                        {/* КЛИЕНТ */}
                        <td className="py-5 px-8">
                          <div className="font-bold text-neutral-900 dark:text-white text-base group-hover:text-[#FFB800] transition-colors duration-300">
                            {row.user?.name || row.user?.firstName || "Гость"}
                          </div>
                          <div className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-widest">
                            ID: {row.participant.userId.slice(-6)}
                          </div>
                        </td>

                        {/* КОНТАКТЫ */}
                        <td className="py-5 px-6">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-300">
                              <Phone size={14} className="text-[#FFB800]" />
                              {row.participant.phone}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
                              <Mail size={14} />
                              {row.user?.email || "—"}
                            </div>
                          </div>
                        </td>

                        {/* ДАТА ЗАЯВКИ */}
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2 text-sm font-bold text-neutral-600 dark:text-neutral-400">
                            <Calendar size={14} className="text-neutral-400" />
                            {new Date(
                              row.participant.createdAt,
                            ).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        {/* СТАТУС */}
                        <td className="py-5 px-8 text-right">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm">
                            Новая заявка
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </motion.table>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
