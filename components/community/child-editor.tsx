'use client';
import { useId, useState } from 'react';
export type ChildValue = { id?: string; draftId?: string; name: string; dateOfBirth: string; gender?: 'male' | 'female' | null };
export default function ChildEditor({ items: children, onSave, disabled = false }: { items: ChildValue[]; onSave: (value: ChildValue[]) => Promise<void>; disabled?: boolean }) {
  const uid = useId(); const [editing, setEditing] = useState<number | null>(null);
  const [value, setValue] = useState<ChildValue>({ name: '', dateOfBirth: '', gender: null });
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  async function persist(next: ChildValue[]) { setPending(true); setError(''); try { await onSave(next); setEditing(null); } catch (error) { setError(error instanceof Error ? error.message : 'Не удалось сохранить ребёнка'); } finally { setPending(false); } }
  async function save() {
    if (value.name.trim().length < 2 || !value.dateOfBirth || (!value.id && !value.gender)) { setError('Укажите имя, дату рождения и пол ребёнка'); return; }
    const item = { ...value, draftId: value.draftId || (!value.id ? crypto.randomUUID() : undefined) };
    await persist(editing === children.length ? [...children, item] : children.map((child, index) => index === editing ? item : child));
  }
  return <section aria-label="Дети" className="space-y-4 min-w-0">
    <h2 className="font-bold">Данные детей</h2>
    {children.map((child, index) => <div key={child.id || child.draftId || index} className="rounded-2xl border p-4 space-y-3 min-w-0">
      <p className="font-bold break-words">{child.name}</p><p className="text-sm">{child.dateOfBirth} · {child.gender === 'male' ? 'Мальчик' : child.gender === 'female' ? 'Девочка' : 'Пол не указан'}</p>
      <div className="flex flex-wrap gap-4"><button type="button" disabled={disabled || pending} onClick={() => { setValue({ ...child }); setEditing(index); setError(''); }} className="font-bold underline">Изменить</button><button type="button" disabled={disabled || pending} onClick={() => void persist(children.filter((_, i) => i !== index))} className="text-red-600 underline">Удалить</button></div>
    </div>)}
    {editing !== null ? <fieldset disabled={disabled || pending} className="rounded-2xl border border-sky-200 p-4 space-y-3 min-w-0"><legend className="font-bold px-1">{editing === children.length ? 'Новый ребёнок' : 'Изменить ребёнка'}</legend>
      <label className="block" htmlFor={`${uid}-name`}>Имя ребёнка</label><input id={`${uid}-name`} value={value.name} maxLength={100} onChange={event => setValue(previous => ({ ...previous, name: event.target.value }))} className="w-full rounded-xl border p-3 bg-transparent min-w-0" />
      <label className="block" htmlFor={`${uid}-dob`}>Дата рождения ребёнка</label><input id={`${uid}-dob`} type="date" value={value.dateOfBirth} onChange={event => setValue(previous => ({ ...previous, dateOfBirth: event.target.value }))} className="w-full rounded-xl border p-3 bg-transparent min-w-0" />
      <fieldset className="flex flex-wrap gap-4"><legend className="mb-2">Пол ребёнка</legend>{([['male','Мальчик'],['female','Девочка']] as const).map(([gender, label]) => <label key={gender} className="flex gap-2 items-center"><input type="radio" name={`${uid}-gender`} checked={value.gender === gender} onChange={() => setValue(previous => ({ ...previous, gender }))} />{label}</label>)}</fieldset>
      <div className="flex flex-wrap gap-4"><button type="button" onClick={() => void save()} className="rounded-xl bg-amber-400 text-black px-5 py-3 font-bold">{pending ? 'Сохраняем…' : 'Сохранить'}</button><button type="button" onClick={() => setEditing(null)} className="underline">Отмена</button></div>
    </fieldset> : <button type="button" disabled={disabled || pending || children.length >= 20} onClick={() => { setValue({ name: '', dateOfBirth: '', gender: null }); setEditing(children.length); setError(''); }} className="font-bold text-amber-700 dark:text-amber-400">Добавить ребёнка</button>}
    {error && <p role="alert" className="text-red-600">{error}</p>}
  </section>;
}
