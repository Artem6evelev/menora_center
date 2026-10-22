'use client';
import { useEffect, useId, useRef, useState } from 'react';
type City = { id: string; name: string; he: string; en?: string | null };
export const cityPickerCopy = { error: 'Не удалось загрузить справочник. Повторите поиск.', loading: 'Загружаем города…', retry: 'Повторить', empty: 'Ничего не найдено. Проверьте название.', prompt: 'Введите начало названия города.', list: 'Населённые пункты' };
export type CityPickerCopy = typeof cityPickerCopy;
export default function CityPicker({ value, cityId, onChange, id = 'profile-city', required = true, copy = cityPickerCopy }: { value: string; cityId?: string | null; onChange: (name: string, id: string | null) => void; id?: string; required?: boolean; copy?: CityPickerCopy }) {
  const listId = useId(); const [items, setItems] = useState<City[]>([]); const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [active, setActive] = useState(0);
  const [retry, setRetry] = useState(0); const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open || !value.trim()) { setItems([]); setLoading(false); setError(''); return; }
    const controller = new AbortController(); setLoading(true); setError('');
    let requestTimeout: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      requestTimeout = setTimeout(() => { setError(copy.error); setLoading(false); controller.abort(); }, 10000);
      void fetch('/api/community/cities?q=' + encodeURIComponent(value), { signal: controller.signal }).then(async response => {
        if (!response.ok) throw new Error(); const result = await response.json(); if (!Array.isArray(result.cities)) throw new Error();
        setItems(result.cities); setActive(0);
      }).catch(() => { if (!controller.signal.aborted) setError(copy.error); }).finally(() => { clearTimeout(requestTimeout); if (!controller.signal.aborted) setLoading(false); });
    }, 180);
    return () => { clearTimeout(timer); clearTimeout(requestTimeout); controller.abort(); };
  }, [value, open, retry, copy.error]);
  useEffect(() => { if (open && items[active]) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' }); }, [active, items, open, listId]);
  function select(city: City) { onChange(city.name, city.id); setOpen(false); input.current?.focus(); }
  return <div className="relative min-w-0">
    <input ref={input} id={id} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && items[active] ? `${listId}-${active}` : undefined}
      required={required} autoComplete="off" value={value} onFocus={() => { if (!cityId) setOpen(true); }} onBlur={() => setOpen(false)}
      onChange={event => { onChange(event.target.value, null); setOpen(true); }}
      onKeyDown={event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive(previous => Math.min(previous + 1, items.length - 1)); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setActive(previous => Math.max(0, previous - 1)); }
        if (event.key === 'Enter' && open) { event.preventDefault(); if (items[active]) select(items[active]); }
        if (event.key === 'Escape') setOpen(false);
      }} className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 min-w-0 focus:ring-2 focus:ring-amber-400 outline-none" />
    {open && <div data-city-options className="absolute z-30 mt-1 w-full rounded-2xl bg-white dark:bg-neutral-900 border shadow-xl max-h-64 overflow-y-auto">
      {loading ? <p role="status" className="p-3 text-sm">{copy.loading}</p> : error ? <div role="alert" className="p-3 text-sm">{error}<button type="button" onMouseDown={event => event.preventDefault()} onClick={() => setRetry(previous => previous + 1)} className="block underline mt-2">{copy.retry}</button></div> : !items.length ? <p role="status" className="p-3 text-sm">{value ? copy.empty : copy.prompt}</p> : null}
      <ul role="listbox" id={listId} aria-label={copy.list}>{items.map((city, index) => <li role="option" id={`${listId}-${index}`} key={city.id} aria-selected={index === active} onMouseDown={event => event.preventDefault()} onClick={() => select(city)} className={`cursor-pointer p-3 text-sm ${index === active ? 'bg-sky-100 dark:bg-sky-950' : ''}`}><span className="font-bold">{city.name}</span><span className="block text-xs text-neutral-500" dir="auto">{city.he} · {city.en}</span></li>)}</ul>
    </div>}
  </div>;
}
