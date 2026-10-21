"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveGiyurStage } from "@/actions/community";
export default function GiyurStageForm({ revision, initialStage }: { revision: number; initialStage?: string | null }) {
  const router = useRouter();
  const [stage, setStage] = useState(initialStage || "");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setMessage("");
    try { const result = await saveGiyurStage({ stage, expectedRevision: revision });
      if (!result.success) setMessage(result.message);
      else { setMessage("Уточнение сохранено."); router.refresh(); }
    } catch { setMessage("Не удалось сохранить уточнение. Попробуйте ещё раз."); }
    finally { setPending(false); }
  }
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="rounded-xl bg-amber-400 text-black font-bold px-5 py-3">Добавить или записать ребёнка</button>;
  return <form onSubmit={submit} className="rounded-2xl border border-amber-200 dark:border-amber-900 p-5 space-y-4">
    <fieldset disabled={pending} className="space-y-3"><legend className="font-bold mb-3">Уточнение этапа гиюра</legend>
      <p className="text-sm">Для определения детских прав достаточно одного ответа. Полную анкету заполнять повторно не нужно.</p>
      {([['advanced', 'Нахожусь на продвинутом этапе'], ['completed', 'Гиюр завершён']] as const).map(([value, label]) => <label key={value} className="flex items-center gap-3"><input type="radio" required name="giyurStage" value={value} checked={stage === value} onChange={() => setStage(value)} />{label}</label>)}
      <button disabled={!stage || pending} className="rounded-xl bg-[#FFB800] text-black px-5 py-3 font-bold disabled:opacity-50">{pending ? "Сохраняем…" : "Сохранить уточнение"}</button>
    </fieldset>{message && <p role="status">{message}</p>}
  </form>;
}
