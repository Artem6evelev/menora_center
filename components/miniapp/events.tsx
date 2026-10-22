"use client";
import { EventCard, EventMedia, EventMeta } from "./event-card";
import { EventShareButton } from "./event-share";
import { EmptyState, EventSkeleton } from "./ui";
import { miniAppUiCopy } from "@/lib/telegram/miniapp-ui-copy";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MiniAppLanguage } from "@/lib/telegram/miniapp-i18n";
import { eventCopy } from "@/lib/telegram/event-copy";
import { miniAppRequest } from "@/lib/telegram/miniapp-client";
import type { eventPreviewDto, eventDetailDto } from "@/lib/telegram/miniapp-events";
import type { MiniAppCache } from "@/lib/telegram/miniapp-cache";
import type { MiniAppProfileData } from "@/lib/telegram/miniapp-profile";
import { MiniAppContact } from "./contact";
import { EventLaunchPreview } from "./event-entry";
import type { MiniAppLaunch } from "@/lib/telegram/event-launch";

type Event = ReturnType<typeof eventPreviewDto>;
type Detail = {
  registration: {
    status: string;
    amountAgorot: number | null;
    paymentUrl: string | null;
  } | null;
  event: ReturnType<typeof eventDetailDto>;
  children: { id: string; name: string }[];
  canRegisterChildren: boolean;
  needsGiyurClarification: boolean;
};
type Registration = {
  id: string;
  event: Event;
  status: string;
  amountAgorot: number | null;
  paymentUrl: string | null;
};
const currency = new Intl.NumberFormat("ru", {style: "currency", currency: "ILS"});
const money = (amount: number, _language: MiniAppLanguage) => currency.format(amount / 100);
export default function MiniAppEvents({
  language,
  mode,
  onNested,
  openPayment,
  initialEvent,
  onProfileChanged, cache, initialPreview,
}: {
  language: MiniAppLanguage;
  mode: "events" | "registrations";
  onNested: (back: (() => void) | null) => void;
  openPayment: (url: string) => void;
  initialEvent?: string;
  initialPreview: MiniAppLaunch["event"];
  onProfileChanged: (snapshot: MiniAppProfileData & { ok: true }) => boolean;
  cache: MiniAppCache;
}) {
  const c = eventCopy.ru, u = miniAppUiCopy.ru;
  const [list, setList] = useState<Event[]>(cache.peek<{events: Event[]}>("events?page=1")?.events ?? []),
    [registrations, setRegistrations] = useState<Registration[]>(cache.peek<{registrations:Registration[]}>("registrations?page=1")?.registrations ?? []),
    [detail, setDetail] = useState<Detail | null>(initialEvent ? cache.peek<Detail>(`events?id=${encodeURIComponent(initialEvent)}`) ?? null : null);
  const [page, setPage] = useState(1),
    [more, setMore] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [loading, setLoading] = useState(() => initialEvent
      ? !cache.peek(`events?id=${encodeURIComponent(initialEvent)}`)
      : !cache.peek(`${mode}?page=1`));
  const [selected, setSelected] = useState<string[]>([]),
    [quote, setQuote] = useState<{
      amountAgorot: number;
      adults: number;
      children: number;
    } | null>(null);
  const [receipt, setReceipt] = useState<Detail["registration"]>(initialEvent ? cache.peek<Detail>(`events?id=${encodeURIComponent(initialEvent)}`)?.registration ?? null : null),
    [clarify, setClarify] = useState(false),
    [stage, setStage] = useState<"advanced" | "completed" | "">("");
  const [eventId, setEventId] = useState(initialEvent || "");
  const requestPending = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const back = useCallback(() => {
    if (requestPending.current) return;
    setEventId("");
    setDetail(null);
    setReceipt(null);
    setQuote(null);
    setError(false);
    setLoading(!cache.peek(`${mode}?page=1`));
  }, [cache, mode]);
  useEffect(() => {
    onNested(eventId ? back : null);
    return () => onNested(null);
  }, [eventId, back, onNested]);
  const load = useCallback(
    async (next = 1, signal?: AbortSignal) => {
      setLoading(!cache.peek(`${mode}?page=${next}`));
      setError(false);
      try {
        if (mode === "events") {
          const data = await cache.read<{
            events: Event[];
            hasMore: boolean;
          }>(`events?page=${next}`, signal);
          if (signal?.aborted) return;
          setList((old) =>
            next === 1 ? data.events : [...old, ...data.events],
          );
          setMore(data.hasMore);
        } else {
          const data = await cache.read<{
            registrations: Registration[];
            hasMore: boolean;
          }>(`registrations?page=${next}`, signal);
          if (signal?.aborted) return;
          setRegistrations((old) =>
            next === 1 ? data.registrations : [...old, ...data.registrations],
          );
          setMore(data.hasMore);
        }
        setPage(next);
      } catch {
        if (!signal?.aborted) setError(true);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [mode, cache],
  );
  useEffect(() => {
    if (eventId) return;
    const controller = new AbortController();
    void load(1, controller.signal);
    return () => controller.abort();
  }, [load, eventId]);
  const loadDetail = useCallback(async (signal?: AbortSignal) => {
    if (!eventId) return;
    setLoading(!cache.peek(`events?id=${encodeURIComponent(eventId)}`));
    setError(false);
    try {
      const data = await cache.read<Detail>(
        `events?id=${encodeURIComponent(eventId)}`, signal,
      );
      if (signal?.aborted) return;
      setDetail(data);
      setSelected((old) =>
        old.filter((id) => data.children.some((child) => child.id === id)),
      );
      setQuote(null);
      setReceipt(data.registration);
    } catch {
      if (!signal?.aborted) setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [eventId, cache]);
  useEffect(() => {
    const controller = new AbortController();
    void loadDetail(controller.signal);
    return () => controller.abort();
  }, [loadDetail]);
  async function action(kind: "quote" | "register") {
    if (requestPending.current) return;
    requestPending.current = true;
    setBusy(true);
    setError(false);
    try {
      const { data } = await miniAppRequest<{
        quote?: typeof quote;
        registration?: NonNullable<typeof receipt>;
      }>("events", { body: { action: kind, eventId, childIds: selected } });
      if (!alive.current) return;
      if (data.quote) setQuote(data.quote);
      if (data.registration) {
        setReceipt(data.registration);
        cache.invalidate("registrations", `events?id=${encodeURIComponent(eventId)}`);
      }
    } catch {
      setError(true);
    } finally {
      requestPending.current = false;
      setBusy(false);
    }
  }
  async function saveStage() {
    if (requestPending.current) return;
    requestPending.current = true;
    setBusy(true);
    setError(false);
    try {
      const result = await miniAppRequest<MiniAppProfileData & { ok: true }>("giyur", { body: { stage } });
      if (!alive.current || !onProfileChanged(result.data)) return;
      cache.invalidate("kids", "events", "registrations");
      setClarify(false);
      await loadDetail();
    } catch {
      setError(true);
    } finally {
      requestPending.current = false;
      setBusy(false);
    }
  }
  const statusLabel = (status: string) =>
    c[status as "confirmed" | "pending" | "paid" | "abandoned" | "cancelled"] ||
    "Статус уточняется";
  const pendingPayment = !!receipt && !detail?.event.isFree && receipt.status === "pending";
  const confirmed = !!receipt && ["paid", "confirmed"].includes(receipt.status);
  function pay(url: string) {
    try {
      cache.invalidate("registrations", `events?id=${encodeURIComponent(eventId)}`);
      openPayment(url);
    } catch { setError(true); }
  }
  return (
    <div className="space-y-5" data-miniapp-events={mode}>
      {!eventId && <div className="miniapp-intro">
        <p className="miniapp-eyebrow">Menorah Center</p>
        <h1>
          {detail?.event.title ||
            (mode === "events" ? c.events : c.registrations)}
        </h1>
      </div>}
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
        eventId && initialPreview?.id === eventId ? <EventLaunchPreview event={initialPreview} language={language} /> : <EventSkeleton label={u.loading} detail={!!eventId} />
      )}
      {eventId && detail ? (
        <article id="miniapp-event" className="miniapp-event-detail miniapp-enter" data-event-detail={detail.event.id}>
          <EventMedia event={detail.event} language={language} priority />
          <div className="miniapp-detail-summary space-y-4">
            <h1>{detail.event.title}</h1>
            <EventMeta event={detail.event} language={language} />
            <EventShareButton key={detail.event.id} event={detail.event} language={language} />
            {(receipt || !detail.event.isRegistrationClosed) && <a className="miniapp-primary w-full" href={receipt ? "#miniapp-receipt" : "#miniapp-participants"}>{pendingPayment ? "Осталось оплатить" : receipt ? u.myRegistration : u.join}</a>}
            {pendingPayment && <p className="miniapp-status miniapp-status-pending">🟡 Регистрация создана</p>}
            {detail.event.description && <details className="miniapp-description" open>
              <summary>{u.about}</summary><p>{detail.event.description.replace(/<\/(?:p|div)>|<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "")}</p>
            </details>}
            {!detail.event.isFree && <p className="miniapp-helper">{`${c.adult}: ${detail.event.price || 0} ₪ · ${c.child}: ${detail.event.childPrice || 0} ₪`}</p>}
          {receipt ? (
            <div className="space-y-4" id="miniapp-receipt" data-payment-handoff>
              <h2>{pendingPayment ? "Осталось оплатить участие" : confirmed ? detail.event.isFree ? "✅ Вы зарегистрированы" : "✅ Оплата подтверждена" : statusLabel(receipt.status)}</h2>
              {confirmed && !detail.event.isFree && <p>Вы зарегистрированы</p>}
              {pendingPayment && (
                <>
                  <p>Завершите оплату, чтобы подтвердить регистрацию на мероприятие.</p>
                  {receipt.amountAgorot !== null && <p className="miniapp-total">
                    {c.total}:{" "}
                    <bdi>{money(receipt.amountAgorot, language)}</bdi>
                  </p>}
                  <p className="miniapp-muted">{c.paymentNote}</p>
                  {receipt.paymentUrl ? (
                    <button
                      className="miniapp-primary w-full"
                      onClick={() => pay(receipt.paymentUrl!)}
                    >
                      {c.pay}
                    </button>
                  ) : <><p>Регистрация создана, но ссылка на оплату временно недоступна.</p><MiniAppContact label="Связаться с Menorah Center" /></>}
                  <a className="miniapp-secondary w-full" href="#miniapp-event">Вернуться к мероприятию</a>
                </>
              )}
            </div>
          ) : detail.event.isRegistrationClosed ? <p className="miniapp-error">{c.closed}</p> : (
            <>
              <fieldset id="miniapp-participants" className="space-y-3" disabled={busy}>
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
                className="miniapp-primary w-full"
                disabled={busy}
                onClick={() => void action("quote")}
              >
                {c.calculate}
              </button>
              {quote && (
                <div className="space-y-3 miniapp-form-actions" data-calculated-total>
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
          </div>
        </article>
      ) : (
        !eventId && (
          <div className="space-y-4">
            {mode === "events"
              ? list.map((event) => (
                  <EventCard key={event.id} event={event} language={language} onSelect={id => { setEventId(id); window.scrollTo({ top: 0, behavior: "instant" }); }} />
                ))
              : registrations.map((row) => (
                  <section
                    className="miniapp-panel space-y-3"
                    key={row.id}
                    data-registration={row.id}
                  >
                    <button className="w-full text-left space-y-2" onClick={() => setEventId(row.event.id)}>
                    <h2>{row.event.title}</h2>
                    <p>{row.event.date}</p>
                    <span className={`miniapp-status${row.status === "pending" ? " miniapp-status-pending" : ""}`}>
                      {["paid", "confirmed"].includes(row.status) ? row.event.isFree ? "✅ Зарегистрирован" : "✅ Подтверждено" : row.status === "pending" && !row.event.isFree ? "🟡 Ожидает оплаты" : statusLabel(row.status)}
                    </span>
                    </button>
                    {row.amountAgorot !== null && row.amountAgorot > 0 && (
                      <p>{row.status === "pending" ? `${c.total}: ` : ""}{money(row.amountAgorot, language)}</p>
                    )}
                    {row.status === "pending" && !row.event.isFree && (row.paymentUrl
                      ? <button className="miniapp-primary w-full" onClick={() => pay(row.paymentUrl!)}>Оплатить</button>
                      : <><p>Регистрация создана, но ссылка на оплату временно недоступна.</p><MiniAppContact label="Связаться с Menorah Center" /></>)}
                  </section>
                ))}
            {!loading &&
              !(mode === "events" ? list.length : registrations.length) && (
                <EmptyState title={mode === "events" ? c.empty : c.none} hint={mode === "events" ? u.emptyHint : undefined} />
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
