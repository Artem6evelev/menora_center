"use client";
import { Bell } from "lucide-react";
import type { MiniAppLanguage } from "@/lib/telegram/miniapp-i18n";
import { eventCopy } from "@/lib/telegram/event-copy";
import { miniAppUiCopy } from "@/lib/telegram/miniapp-ui-copy";
/** Secondary read-only status. Subscription changes remain explicit bot commands. */
export default function Subscription({ language, status }: { language: MiniAppLanguage; status: "unknown" | "subscribed" | "unsubscribed" | "blocked" | null }) {
  const error = status === null;
  return <aside className="miniapp-announcements" data-announcement-status aria-busy={!status && !error}>
    <span className="miniapp-icon"><Bell size={19} aria-hidden="true" /></span>
    <p>{error ? miniAppUiCopy.ru.announcementsUnavailable : status ? eventCopy.ru[status] : miniAppUiCopy.ru.loading}
      {status === "subscribed" && <span className="miniapp-helper block"><bdi dir="ltr">/unsubscribe</bdi></span>}
    </p>
  </aside>;
}
