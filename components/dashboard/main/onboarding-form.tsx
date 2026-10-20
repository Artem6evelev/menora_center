"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Plus, Trash2 } from "lucide-react";
import { saveCommunityProfile, saveResourceChoice } from "@/actions/community";
import { prepareRegistrationDraft, completeRegistrationDraft, discardRegistrationDraft } from "@/actions/community-drafts";
import { AFFILIATIONS, AFFILIATION_LABELS, Affiliation, communityAccess, Gender, FILTER_VERSION, hasFilterProfile } from "@/lib/community/policy";
import { WELCOME_PARAGRAPHS, FORM_EXPLANATION } from "@/lib/community/copy";
import { fullProfileInput } from "@/lib/community/validation";
import ResourceMessage from "@/components/community/resource-message";

type Child = { id?: string; name: string; dateOfBirth: string };
type Fields = { firstName: string; lastName: string; phone: string; dateOfBirth: string; city: string;
  maritalStatus: "" | "single" | "married" | "divorced" | "widowed"; spouseName: string; hasChildren: boolean };
const inputClass = "w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 outline-none focus:ring-2 focus:ring-[#FFB800] min-w-0";
const dateValue = (value: unknown) => { const date = new Date(String(value)); return value && Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : ""; };
export default function OnboardingForm({ userId = null, initialProfile = null, initialDraft = null, draftId, onSaved }: {
  userId?: string | null; initialProfile?: any; initialDraft?: any; draftId?: string;
  returnTo?: string; resume?: boolean; onSaved?: () => void;
}) {
  const router = useRouter(); const clerk = useClerk();
  const current = hasFilterProfile(initialProfile);
  const answers = initialDraft || (current ? initialProfile : null);
  const ordinary = initialDraft || initialProfile;
  const [affiliation, setAffiliation] = useState<Affiliation | "">(answers?.affiliation || "");
  const [gender, setGender] = useState<Gender | "">(answers?.gender || "");
  const [giyurStage, setGiyurStage] = useState<"advanced" | "completed" | "">(answers?.giyurStage || "");
  const [revision, setRevision] = useState(initialProfile?.filterRevision || 0);
  const [fields, setFields] = useState<Fields>({ firstName: ordinary?.firstName || "", lastName: ordinary?.lastName || "",
    phone: ordinary?.phone || "+972", dateOfBirth: dateValue(ordinary?.dateOfBirth), city: ordinary?.city || "",
    maritalStatus: ordinary?.maritalStatus || "", spouseName: ordinary?.spouseName || "", hasChildren: ordinary?.hasChildren ?? false });
  const [children, setChildren] = useState<Child[]>((ordinary?.childrenData || []).map((child: any) => ({
    id: child.id, name: child.name || "", dateOfBirth: child.dateOfBirth || child.birthDate || "",
  })));
  const [agreed, setAgreed] = useState(initialDraft?.agreedToPrivacy === true);
  const [pending, setPending] = useState(false); const [error, setError] = useState("");
  const [saved, setSaved] = useState(current && initialProfile?.affiliation === "none");
  const resumed = useRef(false);
  const attempt = useRef<{ id: string; payload: string } | null>(null);
  const canEditChildren = communityAccess({ affiliation, gender, giyurStage, filterVersion: FILTER_VERSION, filterCompletedAt: new Date(), isProfileComplete: true }).canManageChildren;
  const expanded = affiliation === "maternal" || affiliation === "giyur";
  function payload() {
    return { ...fields, spouseName: fields.maritalStatus === "married" ? fields.spouseName : null,
      affiliation, gender, ...(affiliation === "giyur" ? { giyurStage: giyurStage || null } : {}), expectedRevision: revision, agreedToPrivacy: agreed,
      ...(canEditChildren && fields.hasChildren ? { childrenData: children.filter(child => child.name.trim() || child.dateOfBirth) } : {}),
    };
  }
  const finish = useCallback((result: any) => {
    if (!result.success) { setError(result.message); return; }
    setRevision(result.revision); setSaved(true);
    onSaved?.();
    if (result.access.canViewEvents) router.replace("/dashboard/events");
    router.refresh();
  }, [onSaved, router]);
  useEffect(() => {
    if (!draftId || !userId || resumed.current) return;
    resumed.current = true; setPending(true);
    void completeRegistrationDraft(draftId).then(finish)
      .catch(() => setError("Не удалось завершить сохранение. Анкета остаётся на сервере; попробуйте сохранить снова."))
      .finally(() => setPending(false));
  }, [draftId, userId, finish]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setSaved(false);
    const checked = fullProfileInput.safeParse(payload());
    if (!checked.success) { setError(checked.error.issues[0]?.message || "Проверьте обязательные поля"); return; }
    setPending(true);
    try {
      if (userId) { finish(await (draftId && initialDraft ? completeRegistrationDraft(draftId, checked.data) : saveCommunityProfile(userId, checked.data))); return; }
      const serialized = JSON.stringify(checked.data);
      if (attempt.current?.payload !== serialized) attempt.current = { id: crypto.randomUUID(), payload: serialized };
      const prepared = await prepareRegistrationDraft(checked.data, attempt.current!.id);
      if (!prepared.success) { setError(prepared.message); return; }
      if (!clerk.client) throw new Error("Вход ещё загружается");
      const suffix = `registration=1&draft=${encodeURIComponent(prepared.draftId)}`;
      await clerk.client.signIn.authenticateWithRedirect({ strategy: "oauth_google",
        redirectUrl: `/sso-callback?${suffix}`, redirectUrlComplete: `/auth/complete?${suffix}` });
    } catch { setError("Не удалось завершить вход. Отправленная анкета сохранена на сервере на 30 минут; попробуйте снова."); }
    finally { setPending(false); }
  }
  async function saveChoice() {
    if (!userId || !gender || affiliation !== "none") return;
    setPending(true); setError("");
    try {
      const input = { affiliation, gender, expectedRevision: revision };
      const result = await (draftId && initialDraft ? completeRegistrationDraft(draftId, input) : saveResourceChoice(userId, input));
      if (result.success) { setRevision(result.revision); setSaved(true); router.refresh(); }
      else setError(result.message);
    } catch { setError("Не удалось сохранить выбор. Попробуйте ещё раз."); }
    finally { setPending(false); }
  }
  return <div className="w-full max-w-3xl mx-auto rounded-[32px] md:rounded-[40px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-8 md:p-12 shadow-xl">
    <div className="space-y-4 mb-8">{WELCOME_PARAGRAPHS.map((text, index) => index === 0
      ? <h1 key={text} className="text-2xl md:text-3xl font-black leading-tight">{text}</h1>
      : <p key={text} className="leading-relaxed text-neutral-600 dark:text-neutral-300">{text}</p>)}</div>
    <form onSubmit={submit} className="space-y-6">
      <fieldset disabled={pending} className="space-y-4">
        <legend className="font-bold text-lg mb-4">Пожалуйста, укажите Вашу связь с еврейством:</legend>
        {AFFILIATIONS.map(value => <label key={value} className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer ${affiliation === value ? "border-[#FFB800] bg-amber-50 dark:bg-amber-950/20" : "border-neutral-200 dark:border-neutral-700"}`}>
          <input type="radio" required name="affiliation" value={value} checked={affiliation === value} onChange={() => { setAffiliation(value); setSaved(false); setError(""); if (value === "none" && attempt.current) { void discardRegistrationDraft(attempt.current.id).catch(() => {}); attempt.current = null; } }} className="mt-1 accent-[#FFB800]" />
          <span>{AFFILIATION_LABELS[value]}</span>
        </label>)}
      </fieldset>
      {affiliation && <fieldset disabled={pending}><legend className="font-bold mb-3">Пол</legend><div className="flex flex-wrap gap-5">
        {([['male', 'Мужской'], ['female', 'Женский']] as const).map(([value, label]) => <label key={value} className="flex items-center gap-2"><input type="radio" required name="gender" checked={gender === value} onChange={() => { setGender(value); setSaved(false); }} value={value} className="accent-[#FFB800]" />{label}</label>)}
      </div></fieldset>}
      {affiliation === "giyur" && <fieldset disabled={pending} className="space-y-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4"><legend className="font-bold px-1">Уточнение для детских прав</legend>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Для личной записи это уточнение не требуется. Самостоятельное добавление и запись детей доступны после завершённого гиюра.</p>
        {gender === "male" && <p className="text-sm text-neutral-600 dark:text-neutral-300">Самостоятельное добавление и запись детей доступны только с профиля мамы.</p>}
        {([['advanced', 'Нахожусь на продвинутом этапе'], ['completed', 'Гиюр завершён']] as const).map(([value, label]) => <label key={value} className="flex gap-3 items-center"><input type="radio" name="giyurStage" value={value} checked={giyurStage === value} onChange={() => setGiyurStage(value)} />{label}</label>)}
      </fieldset>}
      {expanded && <fieldset disabled={pending} className="space-y-6 min-w-0">
        <div className="space-y-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 p-5">{FORM_EXPLANATION.map(text => <p key={text} className="leading-relaxed">{text}</p>)}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{([
          ["firstName", "Имя", "text"], ["lastName", "Фамилия", "text"], ["phone", "Номер телефона", "tel"],
          ["dateOfBirth", "Дата рождения", "date"], ["city", "Город проживания", "text"],
        ] as const).map(([name, label, type]) => <div key={name}><label htmlFor={`profile-${name}`} className="block font-bold text-sm mb-2">{label} *</label>
          <input id={`profile-${name}`} name={name} type={type} required value={fields[name]} onChange={event => setFields(previous => ({ ...previous, [name]: event.target.value }))} className={inputClass} />
        </div>)}
          <div><label htmlFor="profile-marital" className="block font-bold text-sm mb-2">Семейное положение *</label><select id="profile-marital" required value={fields.maritalStatus} onChange={event => setFields(previous => ({ ...previous, maritalStatus: event.target.value as Fields['maritalStatus'] }))} className={inputClass}>
            <option value="" disabled>Выберите…</option><option value="single">Холост / Не замужем</option><option value="married">В браке</option><option value="divorced">В разводе</option><option value="widowed">Вдовец / Вдова</option>
          </select></div>
        </div>
        {fields.maritalStatus === "married" && <div><label htmlFor="profile-spouse" className="block font-bold text-sm mb-2">Имя супруга/и *</label><input id="profile-spouse" required value={fields.spouseName} onChange={event => setFields(previous => ({ ...previous, spouseName: event.target.value }))} className={inputClass} /></div>}
        <label className="flex gap-3 items-center"><input type="checkbox" checked={fields.hasChildren} onChange={event => { const checked = event.target.checked; setFields(previous => ({ ...previous, hasChildren: checked })); if (checked && canEditChildren && !children.length) setChildren([{ name: "", dateOfBirth: "" }]); }} className="accent-[#FFB800]" />Есть дети</label>
        {canEditChildren && fields.hasChildren ? <section className="space-y-4" aria-label="Дети">
          <h2 className="font-bold">Данные детей</h2>
          {children.map((child, index) => <div key={child.id || `new-${index}`} className="rounded-2xl border border-amber-200 dark:border-amber-900 p-4 space-y-3">
            <label className="block text-sm font-bold" htmlFor={`child-name-${index}`}>Имя ребёнка *</label><input id={`child-name-${index}`} required value={child.name} onChange={event => setChildren(previous => previous.map((value, i) => i === index ? { ...value, name: event.target.value } : value))} className={inputClass} />
            <label className="block text-sm font-bold" htmlFor={`child-dob-${index}`}>Дата рождения ребёнка *</label><input id={`child-dob-${index}`} type="date" required value={child.dateOfBirth} onChange={event => setChildren(previous => previous.map((value, i) => i === index ? { ...value, dateOfBirth: event.target.value } : value))} className={inputClass} />
            <button type="button" onClick={() => setChildren(previous => previous.filter((_, i) => i !== index))} className="text-red-600 text-sm flex gap-2 items-center"><Trash2 size={16} />Убрать из анкеты</button>
          </div>)}
          <button type="button" onClick={() => setChildren(previous => [...previous, { name: "", dateOfBirth: "" }])} className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2"><Plus size={18} />Добавить ребёнка</button>
        </section> : fields.hasChildren ? <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">Дети добавляются и записываются с профиля еврейской мамы. Если ребёнка может записать только отец, обратитесь к администратору. Существующие семейные данные сохраняются.</p> : null}
        <label className="flex gap-3 items-start"><input type="checkbox" required checked={agreed} onChange={event => setAgreed(event.target.checked)} className="mt-1 accent-[#FFB800]" /><span>Я соглашаюсь с <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">Политикой конфиденциальности</a>.</span></label>
        <div id="clerk-captcha" />
        <button type="submit" className="w-full py-4 rounded-2xl bg-[#FFB800] text-black font-black disabled:opacity-60" disabled={pending || !gender || saved}>{pending ? "Сохраняем…" : userId ? "Сохранить анкету" : "Продолжить с Google"}</button>
      </fieldset>}
      {affiliation === "none" && <><ResourceMessage />{userId && <button type="button" onClick={saveChoice} disabled={pending || !gender || saved} className="w-full py-4 rounded-2xl border border-[#FFB800] font-bold disabled:opacity-50">{pending ? "Сохраняем…" : "Сохранить выбор"}</button>}</>}
      {error && <p role="alert" className="rounded-xl bg-red-50 text-red-700 p-4">{error}</p>}
      {saved && <div role="status" className="rounded-xl bg-emerald-50 text-emerald-800 p-4">{"Ваши данные сохранены."}{(affiliation === "maternal" || affiliation === "giyur") && <a href="/dashboard/events" className="block font-bold underline mt-3">Продолжить</a>}</div>}
    </form>
  </div>;
}
