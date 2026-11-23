/* Read-only compiled/production smoke: actual browser → actual API → public Chabad source. */
require("tsx/cjs");
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const {
  chromium,
} = require("/tmp/menora-zmanim-browser-runtime/node_modules/playwright");
const {
  chabadApiUrl,
  parseChabadResponse,
} = require("../../lib/zmanim/chabad.ts");
const {
  holidayCalendarForDate,
} = require("../../lib/zmanim/holiday-calendar.ts");
const {
  boardHolidays,
  validHolidayCalendar,
} = require("../../lib/zmanim/holiday-display.ts");
const { israelDate, israelClock } = require("../../lib/zmanim/shared.ts");
const base = process.env.ZMANIM_BROWSER_BASE,
  out = process.env.ZMANIM_TEST_OUTPUT;
if (!base || !out) throw Error("Set public base URL and evidence directory");
let browser;
const checks = [],
  errors = [];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const date = israelDate();
  const r = await fetch(base + "/api/zmanim?date=" + date, {
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(r.status, 200);
  const { calendar, ...data } = await r.json();
  assert.equal(validHolidayCalendar(calendar), true);
  assert.deepEqual(calendar, await holidayCalendarForDate(date));
  const source = await fetch(chabadApiUrl(date), {
    headers: { Accept: "application/json", "User-Agent": "MenorahCenter/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(source.status, 200);
  assert.deepEqual(data, parseChabadResponse(await source.json(), date));
  checks.push(
    "actual API times equal fresh official Chabad source; calendar equals server calendar",
  );
  browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const [w, h] of [
    [1920, 1080],
    [3840, 2160],
    [390, 844],
  ]) {
    const c = await browser.newContext({
        viewport: { width: w, height: h },
        locale: "en-US",
        timezoneId: "America/New_York",
      }),
      p = await c.newPage();
    p.setDefaultNavigationTimeout(120000);
    p.on("pageerror", (e) => errors.push(e.message));
    const got = p.waitForResponse(
      (r) => r.url().includes("/api/zmanim?") && r.status() === 200,
    );
    await p.goto(base + "/zmanim");
    const live = await (await got).json();
    await p.locator('[data-zman="LatestShema"]').waitFor();
    await p.locator("[data-holiday-id]").first().waitFor();
    const state = boardHolidays(
      live.calendar,
      live.date,
      israelClock().minuteOfDay,
      live.times,
    );
    const current = state.current?.definitionId || "";
    await p.waitForFunction(
      (current) =>
        document.querySelector("[data-zmanim-board]")?.dataset.boardHoliday ===
        current,
      current,
    );
    assert.deepEqual(
      await p
        .locator("[data-holiday-id]")
        .evaluateAll((es) => es.map((e) => e.dataset.holidayId)),
      state.upcoming.map((e) => e.definitionId),
    );
    assert.equal(await p.locator("nav").count(), 0);
    const dimensions = await p.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
      cards: [...document.querySelectorAll("[data-holiday-id]")].map((el) => ({
        r: el.getBoundingClientRect().right,
        b: el.getBoundingClientRect().bottom,
        overflow: el.scrollHeight > el.clientHeight + 2,
      })),
    }));
    assert.ok(dimensions.w <= w + 1, JSON.stringify(dimensions));
    if (w >= 1100) {
      assert.ok(dimensions.h <= h + 1, JSON.stringify(dimensions));
      assert.ok(
        dimensions.cards.every((r) => r.r <= w + 1 && r.b < h && !r.overflow),
        JSON.stringify(dimensions),
      );
    }
    await p.screenshot({ path: out + "/" + w + ".png", fullPage: w < 1100 });
    checks.push(
      w +
        "x" +
        h +
        ": current theme, 3 matching upcoming dates, Russian standalone board, no overflow",
    );
    await c.close();
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    out + "/results.json",
    JSON.stringify({ base, date, checks, errors, readOnly: true }, null, 2) +
      "\n",
  );
  console.log(
    JSON.stringify({ checks: checks.length, status: "PASS", base, errors }),
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
  });
