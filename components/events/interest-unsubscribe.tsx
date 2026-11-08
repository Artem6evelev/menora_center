"use client";
import { useState } from "react";
import { eventAccessCopy } from "@/lib/events/copy";
export default function InterestUnsubscribe() {
  const [pending, setPending] = useState(false), [done, setDone] = useState(false), [error, setError] = useState(false);
  const copy = eventAccessCopy.ru;
  async function unsubscribe() {
    setPending(true); setError(false);
    try {
      const response = await fetch("/api/events/interests/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: location.hash.slice(1) }) });
      if (!response.ok) throw new Error(); setDone(true); history.replaceState(history.state, "", location.pathname);
    } catch { setError(true); } finally { setPending(false); }
  }
  return <section dir="ltr" lang="ru" className="p-6 rounded-3xl bg-white space-y-5 max-w-xl mx-auto break-words">
    <h1 className="text-xl font-bold">{copy.unsubscribe}</h1>
    {done ? <p role="status">{copy.unsubscribed}</p> : <button disabled={pending} onClick={() => void unsubscribe()} className="p-4 rounded-xl bg-[#FFB800] font-bold">{pending ? copy.saving : copy.unsubscribe}</button>}
    {error && <p role="alert">{copy.error}</p>}
  </section>;
}
