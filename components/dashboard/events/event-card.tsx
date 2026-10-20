"use client";

import { useRouter } from "next/navigation";
import { Calendar, Edit, Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { cn } from "@/lib/utils";

dayjs.locale("ru");

export default function EventCard({
  item,
  onEdit,
  isAdmin,
}: {
  item: any;
  onEdit: (item: any) => void;
  isAdmin: boolean;
}) {
  const { event } = item;
  const router = useRouter();
  const isClosed = event.isRegistrationClosed;
  if (!isAdmin && isClosed) return null;
  const handleClick = () => {
    if (isAdmin) onEdit(item);
    else router.push(`/events/${event.id}`);
  };

  return (
    <>
      <motion.div
        layout
        onClick={handleClick}
        className="group relative rounded-[32px] overflow-hidden aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 shadow-sm transition-all duration-500 hover:shadow-2xl cursor-pointer isolate"
      >
        <img
          src={event.imageUrl || "/default-event-poster.png"}
          alt={event.title}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 -z-10",
            isClosed && "grayscale-[30%] opacity-80",
          )}
        />
        {isAdmin && isClosed && (
          <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-red-500/90 backdrop-blur-md rounded-full flex items-center gap-1.5 shadow-lg border border-red-400/20">
            <Lock size={12} strokeWidth={3} className="text-white" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white">
              Запись закрыта
            </span>
          </div>
        )}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 dark:bg-black/90 backdrop-blur-md text-neutral-900 dark:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <Edit size={16} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent -z-10" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
          <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            <p className="text-[#FFB800] text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Calendar size={14} />
              {event.date
                ? dayjs(event.date).format("DD MMM YYYY")
                : "Дата не указана"}
            </p>
            <h3 className="text-white text-2xl font-black tracking-tighter leading-tight mb-4 line-clamp-3">
              {event.title}
            </h3>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block">
              <button className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors border border-white/20 pointer-events-none flex items-center justify-center gap-2">
                {isAdmin ? (
                  "Редактировать событие"
                ) : (
                  <>
                    <ArrowRight size={16} /> Узнать подробности
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
