// components/dashboard/my-events/my-events-client.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Ticket,
  Baby,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Users,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { cn } from "@/lib/utils";

dayjs.locale("ru");

const StatusBadge = ({
  status,
  type,
}: {
  status: string;
  type: "event" | "kids";
}) => {
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-100 dark:border-green-500/20">
        <CheckCircle2 size={14} /> Подтверждено
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-100 dark:border-red-500/20">
        <XCircle size={14} /> Отклонено
      </span>
    );
  if (status === "in_progress" && type === "kids")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">
        <MessageCircle size={14} /> В работе
      </span>
    );

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20">
      <Clock size={14} /> Ожидает
    </span>
  );
};

export default function MyEventsClient({
  myEvents,
  myKidsApps,
}: {
  myEvents: any[];
  myKidsApps: any[];
}) {
  const [activeTab, setActiveTab] = useState<"events" | "kids">("events");

  return (
    <div className="max-w-7xl mx-auto w-full pb-12">
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
          Мои{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
            Билеты
          </span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2 text-lg max-w-xl">
          Здесь хранятся ваши регистрации на предстоящие события и программы.
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-8 bg-neutral-100/50 dark:bg-neutral-900/50 p-1.5 rounded-[20px] w-fit border border-neutral-200/50 dark:border-neutral-800/50 relative">
        <button
          onClick={() => setActiveTab("events")}
          className={cn(
            "relative z-10 flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-colors",
            activeTab === "events"
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
          )}
        >
          {activeTab === "events" && (
            <motion.div
              layoutId="my-events-tab"
              className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200/50 dark:border-neutral-700/50 -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Ticket size={18} /> Мероприятия{" "}
          <span className="ml-1 px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg text-[10px]">
            {myEvents.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("kids")}
          className={cn(
            "relative z-10 flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-colors",
            activeTab === "kids"
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
          )}
        >
          {activeTab === "kids" && (
            <motion.div
              layoutId="my-events-tab"
              className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200/50 dark:border-neutral-700/50 -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Baby size={18} /> Menorah Kids{" "}
          <span className="ml-1 px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg text-[10px]">
            {myKidsApps.length}
          </span>
        </button>
      </div>

      {/* CONTENT */}
      <motion.div layout className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* ВКЛАДКА ОБЫЧНЫЕ СОБЫТИЯ */}
          {activeTab === "events" ? (
            <motion.div
              key="events"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              {myEvents.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 rounded-[40px] border border-neutral-200/50 dark:border-neutral-800 p-16 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-20 h-20 bg-neutral-50 dark:bg-neutral-800 rounded-[24px] flex items-center justify-center text-neutral-300 dark:text-neutral-600 mb-6">
                    <Ticket size={40} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-black mb-2">
                    У вас пока нет билетов
                  </h3>
                  <p className="text-neutral-500 max-w-md">
                    Перейдите в раздел «События Общины», чтобы выбрать
                    интересные мероприятия и записаться на них.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myEvents.map((item) => (
                    <div
                      key={item.participant.id}
                      className="bg-white dark:bg-neutral-900 rounded-[32px] p-4 sm:p-6 flex flex-col sm:flex-row gap-6 border border-neutral-200/50 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-shadow items-start sm:items-center"
                    >
                      <div className="w-full sm:w-28 sm:h-28 aspect-[4/3] sm:aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-[20px] overflow-hidden shrink-0">
                        <img
                          src={
                            item.event.imageUrl || "/default-event-poster.png"
                          }
                          alt={item.event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] mb-2 flex items-center gap-1.5">
                          <Calendar size={12} />{" "}
                          {item.event.date
                            ? dayjs(item.event.date).format("DD MMM YYYY")
                            : "Дата не указана"}
                        </div>
                        <h4
                          className="text-lg font-black leading-tight mb-4 truncate text-neutral-900 dark:text-white"
                          title={item.event.title}
                        >
                          {item.event.title}
                        </h4>
                        <StatusBadge
                          status={item.participant.status}
                          type="event"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            /* ВКЛАДКА MENORAH KIDS */
            <motion.div
              key="kids"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {myKidsApps.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 rounded-[40px] border border-neutral-200/50 dark:border-neutral-800 p-16 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-20 h-20 bg-pink-50 dark:bg-pink-500/10 rounded-[24px] flex items-center justify-center text-pink-300 dark:text-pink-500/50 mb-6">
                    <Baby size={40} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-black mb-2">
                    У вас нет активных заявок
                  </h3>
                  <p className="text-neutral-500 max-w-md">
                    В разделе Menorah Kids вы можете записать ваших детей на
                    развивающие программы и кружки.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myKidsApps.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white dark:bg-neutral-900 rounded-[32px] p-6 border border-neutral-200/50 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-shadow flex flex-col h-full"
                    >
                      <div className="flex justify-between items-start mb-4 gap-4">
                        <h4 className="text-xl font-black leading-tight text-neutral-900 dark:text-white">
                          {app.programTitle}
                        </h4>
                        <div className="shrink-0">
                          <StatusBadge status={app.status} type="kids" />
                        </div>
                      </div>

                      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-4 mt-auto border border-neutral-100 dark:border-neutral-700/50">
                        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3 ml-1 flex items-center gap-1.5">
                          <Users size={12} /> Записанные дети
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {app.children?.map((child: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm text-neutral-900 dark:text-white"
                            >
                              {child.name}{" "}
                              <span className="text-neutral-400 font-medium ml-1">
                                ({child.age} лет)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
