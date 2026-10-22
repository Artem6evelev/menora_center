import "server-only";
import { escapeTelegramHtml, telegramAppUrl } from "./safety";
import type { MiniAppLanguage } from "./miniapp-i18n";

export const botWelcomeCopy = {
  ru: { greeting: "Шалом", identity: "Еврейский общинный центр в Ришон-ле-Ционе.", intro: "Рады, что вы с нами! Здесь можно смотреть мероприятия, записываться и управлять профилем.",
    event: "Вы перешли к нам, чтобы узнать подробнее о мероприятии. Нажмите кнопку ниже — откроется страница события с датой, местом, программой и записью.",
    note: "Здесь вы также будете получать анонсы ближайших мероприятий Menorah Center. Отключить их можно в любой момент командой /unsubscribe.",
    offNote: "Анонсы отключены. Включить их снова можно командой /subscribe.", open: "Открыть Menorah Center", openEvent: "🎟 Открыть мероприятие", events: "Мероприятия", home: "🏠 Menorah Center", contact: "Связаться с нами", subscribed: "Анонсы Menorah Center включены. Отключить: /unsubscribe.", unsubscribed: "Анонсы отключены. Включить снова: /subscribe." },
  en: { greeting: "Shalom", identity: "Jewish community center in Rishon LeZion.", intro: "We're happy you're here! Explore events, register and manage your profile.",
    event: "You came to learn more about an event. Tap below to see the date, location, program and registration on the event page.",
    note: "You'll also receive announcements about upcoming Menorah Center events here. You can turn them off at any time with /unsubscribe.",
    offNote: "Announcements are off. To enable them again, use /subscribe.", open: "Open Menorah Center", openEvent: "🎟 Open event", events: "Events", home: "🏠 Menorah Center", contact: "Contact us", subscribed: "Menorah Center announcements are on. To turn them off: /unsubscribe.", unsubscribed: "Announcements are off. To enable them again: /subscribe." },
  he: { greeting: "שלום", identity: "מרכז קהילתי יהודי בראשון לציון.", intro: "שמחים שאתם איתנו! כאן אפשר לגלות אירועים, להירשם ולנהל את הפרופיל שלכם.",
    event: "הגעתם כדי לשמוע עוד על אירוע. לחצו למטה לפתיחת עמוד האירוע עם התאריך, המקום, התוכנית וההרשמה.",
    note: "כאן תקבלו גם הודעות על האירועים הקרובים של Menorah Center. אפשר להפסיק אותן בכל עת באמצעות /unsubscribe.",
    offNote: "הודעות כבויות. להפעלה מחדש השתמשו בפקודה /subscribe.", open: "פתיחת Menorah Center", openEvent: "🎟 פתיחת האירוע", events: "אירועים", home: "🏠 Menorah Center", contact: "יצירת קשר", subscribed: "הודעות Menorah Center הופעלו. לביטול: /unsubscribe.", unsubscribed: "ההודעות בוטלו. להפעלה מחדש: /subscribe." },
} satisfies Record<MiniAppLanguage, Record<string, string>>;

export function botLanguage(value?: string): MiniAppLanguage {
  const language = value?.toLowerCase().split(/[-_]/)[0];
  return language === "he" || language === "en" ? language : "ru";
}
export function botWelcome({ firstName, language, campaign, event, status }: { firstName: string; language: MiniAppLanguage; campaign: string | null; event: { id: string; imageUrl: string | null } | null; status: string }) {
  const c = botWelcomeCopy[language], home = telegramAppUrl(), launch = new URL(home);
  if (campaign) launch.searchParams.set("campaign", campaign);
  if (event) launch.searchParams.set("event", event.id);
  const eventsUrl = new URL(home); eventsUrl.searchParams.set("view", "events");
  const brandedPhoto = new URL("/telegram/welcome.png", home).toString();
  let photo = brandedPhoto;
  if (event?.imageUrl) {
    try {
      const candidate = new URL(event.imageUrl, home);
      if (candidate.protocol === "https:" && !candidate.username && !candidate.password) photo = candidate.toString();
    } catch { /* Use the bundled branded banner. */ }
  }
  return { photo, brandedPhoto,
    caption: `👋 ${c.greeting}, ${escapeTelegramHtml(Array.from(firstName).slice(0, 80).join(""))}!\n<b>Menorah Center</b>\n${c.identity}\n\n${event ? c.event : c.intro}\n\n${status === "unsubscribed" ? c.offNote : c.note}`,
    keyboard: { inline_keyboard: [
      [{ text: event ? c.openEvent : c.open, web_app: { url: launch.toString() } }],
      [{ text: event ? c.home : c.events, web_app: { url: event ? home : eventsUrl.toString() } }],
      [{ text: c.contact, url: "https://t.me/menorah_center" }],
    ] } };
}
