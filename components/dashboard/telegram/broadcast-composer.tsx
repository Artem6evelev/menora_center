"use client";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getTelegramBroadcastEvents,
  prepareTelegramBroadcastPreview,
  queueTelegramBroadcast,
} from "@/actions/telegram-broadcast";
import type { AudienceSelection } from "@/lib/telegram/audience";
import {
  BROADCAST_CAPTION_LIMIT,
  BROADCAST_IMAGE_LIMIT,
  BROADCAST_TEXT_LIMIT,
  isBroadcastImageUrl,
} from "@/lib/telegram/broadcast-content";
type EventChoice = Awaited<
  ReturnType<typeof getTelegramBroadcastEvents>
>[number];
type Prepared = Extract<
  Awaited<ReturnType<typeof prepareTelegramBroadcastPreview>>,
  { success: true }
> & {
  signature: string;
  requestKey: string;
};
class ComposerError extends Error {}
export default function BroadcastComposer({
  selection,
  count,
  busy,
  onBusyChange,
  onQueued,
}: {
  selection: AudienceSelection;
  count: number;
  busy: boolean;
  onBusyChange: (value: boolean) => void;
  onQueued: (count: number) => void;
}) {
  const eventSelectId = useId();
  const messageInputId = useId();
  const [message, setMessage] = useState(""),
    [event, setEvent] = useState<EventChoice | null>(null),
    [buttonLabel, setButtonLabel] = useState("Открыть мероприятие");
  const [events, setEvents] = useState<EventChoice[]>([]),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(true),
    [reload, setReload] = useState(0),
    [eventsError, setEventsError] = useState("");
  const [file, setFile] = useState<File | null>(null),
    [imageUrl, setImageUrl] = useState(""),
    [localImage, setLocalImage] = useState(""),
    [imageRevision, setImageRevision] = useState(0);
  const [prepared, setPrepared] = useState<Prepared | null>(null),
    [error, setError] = useState("");
  const alive = useRef(true),
    input = useRef<HTMLInputElement>(null);
  const signature = JSON.stringify({
      selection,
      message,
      eventId: event?.id,
      buttonLabel,
      imageRevision,
    }),
    current = useRef(signature);
  current.current = signature;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!file) {
      setLocalImage("");
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalImage(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      void getTelegramBroadcastEvents(search)
        .then((rows) => {
          if (active) {
            setEvents(rows);
            setEventsError("");
          }
        })
        .catch(() => {
          if (active)
            setEventsError(
              "Не удалось загрузить мероприятия. Нажмите «Обновить список».",
            );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, reload]);
  const previewImage = localImage || imageUrl,
    limit = previewImage ? BROADCAST_CAPTION_LIMIT : BROADCAST_TEXT_LIMIT;
  const ready = prepared?.signature === signature ? prepared : null;
  const choices =
    event && !events.some((e) => e.id === event.id)
      ? [event, ...events]
      : events;
  function invalidate() {
    setPrepared(null);
    setError("");
  }
  function removeImage() {
    setFile(null);
    setImageUrl("");
    setImageRevision((n) => n + 1);
    if (input.current) input.current.value = "";
    invalidate();
  }
  async function preview() {
    onBusyChange(true);
    setError("");
    const started = signature;
    try {
      if (!message.trim()) throw new ComposerError("Введите текст сообщения");
      if (message.trim().length > limit)
        throw new ComposerError(
          `С картинкой — до ${BROADCAST_CAPTION_LIMIT} символов. Сократите текст или уберите картинку`,
        );
      let uploaded = imageUrl;
      if (file && !uploaded) {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch("/api/admin/telegram/broadcast-image", {
          method: "POST",
          body,
          signal: AbortSignal.timeout(20000),
        });
        const result = await response.json();
        if (!response.ok || !result.url)
          throw new ComposerError(
            result.error || "Не удалось загрузить изображение",
          );
        uploaded = result.url;
        if (alive.current && current.current === started) setImageUrl(uploaded);
      }
      const result = await prepareTelegramBroadcastPreview({
        message,
        selection,
        ...(uploaded ? { imageUrl: uploaded } : {}),
        ...(event ? { eventId: event.id, buttonLabel } : {}),
      });
      if (!result.success) throw new ComposerError(result.error);
      if (alive.current && current.current === started)
        setPrepared({
          ...result,
          signature: started,
          requestKey: crypto.randomUUID(),
        });
    } catch (failure) {
      if (alive.current)
        setError(
          failure instanceof ComposerError
            ? failure.message
            : "Не удалось подготовить предпросмотр",
        );
    } finally {
      if (alive.current) onBusyChange(false);
    }
  }
  async function enqueue() {
    if (!ready || !ready.count) return;
    onBusyChange(true);
    setError("");
    try {
      const result = await queueTelegramBroadcast({
        requestKey: ready.requestKey,
        message: ready.message,
        selection: ready.selection,
        ...(ready.imageUrl ? { imageUrl: ready.imageUrl } : {}),
        ...(ready.eventId
          ? { eventId: ready.eventId, buttonLabel: ready.buttonLabel }
          : {}),
      });
      if (!result.success) throw new ComposerError(result.error);
      if (alive.current) {
        setPrepared(null);
        onQueued(result.count);
      }
    } catch (failure) {
      if (alive.current)
        setError(
          failure instanceof ComposerError
            ? failure.message
            : "Не удалось поставить сообщение в очередь",
        );
    } finally {
      if (alive.current) onBusyChange(false);
    }
  }
  return (
    <section
      className="rounded-3xl bg-white border p-4 sm:p-5 space-y-4 min-w-0"
      data-broadcast-composer
    >
      <h2 className="text-xl font-bold">Новое сообщение</h2>
      <p className="text-sm text-slate-600">
        Добавьте текст и картинку. Для кнопки записи выберите мероприятие по
        названию.
      </p>
      <div className="grid xl:grid-cols-2 gap-5 min-w-0">
        <div className="space-y-4 min-w-0">
          <div>
            <label className="block font-medium" htmlFor={messageInputId}>
              Сообщение
            </label>
            <textarea
              id={messageInputId}
              className="w-full border rounded-xl p-3 min-h-36 font-normal"
              maxLength={BROADCAST_TEXT_LIMIT}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                invalidate();
              }}
            />
          </div>
          <p
            className={`text-sm ${message.trim().length > limit ? "text-red-700" : "text-slate-500"}`}
            aria-live="polite"
          >
            {message.trim().length} / {limit} символов
            {previewImage
              ? " · С картинкой текст отправляется подписью"
              : " · Обычный текст, без HTML"}
          </p>
          <div className="border rounded-2xl p-3 space-y-2">
            <label className="block font-medium">
              Картинка (необязательно)
              <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png"
                className="block w-full max-w-full mt-2 text-sm"
                onChange={(e) => {
                  const next = e.target.files?.[0];
                  if (!next) return;
                  if (
                    !["image/jpeg", "image/png"].includes(next.type) ||
                    next.size > BROADCAST_IMAGE_LIMIT ||
                    !next.size
                  ) {
                    setError("Выберите JPG или PNG размером до 4 МБ");
                    e.target.value = "";
                    return;
                  }
                  setFile(next);
                  setImageUrl("");
                  setImageRevision((n) => n + 1);
                  invalidate();
                }}
              />
            </label>
            <p className="text-sm text-slate-500">
              JPG или PNG до 4 МБ. Картинка видна в предпросмотре сразу;
              загружается после нажатия «Предпросмотр».
            </p>
            {event?.imageUrl &&
              isBroadcastImageUrl(
                event.imageUrl,
                process.env.NEXT_PUBLIC_SUPABASE_URL,
              ) && (
                <button
                  type="button"
                  className="underline text-sm"
                  onClick={() => {
                    setFile(null);
                    setImageUrl(event.imageUrl!);
                    setImageRevision((n) => n + 1);
                    invalidate();
                  }}
                >
                  Использовать афишу мероприятия
                </button>
              )}
            {previewImage && (
              <button
                type="button"
                className="text-red-700 underline text-sm"
                onClick={removeImage}
              >
                Убрать картинку
              </button>
            )}
          </div>
          <div className="space-y-2">
            <label className="block font-medium">
              Найти мероприятие
              <input
                className="w-full border rounded-xl p-3 font-normal"
                value={search}
                maxLength={100}
                placeholder="Начните вводить название"
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label className="block font-medium" htmlFor={eventSelectId}>
              Мероприятие (необязательно)
            </label>
            <select
              id={eventSelectId}
              className="w-full min-w-0 border rounded-xl p-3 font-normal"
              value={event?.id || ""}
              onChange={(e) => {
                setEvent(
                  choices.find((item) => item.id === e.target.value) || null,
                );
                invalidate();
              }}
            >
              <option value="">Без кнопки мероприятия</option>
              {choices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                  {item.date
                    ? " · " + item.date.split("-").reverse().join(".")
                    : ""}
                </option>
              ))}
            </select>
            <p className="text-sm text-slate-500">
              Показаны опубликованные мероприятия с открытой записью. ID искать
              не нужно.{" "}
              <Link href="/dashboard/events" className="underline">
                Управление мероприятиями
              </Link>
            </p>
            <button
              type="button"
              className="underline text-sm"
              disabled={loading}
              onClick={() => setReload((n) => n + 1)}
            >
              {loading ? "Загружаем мероприятия…" : "Обновить список"}
            </button>
            {eventsError && (
              <p role="alert" className="text-red-700 text-sm">
                {eventsError}
              </p>
            )}
            {!loading && !choices.length && !eventsError && (
              <p className="text-sm">
                Подходящих мероприятий пока нет. Создайте событие или откройте
                запись в разделе мероприятий.
              </p>
            )}
          </div>
          {event && (
            <label className="block font-medium">
              Текст кнопки
              <input
                className="w-full border rounded-xl p-3 font-normal"
                maxLength={60}
                value={buttonLabel}
                onChange={(e) => {
                  setButtonLabel(e.target.value);
                  invalidate();
                }}
              />
            </label>
          )}
          <button
            type="button"
            className="bg-[#020022] text-white rounded-xl px-5 py-3"
            disabled={busy}
            onClick={() => void preview()}
          >
            {busy ? "Проверяем…" : "Предпросмотр"}
          </button>
        </div>
        <div className="space-y-3 min-w-0" data-broadcast-preview>
          <h3 className="font-bold">
            Так сообщение будет выглядеть в Telegram
          </h3>
          <div className="rounded-2xl bg-sky-50 border p-3 min-w-0">
            <div className="rounded-2xl bg-white border overflow-hidden min-w-0">
              {previewImage && (
                <Image
                  src={previewImage}
                  alt="Картинка рассылки"
                  width={1000}
                  height={1000}
                  unoptimized
                  className="w-full h-auto max-h-[420px] object-contain"
                />
              )}
              <p className="p-4 whitespace-pre-wrap break-words min-h-16">
                {message.trim() || "Текст сообщения появится здесь"}
              </p>
            </div>
            {event && (
              <button
                type="button"
                disabled
                className="mt-2 p-3 w-full rounded-xl bg-sky-100 text-sky-900 font-bold break-words"
              >
                {buttonLabel || "Открыть мероприятие"}
              </button>
            )}
          </div>
          {event && (
            <p className="text-sm break-words">
              Кнопка откроет в Mini App: <strong>{event.title}</strong>
            </p>
          )}
          <p className="text-sm">
            Получателей: {ready ? ready.count : count}. Все выбранные участники
            с доступным Telegram-чатом, независимо от прежней подписки.
          </p>
          {ready && (
            <div
              className="border rounded-xl p-3 space-y-3"
              data-broadcast-validated
            >
              {ready.count ? (
                <p>
                  Сообщение проверено. Можно поставить в очередь для{" "}
                  {ready.count} получателей.
                </p>
              ) : (
                <p className="text-amber-800">
                  Предпросмотр готов. Для отправки выберите получателей с
                  доступным Telegram-чатом.
                </p>
              )}
              <button
                type="button"
                disabled={busy || !ready.count}
                className="bg-[#020022] text-white rounded-xl px-5 py-3 disabled:opacity-50"
                onClick={() => void enqueue()}
              >
                Поставить в очередь
              </button>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-red-700 p-3 bg-red-50 rounded-xl">
          {error}
        </p>
      )}
    </section>
  );
}
