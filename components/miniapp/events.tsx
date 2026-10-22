"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { MiniAppLanguage } from "@/lib/telegram/miniapp-i18n";
import { eventCopy } from "@/lib/telegram/event-copy";
import { miniAppRequest } from "@/lib/telegram/miniapp-client";
import type { eventDto } from "@/lib/telegram/miniapp-events";

type Event = ReturnType<typeof eventDto>;
type Detail = {
  registration: {
    status: string;
    amountAgorot: number;
    paymentUrl: string | null;
  } | null;
  event: Event;
  children: { id: string; name: string }[];
  canRegisterChildren: boolean;
  needsGiyurClarification: boolean;
};
type Registration = {
  id: string;
  event: Event;
  status: string;
  amountAgorot: number;
};
const money = (amount: number, language: MiniAppLanguage) =>
  new Intl.NumberFormat(language === "he" ? "he-IL" : language, {
    style: "currency",
    currency: "ILS",
  }).format(amount / 100);
function EventImage({ event }: { event: Event }) {
  return event.imageUrl ? (
    <div className="miniapp-event-image">
      <Image
        src={event.imageUrl}
        alt=""
        fill
        sizes="(max-width: 600px) 100vw, 600px"
        unoptimized
      />
    </div>
  ) : null;
}
export default function MiniAppEvents({
  language,
  mode,
  onNested,
  openPayment,
  initialEvent,
  onProfileChanged,
}: {
  language: MiniAppLanguage;
  mode: "events" | "registrations";
  onNested: (back: (() => void) | null) => void;
  openPayment: (url: string) => void;
  initialEvent?: string;
  onProfileChanged: () => Promise<void>;
}) {
  const c = eventCopy[language];
  const [list, setList] = useState<Event[]>([]),
    [registrations, setRegistrations] = useState<Registration[]>([]),
    [detail, setDetail] = useState<Detail | null>(null);
  const [page, setPage] = useState(1),
    [more, setMore] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]),
    [quote, setQuote] = useState<{
      amountAgorot: number;
      adults: number;
      children: number;
    } | null>(null);
  const [receipt, setReceipt] = useState<{
      status: string;
      amountAgorot: number;
      paymentUrl: string | null;
    } | null>(null),
    [clarify, setClarify] = useState(false),
    [stage, setStage] = useState<"advanced" | "completed" | "">("");
  const [eventId, setEventId] = useState(initialEvent || "");
  const back = useCallback(() => {
    if (busy) return;
    setEventId("");
    setDetail(null);
    setReceipt(null);
    setQuote(null);
    setError(false);
  }, [busy]);
  useEffect(() => {
    onNested(eventId ? back : null);
    return () => onNested(null);
  }, [eventId, back, onNested]);
  const load = useCallback(
    async (next = 1) => {
      setLoading(true);
      setError(false);
      try {
        if (mode === "events") {
          const { data } = await miniAppRequest<{
            events: Event[];
            hasMore: boolean;
          }>(`events?page=${next}`);
          setList((old) =>
            next === 1 ? data.events : [...old, ...data.events],
          );
          setMore(data.hasMore);
        } else {
          const { data } = await miniAppRequest<{
            registrations: Registration[];
            hasMore: boolean;
          }>(`registrations?page=${next}`);
          setRegistrations((old) =>
            next === 1 ? data.registrations : [...old, ...data.registrations],
          );
          setMore(data.hasMore);
        }
        setPage(next);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [mode],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const loadDetail = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(false);
    try {
      const { data } = await miniAppRequest<Detail>(
        `events?id=${encodeURIComponent(eventId)}`,
      );
      setDetail(data);
      setSelected((old) =>
        old.filter((id) => data.children.some((child) => child.id === id)),
      );
      setQuote(null);
      setReceipt(data.registration);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [eventId]);
  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);
  async function action(kind: "quote" | "register") {
    setBusy(true);
    setError(false);
    try {
      const { data } = await miniAppRequest<{
        quote?: typeof quote;
        registration?: NonNullable<typeof receipt>;
      }>("events", { body: { action: kind, eventId, childIds: selected } });
      if (data.quote) setQuote(data.quote);
      if (data.registration) {
        setReceipt(data.registration);
        await load();
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function saveStage() {
    setBusy(true);
    setError(false);
    try {
      await miniAppRequest("giyur", { body: { stage } });
      await onProfileChanged();
      setClarify(false);
      await loadDetail();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const statusLabel = (status: string) =>
    c[status as "confirmed" | "pending" | "paid" | "abandoned" | "cancelled"] ||
    status;
  return (
    <div className="space-y-5" data-miniapp-events={mode}>
      <div className="miniapp-intro">
        <p className="miniapp-eyebrow">Menorah Center</p>
        <h1>
          {detail?.event.title ||
            (mode === "events" ? c.events : c.registrations)}
        </h1>
      </div>
      {eventId && (
        <button className="miniapp-text-action" disabled={busy} onClick={back}>
          {c.back}
        </button>
      )}
      {error && (
        <div role="alert" className="miniapp-error">
          {c.error}
          <button
            className="miniapp-text-action"
            disabled={busy}
            onClick={() => void (eventId ? loadDetail() : load())}
          >
            {c.retry}
          </button>
        </div>
      )}
      {loading && !detail && (
        <div className="miniapp-spinner" role="status" aria-label="Loading" />
      )}
      {eventId && detail ? (
        <section className="miniapp-panel space-y-5">
          <EventImage event={detail.event} />
          <p className="miniapp-muted">
            {detail.event.date} · {detail.event.time}
            <br />
            {detail.event.location}
          </p>
          <p className="whitespace-pre-wrap break-words">
            {detail.event.description?.replace(/<[^>]*>/g, "")}
          </p>
          <p>
            {detail.event.isFree
              ? c.free
              : `${c.adult}: ${detail.event.price || 0} ₪ · ${c.child}: ${detail.event.childPrice || 0} ₪`}
          </p>
          {detail.event.isRegistrationClosed ? (
            <p className="miniapp-error">{c.closed}</p>
          ) : receipt ? (
            <div className="space-y-4" data-payment-handoff>
              <h2>{statusLabel(receipt.status)}</h2>
              {receipt.status === "pending" && (
                <>
                  <p className="miniapp-total">
                    {c.total}:{" "}
                    <bdi>{money(receipt.amountAgorot, language)}</bdi>
                  </p>
                  <p className="miniapp-muted">{c.paymentNote}</p>
                  {receipt.paymentUrl && (
                    <button
                      className="miniapp-primary w-full"
                      onClick={() => openPayment(receipt.paymentUrl!)}
                    >
                      {c.pay}
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <fieldset className="space-y-3" disabled={busy}>
                <legend className="font-bold mb-3">{c.participants}</legend>
                <label className="miniapp-selection">
                  <input type="checkbox" checked disabled />
                  {c.self}
                </label>
                {detail.children.map((child) => (
                  <label key={child.id} className="miniapp-selection">
                    <input
                      type="checkbox"
                      checked={selected.includes(child.id)}
                      onChange={(e) => {
                        setSelected((old) =>
                          e.target.checked
                            ? [...old, child.id]
                            : old.filter((id) => id !== child.id),
                        );
                        setQuote(null);
                      }}
                    />
                    {child.name}
                  </label>
                ))}
              </fieldset>
              {detail.needsGiyurClarification && (
                <button
                  className="miniapp-text-action"
                  onClick={() => setClarify(!clarify)}
                >
                  {c.clarify}
                </button>
              )}
              {clarify && (
                <fieldset className="miniapp-stage space-y-3" disabled={busy}>
                  <legend>{c.clarify}</legend>
                  <p className="miniapp-muted">{c.stageNote}</p>
                  {(["advanced", "completed"] as const).map((value) => (
                    <label className="miniapp-selection" key={value}>
                      <input
                        type="radio"
                        name="child-stage"
                        checked={stage === value}
                        onChange={() => setStage(value)}
                      />
                      {c[value]}
                    </label>
                  ))}
                  <button
                    className="miniapp-secondary"
                    disabled={!stage || busy}
                    onClick={() => void saveStage()}
                  >
                    {c.save}
                  </button>
                </fieldset>
              )}
              <button
                className="miniapp-secondary w-full"
                disabled={busy}
                onClick={() => void action("quote")}
              >
                {c.calculate}
              </button>
              {quote && (
                <div className="space-y-3" data-calculated-total>
                  <p>
                    {c.adult}: {quote.adults} · {c.child}: {quote.children}
                  </p>
                  <p className="miniapp-total">
                    {c.total}: <bdi>{money(quote.amountAgorot, language)}</bdi>
                  </p>
                  <button
                    className="miniapp-primary w-full"
                    disabled={busy}
                    onClick={() => void action("register")}
                  >
                    {c.register}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        !eventId && (
          <div className="space-y-4">
            {mode === "events"
              ? list.map((event) => (
                  <button
                    type="button"
                    className="miniapp-event-poster"
                    key={event.id}
                    onClick={() => setEventId(event.id)}
                  >
                    <EventImage event={event} />
                    <div className="miniapp-poster-content">
                      <h2>{event.title}</h2>
                      <p>
                        {event.date} · {event.time}
                      </p>
                      <p className="miniapp-poster-location">
                        {event.location}
                      </p>
                      <span className="miniapp-status">
                        {event.isRegistrationClosed
                          ? c.closed
                          : event.isFree
                            ? c.free
                            : `${event.price || 0} ₪`}
                      </span>
                    </div>
                  </button>
                ))
              : registrations.map((row) => (
                  <button
                    className="miniapp-panel miniapp-event-card"
                    key={row.id}
                    onClick={() => setEventId(row.event.id)}
                  >
                    <h2>{row.event.title}</h2>
                    <p>{row.event.date}</p>
                    <span className="miniapp-status">
                      {statusLabel(row.status)}
                    </span>
                    {row.amountAgorot > 0 && (
                      <p>{money(row.amountAgorot, language)}</p>
                    )}
                  </button>
                ))}
            {!loading &&
              !(mode === "events" ? list.length : registrations.length) && (
                <p className="miniapp-panel">
                  {mode === "events" ? c.empty : c.none}
                </p>
              )}
            {more && (
              <button
                className="miniapp-secondary"
                disabled={loading}
                onClick={() => void load(page + 1)}
              >
                {c.more}
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}
