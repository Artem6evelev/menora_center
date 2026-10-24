"use client";
import { useEffect, useRef, useState } from "react";
import { getEventPaymentReminderOptions, remindEventPaymentByTelegram } from "@/actions/event-payment-reminder";

type Options = Extract<Awaited<ReturnType<typeof getEventPaymentReminderOptions>>, { success: true }>;
export default function EventPaymentReminderModal({ registrationId, onClose }: { registrationId: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), pending = useRef(false);
  const [options, setOptions] = useState<Options | null>(null), [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(""), [sent, setSent] = useState(false), [uncertain, setUncertain] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    let active = true;
    getEventPaymentReminderOptions(registrationId).then(result => {
      if (active) { if (result.success) setOptions(result); else setMessage(result.error); }
    }).catch(() => { if (active) setMessage("Не удалось подготовить напоминание"); });
    return () => { active = false; element?.close(); };
  }, [registrationId]);
  async function send() {
    if (pending.current || sent || uncertain) return;
    pending.current = true; setBusy(true); setMessage("");
    try {
      const result = await remindEventPaymentByTelegram(registrationId);
      if (result.success) { setSent(true); setMessage("Напоминание отправлено в Telegram"); }
      else { setMessage(result.error); setUncertain(result.error.includes("Проверьте доставку")); }
    } catch { setUncertain(true); setMessage("Не удалось подтвердить отправку. Проверьте доставку перед повторной отправкой."); }
    finally { pending.current = false; setBusy(false); }
  }
  return <dialog ref={dialog} aria-labelledby="payment-reminder-title" onCancel={onClose}
    className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-900 shadow-xl backdrop:bg-black/50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
    <h2 id="payment-reminder-title" className="text-xl font-bold">Напомнить об оплате</h2>
    <p className="my-3 text-sm text-neutral-500">Оплата пока не подтверждена. Выберите канал для персонального напоминания.</p>
    {!options && !message && <p role="status">Загрузка каналов…</p>}
    {message && <p role={sent ? "status" : "alert"} className="my-3 text-sm">{message}</p>}
    <div className="flex flex-wrap gap-3">
      {options?.telegramAvailable && <button className="rounded-xl border px-4 py-3 font-bold disabled:opacity-50" disabled={busy || sent || uncertain} onClick={() => void send()}>{busy ? "Отправка…" : "Telegram"}</button>}
      {options?.whatsappUrl && <a className="rounded-xl border px-4 py-3 font-bold" href={options.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
      {options && !options.telegramAvailable && !options.whatsappUrl && <p>Нет доступных каналов для напоминания.</p>}
    </div>
    <button className="mt-5 rounded-xl px-4 py-2 font-bold" onClick={onClose}>Закрыть</button>
  </dialog>;
}
