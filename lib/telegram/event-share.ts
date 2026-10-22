/** Public navigation only. This helper never consumes profile/registration data. */
export type EventShareTarget = { id: string; title: string; shareUrl: string | null };
export const eventShareCopy = {
  ru: { share: "Поделиться", text: (title: string) => `${title} — мероприятие Menorah Center в Ришон-ле-Ционе`,
    copied: "Ссылка на мероприятие скопирована", manual: "Скопируйте ссылку", hint: "Выделите ссылку и скопируйте её через меню устройства.", select: "Выделить ссылку", close: "Закрыть" },
  en: { share: "Share", text: (title: string) => `${title} — a Menorah Center event in Rishon LeZion`,
    copied: "Event link copied", manual: "Copy event link", hint: "Select the link and copy it using your device's menu.", select: "Select link", close: "Close" },
  he: { share: "שיתוף", text: (title: string) => `${title} — אירוע של Menorah Center בראשון לציון`,
    copied: "הקישור לאירוע הועתק", manual: "העתקת הקישור לאירוע", hint: "בחרו את הקישור והעתיקו אותו באמצעות תפריט המכשיר.", select: "בחירת הקישור", close: "סגירה" },
};
