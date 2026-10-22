"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Baby } from "lucide-react";
import ChildEditor, { type ChildValue } from "@/components/community/child-editor";
import { kidsProgramIcons } from "@/lib/kids/program-cards";
import type { MiniAppKidsData } from "@/lib/telegram/miniapp-kids";
import type { MiniAppProfileData } from "@/lib/telegram/miniapp-profile";
import { miniAppRequest, MiniAppRequestError } from "@/lib/telegram/miniapp-client";
import { miniAppDictionaries } from "@/lib/telegram/miniapp-i18n";
import { MiniAppContact } from "./contact";

const statusCopy: Record<string, string> = { pending: "На рассмотрении", approved: "Подтверждено", rejected: "Не подтверждено" };
function message(error: unknown) {
  if (error instanceof MiniAppRequestError) {
    if (error.code === "profile_changed") return miniAppDictionaries.ru.errors.profile_changed;
    if (error.code === "kids_access_denied") return "Самостоятельная запись детей недоступна. Обновите данные или свяжитесь с нами.";
    if (["invalid_kids_application", "child_not_owned"].includes(error.code)) return "Проверьте программу и выбранных детей. Возможно, данные семьи изменились.";
    if (error.status === 401) return "Время входа истекло. Откройте приложение заново через Telegram.";
  }
  return "Не удалось сохранить или загрузить данные. Проверьте соединение и попробуйте снова.";
}
function age(date: string) {
  const birth = new Date(date), now = new Date();
  if (!Number.isFinite(birth.getTime()) || birth > now) return "";
  let years = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate()) years--;
  const word = new Intl.PluralRules("ru").select(years);
  return `${years} ${word === "one" ? "год" : word === "few" ? "года" : "лет"}`;
}
export function MenorahKidsEntry({ onOpen }: { onOpen: () => void }) {
  return <button type="button" className="miniapp-kids-entry" data-kids-entry onClick={onOpen}>
    <span className="miniapp-icon"><Baby aria-hidden="true" size={27} /></span>
    <span><strong>Menorah Kids</strong><b>Детские программы</b><span>Занятия, творчество, традиции и развитие для детей общины</span><em>Открыть Menorah Kids →</em></span>
  </button>;
}
export default function MiniAppKids({ profile, onSaveChildren, onRefreshProfile, onDirty, onNested }: {
  profile: MiniAppProfileData;
  onSaveChildren: (children: ChildValue[], version: string) => Promise<MiniAppProfileData>;
  onRefreshProfile: (signal?: AbortSignal) => Promise<void>;
  onDirty: (value: boolean) => void;
  onNested: (handler: (() => void) | null) => void;
}) {
  const [data, setData] = useState<MiniAppKidsData | null>(null), [error, setError] = useState("");
  const [tab, setTab] = useState<"family" | "programs">("family"), [retry, setRetry] = useState(0);
  const [pending, setPending] = useState(false), [editing, setEditing] = useState(false), [notice, setNotice] = useState("");
  const [stage, setStage] = useState<"advanced" | "completed" | "">("");
  const [program, setProgram] = useState<string | null>(null), [selected, setSelected] = useState<string[]>([]), [success, setSuccess] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null), locked = useRef(false), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 4500); return () => clearTimeout(timer); }, [notice]);
  const edit = useCallback((value: boolean) => { setEditing(value); onDirty(value); }, [onDirty]);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError("");
    void (async () => {
      const result = await miniAppRequest<MiniAppKidsData>("kids", { signal: controller.signal });
      await onRefreshProfile(controller.signal);
      if (!controller.signal.aborted) setData(result.data);
    })().catch(failure => { if (!controller.signal.aborted) setError(message(failure)); });
    return () => controller.abort();
  }, [retry, onRefreshProfile]);
  useEffect(() => {
    if (!program) return;
    const modal = dialog.current;
    modal?.showModal();
    onNested(() => { if (!locked.current) setProgram(null); });
    return () => { modal?.close(); onNested(null); };
  }, [program, onNested]);
  const available = (title: string) => {
    const covered = new Set(data?.applications.filter(app => app.programTitle === title).flatMap(app => app.children.map(child => child.id)));
    return data?.children.filter(child => !covered.has(child.id)) ?? [];
  };
  async function submit() {
    if (!program || !selected.length || locked.current) return;
    locked.current = true; setPending(true); setError("");
    try {
      const result = await miniAppRequest<MiniAppKidsData & { created: boolean }>("kids/applications", { body: { programTitle: program, childIds: selected } });
      if (alive.current) { setData(result.data); setProgram(null); setSuccess(result.data.created); if (!result.data.created) setNotice("Эта заявка уже сохранена. Её статус показан ниже."); }
    } catch (failure) { if (alive.current) setError(message(failure)); }
    finally { locked.current = false; if (alive.current) setPending(false); }
  }
  async function clarify() {
    if (!stage || locked.current) return;
    locked.current = true; setPending(true); setError("");
    try {
      await miniAppRequest("giyur", { body: { stage } });
      if (alive.current) setRetry(value => value + 1);
    } catch (failure) { if (alive.current) setError(message(failure)); }
    finally { locked.current = false; if (alive.current) setPending(false); }
  }
  const stale = !!data && data.profileVersion !== profile.profileVersion;
  return <section className="miniapp-kids miniapp-enter" data-miniapp-kids>
    <header className="miniapp-kids-hero"><div><p className="miniapp-eyebrow">Детские программы Menorah Center</p><h1>Menorah Kids</h1><p>Тёплое пространство для учёбы, творчества, традиций и общения.</p></div><div className="miniapp-kids-photo"><Image src="/kids/kids1.webp" alt="Занятия в Menorah Kids" fill sizes="(max-width:600px) 100vw, 640px" /></div></header>
    {!data && !error && <div className="miniapp-panel miniapp-skeleton" role="status">Загружаем Menorah Kids…</div>}
    {error && <p className="miniapp-error" role="alert">{error}</p>}
    {(error || stale) && !editing && <button type="button" className="miniapp-secondary" disabled={pending} onClick={() => setRetry(value => value + 1)}>Обновить данные</button>}
    {stale && <p role="alert" className="miniapp-error">{miniAppDictionaries.ru.errors.profile_changed}</p>}
    {data && !data.permissions.canManageChildren ? <div className="miniapp-panel space-y-4" data-kids-gate>
      {data.permissions.male ? <h2>Запись детей оформляется через профиль мамы.</h2> : <>
        <h2>Чтобы открыть запись детей, уточните статус гиюра.</h2>
        <fieldset disabled={pending} className="space-y-3"><legend className="sr-only">Статус гиюра</legend>{([ ["advanced", "Нахожусь на продвинутом этапе"], ["completed", "Гиюр завершён"] ] as const).map(([value, label]) => <label key={value} className="flex gap-3 items-center min-h-11"><input type="radio" name="kids-giyur-stage" value={value} checked={stage === value} onChange={() => setStage(value)} />{label}</label>)}</fieldset>
        <button type="button" className="miniapp-primary" disabled={pending || !stage} onClick={() => void clarify()}>{pending ? "Сохраняем…" : "Продолжить"}</button>
        <p className="miniapp-helper">На продвинутом этапе самостоятельная запись детей пока недоступна. Личная запись на мероприятия сохраняется.</p>
      </>}
      <MiniAppContact label="Связаться с Menorah Center" />
    </div> : data ? <>
      <div role="tablist" aria-label="Menorah Kids" className="miniapp-kids-tabs">{([ ["family", "Моя семья"], ["programs", "Программы"] ] as const).map(([value, label]) => <button type="button" role="tab" key={value} id={`kids-tab-${value}`} aria-selected={tab === value} aria-controls={`kids-panel-${value}`} disabled={pending || editing} onClick={() => { setTab(value); setSuccess(false); }}>{label}</button>)}</div>
      {success && <div className="miniapp-success" role="status"><h2>✅ Заявка отправлена</h2><p>Администратор Menorah Center свяжется с вами после рассмотрения заявки.</p></div>}
      <div role="tabpanel" aria-labelledby={`kids-tab-${tab}`} id={`kids-panel-${tab}`}>
        {tab === "family" ? <div className="miniapp-panel" data-kids-family>
          {!data.children.length && <p className="miniapp-helper mb-4">Добавьте ребёнка, чтобы выбрать программу.</p>}
          <ChildEditor items={data.children} disabled={pending || stale} onEditingChange={edit} onSave={async children => {
            try {
              const result = await onSaveChildren(children, data.profileVersion);
              if (alive.current) { setData(previous => previous && ({ ...previous, children: result.profile.childrenData, profileVersion: result.profileVersion })); setNotice("Данные ребёнка сохранены"); }
            } catch (failure) { if (alive.current) setError(message(failure)); throw new Error(message(failure)); }
          }} />
          {!!data.children.length && <ul className="miniapp-helper mt-4">{data.children.map(child => <li key={child.id}>{child.name}{age(child.dateOfBirth) && ` · ${age(child.dateOfBirth)}`}</li>)}</ul>}
        </div> : <div className="miniapp-kids-programs">{data.programs.map(item => {
          const Icon = kidsProgramIcons[item.icon], applications = data.applications.filter(app => app.programTitle === item.title), children = available(item.title);
          const approved = applications.some(app => app.status === "approved"), rejected = applications.some(app => app.status === "rejected");
          return <article className="miniapp-panel miniapp-kids-program" key={item.title} data-kids-program={item.title}>
            <span className="miniapp-icon"><Icon size={25} aria-hidden="true" /></span><span className="miniapp-price">{item.age}</span><h2>{item.title}</h2><p className="miniapp-helper">{item.desc}</p>
            {!!applications.length && <p>{approved ? "Подтверждено ✓" : applications.some(app => app.status === "pending") ? "Заявка отправлена ✓" : "Не подтверждено"}</p>}
            {children.length || !data.children.length ? <button type="button" className="miniapp-primary" disabled={pending || stale} onClick={() => {
              if (!data.children.length) { setTab("family"); return; }
              setSelected(children.length === 1 ? [children[0].id] : []); setProgram(item.title); setError("");
            }}>{data.children.length ? "Записать ребёнка" : "Добавить ребёнка"}</button> : null}
            {rejected && <MiniAppContact />}
          </article>;
        })}</div>}
      </div>
    </> : null}
    {!!data?.applications.length && <section className="miniapp-panel space-y-4" data-kids-applications><h2>Мои заявки Menorah Kids</h2>{data.applications.map(app => <article key={app.id}><h3>{app.programTitle}</h3><p>{app.children.map(child => child.name).join(", ")}</p><p>{statusCopy[app.status] ?? "На рассмотрении"}</p>{app.status === "rejected" && <MiniAppContact />}</article>)}</section>}
    <dialog ref={dialog} className="miniapp-share-dialog miniapp-kids-dialog" aria-labelledby="kids-confirm-title" onCancel={event => { if (pending) event.preventDefault(); else setProgram(null); }}>
      <h2 id="kids-confirm-title">Кого записываем?</h2><p>Программа: <strong>{program}</strong></p>
      {program && available(program).map(child => <label className="flex gap-3 items-center min-h-11" key={child.id}><input type="checkbox" checked={selected.includes(child.id)} disabled={pending} onChange={event => setSelected(previous => event.target.checked ? [...previous, child.id] : previous.filter(id => id !== child.id))} />{child.name}</label>)}
      <p>Дети: {data?.children.filter(child => selected.includes(child.id)).map(child => child.name).join(", ") || "Выберите ребёнка"}</p>
      {error && <p className="miniapp-error" role="alert">{error}</p>}
      <div className="miniapp-share-dialog-actions"><button type="button" className="miniapp-primary" disabled={pending || !selected.length} onClick={() => void submit()}>{pending ? "Отправляем…" : "Отправить заявку"}</button><button type="button" className="miniapp-secondary" disabled={pending} onClick={() => setProgram(null)}>Отмена</button></div>
    </dialog>
    {notice && createPortal(<div role="status" className="miniapp-share-toast" lang="ru" dir="ltr">{notice}</div>, document.body)}
  </section>;
}
