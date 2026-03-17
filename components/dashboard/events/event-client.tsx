"use client";

import { useState, useEffect } from "react";
import { Plus, CalendarX } from "lucide-react";
import EventModal from "./event-modal";
import { useEventStore, EventItem } from "@/store/useEventStore";
import EventCard from "./event-card";
import { motion, AnimatePresence } from "framer-motion";

export default function EventsClient({
  initialEvents,
  categories,
  isAdmin,
}: {
  initialEvents: any[];
  categories: any[];
  isAdmin: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);

  const { events, setEvents, setCategories } = useEventStore();

  useEffect(() => {
    setEvents(initialEvents);
    setCategories(categories);
  }, [initialEvents, categories, setEvents, setCategories]);

  const handleCreateNew = () => {
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: EventItem) => {
    setEventToEdit(item);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto w-full pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
            События{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              Общины
            </span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2 text-lg">
            Управление мероприятиями, уроками и праздниками.
          </p>
        </motion.div>

        {/* Показываем кнопку "Создать" ТОЛЬКО админам */}
        {isAdmin && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            onClick={handleCreateNew}
            className="group flex items-center gap-2 bg-[#FFB800] hover:bg-[#E5A600] text-black px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-xl shadow-[#FFB800]/20 active:scale-95 shrink-0"
          >
            <Plus
              size={20}
              strokeWidth={2.5}
              className="transition-transform group-hover:rotate-90"
            />
            Создать
          </motion.button>
        )}
      </div>

      {/* CONTENT */}
      {events.length === 0 ? (
        // EMPTY STATE (Премиальный блок, если событий нет)
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-[40px] p-16 text-center flex flex-col items-center justify-center shadow-sm relative overflow-hidden"
        >
          {/* Декоративное свечение */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FFB800]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 w-24 h-24 bg-[#FFB800]/10 dark:bg-[#FFB800]/5 rounded-3xl flex items-center justify-center text-[#FFB800] mb-6">
            <CalendarX size={40} strokeWidth={1.5} />
          </div>
          <h3 className="relative z-10 text-3xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight">
            Пока нет предстоящих событий
          </h3>
          <p className="relative z-10 text-neutral-500 dark:text-neutral-400 font-medium max-w-md text-lg leading-relaxed">
            {isAdmin
              ? "Нажмите кнопку «Создать», чтобы добавить первое мероприятие в календарь общины."
              : "Загляните сюда позже, скоро мы добавим новые интересные мероприятия!"}
          </p>
        </motion.div>
      ) : (
        // GRID
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {events.map((item) => (
              <EventCard
                key={item.event.id}
                item={item}
                onEdit={handleEdit}
                isAdmin={isAdmin}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Модалка для админов */}
      {isAdmin && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          eventToEdit={eventToEdit}
        />
      )}
    </div>
  );
}
