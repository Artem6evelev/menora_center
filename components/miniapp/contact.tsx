"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { communityContact } from "@/lib/telegram/contact";

export function MiniAppContact({ card = false, className = "miniapp-text-action" }: { card?: boolean; className?: string }) {
  const [help, setHelp] = useState(false), [copied, setCopied] = useState(false);
  const number = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (help) number.current?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [help]);
  function open(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault(); setHelp(true);
    // An external app launch cannot be confirmed by the WebView. Keep a visible
    // number as a fallback even when Telegram accepts the request successfully.
    try {
      if (window.Telegram?.WebApp?.openLink) { window.Telegram.WebApp.openLink(communityContact.url); return; }
    } catch { /* Older clients may expose an unsupported method. */ }
    try { window.open(communityContact.url, "_blank", "noopener,noreferrer"); }
    catch { /* The selectable number remains available if navigation is blocked. */ }
  }
  async function copy() {
    setCopied(false);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard_unavailable");
      await navigator.clipboard.writeText(communityContact.phone); setCopied(true);
    } catch { number.current?.focus(); number.current?.select(); }
  }
  return <div data-miniapp-contact>
    <a href={communityContact.url} target="_blank" rel="noopener noreferrer" onClick={open} className={card ? "miniapp-action-card" : className}>
      {card && <span className="miniapp-icon"><MessageCircle size={21} aria-hidden="true" /></span>}
      <span>Связаться с нами · WhatsApp</span>
      {card && <ArrowRight className="miniapp-arrow" size={18} aria-hidden="true" />}
    </a>
    {help && <div className="miniapp-contact-help">
      <p>Если WhatsApp не открылся, напишите нам по номеру:</p>
      <input ref={number} aria-label="Номер для связи" type="text" dir="ltr" value={communityContact.phone} readOnly onFocus={event => event.currentTarget.select()} />
      <button type="button" className="miniapp-text-action" onClick={() => void copy()}>Скопировать номер</button>
      <p role="status">{copied ? "Номер скопирован" : "Можно выделить номер и скопировать через меню устройства."}</p>
    </div>}
  </div>;
}
