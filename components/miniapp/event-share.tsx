"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Share2 } from "lucide-react";
import { eventShareCopy, type EventShareTarget } from "@/lib/telegram/event-share";
import type { MiniAppLanguage } from "@/lib/telegram/miniapp-i18n";

export function EventShareButton({ event, language, overlay = false }: { event: EventShareTarget; language: MiniAppLanguage; overlay?: boolean }) {
  const c = eventShareCopy[language], url = event.shareUrl, titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null), input = useRef<HTMLInputElement>(null);
  const alive = useRef(true), locked = useRef(false), timer = useRef<ReturnType<typeof setTimeout>>();
  const [pending, setPending] = useState(false), [copied, setCopied] = useState(false);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; clearTimeout(timer.current); };
  }, []);
  async function share() {
    if (!url || locked.current) return;
    locked.current = true; setPending(true); setCopied(false); clearTimeout(timer.current);
    try {
      const data = { title: event.title, text: c.text(event.title), url };
      try {
        if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
          await navigator.share(data);
          return;
        }
      } catch { /* Cancellation/unsupported/rejected sharing falls back to copy. */ }
      if (!alive.current) return;
      try {
        if (!navigator.clipboard?.writeText) throw new Error("clipboard_unavailable");
        await navigator.clipboard.writeText(url);
        if (alive.current) { setCopied(true); timer.current = setTimeout(() => setCopied(false), 4000); }
      } catch {
        if (!alive.current) return;
        // No deprecated execCommand and no false success: give the user a
        // selectable public URL when clipboard permission/activation is absent.
        dialog.current?.showModal(); input.current?.focus(); input.current?.select();
      }
    } finally { locked.current = false; if (alive.current) setPending(false); }
  }
  if (!url) return null;
  return <div className={overlay ? "miniapp-share miniapp-share-overlay" : "miniapp-share"}>
    <button type="button" className="miniapp-share-button" aria-label={c.share} title={c.share} disabled={pending} onClick={() => void share()} data-event-share={event.id}>
      <Share2 size={19} aria-hidden="true" />{!overlay && <span>{c.share}</span>}
    </button>
    {copied && createPortal(<div className="miniapp-share-toast" role="status" lang={language} dir={language === "he" ? "rtl" : "ltr"}>{c.copied}</div>, document.body)}
    <dialog ref={dialog} className="miniapp-share-dialog" aria-labelledby={titleId}>
      <h2 id={titleId}>{c.manual}</h2><p>{c.hint}</p>
      <label><span className="sr-only">{c.manual}</span><input ref={input} type="text" dir="ltr" value={url} readOnly onFocus={e => e.currentTarget.select()} /></label>
      <div className="miniapp-share-dialog-actions"><button type="button" className="miniapp-secondary" onClick={() => { input.current?.focus(); input.current?.select(); }}>{c.select}</button><button type="button" className="miniapp-primary" onClick={() => dialog.current?.close()}>{c.close}</button></div>
    </dialog>
  </div>;
}
