/* Isolated audit probes: real TypeScript bodies, in-memory dependencies only.
 * No .env loading, databases, outbound network, or product source mutations.
 * Successful probes below confirm defects in the audited implementation,
 * not successful security controls or production behavior.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const repo = path.resolve(__dirname, '../../..');
const schema = new Proxy({}, { get: (_, table) => new Proxy({ table }, { get: (t, col) => col === 'table' ? t.table : `${table}.${String(col)}` }) });
const orm = new Proxy({}, { get: (_, op) => (...args) => ({ op, args }) });
const quiet = { log() {}, error() {}, warn() {} };
function load(relative, mocks = {}, environment = {}, globals = {}) {
  const source = fs.readFileSync(path.join(repo, relative), 'utf8');
  const exports = {};
  const defaults = {
    '@/lib/db/schema': schema,
    'drizzle-orm': orm,
    'next/cache': { revalidatePath() {} },
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@clerk/nextjs/server': { auth: async () => ({ userId: null }), currentUser: async () => null },
  };
  const requires = { ...defaults, ...mocks };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports,
    require: (name) => { if (!(name in requires)) throw new Error(`Unmocked import ${name}`); return requires[name]; },
    process: { env: environment }, Request, Response, URL, URLSearchParams, Buffer, console: quiet,
    setTimeout: (fn) => { fn(); return 0; }, ...globals,
  }, { filename: relative });
  return exports;
}
const results = [];
async function probe(id, fn) { await fn(); results.push({ id, result: 'CONFIRMED_IN_ISOLATED_MOCK' }); }
(async () => {
  await probe('DI-BOT-UNAUTHENTICATED-UPDATE-ALL', async () => {
    const calls = [];
    const db = { query: { botSettings: { findFirst: async () => ({ id: 'synthetic-settings' }) } }, update: () => ({ set: async (data) => { calls.push(data); } }) };
    const action = load('actions/bot-settings.ts', { '@/lib/db': { db } });
    assert.equal((await action.updateBotSettings({ notificationGroupId: 'synthetic-group' })).success, true);
    assert.equal(calls[0].notificationGroupId, 'synthetic-group');
  });
  await probe('DI-NOTIFICATIONS-FOREIGN-READ-DELETE-CREATE', async () => {
    const calls = [];
    const db = {
      select: () => ({ from: () => ({ where: (where) => ({ orderBy: async () => { calls.push(['read', where]); return [{ message: 'synthetic-private-message' }]; } }) }) }),
      delete: () => ({ where: async (where) => { calls.push(['delete', where]); } }),
      insert: () => ({ values: async (data) => { calls.push(['insert', data]); } }),
    };
    const action = load('actions/notification.ts', { '@/lib/db': { db } });
    assert.equal((await action.getUserNotifications('synthetic-other-user'))[0].message, 'synthetic-private-message');
    assert.equal((await action.deleteNotification('synthetic-other-notification')).success, true);
    assert.equal((await action.createNotification('synthetic-other-user', 'synthetic', 'synthetic', '/synthetic', 'synthetic-spoofed-sender')).success, true);
    assert.equal(calls[2][1].senderId, 'synthetic-spoofed-sender');
  });
  await probe('DI-WHATSAPP-UNAUTHENTICATED-SEND', async () => {
    const calls = [];
    const action = load('actions/whatsapp.ts', {}, { WHATSAPP_API_URL: 'https://example.invalid/synthetic', WHATSAPP_API_TOKEN: 'synthetic-not-a-secret' }, { fetch: async (...args) => { calls.push(args); return { ok: true }; } });
    assert.equal((await action.sendMassWhatsApp([{ phone: '0500000000', name: 'Synthetic' }], 'Synthetic {name}')).success, true);
    assert.equal(calls.length, 1);
    assert.equal(JSON.parse(calls[0][1].body).message, 'Synthetic Synthetic');
  });
  await probe('DI-STORAGE-UNAUTHENTICATED-SERVICE-ROLE-UPLOAD', async () => {
    let calls = 0;
    const client = { storage: { from: () => ({ upload: async () => { calls++; return { error: null }; }, getPublicUrl: () => ({ data: { publicUrl: 'https://example.invalid/synthetic' } }) }) } };
    const action = load('actions/news.ts', { '@/lib/db': { db: {} }, '@supabase/supabase-js': { createClient: () => client } }, { NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-not-a-secret' });
    assert.equal((await action.uploadImageAction({ get: () => ({ name: 'synthetic.html', size: 123456789, type: 'text/html' }) })).success, true);
    assert.equal(calls, 1);
  });
  await probe('DI-PAYMENT-UNSIGNED-PAID-THEN-DOWNGRADE', async () => {
    const updates = [];
    const db = { update: () => ({ set: (data) => ({ where: async () => { updates.push(data.status); } }) }) };
    const route = load('app/api/webhooks/shutafim/route.ts', { '@/lib/db': { db } });
    for (const status of ['paid', 'failed']) {
      const response = await route.POST(new Request('https://example.invalid/api/webhooks/shutafim', { method: 'POST', body: JSON.stringify({ custom1: 'synthetic-participant', status }) }));
      assert.equal(response.status, 200);
    }
    assert.deepEqual(updates, ['paid', 'abandoned']);
  });
  await probe('DI-CRON-MISSING-SECRET-AND-HTTP-FAILURE-SUCCESS', async () => {
    let calls = 0;
    const db = { query: { botSettings: { findFirst: async () => ({ isActive: true, reminderMessage: 'Synthetic' }) }, users: { findMany: async () => [{ telegramChatId: 'synthetic-chat' }] } } };
    const route = load('app/api/telegram/remind/route.ts', { '@/lib/db': { db } }, {}, { fetch: async () => { calls++; return { ok: false, status: 429 }; } });
    const response = await route.GET(new Request('https://example.invalid/api/telegram/remind', { headers: { Authorization: 'Bearer undefined' } }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.sent, 1);
    assert.equal(calls, 1);
  });
  await probe('DI-TELEGRAM-UNSIGNED-UPDATE-ACCEPTED', async () => {
    let calls = 0;
    class Telegraf { start() {} on() {} async handleUpdate() { calls++; } }
    const route = load('app/api/telegram/webhook/route.ts', { '@/lib/db': { db: {} }, telegraf: { Telegraf, Markup: { inlineKeyboard: () => ({}), button: { callback: () => ({}), url: () => ({}) } } } }, { TELEGRAM_BOT_TOKEN: 'synthetic-not-a-secret' });
    const response = await route.POST(new Request('https://example.invalid/api/telegram/webhook', { method: 'POST', body: JSON.stringify({ update_id: 1 }) }));
    assert.equal(response.status, 200);
    assert.equal(calls, 1);
  });
  await probe('DI-CLERK-SIGNATURE-RAW-BODY-RESERIALIZATION', async () => {
    const { Webhook } = require('svix');
    const secret = `whsec_${Buffer.alloc(32, 1).toString('base64')}`;
    const wh = new Webhook(secret);
    const timestamp = new Date();
    const eventId = 'synthetic-event-id';
    const body = '{\n  "type": "synthetic.ignored",\n  "data": {}\n}';
    const signedHeaders = { 'svix-id': eventId, 'svix-timestamp': String(Math.floor(timestamp.getTime() / 1000)), 'svix-signature': wh.sign(eventId, timestamp, body) };
    assert.equal(wh.verify(body, signedHeaders).type, 'synthetic.ignored');
    const route = load('app/api/webhooks/clerk/route.ts', { '@/lib/db': { db: {} }, svix: { Webhook }, 'next/headers': { headers: async () => new Headers(signedHeaders) } }, { CLERK_WEBHOOK_SECRET: secret });
    const response = await route.POST(new Request('https://example.invalid/api/webhooks/clerk', { method: 'POST', body }));
    assert.equal(response.status, 400);
  });
  await probe('DI-SMTP-FAILURE-AFTER-PERSISTED-PROFILE', async () => {
    let persisted = false;
    const db = { insert: () => ({ values: () => ({ onConflictDoUpdate: async () => { persisted = true; } }) }) };
    const action = load('actions/user.ts', {
      '@/lib/db': { db },
      '@clerk/nextjs/server': { currentUser: async () => ({ emailAddresses: [{ emailAddress: 'synthetic@example.invalid' }] }) },
      nodemailer: { default: { createTransport: () => ({ sendMail: async () => { throw new Error('Synthetic SMTP failure'); } }) } },
    });
    const result = await action.completeUserProfile('synthetic-user', { phoneCode: '+000', phone: '0000000' });
    assert.equal(persisted, true);
    assert.equal(result.success, false);
    assert.equal(result.message, 'Synthetic SMTP failure');
  });
  await probe('DI-EVENT-OMITTED-AMOUNT-PAID-AND-PARALLEL-DUPLICATES', async () => {
    const inserts = [];
    const db = {
      select: () => ({ from: (table) => ({ where: async () => {
        if (table.table === 'users') return [{ id: 'synthetic-user', firstName: 'Synthetic', email: 'synthetic@example.invalid', childrenData: [] }];
        if (table.table === 'events') return [{ id: 'synthetic-event', title: 'Synthetic', isFree: false, price: '100', paymentUrl: 'https://example.invalid/pay' }];
        return [];
      } }) }),
      insert: () => ({ values: async (data) => { inserts.push(data); } }),
    };
    const action = load('actions/event.ts', { '@/lib/db': { db }, '@/actions/telegram': { sendEventRegistrationNotification: async () => ({ success: true }) } });
    const result = await Promise.all([
      action.registerForEvent('synthetic-event', 'synthetic-user', null, {}),
      action.registerForEvent('synthetic-event', 'synthetic-user', null, {}),
    ]);
    assert.equal(inserts.length, 2);
    assert.equal(inserts[0].status, 'paid');
    assert.equal(inserts[1].status, 'paid');
    assert.equal(result[0].paymentUrl, null);
    assert.equal(result[1].paymentUrl, null);
  });
  console.log(JSON.stringify({ scope: 'Only real local function bodies with mocked side effects; no HTTP E2E or production assertions', probes: results }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
