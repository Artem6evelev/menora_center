import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { HOLIDAYS } from "../../lib/zmanim/holiday-catalog";
import {
  HEBREW_HOLIDAYS,
  boardText,
  holidayTitle,
  zmanLabel,
  zmanNote,
  durationLabel,
} from "../../lib/zmanim/board-i18n";
import { formatCalendarDate, hebrewNumeral } from "../../lib/zmanim/shared";
import { parseChabadResponse } from "../../lib/zmanim/chabad";
import { holidayCalendarForDate } from "../../lib/zmanim/holiday-calendar";
import {
  holidayDateLabel,
  holidayHebrewLabel,
} from "../../lib/zmanim/holiday-display";
test("every holiday has an explicit Hebrew title; Russian titles stay unchanged", () => {
  assert.deepEqual(
    Object.keys(HEBREW_HOLIDAYS).sort(),
    Object.keys(HOLIDAYS).sort(),
  );
  for (const id of Object.keys(HOLIDAYS)) {
    assert.match(holidayTitle(id, "he"), /[א-ת]/);
    assert.doesNotMatch(holidayTitle(id, "he"), /[А-Яа-я]/);
    assert.equal(holidayTitle(id, "ru"), HOLIDAYS[id].title);
  }
});
test("all Hebrew board UI strings are translated without Russian leakage", () => {
  assert.deepEqual(
    Object.keys(boardText("he")).sort(),
    Object.keys(boardText("ru")).sort(),
  );
  for (const text of Object.values(boardText("he"))) {
    assert.match(text, /[א-ת]/);
    assert.doesNotMatch(text, /[А-Яа-я]/);
  }
});
test("Hebrew day/year numerals use proper 15/16 forms and punctuation", () => {
  for (const [n, expected] of [
    [1, "א׳"],
    [14, "י״ד"],
    [15, "ט״ו"],
    [16, "ט״ז"],
    [19, "י״ט"],
    [20, "כ׳"],
    [5787, "תשפ״ז"],
  ] as const)
    assert.equal(hebrewNumeral(n), expected);
  assert.equal(formatCalendarDate("2026-11-24", true, "he"), "י״ד בכסלו תשפ״ז");
  assert.equal(
    formatCalendarDate("2027-03-23", true, "he"),
    "י״ד באדר ב׳ תשפ״ז",
  );
  assert.match(formatCalendarDate("2026-11-23", false, "he"), /נובמבר/);
});
test("Hebrew holiday date ranges retain civil start and same Hebrew dates", async () => {
  const c = await holidayCalendarForDate("2026-11-23"),
    w = c.events.find((e) => e.definitionId === "rebbe-wedding")!,
    y = c.events.find((e) => e.definitionId === "yud-tes-kislev")!;
  assert.equal(holidayHebrewLabel(y, "he"), "י״ט–כ׳ בכסלו");
  assert.match(holidayDateLabel(w, "he"), /23 בנובמבר/);
  assert.match(holidayDateLabel(w, "he"), /מהערב/);
});
test("all real Chabad fixture labels and notes translate without changing the times or candle meaning", () => {
  const dir = new URL("./holiday-fixtures/", import.meta.url);
  for (const file of readdirSync(dir).filter(
    (f) => f.endsWith(".json") && f !== "SOURCE.json",
  )) {
    const f = JSON.parse(readFileSync(new URL(file, dir), "utf8")),
      d = parseChabadResponse(f.raw, f.date);
    for (const z of [
      ...d.times,
      ...[d.shabbat.candles, d.shabbat.ending].filter(Boolean),
    ]) {
      const label = zmanLabel(z!, "he");
      assert.equal(typeof label, "string", z!.key);
      assert.match(label, /[א-ת]/);
      assert.doesNotMatch(label, /[А-Яа-я]/);
      assert.equal(zmanLabel(z!, "ru"), z!.label);
      if (z!.note) assert.doesNotMatch(zmanNote(z!, "he")!, /[А-Яа-я]/);
    }
  }
  const raw = JSON.parse(
      readFileSync(new URL("./fixtures/holiday.json", import.meta.url), "utf8"),
    ),
    d = parseChabadResponse(raw, "2026-09-12");
  assert.equal(zmanLabel(d.shabbat.ending!, "he"), "הדלקת נרות החג אחרי");
  assert.match(zmanNote(d.shabbat.ending!, "he")!, /מאש דולקת בלבד/);
  assert.equal(durationLabel("52 мин 26 с", "he"), "52 דק׳ 26 שנ׳");
});
