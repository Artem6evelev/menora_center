"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import ChildEditor, { ChildValue } from "@/components/community/child-editor";
import CityPicker from "@/components/community/city-picker";
import { saveRegistrationProgress, canResumeRegistrationAttempt } from "@/actions/community-progress";
import { useAttempt } from "@/components/community/attempt-context";
import { eventReturnTo } from "@/lib/community/policy";
import { saveCommunityProfile, saveResourceChoice } from "@/actions/community";
import { prepareRegistrationDraft, completeRegistrationDraft } from "@/actions/community-drafts";
import { AFFILIATIONS, AFFILIATION_LABELS, Affiliation, communityAccess, Gender, FILTER_VERSION, hasFilterProfile } from "@/lib/community/policy";
import { WELCOME_PARAGRAPHS, FORM_EXPLANATION } from "@/lib/community/copy";
import { fullProfileInput } from "@/lib/community/validation";
import ResourceMessage from "@/components/community/resource-message";

type Child = ChildValue;
type Fields = { firstName: string; lastName: string; phone: string; dateOfBirth: string; city: string;
  maritalStatus: "" | "single" | "married" | "divorced" | "widowed"; spouseName: string; hasChildren: boolean };
const inputClass = "w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 outline-none focus:ring-2 focus:ring-[#FFB800] min-w-0";
const dateValue = (value: unknown) => { const date = new Date(String(value)); return value && Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : ""; };
export default function OnboardingForm({ userId = null, initialProfile = null, initialDraft = null, draftId, returnTo = "/dashboard/events", resumeReady = false, onSaved }: {
  userId?: string | null; initialProfile?: any; initialDraft?: any; draftId?: string;
  returnTo?: string; resume?: boolean; resumeReady?: boolean; onSaved?: () => void;
}) {
  const router = useRouter(); const clerk = useClerk();
  const current = hasFilterProfile(initialProfile);
  const answers = initialDraft || (current ? initialProfile : null);
  const ordinary = initialDraft || initialProfile;
  const [affiliation, setAffiliation] = useState<Affiliation | "">(answers?.affiliation || "");
  const [gender, setGender] = useState<Gender | "">(answers?.gender || "");
  const giyurStage = initialProfile?.giyurStage || null;
  const [cityId, setCityId] = useState<string | null>(ordinary?.cityId || null);
  const [revision, setRevision] = useState(initialProfile?.filterRevision || 0);
  const [fields, setFields] = useState<Fields>({ firstName: ordinary?.firstName || "", lastName: ordinary?.lastName || "",
    phone: ordinary?.phone || "+972", dateOfBirth: dateValue(ordinary?.dateOfBirth), city: ordinary?.city || "",
    maritalStatus: ordinary?.maritalStatus || "", spouseName: ordinary?.spouseName || "", hasChildren: ordinary?.hasChildren ?? false });
  const [children, setChildren] = useState<Child[]>((ordinary?.childrenData || []).map((child: any) => ({
    id: child.id, draftId: child.draftId, gender: child.gender, name: child.name || "", dateOfBirth: child.dateOfBirth || child.birthDate || "",
  })));
  const [childrenChanged, setChildrenChanged] = useState(initialDraft?.childrenData !== undefined);
  const pendingChildren = useRef<Child[] | null>(null);
  const [childrenPending, setChildrenPending] = useState(false);
  useEffect(() => { if (pendingChildren.current && JSON.stringify(pendingChildren.current) === JSON.stringify(children)) pendingChildren.current = null; }, [children]);
  const [agreed, setAgreed] = useState(initialDraft?.agreedToPrivacy === true);
  const [pending, setPending] = useState(false); const [error, setError] = useState("");
  const [saved, setSaved] = useState(current && initialProfile?.affiliation === "none");
  const resumed = useRef(false);
  const departing = useRef(false);
  const attempt = useRef<{ id: string; payload: string } | null>(null);
  const canEditChildren = communityAccess({ affiliation, gender, giyurStage, filterVersion: FILTER_VERSION, filterCompletedAt: new Date(), isProfileComplete: true }).canManageChildren;
  const expanded = affiliation === "maternal" || affiliation === "giyur";
  function payload() {
    const list = pendingChildren.current || children;
    return { ...fields, spouseName: fields.maritalStatus === "married" ? fields.spouseName : null,
      affiliation, gender, cityId, returnTo: eventReturnTo(returnTo), expectedRevision: revision, agreedToPrivacy: agreed,
      ...(canEditChildren && (fields.hasChildren || (childrenChanged && !list.length)) ? { childrenData: list.filter(child => child.name.trim() || child.dateOfBirth) } : {}),
    };
  }
  const { register: registerPrepare } = useAttempt();
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const latest = useRef(payload()); latest.current = payload();
  const [hydrated, setHydrated] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [draftError, setDraftError] = useState("");
  const storageKey = `menora-attempt:${userId || 'guest'}:${eventReturnTo(returnTo)}`;
  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      const stored = sessionStorage.getItem(storageKey);
      if (!draftId && stored && !new URL(window.location.href).searchParams.has('draft') && /^[0-9a-f-]{36}$/.test(stored)) {
        const allowed = await canResumeRegistrationAttempt(stored, eventReturnTo(returnTo));
        if (cancelled) return;
        if (allowed) { window.location.replace(`/register?draft=${stored}&returnTo=${encodeURIComponent(eventReturnTo(returnTo))}`); return; }
        sessionStorage.removeItem(storageKey);
      }
      if (cancelled) return;
      const id = draftId || crypto.randomUUID();
      attempt.current = { id, payload: '' }; sessionStorage.setItem(storageKey, id);
      if (!draftId) { const url = new URL(window.location.href); url.searchParams.set('draft', id); router.replace(url.pathname + url.search, { scroll: false }); }
      setHydrated(true);
    }
    void initialize().catch(() => setError('Не удалось восстановить попытку. Обновите страницу.'));
    return () => { cancelled = true; };
  }, [draftId, storageKey, returnTo, router]);
  const flushProgress = useCallback(async (nextChildren?: Child[]) => {
    const id = attempt.current?.id;
    if (!id) throw new Error('Дождитесь загрузки анкеты');
    if (nextChildren !== undefined) pendingChildren.current = nextChildren;
    const data = { ...latest.current, ...(nextChildren ? { childrenData: nextChildren } : {}) };
    const { returnTo: target, ...progress } = data;
    const clean = progress.affiliation === 'none' ? { affiliation: 'none', expectedRevision: progress.expectedRevision } : progress;
    setDraftStatus('Сохраняем черновик…'); setDraftError('');
    const request = queue.current.catch(() => {}).then(() => saveRegistrationProgress(clean, id, target));
    queue.current = request;
    let result;
    try { result = await request; }
    catch { if (nextChildren !== undefined) pendingChildren.current = null; setDraftStatus(''); throw new Error('Не удалось сохранить черновик. Повторите сохранение.'); }
    if (!result.success) { if (nextChildren !== undefined) pendingChildren.current = null; setDraftStatus(''); throw new Error(result.message); }
    setDraftStatus('Черновик сохранён'); setDraftError(''); return id;
  }, []);
  const serializedProgress = JSON.stringify(payload());
  useEffect(() => {
    if (!hydrated || pending || childrenPending || saved || resumeReady || departing.current) return;
    const timer = setTimeout(() => { void flushProgress().catch(error => setDraftError(error.message)); }, 500);
    return () => clearTimeout(timer);
  }, [serializedProgress, hydrated, pending, childrenPending, saved, resumeReady, flushProgress]);
  useEffect(() => { registerPrepare(saved ? null : () => flushProgress()); return () => registerPrepare(null); }, [registerPrepare, flushProgress, saved]);
  const finish = useCallback((result: any) => {
    if (!result.success) { setError(result.message); return; }
    setRevision(result.revision); setSaved(true);
    sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(`menora-attempt:guest:${eventReturnTo(returnTo)}`);
    onSaved?.();
    if (result.access.canViewEvents) router.replace(result.redirectTo || "/dashboard/events");
    router.refresh();
  }, [onSaved, router, storageKey, returnTo]);
  useEffect(() => {
    if (!hydrated || !resumeReady || !draftId || !userId || resumed.current) return;
    resumed.current = true; setPending(true);
    void completeRegistrationDraft(draftId).then(finish)
      .catch(() => setError("Не удалось завершить сохранение. Анкета остаётся на сервере; попробуйте сохранить снова."))
      .finally(() => setPending(false));
  }, [draftId, userId, hydrated, resumeReady, finish]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setSaved(false);
    const checked = fullProfileInput.safeParse(payload());
    if (!checked.success) { setError(checked.error.issues[0]?.message || "Проверьте обязательные поля"); return; }
    if (!cityId && (!initialProfile?.city || initialProfile.cityId || fields.city !== initialProfile.city)) { setError("Выберите город из справочника"); return; }
    setPending(true);
    try {
      if (userId) { finish(await (draftId ? completeRegistrationDraft(draftId, checked.data) : saveCommunityProfile(userId, checked.data))); return; }
      const serialized = JSON.stringify(checked.data);
      if (!attempt.current) attempt.current = { id: crypto.randomUUID(), payload: serialized };
      await flushProgress();
      const prepared = await prepareRegistrationDraft(checked.data, attempt.current!.id, eventReturnTo(returnTo));
      if (!prepared.success) { setError(prepared.message); return; }
      if (!clerk.client) throw new Error("Вход ещё загружается");
      const suffix = `registration=1&draft=${encodeURIComponent(prepared.draftId)}`;
      departing.current = true;
      await clerk.client.signIn.authenticateWithRedirect({ strategy: "oauth_google",
        redirectUrl: `/sso-callback?${suffix}`, redirectUrlComplete: `/auth/complete?${suffix}` });
    } catch { departing.current = false; setError("Не удалось завершить вход. Отправленная анкета сохранена на сервере на 30 минут; попробуйте снова."); }
    finally { setPending(false); }
  }
  async function saveChoice() {
    if (!userId || affiliation !== "none") return;
    setPending(true); setError("");
    try {
      const input = { affiliation, expectedRevision: revision };
      const result = await (draftId ? completeRegistrationDraft(draftId, input) : saveResourceChoice(userId, input));
      if (result.success) { setRevision(result.revision); setSaved(true); sessionStorage.removeItem(storageKey); sessionStorage.removeItem(`menora-attempt:guest:${eventReturnTo(returnTo)}`); router.refresh(); }
      else setError(result.message);
    } catch { setError("Не удалось сохранить выбор. Попробуйте ещё раз."); }
    finally { setPending(false); }
  }
  return <div className="w-full max-w-3xl mx-auto rounded-[32px] md:rounded-[40px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-8 md:p-12 shadow-xl">
    <div className="space-y-4 mb-8">{WELCOME_PARAGRAPHS.slice(0, 3).map((text, index) => index === 0
      ? <h1 key={text} className="text-2xl md:text-3xl font-black leading-tight">{text}</h1>
      : <p key={text} className="leading-relaxed text-neutral-600 dark:text-neutral-300">{text}</p>)}</div>
    <div className="rounded-3xl bg-sky-100 text-slate-900 p-5 sm:p-6 flex gap-4 mb-4"><p className="leading-relaxed min-w-0"><strong>Наша миссия</strong>{WELCOME_PARAGRAPHS[3].slice('Наша миссия'.length)}</p><span aria-hidden="true" className="text-blue-700 text-4xl shrink-0 self-center">✡</span></div>
    <div className="rounded-3xl bg-blue-700 text-white font-bold p-5 sm:p-6 leading-relaxed mb-8">{WELCOME_PARAGRAPHS[4]}</div>
    <form onSubmit={submit} className="space-y-6">
      <fieldset disabled={pending || childrenPending || !hydrated} className="space-y-4">
        <legend className="font-bold text-lg mb-4">Пожалуйста, укажите Вашу связь с еврейством:</legend>
        {AFFILIATIONS.map(value => <label key={value} className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer ${affiliation === value ? "border-[#FFB800] bg-amber-50 dark:bg-amber-950/20" : "border-neutral-200 dark:border-neutral-700"}`}>
          <input type="radio" required name="affiliation" value={value} checked={affiliation === value} onChange={() => { setAffiliation(value); setSaved(false); setError(""); }} className="mt-1 accent-[#FFB800]" />
          <span>{AFFILIATION_LABELS[value]}</span>
        </label>)}
      </fieldset>
      {expanded && <fieldset disabled={pending || childrenPending || !hydrated}><legend className="font-bold mb-3">Пол</legend><div className="flex flex-wrap gap-5">
        {([['male', 'Мужской'], ['female', 'Женский']] as const).map(([value, label]) => <label key={value} className="flex items-center gap-2"><input type="radio" required name="gender" checked={gender === value} onChange={() => { setGender(value); setSaved(false); }} value={value} className="accent-[#FFB800]" />{label}</label>)}
      </div></fieldset>}
      {expanded && <fieldset disabled={pending || childrenPending || !hydrated} className="space-y-6 min-w-0">
        <div className="space-y-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 p-5">{FORM_EXPLANATION.map(text => <p key={text} className="leading-relaxed">{text}</p>)}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{([
          ["firstName", "Имя", "text"], ["lastName", "Фамилия", "text"], ["phone", "Номер телефона", "tel"],
          ["dateOfBirth", "Дата рождения", "date"],
        ] as const).map(([name, label, type]) => <div key={name}><label htmlFor={`profile-${name}`} className="block font-bold text-sm mb-2">{label} *</label>
          <input id={`profile-${name}`} name={name} type={type} required value={fields[name]} onChange={event => setFields(previous => ({ ...previous, [name]: event.target.value }))} className={inputClass} />
        </div>)}
          <div><label htmlFor="profile-city" className="block font-bold text-sm mb-2">Город проживания *</label><CityPicker value={fields.city} cityId={cityId} onChange={(city, id) => { setFields(previous => ({ ...previous, city })); setCityId(id); }} /></div>
          <div><label htmlFor="profile-marital" className="block font-bold text-sm mb-2">Семейное положение *</label><select id="profile-marital" required value={fields.maritalStatus} onChange={event => setFields(previous => ({ ...previous, maritalStatus: event.target.value as Fields['maritalStatus'] }))} className={inputClass}>
            <option value="" disabled>Выберите…</option><option value="single">Холост / Не замужем</option><option value="married">В браке</option><option value="divorced">В разводе</option><option value="widowed">Вдовец / Вдова</option>
          </select></div>
        </div>
        {fields.maritalStatus === "married" && <div><label htmlFor="profile-spouse" className="block font-bold text-sm mb-2">Имя супруга/и *</label><input id="profile-spouse" required value={fields.spouseName} onChange={event => setFields(previous => ({ ...previous, spouseName: event.target.value }))} className={inputClass} /></div>}
        <label className="flex gap-3 items-center"><input type="checkbox" checked={fields.hasChildren} onChange={event => setFields(previous => ({ ...previous, hasChildren: event.target.checked }))} className="accent-[#FFB800]" />Есть дети</label>
        {canEditChildren && fields.hasChildren && <ChildEditor items={children} disabled={pending || childrenPending} onSave={async next => { setChildrenPending(true); try { await flushProgress(next); setChildren(next); setChildrenChanged(true); if (!next.length) setFields(previous => ({ ...previous, hasChildren: false })); } finally { setChildrenPending(false); } }} />}
        {affiliation === "giyur" && gender === "female" && !canEditChildren && current && initialProfile?.isProfileComplete && initialProfile.affiliation === "giyur" && userId && <a className="block font-bold underline" href="/dashboard/kids">Добавить или записать ребёнка — перейти в детский раздел</a>}
        <label className="flex gap-3 items-start"><input type="checkbox" required checked={agreed} onChange={event => setAgreed(event.target.checked)} className="mt-1 accent-[#FFB800]" /><span>Я соглашаюсь с <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">Политикой конфиденциальности</a>.</span></label>
        <div id="clerk-captcha" />
        <button type="submit" className="w-full py-4 rounded-2xl bg-[#FFB800] text-black font-black disabled:opacity-60" disabled={pending || !gender || saved}>{pending ? "Сохраняем…" : userId ? "Сохранить анкету" : "Продолжить с Google"}</button>
      </fieldset>}
      {affiliation === "none" && <><ResourceMessage />{userId && <button type="button" onClick={saveChoice} disabled={pending || saved} className="w-full py-4 rounded-2xl border border-[#FFB800] font-bold disabled:opacity-50">{pending ? "Сохраняем…" : "Сохранить выбор"}</button>}</>}
      {draftStatus && <p role="status" className="text-sm text-neutral-500">{draftStatus}</p>}
      {draftError && <p role="alert" className="text-red-600 text-sm">{draftError}</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 text-red-700 p-4">{error}</p>}
      {saved && <div role="status" className="rounded-xl bg-emerald-50 text-emerald-800 p-4">{"Ваши данные сохранены."}{(affiliation === "maternal" || affiliation === "giyur") && <a href="/dashboard/events" className="block font-bold underline mt-3">Продолжить</a>}</div>}
    </form>
  </div>;
}
