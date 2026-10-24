"use client";
import type { PaymentIntentAttempt } from "@/lib/community/payment-intent";
import { paymentIntentLabels, paymentIntentSecondary, paymentIntentState } from "@/lib/community/payment-intent";
const date = (value: Date) => new Date(value).toLocaleString("ru-RU", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" });
export default function PaymentIntentStatus({ status, attempt }: { status: string; attempt: PaymentIntentAttempt | null }) {
  const state = paymentIntentState(status, attempt);
  return <div className="mb-3 max-w-xs whitespace-normal text-left text-sm" data-payment-intent={state}>
    <p className="font-bold">{state === "other" ? ({ rejected: "Отклонено", abandoned: "Не завершено", cancelled: "Отменено" }[status] || paymentIntentLabels.other) : paymentIntentLabels[state]}</p>
    {attempt && <p className="mt-1 font-bold"><bdi>{new Intl.NumberFormat("ru-RU", { style: "currency", currency: "ILS" }).format(attempt.amountAgorot / 100)}</bdi></p>}
    {(state === "opened" || state === "waiting") && <p className="mt-1 text-xs text-neutral-500">{paymentIntentSecondary(attempt)}</p>}
    {state === "opened" && attempt && <div className="mt-1 space-y-1 text-xs text-neutral-500">
      {attempt.openedAt && <p>Первый переход: {date(attempt.openedAt)}</p>}
      {attempt.lastOpenedAt && <p>Последний переход: {date(attempt.lastOpenedAt)}</p>}
      <p>Открывал: {attempt.openCount} {attempt.openCount === 1 ? "раз" : attempt.openCount >= 2 && attempt.openCount <= 4 ? "раза" : "раз"}</p>
    </div>}
  </div>;
}
