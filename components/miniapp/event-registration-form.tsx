"use client";

import { useEffect, useRef, useState } from "react";
import { useSectionReveal } from "./use-section-reveal";
import { Minus, Plus } from "lucide-react";
import { miniAppRequest } from "@/lib/telegram/miniapp-client";
import type { miniAppEventDetail, MiniAppEventQuote, MiniAppEventSelection } from "@/lib/telegram/miniapp-events";

type Detail = Awaited<ReturnType<typeof miniAppEventDetail>>;
const currency = new Intl.NumberFormat("ru", { style: "currency", currency: "ILS" });
const unitPrice = (price: string | number | null) => currency.format(Number(price));

export function EventRegistrationForm({ detail, busy, onRegister }: {
  detail: Detail;
  busy: boolean;
  onRegister: (selection: MiniAppEventSelection) => void;
}) {
  const [self, setSelf] = useState(true);
  const [spouse, setSpouse] = useState(false);
  const [childIds, setChildIds] = useState<string[]>([]);
  const [extraAdults, setExtraAdults] = useState(0);
  const [quote, setQuote] = useState<{ key: string; value: MiniAppEventQuote } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const sequence = useRef(0);
  const selection: MiniAppEventSelection = {
    self,
    spouse: spouse && !!detail.spouseName,
    childIds: detail.canRegisterChildren ? childIds.filter(id => detail.children.some(child => child.id === id)).sort() : [],
    extraAdults: Math.min(extraAdults, detail.extraAdultsLimit),
  };
  const requestKey = JSON.stringify({ eventId: detail.event.id, ...selection });
  const currentQuote = quote?.key === requestKey ? quote.value : null;
  const failed = failedKey === requestKey;
  const empty = !selection.self && !selection.spouse && !selection.childIds.length && !selection.extraAdults;
  const paymentSection = useSectionReveal(!!currentQuote || failed || empty);

  useEffect(() => {
    const controller = new AbortController(), current = ++sequence.current;
    if (empty) return () => controller.abort();
    const timer = setTimeout(async () => {
      try {
        const { data } = await miniAppRequest<{ quote: MiniAppEventQuote }>("events", {
          body: { action: "quote", ...JSON.parse(requestKey) }, signal: controller.signal,
        });
        if (!controller.signal.aborted && current === sequence.current) {
          setQuote({ key: requestKey, value: data.quote });
          setFailedKey(null);
        }
      } catch {
        if (!controller.signal.aborted && current === sequence.current) setFailedKey(requestKey);
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [requestKey, retry, empty]);

  return <section className="space-y-4" data-event-registration-form>
    <fieldset id="miniapp-participants" className="space-y-3" disabled={busy}>
      <legend className="font-bold mb-3">Кто идёт?</legend><p className="miniapp-helper">Если идёт только супруг/супруга, снимите галочку с себя. Выберите хотя бы одного участника.</p>
      <label className="miniapp-selection"><input type="checkbox" checked={self} onChange={event => setSelf(event.target.checked)} />{detail.firstName || "Участник"} (Вы)</label>
      {!detail.spouseName && <p className="miniapp-helper">Имя супруга/супруги можно добавить во вкладке «Профиль». Также можно выбрать взрослого гостя ниже.</p>}
      {detail.spouseName && <label className="miniapp-selection">
        <input type="checkbox" checked={selection.spouse} onChange={event => setSpouse(event.target.checked)} />
        {detail.spouseName} (Супруг/а)
      </label>}
      {detail.canRegisterChildren && detail.children.map(child => <label key={child.id} className="miniapp-selection">
        <input type="checkbox" checked={selection.childIds.includes(child.id)} onChange={event => {
          const checked = event.target.checked;
          setChildIds(previous => checked ? [...new Set([...previous, child.id])] : previous.filter(id => id !== child.id));
        }} />{child.name}
      </label>)}
      <div className="miniapp-guest-counter">
        <span id="miniapp-extra-adults-label">Дополнительные взрослые</span>
        <div role="group" aria-labelledby="miniapp-extra-adults-label">
          <button type="button" className="miniapp-secondary" aria-label="Убрать взрослого гостя" disabled={selection.extraAdults <= 0} onClick={() => setExtraAdults(value => Math.max(0, value - 1))}><Minus size={20} aria-hidden="true" /></button>
          <output aria-label="Количество дополнительных взрослых">{selection.extraAdults}</output>
          <button type="button" className="miniapp-secondary" aria-label="Добавить взрослого гостя" disabled={selection.extraAdults >= detail.extraAdultsLimit} onClick={() => setExtraAdults(value => Math.min(detail.extraAdultsLimit, value + 1))}><Plus size={20} aria-hidden="true" /></button>
        </div>
      </div>
    </fieldset>
    <div ref={paymentSection} className="miniapp-quote space-y-3" data-registration-payment aria-busy={!currentQuote && !failed && !empty}>
      <h2>Стоимость участия</h2>
      {empty ? <p role="alert" className="miniapp-error">Выберите хотя бы одного участника.</p> : failed ? <div role="alert" className="miniapp-error">
        Не удалось рассчитать стоимость. Проверьте подключение и повторите попытку.
        <button type="button" className="miniapp-text-action" disabled={busy} onClick={() => { setFailedKey(null); setRetry(value => value + 1); }}>Повторить расчёт</button>
      </div> : !currentQuote ? <p role="status">Рассчитываем стоимость…</p> : (
        <div className="space-y-3 miniapp-form-actions" data-calculated-total>
          <dl className="miniapp-quote-lines">
            <div><dt>Взрослые</dt><dd>{currentQuote.adults} × <bdi>{unitPrice(currentQuote.adultPrice)}</bdi></dd></div>
            <div><dt>Дети</dt><dd>{currentQuote.children} × <bdi>{unitPrice(currentQuote.childPrice)}</bdi></dd></div>
          </dl>
          <p className="miniapp-total" aria-live="polite">Итого: <bdi>{currentQuote.amountAgorot === 0 ? "Бесплатно" : currency.format(currentQuote.amountAgorot / 100)}</bdi></p>
          <button type="button" className="miniapp-primary w-full" disabled={busy} onClick={() => onRegister(selection)}>
            {currentQuote.amountAgorot === 0 ? "Записаться" : "Перейти к оплате"}
          </button>
        </div>
      )}
    </div>
  </section>;
}
