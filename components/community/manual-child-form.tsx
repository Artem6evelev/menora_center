"use client";
import { useState } from "react";
import { getManualParent, registerChildManually } from "@/actions/community-admin";
export default function ManualChildForm({ events }: { events: { id: string; title: string }[] }) {
  const [parentId, setParentId] = useState(""); const [parent, setParent] = useState<Awaited<ReturnType<typeof getManualParent>>>(null);
  const [kind, setKind] = useState<"event" | "program">("event"); const [eventId, setEventId] = useState(events[0]?.id || "");
  const [programTitle, setProgramTitle] = useState(""); const [reason, setReason] = useState(""); const [childIds, setChildIds] = useState<string[]>([]);
  const [newName, setNewName] = useState(""); const [newDob, setNewDob] = useState(""); const [requestId, setRequestId] = useState("");
  const [newGender, setNewGender] = useState<"male" | "female" | "">("");
  const [pending, setPending] = useState(false); const [message, setMessage] = useState(""); const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const cls = "w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent p-3";
  async function loadParent() {
    setPending(true); setMessage(""); setParent(null); setChildIds([]);
    try { const data = await getManualParent(parentId.trim()); setParent(data); setRequestId(crypto.randomUUID()); if (!data) setMessage("Профиль не найден"); }
    catch { setMessage("Нет доступа или профиль недоступен"); } finally { setPending(false); }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!parent) return; setPending(true); setMessage("");
    try {
      const result = await registerChildManually({ requestId, parentId: parent.id, childIds, kind,
        ...(kind === "event" ? { eventId } : { programTitle }), reason,
        ...(newName || newDob ? { newChild: { name: newName, dateOfBirth: newDob, gender: newGender || undefined } } : {}) });
      if (!result.success) setMessage(result.message);
      else { setMessage(`Ручная запись сохранена и внесена в журнал. Номер: ${result.id}`); setIframeUrl(result.paymentUrl); }
    } catch { setMessage("Не удалось завершить операцию. Повтор не создаст вторую запись."); } finally { setPending(false); }
  }
  return <div className="max-w-3xl space-y-6"><h1 className="text-3xl font-black">Ручная запись ребёнка</h1>
    <p>Исключение для случаев, когда ребёнка может записать только отец. Операция фиксируется с причиной и администратором. Установленный статус человека автоматически не меняется.</p>
    <div className="space-y-3"><label htmlFor="manual-parent" className="font-bold block">ID профиля отца из CRM</label><input id="manual-parent" className={cls} value={parentId} onChange={event => setParentId(event.target.value)} /><button type="button" onClick={loadParent} disabled={pending || !parentId.trim()} className="rounded-xl px-5 py-3 bg-[#FFB800] text-black font-bold disabled:opacity-50">Найти профиль</button></div>
    {parent && <form onSubmit={submit} className="space-y-5"><fieldset disabled={pending} className="space-y-5">
      <h2 className="font-bold text-xl">{parent.firstName} {parent.lastName}</h2>

      <fieldset><legend className="font-bold mb-3">Дети, связанные с профилем</legend>{parent.children.map(child => <label className="flex gap-3 mb-3" key={child.id}><input type="checkbox" checked={childIds.includes(child.id)} onChange={event => setChildIds(previous => event.target.checked ? [...previous, child.id] : previous.filter(id => id !== child.id))} />{child.name}</label>)}</fieldset>
      <div><label htmlFor="manual-child-name" className="font-bold block mb-2">Добавить ребёнка вручную: имя</label><input id="manual-child-name" className={cls} value={newName} onChange={event => setNewName(event.target.value)} /></div>
      <div><label htmlFor="manual-child-dob" className="font-bold block mb-2">Дата рождения ребёнка</label><input id="manual-child-dob" type="date" className={cls} value={newDob} onChange={event => setNewDob(event.target.value)} required={!!newName} /></div>
      <fieldset><legend className="font-bold mb-2">Пол нового ребёнка</legend><label className="mr-5"><input type="radio" name="manual-child-gender" checked={newGender === 'male'} onChange={() => setNewGender('male')} required={!!newName} /> Мальчик</label><label><input type="radio" name="manual-child-gender" checked={newGender === 'female'} onChange={() => setNewGender('female')} required={!!newName} /> Девочка</label></fieldset>
      <div><label htmlFor="manual-kind" className="font-bold block mb-2">Куда записать</label><select id="manual-kind" className={cls} value={kind} onChange={event => setKind(event.target.value as typeof kind)}><option value="event">На событие</option><option value="program">В детскую программу</option></select></div>
      {kind === "event" ? <div><label htmlFor="manual-event" className="font-bold block mb-2">Событие</label><select id="manual-event" className={cls} value={eventId} onChange={event => setEventId(event.target.value)} required>{events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}</select></div> : <div><label htmlFor="manual-program" className="font-bold block mb-2">Детская программа</label><input id="manual-program" required className={cls} value={programTitle} onChange={event => setProgramTitle(event.target.value)} /></div>}
      <div><label htmlFor="manual-reason" className="font-bold block mb-2">Причина исключения *</label><textarea id="manual-reason" required minLength={10} className={cls} value={reason} onChange={event => setReason(event.target.value)} /></div>
      <button disabled={pending || parent.gender !== "male"} className="rounded-xl px-6 py-4 bg-[#FFB800] text-black font-black disabled:opacity-50">{pending ? "Сохраняем…" : "Зарегистрировать ребёнка вручную"}</button>
    </fieldset></form>}
    {message && <p role="status" className="rounded-xl p-4 bg-neutral-100 dark:bg-neutral-800 break-words">{message}</p>}
    {iframeUrl && <div role="dialog" aria-modal="true" aria-label="Оплата Shutafim" className="fixed inset-0 z-[100] bg-black/70 p-4 flex items-center justify-center"><div className="bg-white rounded-3xl w-full max-w-2xl h-[90dvh] flex flex-col overflow-hidden"><button onClick={() => setIframeUrl(null)} className="p-4 text-black font-bold">Закрыть оплату</button><iframe src={iframeUrl} title="Оплата Shutafim" className="w-full flex-1 border-0" /></div></div>}
  </div>;
}
