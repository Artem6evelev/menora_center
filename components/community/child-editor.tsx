'use client';
import { useEffect, useId, useState } from 'react';
export type ChildValue = { id?: string; draftId?: string; name: string; dateOfBirth: string; gender?: 'male' | 'female' | null };
export const childEditorCopy = { section: 'Дети', title: 'Данные детей', edit: 'Изменить', remove: 'Удалить',
  add: 'Добавить ребёнка', newChild: 'Новый ребёнок', editChild: 'Изменить ребёнка', name: 'Имя ребёнка',
  birthDate: 'Дата рождения ребёнка', gender: 'Пол ребёнка', male: 'Мальчик', female: 'Девочка', unknown: 'Пол не указан',
  saving: 'Сохраняем…', save: 'Сохранить', cancel: 'Отмена', invalid: 'Укажите имя, дату рождения и пол ребёнка', error: 'Не удалось сохранить ребёнка' };
export type ChildEditorCopy = typeof childEditorCopy;
export default function ChildEditor({ items: children, onSave, disabled = false, copy = childEditorCopy, onEditingChange }: {
  items: ChildValue[]; onSave: (value: ChildValue[]) => Promise<void>; disabled?: boolean; copy?: ChildEditorCopy; onEditingChange?: (editing: boolean) => void;
}) {
  const uid = useId(); const [editing, setEditing] = useState<number | null>(null);
  const [value, setValue] = useState<ChildValue>({ name: '', dateOfBirth: '', gender: null });
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  useEffect(() => { onEditingChange?.(editing !== null); return () => onEditingChange?.(false); }, [editing, onEditingChange]);
  async function persist(next: ChildValue[]) { setPending(true); setError(''); try { await onSave(next); setEditing(null); } catch (error) { setError(error instanceof Error ? error.message : copy.error); } finally { setPending(false); } }
  async function save() {
    if (value.name.trim().length < 2 || !value.dateOfBirth || (!value.id && !value.gender)) { setError(copy.invalid); return; }
    const item = { ...value, draftId: value.draftId || (!value.id ? crypto.randomUUID() : undefined) };
    await persist(editing === children.length ? [...children, item] : children.map((child, index) => index === editing ? item : child));
  }
  return <section aria-label={copy.section} className="space-y-4 min-w-0">
    <h2 className="font-bold">{copy.title}</h2>
    {children.map((child, index) => <div key={child.id || child.draftId || index} className="rounded-2xl border p-4 space-y-3 min-w-0">
      <p className="font-bold break-words">{child.name}</p><p className="text-sm">{child.dateOfBirth} · {child.gender === 'male' ? copy.male : child.gender === 'female' ? copy.female : copy.unknown}</p>
      <div className="flex flex-wrap gap-4"><button type="button" disabled={disabled || pending} onClick={() => { setValue({ ...child }); setEditing(index); setError(''); }} className="font-bold underline">{copy.edit}</button><button type="button" disabled={disabled || pending} onClick={() => void persist(children.filter((_, i) => i !== index))} className="text-red-600 underline">{copy.remove}</button></div>
    </div>)}
    {editing !== null ? <fieldset disabled={disabled || pending} className="rounded-2xl border border-sky-200 p-4 space-y-3 min-w-0"><legend className="font-bold px-1">{editing === children.length ? copy.newChild : copy.editChild}</legend>
      <label className="block" htmlFor={`${uid}-name`}>{copy.name}</label><input id={`${uid}-name`} value={value.name} maxLength={100} onChange={event => { setValue(previous => ({ ...previous, name: event.target.value })); setError(''); }} className="w-full rounded-xl border p-3 bg-transparent min-w-0" />
      <label className="block" htmlFor={`${uid}-dob`}>{copy.birthDate}</label><input id={`${uid}-dob`} type="date" value={value.dateOfBirth} onChange={event => { setValue(previous => ({ ...previous, dateOfBirth: event.target.value })); setError(''); }} className="w-full rounded-xl border p-3 bg-transparent min-w-0" />
      <fieldset className="flex flex-wrap gap-4"><legend className="mb-2">{copy.gender}</legend>{([['male',copy.male],['female',copy.female]] as const).map(([gender, label]) => <label key={gender} className="flex gap-2 items-center"><input type="radio" name={`${uid}-gender`} checked={value.gender === gender} onChange={() => { setValue(previous => ({ ...previous, gender })); setError(''); }} />{label}</label>)}</fieldset>
      <div className="flex flex-wrap gap-4"><button type="button" onClick={() => void save()} className="rounded-xl bg-amber-400 text-black px-5 py-3 font-bold">{pending ? copy.saving : copy.save}</button><button type="button" onClick={() => setEditing(null)} className="underline">{copy.cancel}</button></div>
    </fieldset> : <button type="button" disabled={disabled || pending || children.length >= 20} onClick={() => { setValue({ name: '', dateOfBirth: '', gender: null }); setEditing(children.length); setError(''); }} className="font-bold text-amber-700 dark:text-amber-400">{copy.add}</button>}
    {error && <p role="alert" className="text-red-600">{error}</p>}
  </section>;
}
