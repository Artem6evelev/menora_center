/** Client-safe presentation only. Pending/opened never proves a payment outcome. */
export type PaymentIntentAttempt = {
  status: string; amountAgorot: number; createdAt: Date; openedAt: Date | null;
  lastOpenedAt: Date | null; openCount: number; lastOpenedSource: "telegram" | "website" | null;
  trackingKnown: boolean;
};
export type PaymentIntentState = "new" | "waiting" | "opened" | "paid" | "confirmed" | "other";
export function paymentIntentState(status: string, attempt: PaymentIntentAttempt | null): PaymentIntentState {
  if (status === "paid" || attempt?.status === "paid") return "paid";
  if (status === "confirmed") return "confirmed";
  if (status !== "pending") return "other";
  if (!attempt) return "new";
  return attempt.openedAt ? "opened" : "waiting";
}
export const paymentIntentLabels = {
  new: "Новая заявка", waiting: "🟠 Ожидает оплаты", opened: "🔥 Оплата открыта",
  paid: "✅ Оплачено", confirmed: "✅ Подтверждено", other: "Статус уточняется",
};
export const applicationFilters = [
  { id: "all", label: "Все" }, { id: "new", label: "Новые" },
  { id: "waiting", label: "Ожидают оплаты" }, { id: "opened", label: "🔥 Открыли оплату" },
  { id: "paid", label: "Оплачено" }, { id: "confirmed", label: "Подтверждено" },
] as const;
export type ApplicationFilter = typeof applicationFilters[number]["id"];
export function matchesPaymentFilter(filter: ApplicationFilter, status: string, attempt: PaymentIntentAttempt | null) {
  return filter === "all" || (filter === "new" ? status === "pending" && attempt?.status !== "paid" : paymentIntentState(status, attempt) === filter);
}
export function paymentIntentSecondary(attempt: PaymentIntentAttempt | null) {
  if (!attempt) return null;
  if (attempt.openedAt) return "Оплата пока не подтверждена";
  return attempt.trackingKnown ? "Ссылка на оплату ещё не открывалась" : "Нет данных об открытии оплаты";
}
const object = (value: unknown): Record<string, unknown> => {
  if (typeof value === "string") { try { return object(JSON.parse(value)); } catch { return {}; } }
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
};
const count = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
export function applicationComposition(raw: unknown) {
  const extra = object(raw), family = object(extra.family);
  const spouse = family.spouse === true, extraAdults = count(extra.extraAdults);
  const childIds = Array.isArray(extra.childIds) ? new Set(extra.childIds.filter(id => typeof id === "string")).size : null;
  const children = Array.isArray(extra.childrenSnapshot) ? extra.childrenSnapshot.length : childIds ?? Object.keys(family).filter(key => key.startsWith("child_") && family[key] === true).length;
  const kids = children + (count(extra.extraKids) || count(extra.kidsCount));
  const adults = 1 + Number(spouse) + extraAdults;
  const plural = (n: number, forms: [string, string, string]) => forms[n % 100 >= 11 && n % 100 <= 14 ? 2 : n % 10 === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 ? 1 : 2];
  return { adults, children: kids, spouse, extraAdults,
    summary: `${adults} ${plural(adults, ["взрослый", "взрослых", "взрослых"])}${kids ? ` + ${kids} ${plural(kids, ["ребёнок", "ребёнка", "детей"])}` : ""}` };
}
export function paymentReminderText(firstName: string | null, eventTitle: string) {
  return `Шалом, ${firstName || "участник"}!\n\nВаша регистрация на мероприятие\n«${eventTitle}» создана.\n\nЕсли оплата ещё не завершена, вы можете продолжить регистрацию по кнопке ниже.`;
}
export function paymentReminderWhatsApp(phone: string | null, text: string, continuationUrl: string) {
  let digits = (phone || "").replace(/\D/g, "");
  if (/^0\d{9}$/.test(digits)) digits = "972" + digits.slice(1);
  if (!/^[1-9]\d{6,14}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text + "\n\nПродолжить регистрацию: " + continuationUrl)}`;
}
