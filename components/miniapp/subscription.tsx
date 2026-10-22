"use client";
import { useEffect, useState } from "react";
import type { MiniAppLanguage } from "@/lib/telegram/miniapp-i18n";
import { eventCopy } from "@/lib/telegram/event-copy";
import { miniAppRequest } from "@/lib/telegram/miniapp-client";
export default function Subscription({
  language,
}: {
  language: MiniAppLanguage;
}) {
  const [status, setStatus] = useState<
      "unknown" | "subscribed" | "unsubscribed" | "blocked"
    >("unknown"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  const c = eventCopy[language];
  useEffect(() => {
    const controller = new AbortController();
    miniAppRequest<{ status: typeof status }>("subscription", {
      signal: controller.signal,
    })
      .then(({ data }) => setStatus(data.status))
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, []);
  async function save() {
    setBusy(true);
    setError(false);
    try {
      const { data } = await miniAppRequest<{ status: typeof status }>(
        "subscription",
        { body: { subscribed: status !== "subscribed" } },
      );
      setStatus(data.status);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="miniapp-panel space-y-3">
      <h2>{c[status]}</h2>
      <p className="miniapp-muted">{c.subscriptionNote}</p>
      <button
        className="miniapp-secondary"
        disabled={busy}
        onClick={() => void save()}
      >
        {status === "subscribed" ? c.unsubscribe : c.notifications}
      </button>
      {error && (
        <p role="alert" className="miniapp-error">
          {c.error}
        </p>
      )}
    </section>
  );
}
