export function greetingByTime(now = new Date()) {
  const h = now.getHours();
  if (h >= 5 && h < 12) return "Бокер тов";
  if (h >= 12 && h < 17) return "Шалом";
  if (h >= 17 && h < 22) return "Эрев тов";
  return "Шалом";
}

export function formatDateTime(iso: string, locale = "ru-RU") {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDate(iso: string, locale = "ru-RU") {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function currencyILS(value: number) {
  // отображаем красиво без копеек
  const rounded = Math.round(value);
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(rounded);
}
