"use client";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { MiniAppLanguage } from "@/lib/telegram/miniapp-i18n";
import { eventCopy } from "@/lib/telegram/event-copy";
import { miniAppUiCopy } from "@/lib/telegram/miniapp-ui-copy";
import { EventShareButton } from "./event-share";
import type { EventShareTarget } from "@/lib/telegram/event-share";
export type MiniAppEvent = ReturnType<typeof import("@/lib/telegram/miniapp-events").eventPreviewDto>;
export type EventPreview = Pick<MiniAppEvent, "id" | "title" | "imageUrl" | "date" | "time" | "location" | "isFree" | "price" | "isRegistrationClosed" | "shareUrl">;

export function EventImage({ event, priority = false }: { event: Pick<EventPreview, "imageUrl">; priority?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const src = event.imageUrl;
  let optimized = !!src && src.startsWith("/") && !src.startsWith("//");
  if (src) try { const url=new URL(src); optimized=url.protocol==="https:" && url.hostname==="gwuzekpkfrkmgluzblty.supabase.co" && url.pathname.startsWith("/storage/v1/object/public/") && !url.username && !url.password; } catch { /* Relative public assets use the local optimizer. */ }
  // Relative site assets and HTTPS event images only. Invalid or broken images
  // retain exactly the same 16:9 box and a recognisable branded fallback.
  const valid = src && (src.startsWith("/") && !src.startsWith("//") || /^https:\/\//.test(src));
  return <div className="miniapp-event-image" data-image-fallback={!valid || failedSrc === src ? "true" : undefined}>
    {(!valid || failedSrc === src) && <div className="miniapp-image-fallback" aria-hidden="true"><CalendarDays size={32} /><span>Menorah Center</span></div>}
    {valid && failedSrc !== src && <>
      <Image className="miniapp-event-backdrop" src={src} alt="" aria-hidden="true" fill sizes="(max-width: 600px) 100vw, 640px" unoptimized={!optimized} priority={priority} onError={() => setFailedSrc(src)} />
      <Image className="miniapp-event-foreground" src={src} alt="" fill sizes="(max-width: 600px) 100vw, 640px" unoptimized={!optimized} priority={priority} onError={() => setFailedSrc(src)} />
    </>}
  </div>;
}
export function EventMedia({ event, language, priority }: { event: Pick<EventPreview, "imageUrl"> & EventShareTarget; language: MiniAppLanguage; priority?: boolean }) {
  return <div className="miniapp-event-media"><EventImage event={event} priority={priority} /><EventShareButton key={event.id} event={event} language={language} overlay /></div>;
}
export function EventMeta({ event, language }: { event: EventPreview; language: MiniAppLanguage }) {
  return <div className="miniapp-event-meta">
    <p><CalendarDays size={16} aria-hidden="true" /><span><bdi>{event.date || "—"}</bdi>{event.time && <> · <bdi>{event.time}</bdi></>}</span></p>
    {event.location && <p><MapPin size={16} aria-hidden="true" /><span>{event.location}</span></p>}
    <span className="miniapp-price">{event.isRegistrationClosed ? eventCopy.ru.closed : event.isFree ? eventCopy.ru.free : `${event.price || 0} ₪`}</span>
  </div>;
}
export function EventCard({ event, language, onSelect, priority }: { event: EventPreview; language: MiniAppLanguage; onSelect: (id: string) => void; priority?: boolean }) {
  return <article className="miniapp-event-poster" data-event-card={event.id}>
    <EventMedia event={event} language={language} priority={priority} />
    <button className="miniapp-event-open" type="button" onClick={() => onSelect(event.id)}>
      <div className="miniapp-poster-content"><h2>{event.title}</h2><EventMeta event={event} language={language} />
        <span className="miniapp-card-cta">{miniAppUiCopy.ru.openEvent}<ArrowRight size={17} className="miniapp-arrow" aria-hidden="true" /></span></div>
    </button>
  </article>;
}
