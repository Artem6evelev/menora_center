"use client";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { eventDto } from "@/lib/telegram/miniapp-events";
import type { MiniAppLanguage } from "@/lib/telegram/miniapp-i18n";
import { eventCopy } from "@/lib/telegram/event-copy";
import { miniAppUiCopy } from "@/lib/telegram/miniapp-ui-copy";
export type MiniAppEvent = ReturnType<typeof eventDto>;
export type EventPreview = Pick<MiniAppEvent, "id" | "title" | "imageUrl" | "date" | "time" | "location" | "isFree" | "price" | "isRegistrationClosed">;

export function EventImage({ event, priority = false }: { event: Pick<EventPreview, "imageUrl">; priority?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const src = event.imageUrl;
  // Relative site assets and HTTPS event images only. Invalid or broken images
  // retain exactly the same 16:9 box and a recognisable branded fallback.
  const valid = src && (src.startsWith("/") && !src.startsWith("//") || /^https:\/\//.test(src));
  return <div className="miniapp-event-image" data-image-fallback={!valid || failedSrc === src ? "true" : undefined}>
    {(!valid || failedSrc === src) && <div className="miniapp-image-fallback" aria-hidden="true"><CalendarDays size={32} /><span>Menorah Center</span></div>}
    {valid && failedSrc !== src && <Image src={src} alt="" fill sizes="(max-width: 600px) 100vw, 640px" unoptimized priority={priority} onError={() => setFailedSrc(src)} />}
  </div>;
}
export function EventMeta({ event, language }: { event: EventPreview; language: MiniAppLanguage }) {
  return <div className="miniapp-event-meta">
    <p><CalendarDays size={16} aria-hidden="true" /><span><bdi>{event.date || "—"}</bdi>{event.time && <> · <bdi>{event.time}</bdi></>}</span></p>
    {event.location && <p><MapPin size={16} aria-hidden="true" /><span>{event.location}</span></p>}
    <span className="miniapp-price">{event.isRegistrationClosed ? eventCopy[language].closed : event.isFree ? eventCopy[language].free : `${event.price || 0} ₪`}</span>
  </div>;
}
export function EventCard({ event, language, onSelect, priority }: { event: MiniAppEvent; language: MiniAppLanguage; onSelect: (id: string) => void; priority?: boolean }) {
  return <button className="miniapp-event-poster" type="button" onClick={() => onSelect(event.id)} data-event-card={event.id}>
    <EventImage event={event} priority={priority} />
    <div className="miniapp-poster-content"><h2>{event.title}</h2><EventMeta event={event} language={language} />
      <span className="miniapp-card-cta">{miniAppUiCopy[language].openEvent}<ArrowRight size={17} className="miniapp-arrow" aria-hidden="true" /></span></div>
  </button>;
}
