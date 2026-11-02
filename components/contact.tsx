"use client";
import { useState } from "react";
import { communityContact } from "@/lib/telegram/contact";
import { eventAccessCopy, type EventLanguage } from "@/lib/events/copy";
/** Community enquiries open a WhatsApp conversation; no pretend submission. */
export function ContactForm() {
  const [language, setLanguage] = useState<EventLanguage>("ru");
  const copy = eventAccessCopy[language];
  return <section className="space-y-5 rounded-3xl border p-6" dir={language === "he" ? "rtl" : "ltr"} lang={language}>
    <select aria-label="Language / שפה / Язык" value={language} onChange={e => setLanguage(e.target.value as EventLanguage)} className="p-2 border rounded-lg"><option value="ru">Русский</option><option value="he">עברית</option><option value="en">English</option></select>
    <a href={communityContact.url} target="_blank" rel="noopener noreferrer" className="block w-full text-center rounded-2xl bg-[#FFB800] px-4 py-4 font-bold text-black">{copy.contact}</a>
    <p><bdi dir="ltr">{communityContact.phone}</bdi></p>
  </section>;
}
