/* Calendar → API payload → actual TV browser. Public recorded Chabad responses only. */
require("tsx/cjs");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const {
  chromium,
} = require("/tmp/menora-zmanim-browser-runtime/node_modules/playwright");
const {
  holidayCalendarForDate,
} = require("../../lib/zmanim/holiday-calendar.ts");
const { parseChabadResponse } = require("../../lib/zmanim/chabad.ts");
const { HOLIDAYS } = require("../../lib/zmanim/holiday-catalog.ts");
const base = process.env.ZMANIM_BROWSER_BASE || "http://127.0.0.1:3391",
  out =
    process.env.ZMANIM_TEST_OUTPUT ||
    "/tmp/menorah-holidays-evidence/holiday-browser";
const checks = [],
  errors = [],
  measurements = [];
let browser;
const raw = (n) =>
  n === "rosh-hashanah"
    ? {
        date: "2026-09-12",
        raw: JSON.parse(
          fs.readFileSync(
            path.join(__dirname, "fixtures", "holiday.json"),
            "utf8",
          ),
        ),
      }
    : JSON.parse(
        fs.readFileSync(
          path.join(__dirname, "holiday-fixtures", n + ".json"),
          "utf8",
        ),
      );
async function payload(name, date) {
  const f = raw(name);
  return {
    ...parseChabadResponse(f.raw, date || f.date),
    calendar: await holidayCalendarForDate(date || f.date),
  };
}
async function test(name, fn) {
  await fn();
  checks.push({ name, status: "PASS" });
  console.log("PASS " + name);
}
async function open(name, width = 1920, height = 1080, time) {
  const f = raw(name),
    d = await payload(name),
    c = await browser.newContext({
      viewport: { width, height },
      locale: "he-IL",
      timezoneId: "America/New_York",
      reducedMotion: "reduce",
    }),
    p = await c.newPage();
  p.setDefaultTimeout(30000);
  p.setDefaultNavigationTimeout(120000);
  p.on("pageerror", (e) => errors.push(e.message));
  await c.route("**/*", (r) =>
    new URL(r.request().url()).origin === base ? r.continue() : r.abort(),
  );
  const frozen = Date.parse(time || f.date + "T10:00:00Z");
  await p.clock.install({ time: new Date(frozen - 1000) });
  await p.clock.pauseAt(new Date(frozen));
  await p.route("**/api/zmanim?**", (r) => r.fulfill({ json: d }));
  const response = p.waitForResponse((r) => r.url().includes("/api/zmanim?"));
  await p.goto(base + "/zmanim");
  await response;
  await p
    .locator(`[data-holiday-id="${d.calendar.events[0].definitionId}"]`)
    .count();
  await p.waitForFunction(
    () => document.querySelectorAll("[data-holiday-id]").length === 3,
  );
  return { p, c, d };
}
async function layout(p, width, height) {
  const data = await p.evaluate(() => {
    const board = document.querySelector("[data-zmanim-board]"),
      strip = document.querySelector("[data-upcoming-holidays]"),
      sr = strip.getBoundingClientRect();
    const shabbat = board.querySelector("[data-shabbat]");
    const sections = [...board.children]
      .filter((el) =>
        el.matches(
          'header, footer, [data-next-zman], [data-upcoming-holidays], [class*="columns__"]',
        ),
      )
      .map((el) => el.getBoundingClientRect());
    return {
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
      shabbatGap:
        shabbat.getBoundingClientRect().top -
        shabbat.previousElementSibling.getBoundingClientRect().bottom,
      sectionGaps: sections.slice(1).map((r, i) => r.top - sections[i].bottom),
      cards: [...strip.querySelectorAll("article")].map((el) => {
        const r = el.getBoundingClientRect();
        return {
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          overflow: el.scrollHeight > el.clientHeight + 2,
          title: el.querySelector("h3").textContent,
        };
      }),
      rows: [...board.querySelectorAll("[data-zman]")].map((el) => {
        const r = el.getBoundingClientRect();
        return { bottom: r.bottom, stripTop: sr.top };
      }),
      panels: [...board.querySelectorAll('[class*="column__"]')].map((el) => {
        const r = el.getBoundingClientRect();
        return {
          bottom: r.bottom,
          stripTop: sr.top,
          overflow: el.scrollHeight > el.clientHeight + 2,
        };
      }),
      font: parseFloat(
        getComputedStyle(
          board.querySelector(
            '[data-zman="LatestShema"] > div:last-child > span',
          ),
        ).fontSize,
      ),
    };
  });
  assert.ok(data.w <= width + 1, JSON.stringify(data));
  measurements.push({ width, height, ...data });
  assert.equal(data.cards.length, 3);
  assert.ok(
    data.shabbatGap >= (width >= 1100 ? Math.max(10, height * 0.012) : 16),
    JSON.stringify(data),
  );
  assert.ok(
    data.sectionGaps.every(
      (gap) => gap >= (width >= 1100 ? Math.max(10, height * 0.012) : 16),
    ),
    JSON.stringify(data),
  );
  if (width >= 1100) {
    assert.ok(data.h <= height + 1, JSON.stringify(data));
    assert.ok(
      data.cards.every(
        (r) =>
          r.left >= 0 &&
          r.right <= width &&
          r.bottom <= height - 20 &&
          !r.overflow,
      ),
      JSON.stringify(data),
    );
    assert.ok(
      data.rows.every((r) => r.bottom < r.stripTop - 2),
      JSON.stringify(data),
    );
    assert.ok(
      data.panels.every((r) => r.bottom <= r.stripTop - 8 && !r.overflow),
      JSON.stringify(data),
    );
    if (width >= 1920 && height >= 1080) assert.ok(data.font >= 40, data.font);
  }
}
async function switchToHebrew(p, width, height, name) {
  await p.clock.fastForward(20000);
  assert.equal(
    await p.locator("[data-zmanim-board]").getAttribute("data-language-phase"),
    "changing",
  );
  await p.clock.runFor(400);
  await p.locator('[data-zmanim-board][lang="he"][dir="rtl"]').waitFor();
  assert.doesNotMatch(
    await p.locator("[data-zmanim-board]").innerText(),
    /[А-Яа-я]/,
  );
  assert.equal(await p.getByRole("time").getAttribute("dir"), "ltr");
  const morning = await p.locator('[data-zmanim-column="0"]').boundingBox(),
    evening = await p.locator('[data-zmanim-column="2"]').boundingBox();
  if (width >= 1100)
    assert.ok(morning.x > evening.x, "Hebrew morning must be on the right");
  await layout(p, width, height);
  await p.screenshot({
    path: out + "/" + name + "-" + width + "x" + height + "-he.png",
    fullPage: width < 1100,
  });
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const [name, id] of [
    ["wedding", "rebbe-wedding"],
    ["rosh-hashanah", "rosh-hashanah"],
    ["liberation", "yud-tes-kislev"],
    ["chanukah", "chanukah"],
    ["purim", "purim"],
    ["pesach", "pesach"],
    ["shavuot", "shavuot"],
    ["sukkot", "sukkot"],
    ["simchat-torah", "simchat-torah"],
    ["yom-kippur", "yom-kippur"],
    ["fast", "fast-tevet"],
    ["memorial", "gimmel-tammuz"],
    ["tree", "tu-bishvat"],
    ["bonfire", "lag-baomer"],
    ["hoshana-rabba", "hoshana-rabba"],
    ["pesach-seventh", "pesach-seventh"],
  ])
    await test(
      name +
        " Full HD: current theme, own art, 3 cards, all zmanim readable and no clipping",
      async () => {
        const { p, c } = await open(
          name,
          1920,
          1080,
          name === "wedding" ? "2026-11-23T20:56:00Z" : undefined,
        );
        try {
          await p.waitForFunction(
            (id) =>
              document.querySelector("[data-zmanim-board]")?.dataset
                .boardHoliday === id,
            id,
          );
          assert.equal(
            await p
              .locator("[data-zmanim-board]")
              .getAttribute("data-board-tone"),
            HOLIDAYS[id].tone,
          );
          assert.equal(
            await p
              .locator(`[data-holiday-id="${id}"]`)
              .getAttribute("data-holiday-active"),
            "true",
          );
          assert.ok(
            await p
              .locator(
                `[data-holiday-id="${id}"] [data-holiday-art="${HOLIDAYS[id].art}"]`,
              )
              .count(),
          );
          await layout(p, 1920, 1080);
          assert.ok((await p.locator("[data-zman]").count()) >= 12);
          assert.equal(
            await p.locator("[data-zmanim-board]").getAttribute("lang"),
            "ru",
          );
          if (HOLIDAYS[id].tone !== "festive")
            assert.doesNotMatch(
              await p.locator("[data-upcoming-holidays]").innerText(),
              /С праздником|Поздравляем/i,
            );
          await p.clock.fastForward(8000);
          await p.screenshot({ path: out + "/" + name + "-1920.png" });
          await switchToHebrew(p, 1920, 1080, name);
        } finally {
          await c.close();
        }
      },
    );
  for (const [w, h, name] of [
    [3840, 2160, "chanukah"],
    [3840, 2160, "memorial"],
    [1280, 720, "pesach"],
    [1280, 720, "rosh-hashanah"],
    [1920, 980, "rosh-hashanah"],
    [1280, 720, "memorial"],
    [1366, 768, "wedding"],
    [1920, 980, "wedding"],
    [3840, 1980, "wedding"],
    [320, 844, "simchat-torah"],
    [390, 844, "wedding"],
  ])
    await test(
      name +
        " " +
        w +
        "x" +
        h +
        " calendar remains inside screen with long Russian titles",
      async () => {
        const { p, c } = await open(
          name,
          w,
          h,
          name === "wedding" ? "2026-11-23T20:56:00Z" : undefined,
        );
        try {
          await layout(p, w, h);
          await p.screenshot({
            path: out + "/" + name + "-" + w + "x" + h + ".png",
            fullPage: true,
          });
          await switchToHebrew(p, w, h, name);
        } finally {
          await c.close();
        }
      },
    );
  await test("sunset turns theme on and nightfall turns it off without reload; next day calendar survives midnight", async () => {
    const { p, c } = await open("wedding", 1920, 1080, "2026-11-23T14:37:59Z");
    try {
      await p.waitForFunction(
        () =>
          document.querySelector("[data-zmanim-board]")?.dataset
            .boardHoliday === "",
      );
      await p.clock.runFor(2000);
      await p.waitForFunction(
        () =>
          document.querySelector("[data-zmanim-board]")?.dataset
            .boardHoliday === "rebbe-wedding",
      );
      await p.route("**/api/zmanim?**", async (r) => {
        const date = new URL(r.request().url()).searchParams.get("date");
        return r.fulfill({ json: await payload("wedding", date) });
      });
      await p.clock.setSystemTime(new Date("2026-11-23T21:59:59Z"));
      await p.clock.runFor(2000);
      await p.waitForFunction(() =>
        document
          .querySelector('[data-zman="LatestShema"]')
          ?.textContent.includes("08:50"),
      );
      assert.equal(
        await p
          .locator("[data-zmanim-board]")
          .getAttribute("data-board-holiday"),
        "rebbe-wedding",
      );
      await p.clock.setSystemTime(new Date("2026-11-24T15:04:59Z"));
      await p.clock.runFor(2000);
      await p.waitForFunction(
        () =>
          document.querySelector("[data-zmanim-board]")?.dataset
            .boardHoliday === "",
      );
      assert.equal(
        await p.locator('[data-holiday-id="rebbe-wedding"]').count(),
        0,
      );
    } finally {
      await c.close();
    }
  });
  await test("503 keeps calendar but never asserts active holiday or shows yesterday times", async () => {
    const { p, c, d } = await open(
      "wedding",
      1920,
      1080,
      "2026-11-23T21:59:59Z",
    );
    try {
      const calendar = await holidayCalendarForDate("2026-11-24");
      await p.route("**/api/zmanim?**", (r) =>
        r.fulfill({
          status: 503,
          json: { error: "Synthetic outage", calendar },
        }),
      );
      await p.clock.runFor(2000);
      await p
        .getByRole("heading", { name: "Ожидаем данные Chabad.org" })
        .waitFor();
      assert.equal(await p.locator("[data-zman]").count(), 0);
      assert.equal(await p.locator("[data-holiday-id]").count(), 3);
      assert.equal(await p.locator('[data-holiday-active="true"]').count(), 0);
      assert.equal(
        await p
          .locator("[data-zmanim-board]")
          .getAttribute("data-board-holiday"),
        "",
      );
    } finally {
      await c.close();
    }
  });
  await test("20-second RU/HE cycle fades smoothly, keeps numeric times, and pauses in settings", async () => {
    const { p, c } = await open("wedding", 1920, 1080, "2026-11-23T20:56:00Z");
    try {
      await p.emulateMedia({ reducedMotion: "no-preference" });
      let reads = 0;
      p.on("request", (r) => {
        if (r.url().includes("/api/zmanim")) reads++;
      });
      const values = await p
        .locator("[data-zman] > div:last-child > span")
        .allTextContents();
      await p.clock.runFor(19500);
      assert.equal(
        await p.locator("[data-zmanim-board]").getAttribute("lang"),
        "ru",
      );
      await p.clock.runFor(500);
      assert.equal(
        await p
          .locator("[data-zmanim-board]")
          .getAttribute("data-language-phase"),
        "changing",
      );
      const style = await p
        .locator("[data-zmanim-board]")
        .evaluate((el) => ({
          property: getComputedStyle(el).transitionProperty,
          duration: getComputedStyle(el).transitionDuration,
        }));
      assert.equal(style.property, "opacity");
      assert.equal(style.duration, "0.32s");
      await new Promise((r) => setTimeout(r, 150));
      const opacity = await p
        .locator("[data-zmanim-board]")
        .evaluate((el) => Number(getComputedStyle(el).opacity));
      assert.ok(opacity > 0 && opacity < 1, opacity);
      await p.clock.runFor(400);
      await p.locator('[data-zmanim-board][lang="he"]').waitFor();
      await new Promise((r) => setTimeout(r, 400));
      assert.deepEqual(
        await p
          .locator("[data-zman] > div:last-child > span")
          .allTextContents(),
        values,
      );
      await p.clock.runFor(20000);
      await p.locator('[data-zmanim-board][lang="ru"]').waitFor();
      assert.equal(
        reads,
        0,
        "Language rotation must not reload the page or refetch zmanim",
      );
      await switchToHebrew(p, 1920, 1080, "cycle");
      await p.getByRole("button", { name: "הגדרות הלוח", exact: true }).click();
      await p.getByRole("dialog", { name: "הגדרות הלוח" }).waitFor();
      await p.clock.fastForward(45000);
      assert.equal(
        await p.locator("[data-zmanim-board]").getAttribute("lang"),
        "he",
      );
      assert.doesNotMatch(await p.getByRole("dialog").innerText(), /[А-Яа-я]/);
      await p.keyboard.press("Escape");
      await p.clock.fastForward(20000);
      await p.clock.runFor(400);
      await p.locator('[data-zmanim-board][lang="ru"]').waitFor();
      await p.emulateMedia({ reducedMotion: "reduce" });
      assert.equal(
        await p
          .locator("[data-zmanim-board]")
          .evaluate((el) => getComputedStyle(el).transitionDuration),
        "0s",
      );
    } finally {
      await c.close();
    }
  });
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    out + "/results.json",
    JSON.stringify(
      {
        environment:
          "Chrome; current code copy; synthetic frozen clocks; actual recorded Chabad 1-853 source; no real DB/env; Hebrew device language and US timezone",
        checks,
        measurements,
        errors,
      },
      null,
      2,
    ),
  );
  console.log("TOTAL " + checks.length + " PASS");
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
  });
