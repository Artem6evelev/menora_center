/* Targeted callback journeys in a disposable HTTP fixture with mocked identity.
 * This is not genuine Google OAuth. No remote DB, delivery, or payments.
 * Prepare via COMMUNITY_HTTP_FIXTURE=/tmp/menora-login-fix-http node tests/community/http-fixture.cjs,
 * then start that fixture at CALLBACK_BROWSER_BASE (default http://127.0.0.1:3341).
 */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('/tmp/menora-browser-runtime/node_modules/playwright');
const base = process.env.CALLBACK_BROWSER_BASE || 'http://127.0.0.1:3341';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Local fixture required');
const out = process.env.COMMUNITY_TEST_OUTPUT || path.resolve(__dirname, '../../docs/login-fix-2026-10-21/evidence');
const checks = [], errors = [];
let browser;
const state = async context => (await context.request.get(base + '/api/test-state')).json();
async function identity(context, id) {
  await context.clearCookies();
  await context.addCookies([{ name: '_community_fixture', value: id, url: base }]);
}
async function fields(page) {
  for (const [name, value] of Object.entries({ firstName: 'Callback', lastName: 'Synthetic', phone: '+972501234567', dateOfBirth: '1990-02-03' })) {
    await page.locator('#profile-' + name).fill(value);
  }
  await page.locator('#profile-city').fill('Ришон');
  await page.getByRole('option').filter({ hasText: 'Ришон ле-Цион' }).first().click();
  await page.locator('#profile-marital').selectOption('single');
  await page.getByRole('checkbox', { name: /Я соглашаюсь/ }).check();
}
const callback = target => base + '/sso-callback' + (target ? '?returnTo=' + encodeURIComponent(target) : '');
async function check(name, fn) { await fn(); checks.push({ name, status: 'PASS' }); console.log('PASS ' + name); }
(async () => {
  browser = await chromium.launch({ headless: true });
  for (const [viewport, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const page = await context.newPage(); page.setDefaultTimeout(45000);
    page.on('pageerror', error => errors.push({ viewport, message: error.message }));
    assert.equal((await state(context)).testDatabase, 'isolated-pglite');
    await check(viewport + ' current member callback and reload retain the original event and profile', async () => {
      await identity(context, 'fixture-mom');
      const before = (await state(context)).users.find(u => u.id === 'fixture-mom');
      await page.goto(callback('/events/fixture-second')); await page.waitForURL(base + '/events/fixture-second');
      await page.getByRole('heading', { name: 'SECOND_EVENT_RETURN_TARGET', exact: true }).waitFor();
      await page.reload(); await page.getByRole('heading', { name: 'SECOND_EVENT_RETURN_TARGET', exact: true }).waitFor();
      const rows = (await state(context)).users.filter(u => u.id === 'fixture-mom');
      assert.equal(rows.length, 1); assert.deepEqual(rows[0], before);
    });
    await check(viewport + ' legacy callback requires the filter and saves before returning to the event', async () => {
      await identity(context, viewport === 'desktop' ? 'fixture-v1' : 'fixture-legacy');
      await page.goto(callback('/events/fixture-second')); await page.waitForURL('**/register?**');
      assert.equal(await page.locator('[name=affiliation]:checked').count(), 0);
      await page.locator('[name=affiliation][value=maternal]').check();
      await page.locator('[name=gender][value=male]').check(); await fields(page);
      await page.getByRole('button', { name: 'Сохранить анкету', exact: true }).click();
      await page.waitForURL(base + '/events/fixture-second');
      await page.reload(); await page.getByRole('heading', { name: 'SECOND_EVENT_RETURN_TARGET', exact: true }).waitFor();
    });
    await check(viewport + ' new draft callback saves one permanent profile and child, then survives replay and reload', async () => {
      const id = 'fixture-callback-new-' + viewport;
      await context.clearCookies(); await context.addCookies([{ name: '_community_login_as', value: id, url: base }]);
      await page.goto(base + '/register?returnTo=%2Fevents%2Ffixture-event');
      await page.locator('[name=affiliation][value=maternal]').check();
      await page.locator('[name=gender][value=female]').check(); await fields(page);
      await page.getByRole('checkbox', { name: 'Есть дети', exact: true }).check();
      await page.getByRole('button', { name: 'Добавить ребёнка', exact: true }).click();
      await page.getByLabel('Имя ребёнка', { exact: true }).fill('Callback child');
      await page.getByLabel('Дата рождения ребёнка', { exact: true }).fill('2020-01-01');
      await page.getByLabel('Девочка', { exact: true }).check();
      await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
      await page.getByText('Callback child', { exact: true }).waitFor();
      const draft = new URL(page.url()).searchParams.get('draft'); assert.ok(draft);
      assert.equal((await state(context)).users.filter(u => u.id === id).length, 0);
      await page.getByRole('button', { name: 'Продолжить с Google', exact: true }).click();
      await page.waitForURL(base + '/events/fixture-event');
      await page.getByRole('heading', { name: 'PRIVATE_SYNTHETIC_EVENT_TITLE', exact: true }).waitFor();
      const before = (await state(context)).users.find(u => u.id === id);
      assert.equal(before.cityId, '8300'); assert.equal(before.agreedToPrivacy, true);
      assert.equal(before.filterVersion, 2); assert.equal(before.childrenData.length, 1);
      assert.equal(before.childrenData[0].parentId, id); assert.equal(before.childrenData[0].gender, 'female');
      await page.goto(callback('/events/fixture-event') + '&registration=1&draft=' + draft);
      await page.waitForURL(base + '/events/fixture-event'); await page.reload();
      await page.getByRole('heading', { name: 'PRIVATE_SYNTHETIC_EVENT_TITLE', exact: true }).waitFor();
      const after = await state(context); assert.deepEqual(after.users.filter(u => u.id === id), [before]);
      assert.ok(after.drafts.find(d => d.id === draft).consumedAt);
      assert.equal(after.participants.filter(p => p.userId === id).length, 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    });
    await check(viewport + ' callback without an event uses dashboard events', async () => {
      await identity(context, 'fixture-mom'); await page.goto(callback()); await page.waitForURL(base + '/dashboard/events');
    });
    await check(viewport + ' third category callback remains on resources after reload', async () => {
      await identity(context, 'fixture-none-father'); await page.goto(callback('/events/fixture-event'));
      await page.waitForURL(base + '/register?result=resources'); await page.reload();
      assert.equal(await page.getByRole('button', { name: 'Продолжить с Google', exact: true }).count(), 0);
      assert.equal(await page.locator('a[href="https://noahideworldcenter.org/ru"]').count(), 1);
    });
    await context.close();
  }
  assert.deepEqual(errors, []); console.log('Callback browser: ' + checks.length + '/' + checks.length + ' PASS; mock identity only.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await browser?.close(); fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'callback-browser.json'), JSON.stringify({ method: 'Local Chromium, real Next routes/actions/SQL; mocked identity, not Google OAuth', checks, errors, exitCode: process.exitCode || 0 }, null, 2) + '\n');
});
