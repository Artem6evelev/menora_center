"use client";
import type { MiniAppLanguage } from "@/lib/telegram/miniapp-i18n";
import { miniAppDictionaries } from "@/lib/telegram/miniapp-i18n";
import { miniAppUiCopy } from "@/lib/telegram/miniapp-ui-copy";
import { eventCopy } from "@/lib/telegram/event-copy";
import type { MiniAppLaunch } from "@/lib/telegram/event-launch";
import { EventMedia, EventMeta } from "./event-card";
import dynamic from "next/dynamic";
const EventAccessFlow = dynamic(() => import("@/components/events/event-access-flow"), { loading: () => <button className="miniapp-primary w-full" disabled>Хочу прийти</button> });
import type { evaluateEventEligibility } from "@/lib/events/eligibility";

/** Public launch data only, while the separately authorized detail is loading. */
export function EventLaunchPreview({ event, language }: { event: NonNullable<MiniAppLaunch["event"]>; language: MiniAppLanguage }) {
  return <article className="miniapp-event-detail" data-event-launch-preview={event.id}>
    <EventMedia event={event} language={language} priority />
    <div className="miniapp-detail-summary"><h1>{event.title}</h1><EventMeta event={event} language={language} />
      <p role="status" className="miniapp-muted">Загружаем данные для записи…</p></div>
  </article>;
}

export function EventEntry({ event, language, onProceed, onOpenEvents }: { event: NonNullable<MiniAppLaunch["event"]>; language: MiniAppLanguage; gate?: boolean; onProceed: (assessment: ReturnType<typeof evaluateEventEligibility>) => void; onOpenEvents: () => void }) {
  const u = miniAppUiCopy[language];
  return <article className="miniapp-event-detail miniapp-enter" data-event-entry={event.id}>
    <EventMedia event={event} language={language} priority />
    <div className="miniapp-detail-summary"><p className="miniapp-eyebrow">{u.preview}</p><h1>{event.title}</h1><EventMeta event={event} language={language} />
      {event.description && <p className="miniapp-muted miniapp-event-lead whitespace-pre-line">{event.description.replace(/<\/(?:p|div)>|<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "")}</p>}
      {!event.isFree && <p>{event.price || "0"} ₪ · {event.childPrice || "0"} ₪</p>}
      <EventAccessFlow eventId={event.id} source="telegram" onProceed={onProceed} onOpenEvents={onOpenEvents} />
    </div>
  </article>;
}
