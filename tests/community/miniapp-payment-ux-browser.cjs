/* Real local UI/API/SQL; payment links are intercepted, never paid or opened externally. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('/tmp/menora-browser-runtime/node_modules/playwright');
const { installSdk } = require('./miniapp-ui-sdk.cjs');
const base = 'http://127.0.0.1:3342', out = process.env.COMMUNITY_TEST_OUTPUT || '/tmp/menora-kids-entry-evidence/payment-browser';
const checks = [], errors = []; let browser, id = 788500;
async function test(name, run) { await run(); checks.push({ name, status: 'PASS' }); console.log('PASS ' + name); }
async function setup(width = 390, event = 'fixture-paid') {
  const subject = id++, context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce', locale: 'en-US' });
  await installSdk(context, { id: subject, language: 'he', start: '' });
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  assert.equal((await context.request.post(base + '/api/test-miniapp-state', { data: { id: subject, kind: 'home' } })).status(), 200);
  const page = await context.newPage(); page.setDefaultTimeout(45000); page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/miniapp?event=' + event); await page.locator('[data-event-detail=' + event + ']').waitFor();
  return { context, page, subject };
}
async function state(context, subject, mode = 'inspect') {
  const response = await context.request.post(base + '/api/test-payment-state', { data: { id: subject, mode } });
  assert.equal(response.status(), 200, await response.text()); const data = await response.json(); assert.equal(data.testDatabase, 'isolated-pglite'); return data;
}
async function register(page, child = false) {
  if (child) await page.locator('#miniapp-participants input[type=checkbox]').nth(1).check();
  await page.getByRole('button', { name: 'Рассчитать стоимость', exact: true }).click();
  await page.locator('[data-calculated-total]').waitFor(); await page.getByRole('button', { name: 'Подтвердить запись', exact: true }).click();
  await page.locator('[data-payment-handoff]').waitFor();
}
async function pending(page) {
  await page.getByRole('heading', { name: 'Осталось оплатить участие', exact: true }).waitFor();
  assert.doesNotMatch(await page.locator('[data-event-detail]').innerText(), /Вы (?:уже )?(?:зарегистрированы|записаны)|Оплата подтверждена/);
  await page.getByText('🟡 Регистрация создана', { exact: true }).waitFor();
  assert.equal(await page.locator('[data-event-detail] .miniapp-status-pending').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(255, 246, 220)');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
}
(async () => {
  fs.mkdirSync(out, { recursive: true }); assert.equal((await (await fetch(base + '/api/test-miniapp-state')).json()).testDatabase, 'isolated-pglite');
  assert.equal((await (await fetch(base + '/api/test-state', { method: 'POST' })).json()).reset, true);
  browser = await chromium.launch({ headless: true });
  for (const width of [320, 390, 1280]) {
    await test(width + ' paid pending shows payment-required UX and opens Shutafim with server family amount', async () => {
      const { context, page, subject } = await setup(width); try {
        await register(page, true); await pending(page);
        assert.match(await page.locator('#miniapp-receipt .miniapp-total').innerText(), /125[,.]35/);
        await page.getByRole('button', { name: 'Оплатить участие', exact: true }).click();
        const url = new URL(await page.evaluate(() => window.__miniappFixture.calls.links.at(-1)));
        assert.equal(url.protocol, 'https:'); assert.equal(url.hostname, 'shutaf.im'); assert.equal(url.searchParams.get('price'), '125.35');
        const s = await state(context, subject); assert.equal(s.registrations[0].status, 'pending'); assert.equal(s.attempts[0].confirmed_at, null);
        await page.getByRole('link', { name: 'Вернуться к мероприятию', exact: true }).click(); await pending(page);
        await page.screenshot({ path: path.join(out, width + '-pending.png'), fullPage: true });
      } finally { await context.close(); }
    });
    await test(width + ' free registration confirms without payment CTA and offers My registration', async () => {
      const { context, page } = await setup(width, 'fixture-event'); try {
        await register(page); await page.getByRole('heading', { name: '✅ Вы зарегистрированы', exact: true }).waitFor();
        await page.getByRole('link', { name: 'Моя запись', exact: true }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Оплатить участие', exact: true }).count(), 0);
      } finally { await context.close(); }
    });
  }
  await test('repeat pending registration returns the same server row/attempt and immutable amount after a price change', async () => {
    const { context, page, subject } = await setup(); try {
      await register(page); const before = await state(context, subject); await state(context, subject, 'price-change');
      const response = await context.request.post(base + '/api/telegram/miniapp/events', { headers: { origin: base }, data: { action: 'register', eventId: 'fixture-paid', childIds: [] } });
      assert.equal(response.status(), 200); const repeated = (await response.json()).registration;
      assert.equal(repeated.registrationId, before.registrations[0].id); assert.equal(repeated.amountAgorot, 10010);
      const after = await state(context, subject); assert.equal(after.registrations.length, 1); assert.equal(after.attempts.length, 1);
      await page.reload(); await pending(page); assert.match(await page.locator('#miniapp-receipt .miniapp-total').innerText(), /100[,.]10/);
      // Restore only this proven disposable fixture for the remaining cases.
      await context.request.post(base + '/api/test-state');
    } finally { await context.close(); }
  });
  await test('return/paid query flags and activation/reload never promote pending or remove payment CTA', async () => {
    const { context, page, subject } = await setup(); try {
      await register(page); await page.getByRole('button', { name: 'Оплатить участие', exact: true }).click();
      await page.evaluate(() => window.__miniappFixture.emit('activated'));
      await page.goto(base + '/miniapp?event=fixture-paid&paid=true&return=success'); await pending(page);
      await page.getByRole('button', { name: 'Оплатить участие', exact: true }).waitFor();
      const s = await state(context, subject); assert.equal(s.registrations[0].status, 'pending'); assert.equal(s.attempts[0].status, 'pending'); assert.equal(s.attempts[0].confirmed_at, null);
    } finally { await context.close(); }
  });
  for (const status of ['paid', 'confirmed']) await test('only server ' + status + ' status shows confirmed payment after reload', async () => {
    const { context, page, subject } = await setup(); try {
      await register(page); await pending(page); await state(context, subject, status);
      await page.reload(); await page.getByRole('heading', { name: '✅ Оплата подтверждена', exact: true }).waitFor();
      await page.getByText('Вы зарегистрированы', { exact: true }).waitFor(); assert.equal(await page.getByRole('button', { name: 'Оплатить участие', exact: true }).count(), 0);
      await page.screenshot({ path: path.join(out, status + '-confirmed.png'), fullPage: true });
    } finally { await context.close(); }
  });
  await test('My registrations distinguishes pending, free and confirmed with a working server payment link', async () => {
    const { context, page, subject } = await setup(); try {
      await register(page); await page.goto(base + '/miniapp?event=fixture-event'); await register(page);
      await page.locator('.miniapp-nav button').nth(2).click(); const rows = page.locator('[data-registration]');
      const paid = rows.filter({ has: page.getByRole('heading', { name: 'SYNTHETIC_PAID_EVENT', exact: true }) });
      const free = rows.filter({ has: page.getByRole('heading', { name: 'PRIVATE_SYNTHETIC_EVENT_TITLE', exact: true }) });
      await paid.getByText('🟡 Ожидает оплаты', { exact: true }).waitFor(); assert.match(await paid.innerText(), /К оплате:.*100[,.]10/);
      await paid.getByRole('button', { name: 'Оплатить', exact: true }).click(); assert.equal(new URL(await page.evaluate(() => window.__miniappFixture.calls.links.at(-1))).searchParams.get('price'), '100.1');
      await free.getByText('✅ Зарегистрирован', { exact: true }).waitFor(); assert.equal(await free.getByRole('button', { name: 'Оплатить', exact: true }).count(), 0);
      await state(context, subject, 'paid'); await page.reload(); await page.locator('.miniapp-nav button').nth(2).click();
      await paid.getByText('✅ Подтверждено', { exact: true }).waitFor(); assert.equal(await paid.getByRole('button', { name: 'Оплатить', exact: true }).count(), 0);
    } finally { await context.close(); }
  });
  await test('legacy paid pending without a payment URL shows known amount and WhatsApp, no dead button', async () => {
    const { context, page, subject } = await setup(); try {
      await state(context, subject, 'missing'); await page.goto(base + '/miniapp?event=fixture-no-link'); await pending(page);
      await page.getByText('Регистрация создана, но ссылка на оплату временно недоступна.', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Оплатить участие', exact: true }).count(), 0);
      assert.match(await page.locator('#miniapp-receipt .miniapp-total').innerText(), /77[,.]00/);
      const contact = page.getByRole('link', { name: 'Связаться с Menorah Center', exact: true }); assert.match(await contact.getAttribute('href'), /^https:\/\/wa\.me\/972506700779/);
      await contact.click(); assert.match(await page.evaluate(() => window.__miniappFixture.calls.links.at(-1)), /^https:\/\/wa\.me\/972506700779/);
      await page.locator('.miniapp-nav button').nth(2).click(); const row = page.locator('[data-registration]').filter({ has: page.getByRole('heading', { name: 'SYNTHETIC_MISSING_PAYMENT', exact: true }) });
      await row.getByRole('link', { name: 'Связаться с Menorah Center', exact: true }).waitFor(); assert.equal(await row.getByRole('button', { name: 'Оплатить', exact: true }).count(), 0);
    } finally { await context.close(); }
  });
  await test('unsafe persisted URL is suppressed by the server and falls back to WhatsApp', async () => {
    const { context, page, subject } = await setup(); try {
      await register(page); await state(context, subject, 'unsafe'); await page.reload(); await pending(page);
      await page.getByRole('link', { name: 'Связаться с Menorah Center', exact: true }).waitFor(); assert.equal(await page.getByRole('button', { name: 'Оплатить участие', exact: true }).count(), 0);
    } finally { await context.close(); }
  });
  for (const sdk of ['missing', 'throws']) await test(sdk + ' Telegram openLink safely falls back without marking payment successful', async () => {
    const { context, page, subject } = await setup(); try {
      await register(page); await page.evaluate(sdk => {
        window.__paymentOpens = []; window.open = (...args) => { window.__paymentOpens.push(args); return null; };
        if (sdk === 'missing') delete window.Telegram.WebApp.openLink; else window.Telegram.WebApp.openLink = () => { throw new Error('Unsupported method'); };
      }, sdk);
      await page.getByRole('button', { name: 'Оплатить участие', exact: true }).click(); const calls = await page.evaluate(() => window.__paymentOpens);
      assert.equal(calls.length, 1); assert.equal(new URL(calls[0][0]).protocol, 'https:'); assert.equal(calls[0][1], '_blank'); assert.equal(calls[0][2], 'noopener,noreferrer');
      await pending(page); assert.equal((await state(context, subject)).registrations[0].status, 'pending');
    } finally { await context.close(); }
  });
  assert.deepEqual(errors, []); console.log('TOTAL ' + checks.length + ' PASS');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await browser?.close(); fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'miniapp-payment-ux-browser-results.json'), JSON.stringify({ environment: 'Local Chromium 320/390/1280 + actual routes/session/SQL; synthetic Telegram SDK; external requests blocked', checks, errors, exitCode: process.exitCode || 0, realPayments: 0, productionChanged: false, realTelegramWebView: 'NOT VERIFIED' }, null, 2) + '\n');
});
