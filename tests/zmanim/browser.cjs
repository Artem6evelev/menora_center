/* Public TV board → real local API → Chabad.org. No identity, database or message writes. */
require("tsx/cjs");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const {
  chromium,
} = require("/tmp/menora-zmanim-browser-runtime/node_modules/playwright");
const { parseChabadResponse } = require("../../lib/zmanim/chabad.ts");
const base = process.env.ZMANIM_BROWSER_BASE || "http://127.0.0.1:3390",
  out =
    process.env.ZMANIM_TEST_OUTPUT || "/tmp/menorah-zmanim-evidence/browser";
const raw = (n) =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, "fixtures", n + ".json"), "utf8"),
  );
const payload = (name, date) => parseChabadResponse(raw(name), date),
  checks = [],
  errors = [];
let browser;
async function test(name, fn) {
  await fn();
  checks.push({ name, status: "PASS" });
  console.log("PASS " + name);
}
async function setup(width, height, time = "2026-11-23T06:00:00Z") {
  const c = await browser.newContext({
    viewport: { width, height },
    locale: "en-US",
    timezoneId: "America/New_York",
    reducedMotion: "reduce",
  });
  const p = await c.newPage();
  p.setDefaultTimeout(45000);
  p.setDefaultNavigationTimeout(120000);
  p.on("pageerror", (e) => errors.push(e.message));
  const thirdParty = [];
  await c.route("**/*", (r) => {
    const u = new URL(r.request().url());
    if (u.origin === base) return r.continue();
    thirdParty.push(u.hostname);
    return r.abort();
  });
  await p.clock.install({ time: new Date(time) });
  return { c, p, thirdParty };
}
async function ready(p) {
  const loaded = p.waitForResponse(
    (r) => r.url().includes("/api/zmanim?") && r.status() === 200,
  );
  await p.goto(base + "/zmanim");
  await loaded;
  await p
    .locator('[data-zman="LatestShema"]')
    .getByText("08:49", { exact: true })
    .waitFor();
}
async function fit(p, width, height) {
  const sizes = await p.evaluate(() => ({
    w: document.documentElement.scrollWidth,
    h: document.documentElement.scrollHeight,
    rows: [...document.querySelectorAll("[data-zman]")].map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left, right: r.right, bottom: r.bottom };
    }),
  }));
  assert.ok(sizes.w <= width + 1, JSON.stringify(sizes));
  if (width >= 1100) {
    assert.ok(sizes.h <= height + 1, JSON.stringify(sizes));
    assert.ok(
      sizes.rows.every(
        (r) => r.x >= 0 && r.right <= width + 1 && r.bottom <= height - 30,
      ),
      JSON.stringify(sizes),
    );
  }
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  browser = await chromium.launch({ channel: "chrome", headless: true });
  await test("actual anonymous GET pins Rishon 853 and matches the Chabad oracle; invalid date is 400", async () => {
    const r = await fetch(base + "/api/zmanim?date=2026-11-23");
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.deepEqual(d, payload("winter", "2026-11-23"));
    assert.equal(
      (await fetch(base + "/api/zmanim?date=2026-02-30")).status,
      400,
    );
  });
  for (const [width, height] of [
    [1280, 720],
    [1920, 1080],
    [3840, 2160],
  ])
    await test(
      width +
        "x" +
        height +
        " television: all times fit without scroll/cutoff, Russian UI, correct Israel clock despite US device, no Clerk dependency",
      async () => {
        const { c, p, thirdParty } = await setup(width, height);
        try {
          await ready(p);
          await p.getByRole("time").waitFor();
          assert.match(
            await p.getByRole("time").getAttribute("aria-label"),
            /08:00/,
          );
          assert.match(
            await p.locator("[data-zmanim-board]").innerText(),
            /13.*5787/,
          );
          assert.equal(
            await p.locator("[data-next-zman]").getAttribute("data-next-zman"),
            "LatestShema",
          );
          assert.equal(
            await p.locator("nav, [data-zmanim-board] select").count(),
            0,
          );
          assert.equal(
            await p.locator("[data-zmanim-board]").getAttribute("lang"),
            "ru",
          );
          await fit(p, width, height);
          assert.deepEqual(thirdParty, []);
          if (width >= 1920) {
            const font = await p
              .locator('[data-zman="LatestShema"] > div:last-child > span')
              .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
            assert.ok(font >= 40, font);
          }
          await p.clock.fastForward(8000);
          await p.screenshot({
            path: out + "/" + width + "x" + height + ".png",
          });
        } finally {
          await c.close();
        }
      },
    );
  for (const width of [320, 390])
    await test(
      width +
        " phone: readable stacked board, no horizontal overflow, source and WhatsApp accessible in settings",
      async () => {
        const { c, p } = await setup(width, 844);
        try {
          await ready(p);
          await fit(p, width, 844);
          await p
            .getByRole("button", { name: "Настройки табло", exact: true })
            .click();
          const dialog = p.getByRole("dialog", { name: "Настройки табло" });
          await dialog.waitFor();
          assert.equal(
            await dialog.evaluate((el) => el.matches(":modal")),
            true,
          );
          assert.match(
            await dialog
              .getByRole("link", { name: /WhatsApp/ })
              .getAttribute("href"),
            /^https:\/\/wa.me\/972506700779/,
          );
          await p.keyboard.press("Escape");
          assert.equal(await p.getByRole("dialog").count(), 0);
          await p.screenshot({
            path: out + "/" + width + "-mobile.png",
            fullPage: true,
          });
        } finally {
          await c.close();
        }
      },
    );
  await test("full-screen control, clock ticks, control auto-hide and periodic refresh need no reload", async () => {
    const { c, p } = await setup(1920, 1080);
    try {
      let reads = 0;
      p.on("request", (r) => {
        if (r.url().includes("/api/zmanim")) reads++;
      });
      await ready(p);
      const before = await p.getByRole("time").getAttribute("aria-label");
      await p.clock.runFor(2000);
      assert.notEqual(
        await p.getByRole("time").getAttribute("aria-label"),
        before,
      );
      await p
        .getByRole("button", { name: "На весь экран", exact: true })
        .click();
      await p.waitForFunction(
        () =>
          Boolean(document.fullscreenElement) ||
          [...document.querySelectorAll("[role=status]")].some((el) =>
            el.textContent.includes("меню браузера телевизора"),
          ),
      );
      if (await p.evaluate(() => Boolean(document.fullscreenElement))) {
        await p
          .getByRole("button", { name: "Выйти из полного экрана", exact: true })
          .click();
        await p.waitForFunction(() => !document.fullscreenElement);
      } else
        await p
          .getByText(
            "Включите полноэкранный режим в меню браузера телевизора.",
            { exact: true },
          )
          .waitFor();
      const n = reads,
        updated = p.waitForResponse(
          (r) => r.url().includes("/api/zmanim") && r.status() === 200,
        );
      await p.clock.fastForward(15 * 60000 + 1000);
      await updated;
      await p.waitForFunction(
        () => document.querySelector('[data-zman="LatestShema"]') !== null,
      );
      assert.ok(reads > n);
      assert.equal(new URL(p.url()).pathname, "/zmanim");
    } finally {
      await c.close();
    }
  });
  await test("midnight outage never shows yesterday as today; online recovery loads the new day automatically", async () => {
    const { c, p } = await setup(1920, 1080, "2026-11-23T21:59:58Z");
    try {
      let fail = false,
        requests = [];
      await p.route("**/api/zmanim?**", (r) => {
        const date = new URL(r.request().url()).searchParams.get("date");
        requests.push(date);
        if (fail)
          return r.fulfill({
            status: 503,
            json: { error: "Synthetic network outage" },
          });
        return r.fulfill({ json: payload("winter", date) });
      });
      await ready(p);
      fail = true;
      await p.clock.runFor(4000);
      await p
        .getByRole("heading", { name: "Ожидаем данные Chabad.org" })
        .waitFor();
      assert.equal(await p.locator("[data-zman]").count(), 0);
      assert.match(
        await p.locator("[data-zmanim-board]").innerText(),
        /24 ноября 2026/,
      );
      assert.ok(requests.includes("2026-11-24"));
      await p.screenshot({ path: out + "/midnight-offline.png" });
      fail = false;
      await p.evaluate(() => window.dispatchEvent(new Event("online")));
      await p
        .locator('[data-zman="LatestShema"]')
        .getByText("08:50", { exact: true })
        .waitFor();
      await fit(p, 1920, 1080);
    } finally {
      await c.close();
    }
  });
  for (const [name, date, time] of [
    ["holiday", "2026-09-12", "2026-09-12T10:00:00Z"],
    ["pesach", "2026-04-01", "2026-04-01T07:00:00Z"],
  ])
    await test(
      name +
        " TV: special deadlines fit and holiday candles are not mislabeled havdalah",
      async () => {
        const { c, p } = await setup(1920, 1080, time);
        try {
          await p.route("**/api/zmanim?**", (r) =>
            r.fulfill({ json: payload(name, date) }),
          );
          await p.goto(base + "/zmanim");
          await p.locator('[data-zman="LatestShema"]').waitFor();
          await p.waitForFunction(
            (date) =>
              document
                .querySelector("[data-zmanim-board]")
                ?.textContent.includes(date),
            name === "holiday" ? "12 сентября" : "1 апреля",
          );
          await fit(p, 1920, 1080);
          if (name === "holiday")
            assert.match(
              await p.locator('[data-zman="ShabbatEndTime"]').innerText(),
              /Праздничные свечи после/,
            );
          else
            assert.equal(
              await p.locator('[data-zman="LastEatingChametzTime"]').count(),
              1,
            );
          await p.screenshot({ path: out + "/" + name + "-1920.png" });
        } finally {
          await c.close();
        }
      },
    );
  await test("evening Hebrew date advances at local sunset without changing the civil-day timetable", async () => {
    const { c, p } = await setup(1920, 1080, "2026-11-23T14:39:00Z");
    try {
      await ready(p);
      assert.match(
        await p.locator("[data-zmanim-board]").innerText(),
        /14 кислева 5787/,
      );
      assert.match(
        await p.locator("[data-zmanim-board]").innerText(),
        /после захода солнца/i,
      );
      assert.equal(
        await p.locator("[data-next-zman]").getAttribute("data-next-zman"),
        "Tzeis",
      );
      await fit(p, 1920, 1080);
      await p.screenshot({ path: out + "/1920-evening.png" });
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
          "Chrome; isolated code copy; real public Chabad API and recorded Chabad regression payloads; device timezone America/New_York; no real env or database",
        checks,
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
