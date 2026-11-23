import "server-only";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import {
  isZmanimDate,
  shabbatDates,
  shiftDate,
  type Zman,
  type ZmanimData,
} from "./shared";

const itemSchema = z.object({
  ZmanType: z.string(),
  Title: z.string(),
  Zman: z.string(),
  Date: z.string(),
  Default: z.boolean(),
  FootnoteType: z.string().optional(),
  InfoMessage: z.string().nullable().optional(),
});
const responseSchema = z.object({
  LocationId: z.literal("1-853"),
  Coordinates: z.object({
    Latitude: z.number().min(31.95).max(31.98),
    Longitude: z.number().min(34.79).max(34.82),
  }),
  Days: z
    .array(
      z.object({
        DisplayDate: z.string(),
        TimeGroups: z.array(
          z.object({ ZmanType: z.string(), Items: z.array(itemSchema).min(1) }),
        ),
      }),
    )
    .min(1)
    .max(9),
});

const labels: Record<string, string> = {
  AlosHashachar: "Рассвет",
  EarliestTefillin: "Талит и тфилин",
  NetzHachamah: "Восход солнца",
  LatestShema: "Шма — до",
  LatestTefillah: "Шахарит — до",
  Chatzos: "Полдень",
  MinchahGedolah: "Минха гдола",
  MinchahKetanah: "Минха ктана",
  PlagHaminchah: "Плаг а-Минха",
  Shkiah: "Заход солнца",
  Tzeis: "Выход звёзд",
  ChatzosNight: "Галахическая полночь",
  CandleLighting: "Зажигание свечей",
  LastEatingChametzTime: "Хамец: есть до",
  BurnChametzTime: "Хамец: уничтожить до",
};
const required = [
  "AlosHashachar",
  "EarliestTefillin",
  "NetzHachamah",
  "LatestShema",
  "LatestTefillah",
  "Chatzos",
  "MinchahGedolah",
  "MinchahKetanah",
  "PlagHaminchah",
  "Shkiah",
  "ChatzosNight",
];

export function parseChabadTime(value: string): {
  time: string;
  minutes: number;
} {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim());
  if (
    !match ||
    Number(match[1]) < 1 ||
    Number(match[1]) > 12 ||
    Number(match[2]) > 59
  )
    throw new Error("Invalid Chabad clock time");
  const hour =
    (Number(match[1]) % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return {
    time: `${String(hour).padStart(2, "0")}:${match[2]}`,
    minutes: hour * 60 + Number(match[2]),
  };
}

function sourceDate(value: string): string {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  const date = match
    ? `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`
    : "";
  const marker = new Date(date + "T12:00:00Z");
  if (
    !Number.isFinite(marker.getTime()) ||
    marker.toISOString().slice(0, 10) !== date
  )
    throw new Error("Invalid Chabad calendar date");
  return date;
}

function specialLabel(item: z.infer<typeof itemSchema>): string | null {
  if (item.ZmanType !== "ShabbatEndTime") return labels[item.ZmanType] ?? null;
  // On the second festival night this same API key means candle lighting, NOT havdalah.
  if (
    item.FootnoteType === "LightCandlesAfter" ||
    item.Title === "Candle Lighting after"
  )
    return "Праздничные свечи после";
  if (/shabbat/i.test(item.Title) && /holiday/i.test(item.Title))
    return "Исход Шаббата и праздника";
  if (/holiday/i.test(item.Title)) return "Исход праздника";
  if (/shabbat/i.test(item.Title)) return "Исход Шаббата";
  throw new Error("Unrecognized Chabad evening time");
}

export function parseChabadResponse(raw: unknown, date: string): ZmanimData {
  if (!isZmanimDate(date)) throw new Error("Invalid requested date");
  const response = responseSchema.parse(raw);
  const days = new Map<
    string,
    { times: Zman[]; proportionalHour: string | null }
  >();
  for (const day of response.Days) {
    const dayDate = sourceDate(day.DisplayDate);
    if (days.has(dayDate)) throw new Error("Duplicate Chabad date");
    const times: Zman[] = [];
    let proportionalHour: string | null = null;
    for (const group of day.TimeGroups) {
      const defaults = group.Items.filter((item) => item.Default);
      if (defaults.length > 1 || (!defaults.length && group.Items.length > 1))
        throw new Error("Ambiguous Chabad opinion");
      const item = defaults[0] ?? group.Items[0];
      if (item.ZmanType === "ShaahZmanit") {
        const duration = /^(\d+):(\d{2}) min\.$/.exec(item.Zman);
        if (duration && Number(duration[2]) < 60)
          proportionalHour = `${Number(duration[1])} мин ${Number(duration[2])} с`;
        continue;
      }
      const label = specialLabel(item);
      if (!label) continue;
      const clock = parseChabadTime(item.Zman);
      // Item.Date is a calendar-day marker (often 05:00 UTC), not the zman's timestamp.
      const marker = /^\/Date\((-?\d+)\)\/$/.exec(item.Date);
      if (!marker) throw new Error("Missing Chabad day marker");
      const markerDate = new Date(Number(marker[1])).toISOString().slice(0, 10);
      const dayOffset = Math.round(
        (Date.parse(markerDate) - Date.parse(dayDate)) / 86400000,
      );
      if (dayOffset !== 0 && dayOffset !== 1)
        throw new Error("Unexpected Chabad day offset");
      let note: string | null = null;
      if (item.FootnoteType === "LaterMincha") {
        const later = item.InfoMessage?.match(
          /would be (\d{1,2}:\d{2}\s*[AP]M)/i,
        )?.[1];
        note = `В короткий день некоторые ждут полных 30 минут после полудня${later ? ` — до ${parseChabadTime(later).time}` : ""}.`;
      }
      if (item.FootnoteType === "LightCandlesAfter")
        note = "Зажигать после указанного времени от уже горящего огня.";
      if (times.some((time) => time.key === item.ZmanType))
        throw new Error("Duplicate Chabad time");
      times.push({ key: item.ZmanType, label, ...clock, dayOffset, note });
    }
    if (required.some((key) => !times.some((time) => time.key === key)))
      throw new Error("Incomplete Chabad day");
    days.set(dayDate, { times, proportionalHour });
  }
  const selected = days.get(date),
    previous = days.get(shiftDate(date, -1)),
    shabbat = shabbatDates(date),
    friday = days.get(shabbat.friday),
    saturday = days.get(shabbat.saturday);
  if (!selected || !previous || !friday || !saturday)
    throw new Error("Chabad returned different dates");
  const midnight = previous?.times.find(
    (time) => time.key === "ChatzosNight" && time.dayOffset === 1,
  );
  return {
    date,
    source: "Chabad.org",
    locationId: "1-853",
    ...selected,
    previousNight: midnight
      ? { ...midnight, key: "PreviousMidnight", dayOffset: 0 }
      : null,
    shabbat: {
      ...shabbat,
      candles:
        friday.times.find((time) => time.key === "CandleLighting") ?? null,
      ending:
        saturday.times.find((time) => time.key === "ShabbatEndTime") ?? null,
    },
  };
}

export function chabadApiUrl(date: string): string {
  if (!isZmanimDate(date)) throw new Error("Invalid requested date");
  const { friday, saturday } = shabbatDates(date);
  const previous = shiftDate(date, -1);
  const start = friday < previous ? friday : previous;
  const format = (day: string) => {
    const [year, month, d] = day.split("-");
    return `${Number(month)}/${Number(d)}/${year}`;
  };
  return (
    "https://www.chabad.org/webservices/zmanim/zmanim/Get_Zmanim?" +
    new URLSearchParams({
      locationid: "853",
      locationtype: "1",
      aid: "143790",
      tdate: date.split("-").slice(1).concat(date.slice(0, 4)).join("-"),
      startdate: format(start),
      enddate: format(saturday),
    })
  );
}

export async function loadChabadZmanim(date: string): Promise<ZmanimData> {
  const response = await fetch(chabadApiUrl(date), {
    headers: { Accept: "application/json", "User-Agent": "MenorahCenter/1.0" },
    signal: AbortSignal.timeout(12000),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Chabad upstream status ${response.status}`);
  const body = await response.text();
  if (body.length > 1000000) throw new Error("Chabad response too large");
  return parseChabadResponse(JSON.parse(body), date);
}

// Cache only a successfully validated snapshot, keyed by date. Provider errors stay retryable.
export const getChabadZmanim = unstable_cache(
  loadChabadZmanim,
  ["rishon-chabad-zmanim-v1"],
  { revalidate: 3600 },
);
