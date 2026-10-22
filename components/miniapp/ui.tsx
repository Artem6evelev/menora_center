"use client";
import type { ReactNode } from "react";
import { ArrowRight, CalendarDays, Check, Home, Ticket, UserRound, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { miniAppDictionaries, type MiniAppLanguage } from "@/lib/telegram/miniapp-i18n";
import { eventCopy } from "@/lib/telegram/event-copy";
import { miniAppUiCopy } from "@/lib/telegram/miniapp-ui-copy";

export function MiniAppHeader() {
  return <header className="miniapp-header">
    <div className="miniapp-brand"><Logo linked={false} appearance="light" />
      <span className="miniapp-wordmark" dir="ltr" aria-hidden="true">Menorah<span>Center</span></span></div>
  </header>;
}
export function WelcomeCard({ language, firstName }: { language: MiniAppLanguage; firstName?: string }) {
  const c = miniAppDictionaries.ru, u = miniAppUiCopy.ru;
  return <div className="miniapp-intro miniapp-welcome-compact">
    <h1>{firstName ? <>{c.greeting}, <bdi>{firstName}</bdi> <span aria-hidden="true">👋</span></> : "Menorah Center"}</h1>
    <p className="miniapp-muted">{firstName ? u.local : u.identity}</p>
    {!firstName && <p className="miniapp-helper">{u.official}</p>}
  </div>;
}
export function ProfileStatusCard({ language, childrenAllowed }: { language: MiniAppLanguage; childrenAllowed: boolean }) {
  return <section className="miniapp-panel miniapp-profile-status" data-profile-status>
    <span className="miniapp-icon miniapp-icon-success"><Check aria-hidden="true" /></span>
    <div><h2>{miniAppDictionaries.ru.status}</h2><p className="miniapp-helper">{miniAppUiCopy.ru[childrenAllowed ? "family" : "selfOnly"]}</p></div>
  </section>;
}
export function ActionCard({ icon: Icon, children, onClick, href }: { icon: LucideIcon; children: ReactNode; onClick?: () => void; href?: string }) {
  const content = <><span className="miniapp-icon"><Icon size={21} aria-hidden /></span><span>{children}</span><ArrowRight className="miniapp-arrow" size={18} aria-hidden="true" /></>;
  return href ? <a className="miniapp-action-card" href={href} target="_blank" rel="noopener noreferrer">{content}</a> : <button className="miniapp-action-card" onClick={onClick} type="button">{content}</button>;
}
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return <div className="miniapp-panel miniapp-empty"><span className="miniapp-icon"><CalendarDays aria-hidden="true" /></span><h2>{title}</h2>{hint && <p className="miniapp-helper">{hint}</p>}</div>;
}
export function EventSkeleton({ label, detail = false }: { label: string; detail?: boolean }) {
  return <div className="miniapp-event-skeleton" role="status" aria-label={label} data-skeleton={detail ? "detail" : "event"}>
    <div className="miniapp-event-image miniapp-skeleton" /><div className="miniapp-skeleton-lines" aria-hidden="true"><span /><span /><span /></div>
  </div>;
}
export type MiniAppTab = "profile" | "filter" | "events" | "registrations" | null;
export function BottomNav({ language, view, navigate }: { language: MiniAppLanguage; view: MiniAppTab; navigate: (tab: MiniAppTab) => void }) {
  const c = miniAppDictionaries.ru, e = eventCopy.ru;
  const tabs = [{ id: null, label: c.home, Icon: Home }, { id: "events", label: e.events, Icon: CalendarDays },
    { id: "registrations", label: e.registrations, Icon: Ticket }, { id: "profile", label: c.profile, Icon: UserRound }] as const;
  return <nav className="miniapp-nav" aria-label={c.account}>{tabs.map(({ id, label, Icon }) => <button key={id ?? "home"} type="button" aria-current={view === id ? "page" : undefined} onClick={() => navigate(id)}><span className="miniapp-nav-icon"><Icon size={21} aria-hidden="true" /></span><span>{label}</span></button>)}</nav>;
}
