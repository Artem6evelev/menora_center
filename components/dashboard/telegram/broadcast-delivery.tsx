"use client";
import { useEffect, useRef, useState } from "react";
import {
  getTelegramBroadcastProgress,
  sendTelegramBroadcast,
} from "@/actions/telegram-broadcast";
class DeliveryError extends Error {}
type Progress = Extract<
  Awaited<ReturnType<typeof getTelegramBroadcastProgress>>,
  { success: true }
>["progress"];

/** One user action continues the whole durable campaign; each bounded call keeps server safeguards. */
export default function BroadcastDelivery({
  id,
  onSending,
  onUpdate,
}: {
  id: string;
  onSending: (value: boolean) => void;
  onUpdate: () => void;
}) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    let active = true,
      timer: ReturnType<typeof setTimeout> | undefined;
    let wake: (() => void) | undefined;
    const pause = (ms: number) =>
      new Promise<void>((resolve) => {
        wake = resolve;
        timer = setTimeout(resolve, ms);
      });
    onSending(true);
    setError("");
    section.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    void (async () => {
      try {
        let result = await getTelegramBroadcastProgress(id);
        while (active) {
          if (!result.success) throw new DeliveryError(result.error);
          const current = result.progress;
          setProgress(current);
          if (
            current.status !== "queued" ||
            (!current.queued && !current.sending)
          )
            break;
          const due = current.nextAttemptAt ?? 0;
          if (due > Date.now() && !current.sending) {
            await pause(Math.min(5000, Math.max(500, due - Date.now())));
            if (active) result = await getTelegramBroadcastProgress(id);
          } else {
            result = await sendTelegramBroadcast(id);
            if (active) {
              if (result.success) setProgress(result.progress);
              await pause(
                result.success &&
                  result.progress.delivered === current.delivered &&
                  result.progress.failed === current.failed &&
                  result.progress.unknown === current.unknown &&
                  result.progress.skipped === current.skipped
                  ? 1500
                  : 150,
              );
            }
          }
        }
      } catch (failure) {
        if (active)
          setError(
            failure instanceof DeliveryError
              ? failure.message
              : "Отправка приостановлена. Повторите попытку.",
          );
      } finally {
        if (active) {
          onSending(false);
          onUpdate();
        }
      }
    })();
    return () => {
      active = false;
      clearTimeout(timer);
      wake?.();
      onSending(false);
    };
  }, [id, attempt, onSending, onUpdate]);
  const finished =
    progress &&
    ((!progress.queued && !progress.sending) || progress.status !== "queued");
  const handled = progress
    ? progress.delivered + progress.failed + progress.unknown + progress.skipped
    : 0;
  return (
    <section
      ref={section}
      className="rounded-3xl border border-amber-200 bg-amber-50 p-4 sm:p-5 space-y-3 min-w-0"
      data-broadcast-delivery={id}
    >
      <h2 className="text-xl font-bold">
        {error
          ? "Отправка приостановлена"
          : progress?.status === "cancelled"
            ? "Рассылка отменена"
            : finished
              ? "Рассылка завершена"
              : "Отправляем рассылку"}
      </h2>
      {progress ? (
        <>
          <progress
            aria-label="Прогресс рассылки"
            value={handled}
            max={Math.max(1, progress.count)}
            className="w-full h-4 accent-amber-500"
          />
          <p role="status" aria-live="polite">
            Доставлено:{" "}
            <b>
              {progress.delivered} из {progress.count}
            </b>
          </p>
          {progress.failed > 0 && (
            <p>Не удалось доставить: {progress.failed}.</p>
          )}
          {progress.skipped > 0 && (
            <p>Пропущено недоступных чатов: {progress.skipped}.</p>
          )}
          {progress.unknown > 0 && (
            <p className="text-amber-900">
              Требуют проверки: {progress.unknown}. Они не отправляются повторно
              автоматически, чтобы избежать дубликатов.
            </p>
          )}
          {!finished &&
            progress.nextAttemptAt &&
            progress.nextAttemptAt > Date.now() + 1000 && (
              <p>
                Ожидаем повторной попытки. Отправка продолжится автоматически.
              </p>
            )}
        </>
      ) : (
        <p role="status">Проверяем отправку…</p>
      )}
      {!finished && (
        <p className="text-sm">
          Оставьте страницу открытой до завершения. Если закроете её, продолжить
          можно из истории рассылок.
        </p>
      )}
      {error && (
        <>
          <p role="alert" className="text-red-700">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="rounded-xl bg-[#020022] text-white px-5 py-3"
          >
            Продолжить отправку
          </button>
        </>
      )}
    </section>
  );
}
