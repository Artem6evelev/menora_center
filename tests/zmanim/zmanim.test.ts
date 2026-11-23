import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  chabadApiUrl,
  loadChabadZmanim,
  parseChabadResponse,
  parseChabadTime,
} from "../../lib/zmanim/chabad";
import {
  boardHebrewDate,
  chabadSourceUrl,
  formatCalendarDate,
  isZmanimDate,
  israelClock,
  israelDate,
  nextZman,
  shabbatDates,
} from "../../lib/zmanim/shared";
import { GET } from "../../app/api/zmanim/route";
const fixture = (name: string) =>
  JSON.parse(
    readFileSync(
      new URL("./fixtures/" + name + ".json", import.meta.url),
      "utf8",
    ),
  );
const winter = () => parseChabadResponse(fixture("winter"), "2026-11-23");
const at = (day: string, hour: string) => Date.parse(day + "T" + hour);
test("real Chabad winter source: city 853, exact published times, no own calculation", () => {
  const d = winter();
  assert.equal(d.locationId, "1-853");
  for (const [key, value] of Object.entries({
    AlosHashachar: "04:56",
    EarliestTefillin: "05:30",
    NetzHachamah: "06:16",
    LatestShema: "08:49",
    LatestTefillah: "09:42",
    Chatzos: "11:27",
    Shkiah: "16:38",
    Tzeis: "17:05",
  }))
    assert.equal(d.times.find((t) => t.key === key)?.time, value);
  assert.equal(d.shabbat.candles?.time, "16:07");
  assert.equal(d.shabbat.ending?.time, "17:16");
  assert.equal(d.proportionalHour, "52 мин 26 с");
  assert.match(d.times.find((t) => t.key === "MinchahGedolah")!.note!, /11:57/);
});
test("AM/PM conversion never treats 12 AM as noon or 12 PM as midnight", () => {
  assert.equal(parseChabadTime("12:00 AM").time, "00:00");
  assert.equal(parseChabadTime("12:00 PM").time, "12:00");
  assert.equal(parseChabadTime("1:09 PM").time, "13:09");
  for (const bad of [
    "13:00 AM",
    "0:12 AM",
    "12:60 PM",
    "15:22",
    "52:26 min.",
    "<b>4:00 PM</b>",
  ])
    assert.throws(() => parseChabadTime(bad));
});
test("summer source preserves Israel DST and the after-midnight day marker", () => {
  const d = parseChabadResponse(fixture("summer"), "2026-06-19");
  assert.equal(d.shabbat.candles?.time, "19:19");
  assert.equal(d.shabbat.ending?.time, "20:32");
  assert.equal(d.times.find((t) => t.key === "ChatzosNight")?.dayOffset, 1);
  assert.ok(d.previousNight);
  assert.equal(
    nextZman([...d.times, d.previousNight!], 1)?.key,
    "PreviousMidnight",
  );
});
test("holiday night candle lighting is NOT labelled end of Shabbat or holiday", () => {
  const d = parseChabadResponse(fixture("holiday"), "2026-09-12");
  assert.equal(d.shabbat.ending?.label, "Праздничные свечи после");
  assert.equal(d.shabbat.ending?.time, "19:27");
  assert.match(d.shabbat.ending?.note ?? "", /уже горящего огня/);
  const end = parseChabadResponse(fixture("holiday"), "2026-09-13");
  assert.equal(
    end.times.find((t) => t.key === "ShabbatEndTime")?.label,
    "Исход праздника",
  );
});
test("Pesach source retains eating/burning deadlines and candle lighting", () => {
  const d = parseChabadResponse(fixture("pesach"), "2026-04-01");
  for (const key of [
    "LastEatingChametzTime",
    "BurnChametzTime",
    "CandleLighting",
  ])
    assert.ok(d.times.some((t) => t.key === key));
});
test("spring transition uses source local times, never host timezone conversion", () => {
  const raw = fixture("dst-start"),
    d = parseChabadResponse(raw, "2026-03-27");
  assert.equal(
    raw.Days.find((d: any) => d.DisplayDate === "3/27/2026").IsDstActive,
    true,
  );
  const sunrise = raw.Days.find(
    (d: any) => d.DisplayDate === "3/27/2026",
  ).TimeGroups.find((g: any) => g.ZmanType === "NetzHachamah").Items[0].Zman;
  assert.equal(
    d.times.find((t) => t.key === "NetzHachamah")?.time,
    parseChabadTime(sunrise).time,
  );
});
test("fall transition is handled by Asia/Jerusalem, not a fixed +2/+3 offset", () => {
  const d = parseChabadResponse(fixture("dst-end"), "2026-10-25");
  assert.ok(d.times.length > 10);
  assert.equal(israelClock(at("2026-10-24", "22:30:00Z")).hours, "01");
  assert.equal(israelClock(at("2026-10-24", "23:30:00Z")).hours, "01");
  assert.equal(israelDate(at("2026-10-24", "23:30:00Z")), "2026-10-25");
});
test("Israel date rolls at local midnight, independently of a US device timezone", () => {
  assert.equal(israelDate(at("2026-11-23", "21:59:59Z")), "2026-11-23");
  assert.equal(israelDate(at("2026-11-23", "22:00:00Z")), "2026-11-24");
  assert.equal(israelDate(at("2026-06-19", "21:00:00Z")), "2026-06-20");
});
test("next zman moves at the minute boundary and uses real chronological order", () => {
  const d = winter();
  assert.equal(nextZman(d.times, 8 * 60 + 48)?.key, "LatestShema");
  assert.equal(nextZman(d.times, 8 * 60 + 49)?.key, "LatestTefillah");
  assert.equal(nextZman(d.times, 23 * 60 + 59), null);
});
test("Russian calendar text includes the correct Hebrew date", () => {
  assert.match(formatCalendarDate("2026-11-23", true), /13.*5787/);
  assert.match(formatCalendarDate("2026-11-23"), /23 ноября 2026/);
});
test("strict date validation rejects overflow, injection, arrays and unsupported range", () => {
  for (const bad of [
    "2026-02-30",
    "2026-13-01",
    "2026-2-01",
    "2026-11-23&locationid=1",
    "2026-11-23T00:00:00Z",
    "",
    null,
    [],
    "1800-01-01",
  ])
    assert.equal(isZmanimDate(bad), false);
  assert.equal(isZmanimDate("2028-02-29"), true);
});
test("fixed upstream URL pins city and type and covers previous night plus Friday/Saturday", () => {
  const u = new URL(chabadApiUrl("2026-11-23"));
  assert.equal(u.origin, "https://www.chabad.org");
  assert.equal(u.pathname, "/webservices/zmanim/zmanim/Get_Zmanim");
  assert.equal(u.searchParams.get("locationid"), "853");
  assert.equal(u.searchParams.get("locationtype"), "1");
  assert.equal(u.searchParams.get("startdate"), "11/22/2026");
  assert.equal(u.searchParams.get("enddate"), "11/28/2026");
  const sat = new URL(chabadApiUrl("2026-11-28"));
  assert.equal(sat.searchParams.get("startdate"), "11/27/2026");
  assert.throws(() => chabadApiUrl("bad"));
});
test("Saturday keeps Friday candle lighting; Sunday advances to the next Shabbat", () => {
  assert.deepEqual(shabbatDates("2026-11-28"), {
    friday: "2026-11-27",
    saturday: "2026-11-28",
  });
  assert.deepEqual(shabbatDates("2026-11-29"), {
    friday: "2026-12-04",
    saturday: "2026-12-05",
  });
  assert.match(
    chabadSourceUrl("2026-11-23"),
    /853\/locationtype\/1\/tdate\/11-23-2026/,
  );
});
test("wrong location, coordinates, missing day and incomplete data fail closed", () => {
  const wrong = fixture("winter");
  wrong.LocationId = "1-42";
  assert.throws(() => parseChabadResponse(wrong, "2026-11-23"));
  const geo = fixture("winter");
  geo.Coordinates.Latitude = 32.1;
  assert.throws(() => parseChabadResponse(geo, "2026-11-23"));
  const incomplete = fixture("winter");
  incomplete.Days[1].TimeGroups = [];
  assert.throws(() => parseChabadResponse(incomplete, "2026-11-23"));
  assert.throws(() => parseChabadResponse(fixture("winter"), "2026-11-30"));
});
test("ambiguous opinions and duplicate days are rejected rather than silently guessed", () => {
  const raw = fixture("winter");
  raw.Days[0].TimeGroups[0].Items.push({
    ...raw.Days[0].TimeGroups[0].Items[0],
  });
  assert.throws(() => parseChabadResponse(raw, "2026-11-23"));
  const dup = fixture("winter");
  dup.Days.push(dup.Days[0]);
  assert.throws(() => parseChabadResponse(dup, "2026-11-23"));
});
test("raw item calendar marker is not misinterpreted as the actual clock time", () => {
  const d = winter();
  assert.notEqual(d.times.find((t) => t.key === "NetzHachamah")?.time, "07:00");
  assert.equal(d.times.find((t) => t.key === "NetzHachamah")?.time, "06:16");
});
test("server fetch is read-only, bounded and validates the response before caching", async () => {
  const original = globalThis.fetch;
  let called = 0;
  try {
    globalThis.fetch = async (input, init) => {
      called++;
      assert.equal(
        new URL(String(input)).searchParams.get("locationid"),
        "853",
      );
      assert.equal(init?.cache, "no-store");
      assert.ok(init?.signal);
      assert.equal(init?.method, undefined);
      return Response.json(fixture("winter"));
    };
    assert.equal((await loadChabadZmanim("2026-11-23")).date, "2026-11-23");
    assert.equal(called, 1);
    globalThis.fetch = async () => new Response("unavailable", { status: 503 });
    await assert.rejects(loadChabadZmanim("2026-11-23"));
    globalThis.fetch = async () => new Response("<html>challenge</html>");
    await assert.rejects(loadChabadZmanim("2026-11-23"));
  } finally {
    globalThis.fetch = original;
  }
});
test("public GET rejects invalid dates before making any outbound request", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      throw new Error("Must not fetch");
    };
    for (const date of ["bad", "2026-02-30"]) {
      const r = await GET(
        new Request("https://local.invalid/api/zmanim?date=" + date),
      );
      assert.equal(r.status, 400);
      assert.match((await r.json()).error, /дату/);
    }
  } finally {
    globalThis.fetch = original;
  }
});
test("Hebrew date is Russian without the English AM era marker", () => {
  assert.equal(formatCalendarDate("2026-11-23", true), "13 кислева 5787");
  assert.doesNotMatch(formatCalendarDate("2026-11-23", true), /[A-Z]/);
});

test("Hebrew date changes at published local sunset; civil timetable keeps its original day", () => {
  const d = winter();
  assert.equal(boardHebrewDate(d.date, d.times, 16 * 60 + 37), "2026-11-23");
  assert.equal(boardHebrewDate(d.date, d.times, 16 * 60 + 38), "2026-11-24");
  assert.equal(d.date, "2026-11-23");
  assert.equal(boardHebrewDate(d.date, [], 21 * 60), d.date);
});

test("evening of Rosh Hashanah advances the Hebrew year using the calendar", () => {
  const date = "2026-09-11";
  const day = fixture("holiday").Days.find(
    (d: { DisplayDate: string }) => d.DisplayDate === "9/11/2026",
  );
  const sunset = day.TimeGroups.find(
    (g: { ZmanType: string }) => g.ZmanType === "Shkiah",
  ).Items[0];
  const times = [
    {
      key: "Shkiah",
      label: "Заход солнца",
      ...parseChabadTime(sunset.Zman),
      dayOffset: 0,
      note: null,
    },
  ];
  assert.match(formatCalendarDate(date, true), /5786/);
  assert.match(
    formatCalendarDate(boardHebrewDate(date, times, 20 * 60), true),
    /5787/,
  );
});
