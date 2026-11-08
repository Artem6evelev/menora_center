"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { INTAKE_CHOICES, type IntakeChoice, type evaluateEventEligibility } from "@/lib/events/eligibility";
import { eventAccessCopy } from "@/lib/events/copy";
import { communityContact } from "@/lib/telegram/contact";
type Assessment = ReturnType<typeof evaluateEventEligibility>;
export default function EventAccessFlow({ eventId, source, onProceed, onOpenEvents, startImmediately = false, onDismiss }: {
  eventId: string; source: "website" | "telegram";
  onProceed: (assessment: Assessment, intake: IntakeChoice | null) => void;
  onOpenEvents?: () => void; startImmediately?: boolean; onDismiss?: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "checking" | "question" | "contact" | "saved">(startImmediately ? "checking" : "idle");
  const [intake, setIntake] = useState<IntakeChoice | null>(null), [assessment, setAssessment] = useState<Assessment>();
  const [pending, setPending] = useState(false), [error, setError] = useState(""), [token, setToken] = useState<string | null>(null);
  const id = useId(), submission = useRef<string>(), alive = useRef(true), locked = useRef(false);
  const controller = useRef<AbortController>();
  useEffect(() => { alive.current = true; return () => { alive.current = false; controller.current?.abort(); }; }, []);
  const copy = eventAccessCopy.ru, root = source === "telegram" ? "/api/telegram/miniapp" : "/api/events";
  const checkOnOpen = useRef(check);
  checkOnOpen.current = check;
  useEffect(() => {
    if (!startImmediately) return;
    let cancelled = false;
    // Defer until after the StrictMode setup/cleanup probe so it starts one
    // request, rather than aborting the only request while its lock is held.
    queueMicrotask(() => { if (!cancelled) void checkOnOpen.current(); });
    return () => { cancelled = true; };
  }, [startImmediately]);
  async function request(path: string, body: unknown) {
    controller.current = new AbortController();
    const response = await fetch(root + path, { method: "POST", credentials: "same-origin", cache: "no-store", signal: controller.current.signal,
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error ?? "unavailable");
    return data;
  }
  function failed(failure: unknown) {
    if (!alive.current) return;
    const code = failure instanceof Error ? failure.message : "unavailable";
    setError(code === "contact_required" ? copy.contactRequired : code === "rate_limited" ? copy.limit : copy.error);
  }
  async function check() {
    if (locked.current) return; locked.current = true; setPending(true); setError("");
    try {
      const result = await request("/intake", { eventId, intake });
      if (!alive.current) return;
      const next: Assessment = result.assessment; setAssessment(next);
      if (next.needsStatusQuestion) setPhase("question");
      else if (next.decision === "eligible") onProceed(next, intake);
      else setPhase("contact");
    } catch (failure) { failed(failure); }
    finally { locked.current = false; if (alive.current) setPending(false); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (locked.current) return; locked.current = true; setPending(true); setError("");
    const fields = new FormData(event.currentTarget);
    submission.current ??= crypto.randomUUID();
    const attribution = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].flatMap(key => {
      const value = new URL(window.location.href).searchParams.get(key); return value ? [[key, value.slice(0, 100)]] : [];
    }));
    try {
      const result = await request("/interests", { eventId, intake, submissionId: submission.current, name: fields.get("name"), phone: fields.get("phone"),
        email: fields.get("email"), website: fields.get("website"), contactConsent: fields.get("contactConsent") === "on", invitationConsent: fields.get("invitationConsent") === "on", attribution });
      if (alive.current) { setToken(result.unsubscribeToken); setPhase("saved"); }
    } catch (failure) { failed(failure); }
    finally { locked.current = false; if (alive.current) setPending(false); }
  }
  return <section lang="ru" dir="ltr" className="space-y-4 text-start break-words" data-event-access={phase}>
    {phase === "checking" && (error ? <button type="button" className="miniapp-primary w-full rounded-xl p-3 bg-[#FFB800] font-bold" disabled={pending} onClick={() => void check()}>{pending ? copy.wait : "Повторить проверку"}</button> : <p role="status" aria-live="polite">{copy.wait}</p>)}
    {phase === "idle" && <button className="miniapp-primary w-full rounded-2xl bg-[#FFB800] text-black p-4 font-bold" disabled={pending} onClick={() => void check()}>{pending ? copy.wait : copy.join}</button>}
    {phase === "question" && <fieldset className="space-y-3" disabled={pending}>
      <legend className="font-bold mb-3">{copy.question}</legend>
      {INTAKE_CHOICES.map((choice, index) => <label className="flex items-start gap-3 p-3 border rounded-xl" key={choice}>
        <input type="radio" name={id + "intake"} value={choice} checked={intake === choice} onChange={() => setIntake(choice)} className="mt-1 shrink-0" /><span>{copy.choices[index]}</span>
      </label>)}
      <button className="miniapp-primary w-full rounded-xl p-3 bg-[#FFB800] font-bold" disabled={!intake || pending} onClick={() => void check()}>{pending ? copy.wait : copy.next}</button>
    </fieldset>}
    {phase === "contact" && <>
      <p className="whitespace-pre-line">{assessment?.decision === "not_eligible" ? copy.denied : copy.review}</p>
      <form onSubmit={submit} className="space-y-4" data-event-interest-form>
        <h2 className="font-bold">{copy.details}</h2>
        {(["name", "phone", "email"] as const).map(field => <label className="block" key={field} htmlFor={id + field}>{copy[field]}
          <input id={id + field} name={field} type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} dir={field === "name" ? undefined : "ltr"}
            autoComplete={field === "phone" ? "tel" : field} required={field === "name"} maxLength={field === "email" ? 254 : field === "phone" ? 25 : 100}
            className="block w-full min-w-0 p-3 border rounded-xl bg-white text-neutral-900" />
        </label>)}
        <div hidden aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" defaultValue="" /></div>
        <label className="flex items-start gap-3"><input type="checkbox" name="contactConsent" required className="mt-1" /><span>{copy.consent} <Link href="/privacy" className="underline" target="_blank" rel="noopener noreferrer">{copy.privacy}</Link></span></label>
        <label className="flex items-start gap-3"><input type="checkbox" name="invitationConsent" className="mt-1" /><span>{copy.invitations}</span></label>
        <button disabled={pending} className="miniapp-primary w-full rounded-xl p-3 bg-[#FFB800] font-bold">{pending ? copy.saving : copy.save}</button>
      </form>
    </>}
    {phase === "saved" && <><p role="status" className="miniapp-success">{copy.saved}</p>{token && <Link href={`/event-interest/unsubscribe#${token}`} className="underline">{copy.unsubscribe}</Link>}</>}
    {(phase === "question" || phase === "contact" || phase === "saved") && <div className="flex flex-col gap-3">
      <a href={communityContact.url} target="_blank" rel="noopener noreferrer" className="miniapp-secondary underline">{copy.contact}</a>
      {onOpenEvents ? <button className="miniapp-text-action" onClick={onOpenEvents}>{copy.open}</button> : <Link href="/events?open=1" className="underline">{copy.open}</Link>}
      <button type="button" className="miniapp-text-action underline" onClick={() => { if (onDismiss) onDismiss(); else { setPhase("idle"); setError(""); } }}>{copy.close}</button>
    </div>}
    {error && <p role="alert" className="miniapp-error text-red-700">{error}</p>}
  </section>;
}
