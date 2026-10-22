"use client";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import type { MiniAppLanguage } from "@/lib/telegram/miniapp-i18n";
import { eventCopy } from "@/lib/telegram/event-copy";
import { miniAppUiCopy } from "@/lib/telegram/miniapp-ui-copy";
import { miniAppRequest } from "@/lib/telegram/miniapp-client";
/** Secondary read-only status. Subscription changes remain explicit bot commands. */
export default function Subscription({ language }: { language: MiniAppLanguage }) {
  const [status, setStatus] = useState<"unknown" | "subscribed" | "unsubscribed" | "blocked" | null>(null), [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    miniAppRequest<{ status: NonNullable<typeof status> }>("subscription", { signal: controller.signal })
      .then(({ data }) => setStatus(data.status))
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, []);
  return <aside className="miniapp-announcements" data-announcement-status aria-busy={!status && !error}>
    <span className="miniapp-icon"><Bell size={19} aria-hidden="true" /></span>
    <p>{error ? miniAppUiCopy[language].announcementsUnavailable : status ? eventCopy[language][status] : miniAppUiCopy[language].loading}
      {status === "subscribed" && <span className="miniapp-helper block"><bdi dir="ltr">/unsubscribe</bdi></span>}
    </p>
  </aside>;
}
