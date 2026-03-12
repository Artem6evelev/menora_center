// components/events/event-category.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MapPin, Clock, CalendarDays, ArrowRight } from "lucide-react";

// 🚀 Сделали image обязательным
type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
  type: string;
  color: string;
};

interface EventCategoryProps {
  title: string;
  description: string;
  events: EventItem[];
}

export const EventCategory = ({
  title,
  description,
  events,
}: EventCategoryProps) => {
  return (
    <section className="relative py-12 max-w-7xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">{title}</h2>
          <p className="text-neutral-500 max-w-2xl text-sm md:text-base">
            {description}
          </p>
        </div>
        <Link
          href={`/events/all`}
          className="text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors flex items-center"
        >
          Смотреть все <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </motion.div>

      {/* Горизонтальный скролл на мобильных, сетка на десктопах */}
      <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 snap-x snap-mandatory hide-scrollbar">
        {events.map((event, index) => (
          <EventCard key={event.id} event={event} index={index} />
        ))}
      </div>
    </section>
  );
};

const EventCard = ({ event, index }: { event: EventItem; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "group relative flex flex-col min-w-[320px] md:min-w-0 w-full snap-start",
        "bg-white border border-neutral-200 rounded-[2rem] overflow-hidden shadow-sm",
        "transition-all duration-300 hover:shadow-xl hover:shadow-neutral-200/50 hover:-translate-y-1",
        "transform-gpu will-change-transform",
      )}
    >
      {/* 🚀 Обязательное фото (Top Half) */}
      <div className="relative w-full h-52 bg-neutral-100 overflow-hidden">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {/* Бейдж с типом события поверх картинки */}
        <div className="absolute top-4 left-4 z-10">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md bg-white/90",
              event.color,
            )}
          >
            {event.type}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Контент (Bottom Half) */}
      <div className="p-6 md:p-8 flex flex-col flex-grow bg-white relative z-10">
        <h3 className="text-xl font-bold text-neutral-900 mb-5 leading-tight group-hover:text-blue-700 transition-colors">
          {event.title}
        </h3>

        <div className="space-y-3 mb-8">
          <div className="flex items-center text-sm text-neutral-600 font-medium">
            <CalendarDays className="w-4 h-4 mr-3 text-neutral-400" />
            {event.date}
          </div>
          <div className="flex items-center text-sm text-neutral-600 font-medium">
            <Clock className="w-4 h-4 mr-3 text-neutral-400" />
            {event.time}
          </div>
          <div className="flex items-center text-sm text-neutral-600 font-medium">
            <MapPin className="w-4 h-4 mr-3 text-neutral-400 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        <div className="mt-auto border-t border-neutral-100 pt-5">
          <Link
            href={`/dashboard/events/${event.id}`}
            className="w-full inline-flex items-center justify-center text-sm font-bold bg-neutral-50 hover:bg-neutral-100 text-neutral-900 py-3 rounded-xl transition-colors"
          >
            Подробнее / Записаться
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
