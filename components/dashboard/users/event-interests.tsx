"use client";
import { useEffect, useState } from "react";
import { getEventInterests, getEventInterestHistory, updateEventInterestProcessing, type InterestCrmFilters } from "@/actions/event-interests";
import { useCrmStore } from "@/store/useCrmStore";
import { eventAccessCopy } from "@/lib/events/copy";
import { INTAKE_CHOICES } from "@/lib/events/eligibility";
type Data = Awaited<ReturnType<typeof getEventInterests>>;
const states = { new: "Заинтересован", reviewing: "Ожидает уточнения", contacted: "Связались", closed: "Обработан" };
const decisions = { eligible: "Подходит для записи", needs_review: "Необходимо уточнение", not_eligible: "Не подходит для этого события" };
export default function EventInterestsCrm({ initialData, userId }: { initialData: Data; userId?: string }) {
  const [data, setData] = useState(initialData), [filters, setFilters] = useState<InterestCrmFilters>({ page: 1, userId });
  const [error, setError] = useState(""), [pending, setPending] = useState(false), [revision, setRevision] = useState(0);
  const [history, setHistory] = useState<Record<string, Awaited<ReturnType<typeof getEventInterestHistory>>>>({});
  const openSlider = useCrmStore(state => state.openSlider);
  useEffect(() => {
    let cancelled = false; const timer = setTimeout(() => { setPending(true);
      void getEventInterests(filters).then(result => { if (!cancelled) { setData(result); setError(""); } })
        .catch(() => { if (!cancelled) setError("Не удалось загрузить обращения. Попробуйте ещё раз."); })
        .finally(() => { if (!cancelled) setPending(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filters, revision]);
  function filter(name: string, value: string) { setFilters(previous => ({ ...previous, page: 1, [name]: value || undefined })); }
  async function processing(id: string, processingStatus: string) {
    setPending(true); try { await updateEventInterestProcessing({ id, processingStatus }); setRevision(n => n + 1); }
    catch { setError("Не удалось изменить статус обращения."); setPending(false); }
  }
  return <section className="space-y-4 border rounded-2xl p-4 min-w-0" data-event-interests-crm>
    <h2 className="text-xl font-bold">Интерес к мероприятиям · {data.total}</h2>
    <p className="text-sm text-neutral-500">Контакты и запросы на уточнение. Обращение само по себе не является регистрацией или оплатой.</p>
    <div className="flex flex-wrap gap-3">
      <input aria-label="Поиск обращений" placeholder="Имя, контакт или мероприятие" maxLength={100} onChange={e => filter("search", e.target.value)} className="border rounded-lg p-2 min-w-0 max-w-full" />
      <select aria-label="Источник обращения" className="border p-2 rounded-lg" onChange={e => filter("source", e.target.value)}><option value="">Все источники</option><option value="website">Сайт</option><option value="telegram">Telegram Mini App</option></select>
      <select aria-label="Предварительный допуск" className="border p-2 rounded-lg max-w-full" onChange={e => filter("decision", e.target.value)}><option value="">Все результаты</option>{Object.entries(decisions).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select>
      <select aria-label="Самоответ" className="border p-2 rounded-lg max-w-full" onChange={e => filter("intake", e.target.value)}><option value="">Все самоответы</option>{INTAKE_CHOICES.map((key, i) => <option key={key} value={key}>{eventAccessCopy.ru.choices[i]}</option>)}</select>
      <select aria-label="Обработка обращения" className="border p-2 rounded-lg" onChange={e => filter("processing", e.target.value)}><option value="">Вся обработка</option>{Object.entries(states).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select>
      <select aria-label="Согласие на приглашения" className="border p-2 rounded-lg" onChange={e => filter("invitations", e.target.value)}><option value="">Согласие: любое</option><option value="yes">Приглашения разрешены</option><option value="no">Без приглашений</option></select>
      <select aria-label="Наличие регистрации" className="border p-2 rounded-lg" onChange={e => filter("registered", e.target.value)}><option value="">Регистрация: любая</option><option value="yes">Есть регистрация</option><option value="no">Нет регистрации</option></select>
      <input aria-label="ID мероприятия" placeholder="ID мероприятия" maxLength={150} onChange={e => filter("eventId", e.target.value)} className="border rounded-lg p-2 min-w-0 max-w-full" />
    </div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <div className="grid gap-4" aria-busy={pending}>{data.rows.map(row => <article key={row.id} className="p-4 border rounded-xl space-y-2 min-w-0 break-words" data-event-interest={row.id}>
      <h3 className="font-bold">{row.name} · {row.title}</h3>
      <p>{row.phone || "Телефон не указан"} · {row.email || "Email не указан"} · {row.source === "website" ? "Сайт" : "Telegram Mini App"}</p>
      <p>{row.intakeStatus ? eventAccessCopy.ru.choices[INTAKE_CHOICES.indexOf(row.intakeStatus)] : "Самоответ не указан"}</p>
      <p>{decisions[row.decision]} · Оставил контакт{row.registered ? " · Есть отдельная регистрация" : " · Не зарегистрирован"}</p>
      <p className="text-sm">{new Date(row.createdAt).toLocaleString("ru-RU")} · Приглашения: {row.invitationConsent ? "разрешены" : "не разрешены"} · Политика {row.policyVersion}</p>
      <details className="text-sm"><summary className="cursor-pointer">Согласия и источник перехода</summary>
        <p>Связаться по обращению: {new Date(row.contactConsentAt).toLocaleString("ru-RU")}</p>
        <p>Приглашения разрешены: {row.invitationConsentAt ? new Date(row.invitationConsentAt).toLocaleString("ru-RU") : "согласие не предоставлено"}</p>
        {row.invitationWithdrawnAt && <p>Приглашения отключены: {new Date(row.invitationWithdrawnAt).toLocaleString("ru-RU")}</p>}
        {Object.entries(row.attribution ?? {}).map(([key, value]) => <p key={key}>{key}: {String(value)}</p>)}
      </details>
      {row.userId ? <button className="underline" onClick={() => openSlider(row.userId!)}>Открыть профиль человека</button> : <p className="text-sm">Гостевой контакт · аккаунт не создавался</p>}
      <label className="block">Обработка <select disabled={pending} value={row.processingStatus} onChange={e => void processing(row.id, e.target.value)} className="p-2 border rounded-lg">{Object.entries(states).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
      <button className="underline" onClick={() => { void getEventInterestHistory(row.id).then(rows => setHistory(old => ({ ...old, [row.id]: rows }))).catch(() => setError("Не удалось загрузить историю")); }}>История взаимодействий</button>
      {history[row.id] && <ul className="text-sm">{history[row.id].map((item, index) => <li key={index}>{new Date(item.createdAt).toLocaleString("ru-RU")} · {item.action} · {item.actor}</li>)}</ul>}
    </article>)}</div>
    {!data.rows.length && <p>Обращений по выбранным условиям нет.</p>}
    <div className="flex gap-4"><button disabled={pending || (filters.page ?? 1) <= 1} onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}>Назад</button><span>{filters.page ?? 1}</span><button disabled={pending || (filters.page ?? 1) * 20 >= data.total} onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}>Далее</button></div>
  </section>;
}
