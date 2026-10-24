/* Real local UI/API/SQL; synthetic SDK/identity, no real payment navigation. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('/tmp/menora-browser-runtime/node_modules/playwright');
const { installSdk, signedInitData, openEventRegistration } = require('./miniapp-ui-sdk.cjs');
const base = process.env.MINIAPP_BROWSER_BASE || 'http://127.0.0.1:3342';
const out = process.env.COMMUNITY_TEST_OUTPUT || '/tmp/menora-participant-parity-evidence';
const checks = [], errors = []; let browser, subject = 789000;
async function test(name, run) { await run(); checks.push({ name, status: 'PASS' }); console.log('PASS ' + name); }
async function setup({ width = 390, kind = 'home', event = 'fixture-paid', family = true } = {}) {
  const id = subject++, context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await installSdk(context, { id, language: 'he' });
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  assert.equal((await context.request.post(base + '/api/test-miniapp-state', { data: { id, kind } })).status(), 200);
  assert.equal((await context.request.post(base + '/api/telegram/miniapp/bootstrap', { headers: { origin: base }, data: { initData: signedInitData(id, 'he') } })).status(), 200);
  if (family) {
    const snapshot = await (await context.request.get(base + '/api/telegram/miniapp/profile')).json();
    const { affiliation, gender, ...profile } = snapshot.profile;
    const response = await context.request.post(base + '/api/telegram/miniapp/profile', { headers: { origin: base }, data: {
      ...profile, maritalStatus: 'married', spouseName: 'Synthetic spouse', hasChildren: true,
      childrenData: [...profile.childrenData, { name: 'Second synthetic child', dateOfBirth: '2021-01-01', gender: 'male' }], profileVersion: snapshot.profileVersion,
    } });
    assert.equal(response.status(), 200, await response.text());
  }
  const page = await context.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', error => errors.push(error.message));
  const requests = [];
  page.on('request', request => { if (request.url().includes('/api/telegram/miniapp/')) requests.push({ url: new URL(request.url()).pathname, method: request.method(), body: request.postDataJSON() }); });
  await page.goto(base + '/miniapp?event=' + event);
  await page.locator('[data-event-detail=' + event + ']').waitFor();
  assert.equal(requests.filter(r => r.body?.action === 'quote').length, 0);
  await openEventRegistration(page);
  return { context, page, id, requests };
}
const total = page => page.locator('[data-calculated-total] .miniapp-total');
const plus = page => page.getByRole('button', { name: 'Добавить взрослого гостя', exact: true });
const minus = page => page.getByRole('button', { name: 'Убрать взрослого гостя', exact: true });
async function amount(page, pattern) { await assertEventually(() => total(page).innerText(), pattern); }
async function assertEventually(read, pattern) {
  const limit = Date.now() + 45000; let value;
  while (Date.now() < limit) { try { value = await read(); if (pattern.test(value)) return; } catch {} await new Promise(resolve => setTimeout(resolve, 25)); }
  assert.match(value || '', pattern);
}
async function paymentState(context, id) {
  const response = await context.request.post(base + '/api/test-payment-state', { data: { id, mode: 'inspect' } });
  assert.equal(response.status(), 200); return response.json();
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  assert.equal((await (await fetch(base + '/api/test-miniapp-state')).json()).testDatabase, 'isolated-pglite');
  assert.equal((await (await fetch(base + '/api/test-state', { method: 'POST' })).json()).reset, true);
  browser = await chromium.launch({ headless: true });
  for (const width of [320, 390, 1280]) await test(width + ' website participant model, server line items and immutable Shutafim amount', async () => {
    const { context, page, id } = await setup({ width });
    try {
      const self = page.getByRole('checkbox', { name: 'Synthetic (Вы)', exact: true });
      assert.equal(await self.isChecked(), true); assert.equal(await self.isDisabled(), true);
      assert.equal(await page.getByRole('checkbox', { name: /Супруг\/а/ }).count(), 1);
      assert.equal(await page.locator('#miniapp-participants input[type=checkbox]').count(), 4);
      assert.equal(await minus(page).isDisabled(), true);
      assert.equal(await page.getByText('Дополнительные дети', { exact: true }).count(), 0);
      await amount(page, /100[,.]10/);
      await page.getByRole('checkbox', { name: /Супруг\/а/ }).check(); await amount(page, /200[,.]20/);
      await plus(page).click(); await plus(page).click(); await amount(page, /400[,.]40/);
      await page.getByRole('checkbox', { name: 'Synthetic child', exact: true }).check();
      await page.getByRole('checkbox', { name: 'Second synthetic child', exact: true }).check(); await amount(page, /450[,.]90/);
      assert.match(await page.locator('.miniapp-quote-lines').innerText(), /4 ×/); assert.match(await page.locator('.miniapp-quote-lines').innerText(), /2 ×/);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      for (const button of [plus(page), minus(page)]) { const box = await button.boundingBox(); assert.ok(box.width >= 44 && box.height >= 44); }
      await page.screenshot({ path: path.join(out, width + '-participants.png'), fullPage: true });
      await page.getByRole('button', { name: 'Перейти к оплате', exact: true }).click();
      await page.getByRole('heading', { name: 'Осталось оплатить участие', exact: true }).waitFor();
      const state = await paymentState(context, id); assert.equal(state.attempts[0].amount_agorot, 45090); assert.equal(state.registrations[0].extra_data.extraAdults, 2);
      assert.equal(state.registrations[0].extra_data.extraKids, 0); assert.equal(state.registrations[0].extra_data.childIds.length, 2);
      await page.getByRole('button', { name: 'Оплатить участие', exact: true }).click(); await page.waitForFunction(() => window.__miniappFixture.calls.links.length > 0);
      const url = new URL(await page.evaluate(() => window.__miniappFixture.calls.links.at(-1)));
      for (const [key, value] of Object.entries({ price: '450.9', quantity: '1', cur: 'ILS', payments: '1', lang: 'ru', custom1: state.registrations[0].id })) assert.equal(url.searchParams.get(key), value);
    } finally { await context.close(); }
  });
  await test('rapid guest taps coalesce into one quote with no profile/event reload and enforce 0..20', async () => {
    const { context, page, requests } = await setup();
    try {
      await amount(page, /100[,.]10/); const before = requests.length;
      await plus(page).evaluate(button => { button.click(); button.click(); button.click(); });
      await amount(page, /400[,.]40/);
      assert.deepEqual(requests.slice(before).map(r => [r.url, r.method, r.body.action]), [['/api/telegram/miniapp/events', 'POST', 'quote']]);
      await plus(page).evaluate(button => { for (let n = 0; n < 25; n++) button.click(); });
      await amount(page, /2[\s\u00a0]?102[,.]10/); assert.equal(await plus(page).isDisabled(), true);
      assert.equal(await page.getByLabel('Количество дополнительных взрослых').innerText(), '20');
    } finally { await context.close(); }
  });
  await test('late old quote cannot replace the newer participant selection', async () => {
    const { context, page } = await setup(); let release;
    try {
      await amount(page, /100[,.]10/); let held = false;
      await context.route('**/api/telegram/miniapp/events', async route => {
        const body = route.request().postDataJSON();
        if (body?.action === 'quote' && body.extraAdults === 1) {
          held = true; const response = await route.fetch(); await new Promise(resolve => { release = resolve; });
          await route.fulfill({ response }).catch(() => {}); return;
        }
        await route.continue();
      });
      await plus(page).click(); await assertEventually(async () => String(held), /true/);
      await plus(page).click(); await amount(page, /300[,.]30/); release();
      await page.waitForTimeout(300); assert.match(await total(page).innerText(), /300[,.]30/);
    } finally { release?.(); await context.close(); }
  });
  await test('quote error preserves selection and retry sends only a quote', async () => {
    const { context, page, requests } = await setup();
    try {
      await amount(page, /100[,.]10/); let fail = true;
      await context.route('**/api/telegram/miniapp/events', route => {
        if (route.request().postDataJSON()?.action === 'quote' && fail) { fail = false; return route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false,"error":"temporarily_unavailable"}' }); }
        return route.continue();
      });
      await plus(page).click(); await page.getByRole('alert').filter({ hasText: 'Не удалось рассчитать' }).waitFor();
      assert.equal(await page.getByLabel('Количество дополнительных взрослых').innerText(), '1');
      const before = requests.length; await page.getByRole('button', { name: 'Повторить расчёт', exact: true }).click(); await amount(page, /200[,.]20/);
      assert.deepEqual(requests.slice(before).map(r => [r.url, r.body.action]), [['/api/telegram/miniapp/events', 'quote']]);
    } finally { await context.close(); }
  });
  await test('pending selection conflict shows exact Russian recovery message and WhatsApp without changing amount', async () => {
    const { context, page, id } = await setup();
    try {
      await plus(page).click(); await amount(page, /200[,.]20/);
      const response = await context.request.post(base + '/api/telegram/miniapp/events', { headers: { origin: base }, data: { action: 'register', eventId: 'fixture-paid' } }); assert.equal(response.status(), 200);
      await page.getByRole('button', { name: 'Перейти к оплате', exact: true }).click();
      const conflict = page.locator('[data-pending-selection-conflict]'); await conflict.waitFor();
      assert.match(await conflict.innerText(), /У вас уже есть регистрация, ожидающая оплаты, с другим составом участников\. Для изменения свяжитесь с Menorah Center\./);
      assert.match(await conflict.getByRole('link').getAttribute('href'), /^https:\/\/wa\.me\//);
      assert.equal((await paymentState(context, id)).attempts[0].amount_agorot, 10010);
    } finally { await context.close(); }
  });
  await test('free event uses the same selector, displays Free and confirms without a payment URL', async () => {
    const { context, page, id } = await setup({ event: 'fixture-event' });
    try {
      await page.getByRole('checkbox', { name: /Супруг\/а/ }).check(); await plus(page).click(); await page.getByRole('checkbox', { name: 'Synthetic child', exact: true }).check();
      await amount(page, /Бесплатно/); await page.getByRole('button', { name: 'Записаться', exact: true }).click();
      await page.getByRole('heading', { name: '✅ Вы зарегистрированы', exact: true }).waitFor();
      assert.equal((await paymentState(context, id)).attempts.length, 0); assert.deepEqual(await page.evaluate(() => window.__miniappFixture.calls.links), []);
    } finally { await context.close(); }
  });
  for (const kind of ['male', 'giyur-unknown', 'giyur-advanced']) await test(kind + ' retains existing child restrictions and hides an unsaved spouse', async () => {
    const { context, page } = await setup({ kind, family: false });
    try { assert.equal(await page.locator('#miniapp-participants input[type=checkbox]').count(), 1); assert.equal(await page.getByRole('checkbox', { name: /Супруг\/а/ }).count(), 0); await plus(page).click(); await amount(page, /200[,.]20/); }
    finally { await context.close(); }
  });
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ environment: 'Local Chromium + production Mini App routes + isolated PGlite, synthetic SDK, external navigation intercepted', realPayments: 0, checks, errors }, null, 2) + '\n');
  console.log(checks.length + '/' + checks.length + ' participant parity browser checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await browser?.close(); });
