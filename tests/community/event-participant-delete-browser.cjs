/* Actual CRM page -> server action -> isolated SQL, with synthetic Clerk identity. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('/tmp/menora-browser-runtime/node_modules/playwright');
const base = process.env.COMMUNITY_BROWSER_BASE || 'http://127.0.0.1:3372';
const out = process.env.COMMUNITY_TEST_OUTPUT || '/tmp/menora-event-delete-browser';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const checks = [], errors = []; let browser;
const pendingPrompt = 'Заявка ожидает оплаты. После удаления ссылка на эту регистрацию больше не будет учитываться. Удалить?';
const paidMessage = 'Оплаченную регистрацию нельзя удалить. Сначала необходимо корректно обработать платёж.';
async function test(name, fn) { await fn(); checks.push({ name, status: 'PASS' }); console.log('PASS ' + name); }
async function state(context) { return (await context.request.get(base + '/api/test-event-delete')).json(); }
const target = page => page.locator('tr').filter({ hasText: 'DELETE_UI_TARGET' });
const remove = page => target(page).getByRole('button', { name: 'Удалить заявку', exact: true });
const error = page => page.getByRole('alert').filter({ hasText: 'Не удалось удалить заявку' });
async function setup(options = {}, width = 1280) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  assert.equal((await state(context)).testDatabase, 'isolated-pglite');
  assert.equal((await context.request.post(base + '/api/test-state')).status(), 200);
  assert.equal((await context.request.post(base + '/api/test-event-delete', { data: options })).status(), 200);
  await context.addCookies([{ name: '_community_fixture', value: 'fixture-admin', url: base }]);
  const page = await context.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + '/dashboard/applications'); await target(page).waitFor();
  return { context, page };
}
function confirm(page, message, accept = true) {
  page.once('dialog', dialog => { assert.equal(dialog.type(), 'confirm'); assert.equal(dialog.message(), message); return accept ? dialog.accept() : dialog.dismiss(); });
}
async function success(page, context, prompt = pendingPrompt) {
  confirm(page, prompt); await remove(page).click(); await target(page).waitFor({ state: 'hidden' });
  await page.locator('tr').filter({ hasText: 'DELETE_UI_CONTROL' }).waitFor();
  const saved = await state(context); assert.deepEqual(saved.participants.map(row => row.id), ['delete-ui-control']); assert.deepEqual(saved.attempts, []);
}
(async () => {
  fs.mkdirSync(out, { recursive: true }); browser = await chromium.launch({ headless: true });
  for (const width of [390, 1280]) await test(width + ' pending payment delete waits for success, removes only its row and makes no hard reload', async () => {
    const { context, page } = await setup({}, width);
    try {
      let held, navigations = 0, calls = 0;
      page.on('request', request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) navigations++; });
      await context.route('**/dashboard/applications', route => {
        if (route.request().method() === 'POST' && route.request().postData()?.includes('delete-ui-target')) { calls++; held = route; return; }
        return route.continue();
      });
      confirm(page, pendingPrompt); await remove(page).click();
      await page.waitForFunction(() => document.querySelector('button[aria-busy="true"]')?.disabled);
      for (let i = 0; !held && i < 100; i++) await new Promise(resolve => setTimeout(resolve, 20));
      assert.ok(held);
      assert.equal(await target(page).isVisible(), true); assert.equal(await remove(page).isDisabled(), true);
      await remove(page).dispatchEvent('click'); assert.equal(calls, 1);
      await held.continue(); await target(page).waitFor({ state: 'hidden' });
      assert.equal(navigations, 0); assert.equal(calls, 1);
      const saved = await state(context); assert.deepEqual(saved.participants.map(row => row.id), ['delete-ui-control']); assert.deepEqual(saved.attempts, []);
      assert.doesNotMatch(await page.getByRole('button').filter({ hasText: 'DELETE_UI_EVENT' }).innerText(), /новых/i);
      await page.screenshot({ path: path.join(out, width + '-deleted.png'), fullPage: true });
    } finally { await context.close(); }
  });
  await test('free registration uses the generic confirm and disappears after successful real action', async () => {
    const { context, page } = await setup({ free: true });
    try { await success(page, context, 'Удалить эту заявку?'); } finally { await context.close(); }
  });
  await test('dismissed pending confirmation sends no deletion and keeps both SQL rows', async () => {
    const { context, page } = await setup();
    try {
      let calls = 0; page.on('request', request => { if (request.method() === 'POST' && request.postData()?.includes('delete-ui-target')) calls++; });
      confirm(page, pendingPrompt, false); await remove(page).click();
      assert.equal(calls, 0); assert.equal((await state(context)).participants.length, 2); assert.equal((await state(context)).attempts.length, 1);
    } finally { await context.close(); }
  });
  await test('paid attempt rejection shows safe server message and preserves the row and pending count', async () => {
    const { context, page } = await setup({ attempt: 'paid' });
    try {
      confirm(page, pendingPrompt); await remove(page).click(); await error(page).waitFor();
      assert.ok((await error(page).innerText()).includes(paidMessage)); assert.equal(await target(page).isVisible(), true);
      await page.waitForFunction(() => {
        const row = [...document.querySelectorAll('tr')].find(item => item.textContent.includes('DELETE_UI_TARGET'));
        return row && [...row.parentElement.children].every(item =>
          Number(getComputedStyle(item).opacity) > 0.95 && getComputedStyle(item).transform === 'none');
      });
      assert.match(await page.getByRole('button').filter({ hasText: 'DELETE_UI_EVENT' }).innerText(), /1 новых/i);
      const saved = await state(context); assert.equal(saved.participants.length, 2); assert.equal(saved.attempts[0].status, 'paid');
      await page.screenshot({ path: path.join(out, 'paid-rejection.png'), fullPage: true });
    } finally { await context.close(); }
  });
  await test('transport failure keeps the row, shows error and allows a successful retry', async () => {
    const { context, page } = await setup();
    try {
      let fail = true;
      const interceptor = route => route.request().method() === 'POST' && route.request().postData()?.includes('delete-ui-target') && fail
        ? (fail = false, route.abort('failed')) : route.continue();
      await context.route('**/dashboard/applications', interceptor);
      confirm(page, pendingPrompt); await remove(page).click(); await error(page).waitFor();
      assert.equal(await target(page).isVisible(), true); assert.equal((await state(context)).attempts.length, 1);
      await success(page, context); assert.equal(await error(page).count(), 0);
    } finally { await context.close(); }
  });
  await test('cancelled payment attempt can be deleted through the same dashboard action', async () => {
    const { context, page } = await setup({ attempt: 'cancelled' });
    try { await success(page, context); } finally { await context.close(); }
  });
  await test('historical paid participant has a disabled delete button and retains its payment history', async () => {
    const { context, page } = await setup({ status: 'paid', attempt: 'paid' });
    try { assert.equal(await remove(page).isDisabled(), true); assert.equal((await state(context)).participants.length, 2); }
    finally { await context.close(); }
  });
  await test('lost staff permission is checked by the real action and reported without hiding the row', async () => {
    const { context, page } = await setup();
    try {
      assert.equal((await context.request.post(base + '/api/test-event-delete', { data: { mode: 'demote' } })).status(), 200);
      confirm(page, pendingPrompt); await remove(page).click(); await error(page).waitFor();
      assert.ok((await error(page).innerText()).includes('Действие доступно только администратору')); assert.equal(await target(page).isVisible(), true);
      assert.equal((await state(context)).attempts.length, 1);
    } finally { await context.close(); }
  });
  await test('stale row deletion reports the explicit server not-found error', async () => {
    const { context, page } = await setup();
    try {
      assert.equal((await context.request.post(base + '/api/test-event-delete', { data: { mode: 'remove' } })).status(), 200);
      confirm(page, pendingPrompt); await remove(page).click(); await error(page).waitFor();
      assert.ok((await error(page).innerText()).includes('Запись не найдена'));
    } finally { await context.close(); }
  });
  assert.deepEqual(errors, []); console.log(checks.length + '/' + checks.length + ' dashboard deletion checks PASS');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => {
  await browser?.close(); fs.writeFileSync(path.join(out, 'event-participant-delete-browser-results.json'), JSON.stringify({ environment: 'Local Playwright + real dashboard/action/SQL; synthetic identity, no remote services', checks, errors, exitCode: process.exitCode || 0 }, null, 2) + '\n');
});
