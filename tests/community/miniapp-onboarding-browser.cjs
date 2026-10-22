/* Actual UI -> HTTP -> canonical SQL. Synthetic Telegram proof only; no production access. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('/tmp/menora-browser-runtime/node_modules/playwright');
const { installSdk } = require('./miniapp-ui-sdk.cjs');
const base = 'http://127.0.0.1:3342';
const out = process.env.COMMUNITY_TEST_OUTPUT || '/tmp/menora-onboarding-fix-evidence/onboarding-browser';
const checks = [], errors = [];
let browser;
async function test(name, run) { await run(); checks.push({ name, status: 'PASS' }); console.log('PASS ' + name); }
async function setup(id, language, mode) {
  const context = await browser.newContext({ viewport: { width: language === 'en' ? 1280 : 390, height: 844 } });
  await installSdk(context, { id, language });
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await context.route('**/api/telegram/miniapp/{profile,filter}', async route => {
    const headers = { ...route.request().headers() }; delete headers['if-match'];
    const response = await route.fetch({ headers });
    const outgoing = { ...response.headers() };
    if (mode === 'missing') delete outgoing.etag;
    else outgoing.etag = mode === 'weak' ? 'W/' + outgoing.etag : '"transport-representation-tag"';
    await route.fulfill({ response, headers: outgoing });
  });
  const page = await context.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', error => errors.push(error.message));
  return { context, page };
}
async function fill(page, firstName = 'Synthetic Mini App') {
  for (const [key, value] of Object.entries({ firstName, lastName: 'Onboarding', phone: '+972501234567', dateOfBirth: '1990-01-01' }))
    await page.locator('#profile-' + key).fill(value);
  await page.locator('#profile-city').fill('Ришон');
  await page.getByRole('option').filter({ hasText: 'Ришон ле-Цион' }).first().click();
  await page.locator('#profile-marital').selectOption('single');
  await page.locator('input[type=checkbox][required]').check();
}
async function filter(page) {
  await page.goto(base + '/miniapp'); await page.locator('[data-screen=filter]').waitFor();
  await page.locator('[name=affiliation][value=giyur]').check();
  await page.locator('[name=gender][value=male]').check();
  assert.equal(await page.locator('[name=giyurStage]').count(), 0);
  await page.locator('[data-miniapp-form=filter] button[type=submit]').click();
  await page.locator('[data-screen=profile]').waitFor();
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const probe = await (await fetch(base + '/api/test-miniapp-state')).json();
  assert.equal(probe.testDatabase, 'isolated-pglite');
  const reset = await (await fetch(base + '/api/test-state', { method: 'POST' })).json();
  assert.equal(reset.testDatabase, 'isolated-pglite'); assert.equal(reset.reset, true);
  browser = await chromium.launch({ headless: true });
  for (const [index, language, mode] of [[0, 'ru', 'missing'], [1, 'he', 'weak'], [2, 'en', 'replaced']]) {
    await test(`${language}/${mode}: first giyur male saves advance filter -> profile -> home and survive reload`, async () => {
      const { context, page } = await setup(785100 + index, language, mode);
      try {
        const bootstraps = []; page.on('request', r => { if (r.url().endsWith('/bootstrap')) bootstraps.push(r.url()); });
        await filter(page); assert.equal(await page.locator('.miniapp').getAttribute('lang'), 'ru');
        assert.equal(await page.locator('.miniapp').getAttribute('dir'), 'ltr');
        assert.equal(await page.locator('[name=giyurStage]').count(), 0);
        await fill(page); await page.locator('[data-screen=profile] button[type=submit]').click();
        await page.locator('[data-screen=home]').waitFor();
        const response = await context.request.get(base + '/api/telegram/miniapp/profile');
        const saved = await response.json(); assert.equal(saved.summary.nextStep, 'home');
        assert.equal(saved.profile.affiliation, 'giyur'); assert.equal(saved.profile.gender, 'male');
        assert.equal(saved.profile.cityId, '8300'); assert.equal(saved.profile.agreedToPrivacy, true);
        assert.equal(saved.permissions.canEditChildren, false); assert.equal(saved.profile.firstName, 'Synthetic Mini App');
        await page.reload(); await page.locator('[data-screen=home]').waitFor();
        assert.equal(bootstraps.length, 1, 'StrictMode/resume must not issue a second bootstrap');
        assert.equal(await page.locator('.miniapp [role=alert]').count(), 0);
      } finally { await context.close(); }
    });
  }
  await test('a real competing request remains a conflict and preserves both the winning profile and unsaved UI input', async () => {
    const { context, page } = await setup(785103, 'ru', 'missing');
    try {
      await filter(page); await fill(page, 'Unsaved local input');
      const before = await (await context.request.get(base + '/api/telegram/miniapp/profile')).json();
      const response = await context.request.post(base + '/api/telegram/miniapp/profile', { headers: { origin: base }, data: {
        profileVersion: before.profileVersion, firstName: 'Concurrent winner', lastName: 'Onboarding', phone: '+972501234567',
        dateOfBirth: '1990-01-01', city: 'Ришон ле-Цион', cityId: '8300', maritalStatus: 'single', spouseName: null,
        hasChildren: false, agreedToPrivacy: true,
      } }); assert.equal(response.status(), 200);
      await page.locator('[data-screen=profile] button[type=submit]').click();
      await page.getByRole('alert').filter({ hasText: 'Профиль изменился' }).waitFor();
      assert.equal(await page.locator('#profile-firstName').inputValue(), 'Unsaved local input');
      assert.equal((await (await context.request.get(base + '/api/telegram/miniapp/profile')).json()).profile.firstName, 'Concurrent winner');
    } finally { await context.close(); }
  });
  assert.deepEqual(errors, []); console.log(`${checks.length}/${checks.length} onboarding browser checks passed`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await browser?.close(); fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'miniapp-onboarding-browser-results.json'), JSON.stringify({
    environment: 'Local Chromium + real HTTP/API/SQL, synthetic Telegram HMAC/SDK; cache-header transformations explicit',
    realTelegramWebView: 'NOT VERIFIED', checks, errors, exitCode: process.exitCode || 0,
  }, null, 2) + '\n');
});
