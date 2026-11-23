import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import {
  holidayCalendarForDate,
  CHABAD_DATES,
} from "../../lib/zmanim/holiday-calendar";
import { HOLIDAYS } from "../../lib/zmanim/holiday-catalog";
import {
  boardHolidays,
  holidayPhase,
  holidayDateLabel,
  holidayHebrewLabel,
  validHolidayCalendar,
} from "../../lib/zmanim/holiday-display";
import { parseChabadResponse } from "../../lib/zmanim/chabad";
import type { HolidayCalendar } from "../../lib/zmanim/holiday-catalog";
const fixture = (name: string) =>
  JSON.parse(
    readFileSync(
      new URL(`./holiday-fixtures/${name}.json`, import.meta.url),
      "utf8",
    ),
  );
const source = (name: string, date?: string) => {
  const f = fixture(name);
  return parseChabadResponse(f.raw, date ?? f.date);
};
const get = (c: HolidayCalendar, id: string) => {
  const e = c.events.find((e) => e.definitionId === id);
  assert.ok(e, id);
  return e;
};
let winter: HolidayCalendar;
before(async () => {
  winter = await holidayCalendarForDate("2026-11-23");
});

test("next Chabad dates are 14 Kislev wedding and 19–20 Kislev liberation, not fixed civil dates", () => {
  assert.equal(get(winter, "rebbe-wedding").startDate, "2026-11-24");
  assert.deepEqual(
    [
      get(winter, "yud-tes-kislev").startDate,
      get(winter, "yud-tes-kislev").endDate,
    ],
    ["2026-11-29", "2026-11-30"],
  );
  assert.match(
    holidayDateLabel(get(winter, "rebbe-wedding")),
    /С вечера 23 ноября/,
  );
  assert.equal(
    holidayHebrewLabel(get(winter, "yud-tes-kislev")),
    "19–20 кислева",
  );
});
test("Chanukah uses the eight actual Hebrew days, not the prior candle-count evenings", () => {
  const e = get(winter, "chanukah");
  assert.deepEqual([e.startDate, e.endDate], ["2026-12-05", "2026-12-12"]);
  assert.match(holidayDateLabel(e), /С вечера 4 декабря/);
});
test("a short Kislev still produces eight Chanukah days across Tevet", async () => {
  const e = get(await holidayCalendarForDate("2023-12-01"), "chanukah");
  assert.deepEqual([e.startDate, e.endDate], ["2023-12-08", "2023-12-15"]);
  assert.match(holidayHebrewLabel(e), /25 кислева — 3 тевета/);
});
test("Israel Pesach has seven days, Shavuot one, Simchat Torah and Atzeret one combined day", async () => {
  const c = await holidayCalendarForDate("2026-03-01");
  for (const [id, a, b] of [
    ["pesach", "2026-04-02", "2026-04-08"],
    ["shavuot", "2026-05-22", "2026-05-22"],
    ["simchat-torah", "2026-10-03", "2026-10-03"],
  ]) {
    const e = get(c, id);
    assert.deepEqual([e.startDate, e.endDate], [a, b]);
  }
  assert.equal(
    c.events.filter(
      (e) =>
        e.definitionId === "simchat-torah" && e.startDate.startsWith("2026"),
    ).length,
    1,
  );
});
test("Sukkot includes its seventh day; Hoshana Rabba has its own presentation", async () => {
  const c = await holidayCalendarForDate("2026-09-01"),
    e = get(c, "sukkot");
  assert.deepEqual([e.startDate, e.endDate], ["2026-09-26", "2026-10-02"]);
  const d = source("hoshana-rabba");
  const b = boardHolidays(c, d.date, 12 * 60, d.times);
  assert.equal(b.current?.definitionId, "hoshana-rabba");
  assert.ok(!b.upcoming.some((e) => e.definitionId === "sukkot"));
});
test("seventh Pesach theme supersedes parent without deleting the seven-day range", async () => {
  const c = await holidayCalendarForDate("2026-04-01"),
    d = source("pesach-seventh");
  assert.equal(get(c, "pesach").endDate, "2026-04-08");
  const b = boardHolidays(c, d.date, 12 * 60, d.times);
  assert.equal(b.current?.definitionId, "pesach-seventh");
  assert.ok(!b.upcoming.some((e) => e.definitionId === "pesach"));
});
test("leap-year Purim is Adar II and Purim Katan is Adar I", () => {
  assert.equal(get(winter, "purim").startDate, "2027-03-23");
  assert.equal(get(winter, "purim-katan").startDate, "2027-02-21");
  assert.match(holidayHebrewLabel(get(winter, "purim")), /адара II/);
});
test("Chabad Rebbetzin birthday is in both Adars in leap year; once in ordinary year", async () => {
  const leap = winter.events.filter(
    (e) =>
      e.definitionId === "rebbetzin-birthday" && e.startDate.startsWith("2027"),
  );
  assert.equal(leap.length, 2);
  assert.match(holidayHebrewLabel(leap[0]), /25 адара I$/);
  assert.match(holidayHebrewLabel(leap[1]), /25 адара II$/);
  const normal = (await holidayCalendarForDate("2026-01-01")).events.filter(
    (e) =>
      e.definitionId === "rebbetzin-birthday" && e.startDate.startsWith("2026"),
  );
  assert.equal(normal.length, 1);
});
test("all 24 sourced Chabad dates recur in future Hebrew years", async () => {
  const c = await holidayCalendarForDate("2030-01-01");
  assert.equal(CHABAD_DATES.length, 24);
  for (const entry of CHABAD_DATES) {
    assert.ok(
      c.events.some((e) => e.definitionId === entry.id),
      entry.id,
    );
    assert.equal(HOLIDAYS[entry.id].kind, "chabad");
  }
  assert.notEqual(
    get(c, "rebbe-wedding").startDate.slice(5),
    get(winter, "rebbe-wedding").startDate.slice(5),
  );
});
test("calendar excludes diaspora, modern state holidays, Shushan Purim, BeHaB and special Shabbat entries", () => {
  assert.ok(
    winter.events.every((e) => Object.hasOwn(HOLIDAYS, e.definitionId)),
  );
  assert.ok(
    !winter.events.some((e) => /shushan|yom-ha|behab|haazinu/i.test(e.id)),
  );
  assert.equal(
    new Set(winter.events.map((e) => e.id)).size,
    winter.events.length,
  );
});
test("postponed Tisha BAv and Tammuz fast follow the actual observed dates", async () => {
  const c = await holidayCalendarForDate("2022-07-01");
  assert.deepEqual(
    [get(c, "tisha-bav").startDate, get(c, "tisha-bav").observed],
    ["2022-08-07", true],
  );
  assert.deepEqual(
    [get(c, "fast-tammuz").startDate, get(c, "fast-tammuz").observed],
    ["2022-07-17", true],
  );
});
test("Esther fast advanced before Shabbat is not confused with Purim", async () => {
  const c = await holidayCalendarForDate("2024-03-01");
  assert.deepEqual(
    [get(c, "fast-esther").startDate, get(c, "fast-esther").observed],
    ["2024-03-21", true],
  );
  assert.equal(get(c, "purim").startDate, "2024-03-24");
});
test("theme starts at real Chabad sunset, not civil midnight or device timezone", () => {
  const e = get(winter, "rebbe-wedding"),
    d = source("wedding");
  const sunset = d.times.find((t) => t.key === "Shkiah")!.minutes;
  assert.equal(holidayPhase(e, d.date, sunset - 1, d.times), "upcoming");
  assert.equal(holidayPhase(e, d.date, sunset, d.times), "active");
  assert.equal(
    boardHolidays(winter, d.date, sunset, d.times).current?.definitionId,
    "rebbe-wedding",
  );
});
test("last day remains active past sunset until Chabad nightfall, then moves to next date", () => {
  const e = get(winter, "rebbe-wedding"),
    d = source("wedding", "2026-11-24");
  assert.equal(
    holidayPhase(
      e,
      d.date,
      d.times.find((t) => t.key === "Shkiah")!.minutes,
      d.times,
    ),
    "active",
  );
  const end = d.times.find((t) => t.key === "Tzeis")!.minutes;
  assert.equal(holidayPhase(e, d.date, end - 1, d.times), "active");
  assert.equal(holidayPhase(e, d.date, end, d.times), "past");
});
test("minor fast starts at source dawn and ends at the explicit FastEnds time", async () => {
  const d = source("fast"),
    c = await holidayCalendarForDate(d.date),
    e = get(c, "fast-tevet"),
    dawn = d.times.find((t) => t.key === "AlosHashachar")!.minutes,
    end = d.times.find((t) => t.key === "FastEnds")!;
  assert.equal(end.time, "17:08");
  assert.equal(end.label, "Окончание поста");
  assert.equal(holidayPhase(e, d.date, dawn - 1, d.times), "upcoming");
  assert.equal(holidayPhase(e, d.date, dawn, d.times), "active");
  assert.equal(holidayPhase(e, d.date, end.minutes, d.times), "past");
  assert.match(holidayDateLabel(e), /с рассвета/);
});
test("major festival wins over simultaneous memorial, without losing either calendar record", async () => {
  const d = source("shavuot"),
    c = await holidayCalendarForDate(d.date),
    b = boardHolidays(c, d.date, 12 * 60, d.times);
  assert.equal(b.current?.definitionId, "shavuot");
  assert.ok(
    b.upcoming.some((e) => e.definitionId === "baal-shem-tov-yahrzeit"),
  );
});
test("fasts and yahrzeits never use festive tone", () => {
  for (const def of Object.values(HOLIDAYS)) {
    if (def.kind === "fast") assert.equal(def.tone, "reflective");
    if (def.title.includes("памяти")) assert.equal(def.tone, "memorial");
  }
  assert.equal(HOLIDAYS["yom-kippur"].tone, "reflective");
});
test("no invented active theme when Chabad times are missing; future calendar remains usable", () => {
  const b = boardHolidays(winter, "2026-11-23", 23 * 60, []);
  assert.equal(b.current, null);
  assert.equal(b.upcoming.length, 3);
});
test("exactly three chronological upcoming dates before evening, stable after sunset", () => {
  const d = source("wedding"),
    b = boardHolidays(winter, d.date, 8 * 60, d.times);
  assert.deepEqual(
    b.upcoming.map((e) => e.definitionId),
    ["rebbe-wedding", "yud-tes-kislev", "chanukah"],
  );
  assert.equal(b.current, null);
  assert.equal(
    boardHolidays(winter, d.date, 18 * 60, d.times).upcoming[0].definitionId,
    "rebbe-wedding",
  );
});
test("expired or backwards unrelated calendar is hidden until refreshed", () => {
  for (const date of ["2020-01-01", "2035-01-01"])
    assert.deepEqual(boardHolidays(winter, date, 600, []), {
      current: null,
      upcoming: [],
    });
});
test("calendar payload rejects malformed/unknown dates and oversized responses", () => {
  assert.equal(validHolidayCalendar(winter), true);
  for (const value of [
    null,
    {},
    { ...winter, version: 2 },
    { ...winter, events: [null] },
    { ...winter, events: [{ ...winter.events[0], definitionId: "fake" }] },
    { ...winter, events: [{ ...winter.events[0], startDate: "2026-02-30" }] },
    { ...winter, events: Array(181).fill(winter.events[0]) },
  ])
    assert.equal(validHolidayCalendar(value), false);
});
test("strict input date prevents parser normalization and unsupported payloads", async () => {
  for (const value of ["bad", "2026-02-30", "2026-11-23&x=1"])
    await assert.rejects(holidayCalendarForDate(value));
});
test("host timezone never shifts Hebrew holidays by a Gregorian day", () => {
  const script = `(async()=>{const{holidayCalendarForDate}=require('./lib/zmanim/holiday-calendar.ts');process.stdout.write(JSON.stringify((await holidayCalendarForDate('2026-11-23')).events))})()`;
  const outputs = [
    "UTC",
    "Asia/Jerusalem",
    "America/Los_Angeles",
    "Pacific/Kiritimati",
  ].map((TZ) =>
    execFileSync(
      process.execPath,
      ["--conditions=react-server", "--import", "tsx", "-e", script],
      { env: { ...process.env, TZ }, encoding: "utf8" },
    ),
  );
  for (const output of outputs) assert.equal(output, outputs[0]);
});
test("all recorded official snapshots remain parseable including festival and fast end keys", () => {
  for (const name of [
    "wedding",
    "liberation",
    "chanukah",
    "purim",
    "pesach",
    "shavuot",
    "sukkot",
    "simchat-torah",
    "yom-kippur",
    "fast",
    "memorial",
    "tree",
    "bonfire",
    "hoshana-rabba",
    "pesach-seventh",
  ])
    assert.ok(source(name).times.length >= 12, name);
});
