/* Local browser -> real Mini App/session/routes -> isolated PGlite. Synthetic SDK only. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('/tmp/menora-browser-runtime/node_modules/playwright');
const { installSdk } = require('./miniapp-ui-sdk.cjs');
const base = 'http://127.0.0.1:3342';
const out = process.env.COMMUNITY_TEST_OUTPUT || '/tmp/menora-kids-entry-evidence/entry-browser';
const checks = [], errors = []; let browser, id = 789000;
async function test(name, run) { await run(); checks.push({ name, status: 'PASS' }); console.log('PASS ' + name); }
async function setup({ kind = 'home', query = '?section=kids', start = '', width = 390 } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, locale: 'en-US', reducedMotion: 'reduce' });
  const subject = id++;
  await installSdk(context, { id: subject, language: 'he', start });
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  if (kind) assert.equal((await context.request.post(base + '/api/test-miniapp-state', { data: { id: subject, kind, language: 'he' } })).status(), 200);
  const page = await context.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/miniapp' + query);
  return { context, page };
}
async function kids(page, selector = '[data-kids-family]') {
  await page.locator('[data-screen=kids]').waitFor(); await page.locator(selector).waitFor();
  assert.equal(new URL(page.url()).pathname, '/miniapp');
  assert.equal(await page.locator('.miniapp').getAttribute('lang'), 'ru');
  assert.equal(await page.evaluate(() => window.__miniappFixture.calls.links.length), 0);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
}
async function choose(page, affiliation = 'maternal', gender = 'female') {
  await page.locator('[data-screen=filter]').waitFor();
  await page.locator(`[name=affiliation][value=${affiliation}]`).check();
  if (affiliation !== 'none') await page.locator(`[name=gender][value=${gender}]`).check();
  assert.equal(await page.locator('[name=giyurStage],[name=kids-giyur-stage]').count(), 0);
  await page.locator('[data-miniapp-form=filter] button[type=submit]').click();
}
async function complete(page) {
  await page.locator('[data-screen=profile]').waitFor();
  for (const [key, value] of Object.entries({ firstName: 'Synthetic Kids Entry', lastName: 'Fixture', phone: '+972501234567', dateOfBirth: '1990-01-01' }))
    await page.locator('#profile-' + key).fill(value);
  await page.locator('#profile-city').fill('Ришон');
  await page.getByRole('option').filter({ hasText: 'Ришон ле-Цион' }).first().click();
  await page.locator('#profile-marital').selectOption('single');
  await page.locator('input[type=checkbox][required]').check();
  await page.locator('[data-miniapp-form=profile] button[type=submit]').click();
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  assert.equal((await (await fetch(base + '/api/test-miniapp-state')).json()).testDatabase, 'isolated-pglite');
  assert.equal((await (await fetch(base + '/api/test-state', { method: 'POST' })).json()).reset, true);
  browser = await chromium.launch({ headless: true });
  for (const width of [320, 390, 1280]) await test(width + ' section=kids opens internally after auth; native Back returns Home and consumes hint', async () => {
    const { context, page } = await setup({ width }); try {
      await kids(page); assert.equal(await page.evaluate(() => window.__miniappFixture.calls.backVisible), true);
      await page.reload(); await kids(page);
      await page.evaluate(() => window.__miniappFixture.back()); await page.locator('[data-screen=home]').waitFor();
      assert.equal(new URL(page.url()).searchParams.has('section'), false);
      assert.equal(await page.evaluate(() => window.__miniappFixture.calls.backVisible), false);
      await page.reload(); await page.locator('[data-screen=home]').waitFor();
    } finally { await context.close(); }
  });
  for (const kind of ['male', 'giyur-male']) await test(kind + ' direct Kids opens mother-profile gate and retains WhatsApp', async () => {
    const { context, page } = await setup({ kind }); try {
      await kids(page, '[data-kids-gate]');
      await page.getByRole('heading', { name: 'Запись детей оформляется через профиль мамы.', exact: true }).waitFor();
      assert.equal(await page.locator('[data-kids-family],[name=kids-giyur-stage]').count(), 0);
      const contact = page.getByRole('link', { name: 'Связаться с Menorah Center', exact: true });
      assert.match(await contact.getAttribute('href'), /^https:\/\/wa\.me\/972506700779/);
      await contact.click(); assert.match(await page.evaluate(() => window.__miniappFixture.calls.links.at(-1)), /^https:\/\/wa\.me\/972506700779/);
      assert.equal((await context.request.post(base + '/api/telegram/miniapp/kids/applications', { headers: { origin: base }, data: { programTitle: 'Творческие мастерские', childIds: ['synthetic-child'] } })).status(), 403);
    } finally { await context.close(); }
  });
  for (const kind of ['giyur-unknown', 'giyur-advanced']) await test(kind + ' direct Kids shows existing child-action stage gate; completed resumes family', async () => {
    const { context, page } = await setup({ kind }); try {
      await kids(page, '[data-kids-gate]');
      await page.getByLabel('Гиюр завершён', { exact: true }).check();
      await page.getByRole('button', { name: 'Продолжить', exact: true }).click(); await kids(page);
    } finally { await context.close(); }
  });
  await test('none category section hint stays resources and cannot call Kids API', async () => {
    const { context, page } = await setup({ kind: 'resources' }); try {
      await page.locator('[data-screen=resources]').waitFor(); assert.equal(await page.locator('[data-miniapp-kids],.miniapp-nav').count(), 0);
      assert.equal((await context.request.get(base + '/api/telegram/miniapp/kids')).status(), 403);
    } finally { await context.close(); }
  });
  for (const [affiliation, gender] of [['maternal', 'female'], ['giyur', 'female'], ['giyur', 'male']]) await test('new ' + affiliation + '/' + gender + ' retains Kids through filter, backtracking, reload and profile completion', async () => {
    const { context, page } = await setup({ kind: null }); try {
      await choose(page, affiliation, gender); await page.locator('[data-screen=profile]').waitFor();
      await page.getByRole('button', { name: 'Изменить ответы', exact: true }).click();
      await choose(page, affiliation, gender); await page.locator('[data-screen=profile]').waitFor();
      await page.reload(); await page.locator('[data-screen=profile]').waitFor();
      assert.equal(new URL(page.url()).searchParams.get('section'), 'kids');
      assert.equal(await page.locator('[name=giyurStage],[name=kids-giyur-stage]').count(), 0);
      await complete(page); await kids(page, affiliation === 'maternal' ? '[data-kids-family]' : '[data-kids-gate]');
      const profile = await (await context.request.get(base + '/api/telegram/miniapp/profile')).json();
      assert.equal(profile.summary.nextStep, 'home'); assert.equal(profile.profile.agreedToPrivacy, true); assert.equal(profile.profile.cityId, '8300');
      assert.equal(profile.profile.affiliation, affiliation); assert.equal(profile.profile.gender, gender);
      await page.reload(); await kids(page, affiliation === 'maternal' ? '[data-kids-family]' : '[data-kids-gate]');
    } finally { await context.close(); }
  });
  await test('legacy completed profile keeps Kids destination through mandatory new filter', async () => {
    const { context, page } = await setup({ kind: 'legacy' }); try { await choose(page); await kids(page); } finally { await context.close(); }
  });
  await test('new none answer stays resources; changing to eligible category resumes intended Kids', async () => {
    const { context, page } = await setup({ kind: null }); try {
      await choose(page, 'none'); await page.locator('[data-screen=resources]').waitFor();
      assert.equal(await page.locator('[data-miniapp-kids]').count(), 0);
      await page.getByRole('button', { name: 'Изменить ответы', exact: true }).click();
      await choose(page); await complete(page); await kids(page);
    } finally { await context.close(); }
  });
  await test('event hint remains primary when combined with section=kids', async () => {
    const { context, page } = await setup({ query: '?section=kids&event=fixture-event' }); try {
      await page.locator('[data-event-detail=fixture-event]').waitFor(); assert.equal(await page.locator('[data-miniapp-kids]').count(), 0);
    } finally { await context.close(); }
  });
  await test('explicit Kids button does not inherit a previous signed Telegram event start hint', async () => {
    const { context, page } = await setup({ start: 'event_fixture-event' }); try {
      await kids(page); assert.equal(await page.locator('[data-event-detail],[data-event-entry],main [role=alert]').count(), 0);
    } finally { await context.close(); }
  });
  await test('unsupported section cannot select a screen or bypass onboarding', async () => {
    const { context, page } = await setup({ kind: null, query: '?section=dashboard/kids' }); try {
      await choose(page); await complete(page); await page.locator('[data-screen=home]').waitFor();
      assert.equal(await page.locator('[data-miniapp-kids]').count(), 0);
    } finally { await context.close(); }
  });
  assert.deepEqual(errors, []); console.log('TOTAL ' + checks.length + ' PASS');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await browser?.close(); fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'miniapp-kids-entry-browser-results.json'), JSON.stringify({ environment: 'Local Chromium mobile/desktop + actual HTTP/session/SQL; synthetic Telegram HMAC/SDK, blocked external requests', checks, errors, exitCode: process.exitCode || 0, productionChanged: false, realTelegramWebView: 'NOT VERIFIED' }, null, 2) + '\n');
});
