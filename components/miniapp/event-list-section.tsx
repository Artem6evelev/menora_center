"use client";
import { useEffect, useState } from "react";
import type { MiniAppCache } from "@/lib/telegram/miniapp-cache";
import { markMiniApp } from "@/lib/telegram/miniapp-performance";
import { miniAppUiCopy } from "@/lib/telegram/miniapp-ui-copy";
import { eventCopy } from "@/lib/telegram/event-copy";
import type { MiniAppLanguage } from "@/lib/telegram/miniapp-i18n";
import { EventCard, type MiniAppEvent } from "./event-card";
import { EmptyState, EventSkeleton } from "./ui";
/** Mounted only after the server profile admits the user. No global/account cache. */
export function EventListSection({ language, onSelect, onAll, initialEvents, cache }: { initialEvents: MiniAppEvent[] | null; cache: MiniAppCache; language: MiniAppLanguage; onSelect: (id: string) => void; onAll: () => void }) {
  const [events, setEvents] = useState<MiniAppEvent[]>(initialEvents ?? []), [loading, setLoading] = useState(initialEvents === null), [error, setError] = useState(false), [retry, setRetry] = useState(0);
  const u = miniAppUiCopy.ru, c = eventCopy.ru;
  useEffect(() => {
    if (initialEvents !== null && retry === 0) { setEvents(initialEvents); setLoading(false); markMiniApp("home-content"); return; }
    const controller = new AbortController();
    setLoading(true); setError(false);
    cache.read<{ events: MiniAppEvent[] }>("events?preview=home", controller.signal)
      .then(data => { if (!controller.signal.aborted) { setEvents(data.events); markMiniApp("home-content"); } })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry, initialEvents, cache]);
  return <section className="miniapp-event-section" aria-label={u.upcoming} data-upcoming-events>
    <div className="miniapp-section-heading"><h2>{u.upcoming}</h2><button className="miniapp-text-action" onClick={onAll}>{u.allEvents}</button></div>
    {loading ? <div className="miniapp-event-grid"><EventSkeleton label={u.loading} /><EventSkeleton label={u.loading} /></div> : error ? <div className="miniapp-error" role="alert"><p>{c.error}</p><button className="miniapp-text-action" onClick={() => setRetry(n => n + 1)}>{c.retry}</button></div> : events.length ? <div className="miniapp-event-grid">{events.map((event, i) => <EventCard key={event.id} event={event} language={language} onSelect={onSelect} priority={i === 0} />)}</div> : <EmptyState title={c.empty} hint={u.emptyHint} />}
  </section>;
}
