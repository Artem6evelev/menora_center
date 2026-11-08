"use client";
import { communityContact } from "@/lib/telegram/contact";
import { eventAccessCopy } from "@/lib/events/copy";
/** Community enquiries open a WhatsApp conversation; no pretend submission. */
export function ContactForm() {
  const copy = eventAccessCopy.ru;
  return <section className="space-y-5 rounded-3xl border p-6" dir="ltr" lang="ru">
    <a href={communityContact.url} target="_blank" rel="noopener noreferrer" className="block w-full text-center rounded-2xl bg-[#FFB800] px-4 py-4 font-bold text-black">{copy.contact}</a>
    <p><bdi dir="ltr">{communityContact.phone}</bdi></p>
  </section>;
}
