import "server-only";
import type { HDate as HebrewDate } from "@hebcal/core";
import {
  HOLIDAYS,
  type HolidayCalendar,
  type HolidayOccurrence,
} from "./holiday-catalog";
import { isZmanimDate, shiftDate } from "./shared";

const standard: Record<string, string> = {
  "Rosh Hashana": "rosh-hashanah",
  "Yom Kippur": "yom-kippur",
  Sukkot: "sukkot",
  "Shmini Atzeret": "simchat-torah",
  "Simchat Torah": "simchat-torah",
  Purim: "purim",
  "Purim Katan": "purim-katan",
  Pesach: "pesach",
  "Pesach Sheni": "pesach-sheni",
  Shavuot: "shavuot",
  "Tu BiShvat": "tu-bishvat",
  "Lag BaOmer": "lag-baomer",
  "Tu B'Av": "tu-bav",
  "Tzom Gedaliah": "fast-gedaliah",
  "Asara B'Tevet": "fast-tevet",
  "Ta'anit Esther": "fast-esther",
  "Tzom Tammuz": "fast-tammuz",
  "Tish'a B'Av": "tisha-bav",
};

/** Fixed Hebrew dates from Chabad's official list, plus its separate 28 Sivan entry. */
export const CHABAD_DATES: ReadonlyArray<{
  id: string;
  month: string;
  day: number;
  days?: number;
  bothAdars?: boolean;
}> = [
  { id: "chana-yahrzeit", month: "Tishrei", day: 6 },
  { id: "maharash-yahrzeit", month: "Tishrei", day: 13 },
  { id: "rashab-birthday", month: "Cheshvan", day: 20 },
  { id: "rosh-chodesh-kislev", month: "Kislev", day: 1 },
  { id: "mitteler-day", month: "Kislev", day: 9 },
  { id: "yud-kislev", month: "Kislev", day: 10 },
  { id: "rebbe-wedding", month: "Kislev", day: 14 },
  { id: "yud-tes-kislev", month: "Kislev", day: 19, days: 2 },
  { id: "hei-tevet", month: "Tevet", day: 5 },
  { id: "alter-rebbe-yahrzeit", month: "Tevet", day: 24 },
  { id: "yud-shevat", month: "Shvat", day: 10 },
  { id: "rebbetzin-yahrzeit", month: "Shvat", day: 22 },
  { id: "rebbetzin-birthday", month: "Adar I", day: 25, bothAdars: true },
  { id: "rashab-yahrzeit", month: "Nisan", day: 2 },
  { id: "rebbe-birthday", month: "Nisan", day: 11 },
  { id: "tzemach-yahrzeit", month: "Nisan", day: 13 },
  { id: "maharash-birthday", month: "Iyyar", day: 2 },
  { id: "baal-shem-tov-yahrzeit", month: "Sivan", day: 6 },
  { id: "sivan-28", month: "Sivan", day: 28 },
  { id: "gimmel-tammuz", month: "Tamuz", day: 3 },
  { id: "yud-bet-tammuz", month: "Tamuz", day: 12, days: 2 },
  { id: "levi-yitzchak-yahrzeit", month: "Av", day: 20 },
  { id: "chai-elul", month: "Elul", day: 18 },
  { id: "tzemach-birthday", month: "Elul", day: 29 },
];

function fromCivil(
  date: string,
  HDate: (typeof import("@hebcal/core"))["HDate"],
) {
  const [year, month, day] = date.split("-").map(Number);
  return new HDate(new Date(year, month - 1, day, 12));
}
function civil(date: HebrewDate) {
  const value = date.greg();
  // HDate.greg() is host-local midnight; toISOString() would change the day east of UTC.
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export async function holidayCalendarForDate(
  date: string,
): Promise<HolidayCalendar> {
  if (!isZmanimDate(date)) throw new Error("Invalid calendar date");
  const { HDate, HebrewCalendar, flags, months } = await import("@hebcal/core");
  const year = fromCivil(date, HDate).getFullYear(),
    through = shiftDate(date, 400);
  const groups = new Map<string, HolidayOccurrence>();
  const add = (
    id: string,
    start: HebrewDate,
    end = start,
    group = id + ":" + start.getFullYear(),
  ) => {
    if (!Object.hasOwn(HOLIDAYS, id))
      throw new Error("Unknown holiday definition");
    const startDate = civil(start),
      endDate = civil(end),
      previous = groups.get(group);
    if (previous) {
      if (startDate < previous.startDate) previous.startDate = startDate;
      if (endDate > previous.endDate) previous.endDate = endDate;
    } else
      groups.set(group, { id: group, definitionId: id, startDate, endDate });
  };
  for (const y of [year, year + 1, year + 2]) {
    // Israel is explicit; no diaspora eighth day of Pesach / second day of Shavuot.
    for (const event of HebrewCalendar.getHolidaysForYearArray(y, true)) {
      const mask = event.getFlags(),
        name = event.basename();
      if (
        mask &
        (flags.EREV |
          flags.MODERN_HOLIDAY |
          flags.SPECIAL_SHABBAT |
          flags.YOM_KIPPUR_KATAN |
          flags.BEHAB)
      )
        continue;
      if (mask & flags.ROSH_CHODESH) {
        add(
          "rosh-chodesh",
          event.getDate(),
          event.getDate(),
          `rosh-chodesh:${name}:${y}`,
        );
        continue;
      }
      const id = standard[name];
      if (id) {
        add(id, event.getDate());
        const nominal: Record<string, number> = {
          "fast-gedaliah": 3,
          "fast-esther": 13,
          "fast-tammuz": 17,
          "tisha-bav": 9,
        };
        if (nominal[id] && event.getDate().getDate() !== nominal[id])
          groups.get(id + ":" + y)!.observed = true;
      }
      if (event.getDesc().includes("Hoshana Raba"))
        add("hoshana-rabba", event.getDate());
      if (name === "Pesach" && event.getDate().getDate() === 21)
        add("pesach-seventh", event.getDate());
    }
    // Hebcal candle-count events are dated the evening before. Build the actual eight Hebrew days.
    const chanukah = new HDate(25, months.KISLEV, y);
    add("chanukah", chanukah, chanukah.add(7));
    for (const entry of CHABAD_DATES) {
      const ms =
        entry.bothAdars && HDate.isLeapYear(y)
          ? [months.ADAR_I, months.ADAR_II]
          : [entry.month];
      for (const month of ms) {
        const start = new HDate(entry.day, month, y);
        add(
          entry.id,
          start,
          start.add((entry.days ?? 1) - 1),
          `${entry.id}:${y}:${month}`,
        );
      }
    }
  }
  const events = [...groups.values()]
    .filter(
      (event) =>
        event.endDate >= shiftDate(date, -1) && event.startDate <= through,
    )
    .sort(
      (a, b) =>
        a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id),
    );
  return { version: 1, generatedFor: date, through, events };
}
