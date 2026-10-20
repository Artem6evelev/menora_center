/* Targeted local Chromium checks. Real Next/actions/PGlite; mocked identity.
 * Shutafim requests are intercepted: no provider traffic or real payments. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require(process.env.COMMUNITY_BROWSER_RUNTIME || '/tmp/menora-browser-runtime/node_modules/playwright');
const base = 'http://127.0.0.1:3331';
const output = path.resolve(__dirname, '../../docs/targeted-fixes-2026-10-21/evidence/browser');
fs.mkdirSync(output, { recursive: true });
const checks = [], errors = [], paymentRequests = [];
const hint = 'Для личной записи это уточнение не требуется. Самостоятельное добавление и запись детей доступны после завершённого гиюра.';
let browser;
async function check(name, fn) {
  await fn(); checks.push({ name, status: 'PASS' }); console.log('PASS ' + name);
}
async function login(context, id) {
  await context.clearCookies();
  await context.addCookies([{ name: '_community_fixture', value: id, url: base, sameSite: 'Lax' }]);
}
async function state(context) { return (await context.request.get(base + '/api/test-state')).json(); }
async function noOverflow(page) { assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); }
async function fields(page) {
  await page.locator('#profile-firstName').fill('Browser');
  await page.locator('#profile-lastName').fill('Synthetic');
  await page.locator('#profile-phone').fill('+972501234567');
  await page.locator('#profile-dateOfBirth').fill('1990-02-03');
  await page.locator('#profile-city').fill('Synthetic City');
  await page.locator('#profile-marital').selectOption('single');
  await page.getByRole('checkbox', { name: /Я соглашаюсь/ }).check();
}
async function iframePrice(page, price) {
  const iframe = page.locator('iframe[title="Оплата Shutafim"]');
  await iframe.waitFor({ state: 'visible' });
  const url = new URL(await iframe.getAttribute('src'));
  assert.equal(url.origin, 'https://shutaf.im');
  assert.equal(url.pathname, '/donate/menorah_rishon');
  for (const [key, value] of Object.entries({ price, quantity: '1', cur: 'ILS', payments: '1', lang: 'ru', campaign: 'synthetic' })) assert.equal(url.searchParams.get(key), value);
  assert.ok(url.searchParams.get('custom1'));
  await page.frameLocator('iframe[title="Оплата Shutafim"]').getByText('Synthetic payment window').waitFor();
  return url.searchParams.get('custom1');
}
(async () => {
  browser = await chromium.launch({ headless: false });
  for (const [viewport, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin === base) return route.continue();
      if (url.origin === 'https://shutaf.im') {
        paymentRequests.push(url.toString());
        return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Synthetic payment</title><p>Synthetic payment window</p>' });
      }
      return route.abort('blockedbyclient');
    });
    const page = await context.newPage(); page.setDefaultTimeout(20000);
    page.on('pageerror', error => errors.push({ viewport, message: error.message }));
    for (const gender of ['female', 'male']) for (const affiliation of ['maternal', 'giyur']) {
      for (const stage of affiliation === 'giyur' ? [null, 'advanced', 'completed'] : [null]) {
        await check(`${viewport} ${gender} ${affiliation}/${stage}: save, events redirect, refresh and stage persistence`, async () => {
          const id = `fixture-target-${viewport}-${gender}-${affiliation}-${stage}`;
          await login(context, id); await page.goto(base + '/register?returnTo=%2Fevents%2Ffixture-paid');
          await page.locator(`[name=affiliation][value=${affiliation}]`).check();
          await page.locator(`[name=gender][value=${gender}]`).check();
          assert.equal(await page.locator('[name=affiliation]').count(), 3);
          if (affiliation === 'giyur') {
            assert.ok(await page.getByText(hint, { exact: true }).isVisible());
            assert.equal(await page.locator('[name=giyurStage]').count(), 2);
            assert.equal(await page.locator('[name=giyurStage][required]').count(), 0);
            if (stage) await page.locator(`[name=giyurStage][value=${stage}]`).check();
          }
          await fields(page); await noOverflow(page);
          await page.getByRole('button', { name: 'Сохранить анкету', exact: true }).click();
          await page.waitForURL(base + '/dashboard/events');
          await page.reload(); assert.equal(page.url(), base + '/dashboard/events');
          const saved = (await state(context)).users.find(user => user.id === id);
          assert.equal(saved.affiliation, affiliation); assert.equal(saved.giyurStage, stage);
          await page.goto(base + '/register');
          assert.equal(await page.locator('[name=giyurStage]:checked').count(), stage ? 1 : 0);
          if (stage) assert.equal(await page.locator('[name=giyurStage]:checked').inputValue(), stage);
          await page.getByRole('checkbox', { name: 'Есть дети', exact: true }).check();
          assert.equal(await page.getByRole('button', { name: 'Добавить ребёнка', exact: true }).count(), gender === 'female' && (affiliation === 'maternal' || stage === 'completed') ? 1 : 0);
        });
      }
    }
    await check(viewport + ' Shutafim reprices selections, opens iframe twice and closing/reloading keeps one pending record', async () => {
      await login(context, 'fixture-mom'); await page.goto(base + '/events/fixture-paid');
      await page.getByRole('button', { name: 'Записаться на мероприятие', exact: true }).click();
      await page.getByRole('checkbox', { name: /Synthetic child/ }).check();
      await page.getByRole('button', { name: 'Увеличить количество взрослых', exact: true }).click();
      assert.ok(await page.getByText('225.45 ₪', { exact: true }).isVisible());
      await noOverflow(page);
      await page.getByRole('button', { name: 'Оплатить', exact: true }).click();
      const firstId = await iframePrice(page, '225.45');
      assert.equal((await state(context)).participants.find(row => row.id === firstId).status, 'pending');
      await page.screenshot({ path: path.join(output, viewport + '-iframe.png'), fullPage: true });
      await page.getByRole('button', { name: 'Закрыть окно оплаты', exact: true }).click();
      assert.equal(await page.locator('iframe[title="Оплата Shutafim"]').count(), 0);
      assert.equal((await state(context)).participants.find(row => row.id === firstId).status, 'pending');
      await page.getByRole('button', { name: 'Записаться на мероприятие', exact: true }).click();
      assert.ok(await page.getByText('100.1 ₪', { exact: true }).isVisible());
      await page.getByRole('button', { name: 'Оплатить', exact: true }).click();
      assert.equal(await iframePrice(page, '100.1'), firstId);
      await page.getByRole('button', { name: 'Закрыть окно оплаты', exact: true }).click();
      await page.getByRole('button', { name: 'Записаться на мероприятие', exact: true }).click();
      if (viewport === 'desktop') {
        await page.getByRole('button', { name: 'Указать супруга/у', exact: true }).click();
        await page.getByPlaceholder('Имя супруга/и').fill('Added spouse');
        assert.ok(await page.getByText('200.2 ₪', { exact: true }).isVisible());
        await page.getByRole('button', { name: 'Оплатить', exact: true }).click();
        assert.equal(await iframePrice(page, '200.2'), firstId);
        await page.getByRole('button', { name: 'Закрыть окно оплаты', exact: true }).click();
        await page.getByRole('button', { name: 'Записаться на мероприятие', exact: true }).click();
      }
      assert.ok(await page.getByText('100.1 ₪', { exact: true }).isVisible());
      await page.getByRole('checkbox', { name: /Added spouse/ }).check();
      assert.ok(await page.getByText('200.2 ₪', { exact: true }).isVisible());
      await page.getByRole('button', { name: 'Отмена', exact: true }).click();
      await page.reload();
      const rows = (await state(context)).participants.filter(row => row.eventId === 'fixture-paid' && row.userId === 'fixture-mom');
      assert.equal(rows.length, 1); assert.equal(rows[0].status, 'pending');
    });
    await check(viewport + ' existing advanced woman can select self, sees no old child or child creation', async () => {
      await login(context, 'fixture-advanced'); await page.goto(base + '/events/fixture-paid');
      await page.getByRole('button', { name: 'Записаться на мероприятие', exact: true }).click();
      await page.getByText('Ваша семья:', { exact: true }).waitFor();
      assert.equal(await page.getByText(/Advanced existing child/).count(), 0);
      assert.equal(await page.getByRole('button', { name: /Добавить ребёнка/ }).count(), 0);
      await page.getByRole('button', { name: 'Оплатить', exact: true }).click();
      const id = await iframePrice(page, '100.1');
      assert.equal((await state(context)).participants.find(row => row.id === id).status, 'pending');
      await page.getByRole('button', { name: 'Закрыть окно оплаты', exact: true }).click();
    });
    await check(viewport + ' third category stays informational and cannot register', async () => {
      await login(context, 'fixture-none-father'); await page.goto(base + '/register');
      assert.equal(await page.locator('#profile-firstName').count(), 0);
      assert.equal(await page.locator('[name=affiliation][value=none]').isChecked(), true);
      await page.goto(base + '/events/fixture-paid');
      assert.equal(await page.getByRole('button', { name: 'Записаться на мероприятие', exact: true }).count(), 0);
      assert.equal(await page.getByText('SYNTHETIC_PAID_EVENT', { exact: true }).count(), 0);
      await noOverflow(page);
    });
    await check(viewport + ' unverified payment callback cannot mark a pending registration paid', async () => {
      const before = (await state(context)).participants.find(row => row.userId === 'fixture-mom' && row.eventId === 'fixture-paid');
      const response = await context.request.post(base + '/api/webhooks/shutafim', { data: { custom1: before.id, status: 'paid' } });
      assert.equal(response.status(), 503);
      assert.equal((await state(context)).participants.find(row => row.id === before.id).status, 'pending');
    });
    await context.close();
  }
  assert.deepEqual(errors, []); assert.ok(paymentRequests.length >= 6);
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ environment: base, identity: 'mock Clerk', database: 'disposable PGlite', provider: 'intercepted iframe response; no real Shutafim requests or payments', checks, errors, paymentRequests }, null, 2) + '\n');
  console.log(checks.length + '/' + checks.length + ' targeted browser checks passed');
})().catch(error => { console.error(error.stack); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
