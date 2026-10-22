"use client";
import type { MiniAppLanguage } from "@/lib/telegram/miniapp-i18n";
import { miniAppDictionaries } from "@/lib/telegram/miniapp-i18n";
import { miniAppUiCopy } from "@/lib/telegram/miniapp-ui-copy";
import { eventCopy } from "@/lib/telegram/event-copy";
import type { MiniAppLaunch } from "@/lib/telegram/event-launch";
import { EventMedia, EventMeta } from "./event-card";

export function EventEntry({ event, language, gate, onRegister, onContinue }: { event: NonNullable<MiniAppLaunch["event"]>; language: MiniAppLanguage; gate: boolean; onRegister: () => void; onContinue: () => void }) {
  const u = miniAppUiCopy[language];
  return <article className="miniapp-event-detail miniapp-enter" data-event-entry={event.id}>
    <EventMedia event={event} language={language} priority />
    <div className="miniapp-detail-summary"><p className="miniapp-eyebrow">{u.preview}</p><h1>{event.title}</h1><EventMeta event={event} language={language} />
      {event.lead && <p className="miniapp-muted miniapp-event-lead">{event.lead}</p>}
      {gate ? <section className="miniapp-note miniapp-gate" data-onboarding-gate><h2>{u.gateTitle}</h2><p>{u.gateBody}</p><button className="miniapp-primary w-full" onClick={onContinue}>{miniAppDictionaries[language].next}</button></section>
        : <button data-entry-register className="miniapp-primary w-full" disabled={!!event.isRegistrationClosed} onClick={onRegister}>{event.isRegistrationClosed ? eventCopy[language].closed : u.join}</button>}
    </div>
  </article>;
}
