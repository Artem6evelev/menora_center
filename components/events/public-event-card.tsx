"use client";

import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/ru";

dayjs.locale("ru");

export default function PublicEventCard({ item }: { item: any }) {
  const { event } = item;
  const eventImageUrl = event.imageUrl || "/default-event-poster.png";

  return (
    <Link
      href={`/events/${event.id}`}
      className="group relative rounded-[32px] overflow-hidden aspect-[3/4] bg-neutral-100 shadow-sm transition-all duration-500 hover:shadow-2xl cursor-pointer block"
    >
      <img
        src={eventImageUrl}
        alt={event.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
        <p className="text-[#FFB800] text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Calendar size={14} />{" "}
          {event.date ? dayjs(event.date).format("DD MMM") : ""}
        </p>
        <h3 className="text-white text-2xl font-black tracking-tighter leading-tight mb-4">
          {event.title}
        </h3>
        <button className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors border border-white/20 flex items-center justify-center gap-2">
          <ArrowRight size={16} /> Узнать подробности
        </button>
      </div>
    </Link>
  );
}
