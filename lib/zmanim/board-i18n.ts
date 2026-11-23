import { HOLIDAYS } from "./holiday-catalog";
import type { BoardLocale, Zman } from "./shared";

const ru = {
  home: "Menorah Center — на главную",
  brand: "Menorah Center",
  location: "Ришон ле-Цион, Израиль",
  title: "Зманим",
  afterSunset: "после захода солнца",
  israelTime: "Время в Израиле",
  localTime: "Местное время Израиля",
  next: "Ближайший зман",
  finished: "Все зманим дня завершены",
  updating: "Обновляем время дня",
  tomorrow: "завтра",
  morning: "Утро",
  morningSubtitle: "Начало нового дня",
  day: "День",
  daySubtitle: "От полудня до вечера",
  evening: "Вечер",
  eveningSubtitle: "Завершение дня",
  shabbat: "Шаббат и праздники",
  more: "Подробнее на Chabad.org",
  proportionalHour: "Галахический час",
  waiting: "Ожидаем данные Chabad.org",
  loading: "Загружаем зманим",
  retry:
    "Обновление происходит автоматически. Время за другую дату не показываем.",
  viewSource: "Посмотреть время на Chabad.org",
  customs: "По обычаям Хабад",
  source: "Источник",
  calendarCredit: "Календарь: Hebcal / Chabad",
  offline: "Нет связи · повторяем автоматически",
  updated: "Обновлено",
  fullscreen: "На весь экран",
  exitFullscreen: "Выйти из полного экрана",
  settings: "Настройки табло",
  closeSettings: "Закрыть настройки",
  fullscreenHelp: "Включите полноэкранный режим в меню браузера телевизора.",
  settingsTitle: "Табло для синагоги",
  settingsLocation:
    "Время и дата обновляются автоматически. Местонахождение: Ришон ле-Цион, Израиль. Расчёты Chabad.org, по обычаям Хабад.",
  minyan:
    "Галахические сроки не являются расписанием миньянов. Время молитв в центре можно уточнить в общине.",
  calendarBefore:
    "Праздники показаны по календарю Израиля. Хабадские даты сверены с",
  calendarLink: "календарём Chabad",
  calendarBetween: ". Перевод дат и перенесённые посты —",
  calendarAfter: ". Расчёт зманим по-прежнему выполняет Chabad.org.",
  tvHelp:
    "Не откладывайте исполнение заповедей до последней минуты. Настройки сна телевизора регулируются на самом устройстве.",
  rotationHelp:
    "Русский и иврит сменяются автоматически каждые 20 секунд. Пока открыты настройки, язык не меняется.",
  refresh: "Обновить данные",
  contact: "Связаться с общиной · WhatsApp",
  website: "Вернуться на сайт",
  communityCalendar: "Календарь общины",
  upcoming: "Ближайшие праздники",
  today: "Сегодня",
  chabadDate: "Хабадская дата",
  memorial: "Памятная дата Хабада",
  observedFast: "Перенесённый пост",
  fast: "День поста",
  newMonth: "Новомесячье",
  kippur: "День молитвы и поста",
  holiday: "Еврейский праздник",
  calendarPending: "Календарь обновляется автоматически",
} as const;
const he: Record<keyof typeof ru, string> = {
  home: "מרכז מנורה — לדף הבית",
  brand: "מרכז מנורה",
  location: "ראשון לציון, ישראל",
  title: "זמני היום",
  afterSunset: "לאחר השקיעה",
  israelTime: "השעה בישראל",
  localTime: "השעה המקומית בישראל",
  next: "הזמן הבא",
  finished: "כל זמני היום הסתיימו",
  updating: "מעדכנים את זמני היום",
  tomorrow: "מחר",
  morning: "בוקר",
  morningSubtitle: "תחילתו של יום חדש",
  day: "יום",
  daySubtitle: "מחצות היום ועד הערב",
  evening: "ערב",
  eveningSubtitle: "לקראת סיום היום",
  shabbat: "שבת ומועדים",
  more: "לפרטים באתר Chabad.org",
  proportionalHour: "שעה זמנית",
  waiting: "ממתינים לנתוני Chabad.org",
  loading: "טוענים את זמני היום",
  retry: "הנתונים מתעדכנים אוטומטית. זמנים מתאריך אחר אינם מוצגים.",
  viewSource: "לצפייה בזמנים באתר Chabad.org",
  customs: "לפי מנהג חב״ד",
  source: "מקור",
  calendarCredit: "לוח השנה: Hebcal / Chabad",
  offline: "אין חיבור · מנסים שוב אוטומטית",
  updated: "עודכן",
  fullscreen: "מסך מלא",
  exitFullscreen: "יציאה ממסך מלא",
  settings: "הגדרות הלוח",
  closeSettings: "סגירת ההגדרות",
  fullscreenHelp: "יש להפעיל מסך מלא דרך תפריט הדפדפן בטלוויזיה.",
  settingsTitle: "לוח לבית הכנסת",
  settingsLocation:
    "השעה והתאריך מתעדכנים אוטומטית. מיקום: ראשון לציון, ישראל. חישובי Chabad.org לפי מנהג חב״ד.",
  minyan:
    "הזמנים ההלכתיים אינם לוח זמני המניינים. לבירור זמני התפילות במרכז ניתן לפנות לקהילה.",
  calendarBefore:
    "המועדים מוצגים לפי לוח השנה בארץ ישראל. מועדי חב״ד נבדקו מול",
  calendarLink: "לוח השנה של חב״ד",
  calendarBetween: ". המרת התאריכים ומועדי הצומות הנדחים —",
  calendarAfter: ". חישוב הזמנים נשאר של Chabad.org.",
  tvHelp:
    "אין להמתין לרגע האחרון לקיום המצוות. את הגדרות השינה של הטלוויזיה יש לשנות במכשיר עצמו.",
  rotationHelp:
    "רוסית ועברית מתחלפות אוטומטית כל 20 שניות. כשההגדרות פתוחות, השפה אינה מתחלפת.",
  refresh: "רענון הנתונים",
  contact: "יצירת קשר עם הקהילה · WhatsApp",
  website: "חזרה לאתר",
  communityCalendar: "לוח הקהילה",
  upcoming: "המועדים הקרובים",
  today: "היום",
  chabadDate: "מועד חב״די",
  memorial: "יום הילולא בחב״ד",
  observedFast: "צום שהוקדם או נדחה",
  fast: "יום צום",
  newMonth: "ראש חודש",
  kippur: "יום תפילה וצום",
  holiday: "חג ומועד",
  calendarPending: "לוח השנה מתעדכן אוטומטית",
};
export const boardText = (locale: BoardLocale) => (locale === "he" ? he : ru);
export const HEBREW_HOLIDAYS: Record<string, string> = {
  "rosh-hashanah": "ראש השנה",
  "yom-kippur": "יום הכיפורים",
  sukkot: "סוכות",
  "hoshana-rabba": "הושענא רבה",
  "simchat-torah": "שמיני עצרת ושמחת תורה",
  chanukah: "חנוכה",
  purim: "פורים",
  "purim-katan": "פורים קטן",
  pesach: "פסח",
  "pesach-seventh": "שביעי של פסח",
  "pesach-sheni": "פסח שני",
  shavuot: "שבועות",
  "tu-bishvat": "ט״ו בשבט",
  "lag-baomer": "ל״ג בעומר",
  "tu-bav": "ט״ו באב",
  "rosh-chodesh": "ראש חודש",
  "fast-gedaliah": "צום גדליה",
  "fast-tevet": "עשרה בטבת",
  "fast-esther": "תענית אסתר",
  "fast-tammuz": "שבעה עשר בתמוז",
  "tisha-bav": "תשעה באב",
  "chana-yahrzeit": "יום ההילולא של הרבנית חנה",
  "maharash-yahrzeit": "יום ההילולא של אדמו״ר המהר״ש",
  "rashab-birthday": "יום הולדת אדמו״ר הרש״ב",
  "rosh-chodesh-kislev": "ראש חודש כסלו",
  "mitteler-day": "יום אדמו״ר האמצעי",
  "yud-kislev": "חג הגאולה של אדמו״ר האמצעי",
  "rebbe-wedding": "חתונת הרבי והרבנית",
  "yud-tes-kislev": "ראש השנה לחסידות",
  "hei-tevet": "ה׳ טבת · דידן נצח",
  "alter-rebbe-yahrzeit": "יום ההילולא של אדמו״ר הזקן",
  "yud-shevat": "י׳ שבט",
  "rebbetzin-yahrzeit": "יום ההילולא של הרבנית חיה מושקא",
  "rebbetzin-birthday": "יום הולדת הרבנית חיה מושקא",
  "rashab-yahrzeit": "יום ההילולא של אדמו״ר הרש״ב",
  "rebbe-birthday": "יום הולדת הרבי",
  "tzemach-yahrzeit": "יום ההילולא של הצמח צדק",
  "maharash-birthday": "יום הולדת אדמו״ר המהר״ש",
  "baal-shem-tov-yahrzeit": "יום ההילולא של הבעל שם טוב",
  "sivan-28": "כ״ח בסיוון · הגעת הרבי לארצות הברית",
  "gimmel-tammuz": "ג׳ תמוז · יום ההילולא של הרבי",
  "yud-bet-tammuz": "ימי הגאולה של הרבי הריי״צ",
  "levi-yitzchak-yahrzeit": "יום ההילולא של רבי לוי יצחק",
  "chai-elul": "ח״י אלול",
  "tzemach-birthday": "יום הולדת הצמח צדק",
};
export const holidayTitle = (id: string, locale: BoardLocale) =>
  locale === "he" ? HEBREW_HOLIDAYS[id] : HOLIDAYS[id].title;
const hebrewZmanLabels: Record<string, string> = {
  AlosHashachar: "עלות השחר",
  EarliestTefillin: "טלית ותפילין",
  NetzHachamah: "הנץ החמה",
  LatestShema: "סוף זמן קריאת שמע",
  LatestTefillah: "סוף זמן תפילה",
  Chatzos: "חצות היום",
  MinchahGedolah: "מנחה גדולה",
  MinchahKetanah: "מנחה קטנה",
  PlagHaminchah: "פלג המנחה",
  Shkiah: "שקיעה",
  Tzeis: "צאת הכוכבים",
  FastEnds: "סיום הצום",
  ChatzosNight: "חצות הלילה",
  PreviousMidnight: "חצות הלילה",
  CandleLighting: "הדלקת נרות",
  LastEatingChametzTime: "סוף זמן אכילת חמץ",
  BurnChametzTime: "סוף זמן ביעור חמץ",
};
const eveningLabels: Record<string, string> = {
  "Праздничные свечи после": "הדלקת נרות החג אחרי",
  "Исход Шаббата и праздника": "צאת השבת והחג",
  "Исход праздника": "צאת החג",
  "Исход Шаббата": "צאת השבת",
};
export function zmanLabel(time: Zman, locale: BoardLocale) {
  return locale === "ru"
    ? time.label
    : time.key === "ShabbatEndTime"
      ? eveningLabels[time.label]
      : hebrewZmanLabels[time.key];
}
export function zmanNote(time: Zman, locale: BoardLocale): string | null {
  if (!time.note || locale === "ru") return time.note;
  if (time.key === "MinchahGedolah") {
    const later = time.note.match(/\d{2}:\d{2}/)?.[0];
    return `ביום קצר יש הנוהגים להמתין 30 דקות מלאות לאחר חצות${later ? " — עד " + later : ""}.`;
  }
  return "יש להדליק לאחר הזמן הנקוב, מאש דולקת בלבד.";
}
export const durationLabel = (value: string, locale: BoardLocale) =>
  locale === "he" ? value.replace(/мин/g, "דק׳").replace(/с/g, "שנ׳") : value;
