export const ZMANIM_TIME_ZONE = "Asia/Jerusalem";
export const ZMANIM_LOCATION = "Ришон ле-Цион, Израиль";
export const ZMANIM_MIN_DATE = "1900-01-01";
export const ZMANIM_MAX_DATE = "2100-12-31";

export type Zman = {
  key: string;
  label: string;
  time: string;
  minutes: number;
  dayOffset: number;
  note: string | null;
};
export type ZmanimData = {
  date: string;
  locationId: "1-853";
  source: "Chabad.org";
  times: Zman[];
  previousNight: Zman | null;
  proportionalHour: string | null;
  shabbat: {
    friday: string;
    saturday: string;
    candles: Zman | null;
    ending: Zman | null;
  };
};

export function isZmanimDate(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < ZMANIM_MIN_DATE ||
    value > ZMANIM_MAX_DATE
  )
    return false;
  const date = new Date(value + "T12:00:00Z");
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function israelDate(now: number | Date = Date.now()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZMANIM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function shiftDate(date: string, days: number): string {
  const value = new Date(date + "T12:00:00Z");
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function shabbatDates(date: string) {
  const weekday = new Date(date + "T12:00:00Z").getUTCDay();
  const friday = shiftDate(date, weekday === 6 ? -1 : 5 - weekday);
  return { friday, saturday: shiftDate(friday, 1) };
}

export function chabadSourceUrl(date: string): string {
  const [year, month, day] = date.split("-");
  return `https://ru.chabad.org/calendar/zmanim_cdo/locationid/853/locationtype/1/tdate/${month}-${day}-${year}/jewish/Halachic-Times.htm`;
}

export function formatCalendarDate(date: string, hebrew = false): string {
  const formatter = new Intl.DateTimeFormat(
    hebrew ? "ru-RU-u-ca-hebrew" : "ru-RU",
    {
      timeZone: ZMANIM_TIME_ZONE,
      day: "numeric",
      month: "long",
      year: "numeric",
      ...(hebrew ? {} : { weekday: "long" as const }),
    },
  );
  const value = new Date(date + "T12:00:00Z");
  if (hebrew) {
    const parts = formatter.formatToParts(value);
    const get = (type: string) =>
      parts.find((part) => part.type === type)!.value;
    const month = get("month").toLocaleLowerCase("ru-RU");
    const months: Record<string, string> = {
      тишрей: "тишрея",
      хешван: "хешвана",
      кислев: "кислева",
      тевет: "тевета",
      шват: "швата",
      адар: "адара",
      "адар i": "адара I",
      "адар ii": "адара II",
      нисан: "нисана",
      ияр: "ияра",
      сиван: "сивана",
      тамуз: "тамуза",
      ав: "ава",
      элул: "элула",
    };
    return `${get("day")} ${months[month] ?? month} ${get("year")}`;
  }
  const text = formatter.format(value).replace(/\s*г\.$/, "");
  return text.charAt(0).toLocaleUpperCase("ru-RU") + text.slice(1);
}

export function israelClock(now: number): {
  hours: string;
  minutes: string;
  seconds: string;
  minuteOfDay: number;
} {
  const parts = new Intl.DateTimeFormat("ru-RU", {
    timeZone: ZMANIM_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  const hours = get("hour"),
    minutes = get("minute"),
    seconds = get("second");
  return {
    hours,
    minutes,
    seconds,
    minuteOfDay: Number(hours) * 60 + Number(minutes),
  };
}

export function nextZman(times: Zman[], minuteOfDay: number): Zman | null {
  return (
    times
      .filter((time) => time.minutes + time.dayOffset * 1440 > minuteOfDay)
      .sort(
        (a, b) =>
          a.minutes + a.dayOffset * 1440 - (b.minutes + b.dayOffset * 1440),
      )[0] ?? null
  );
}

/** The board's Hebrew date advances at the locally published sunset; civil-day times stay unchanged. */
export function boardHebrewDate(
  date: string,
  times: Zman[],
  minuteOfDay: number,
): string {
  const sunset = times.find((time) => time.key === "Shkiah");
  return sunset && minuteOfDay >= sunset.minutes ? shiftDate(date, 1) : date;
}
