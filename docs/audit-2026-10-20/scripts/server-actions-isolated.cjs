/* Audit-only behavior probes. All imports are intercepted; no DB/network/env access. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const ROOT = path.resolve(__dirname, '../../..');

function fixture(file, { actor = null, rows = {}, failTable = null } = {}) {
  const data = structuredClone(rows);
  const calls = { auth: 0, currentUser: 0, writes: [], mails: 0, uploads: [] };
  const schema = new Proxy({}, { get: (_, name) => new Proxy({ __name: name }, {
    get: (table, key) => key === '__name' ? table.__name : { table: name, column: key },
  }) });
  const matches = (row, expr) => !expr || (expr.op === 'eq' ? row[expr.col.column] === expr.value : expr.op === 'and' ? expr.parts.every(e => matches(row, e)) : true);
  function builder(op, table, selection) {
    const b = { table, selection, cond: null, payload: null };
    for (const method of ['orderBy', 'limit', 'offset', 'leftJoin', 'innerJoin']) b[method] = () => b;
    b.from = (t) => { b.table = t; return b; };
    b.where = (cond) => { b.cond = cond; return b; };
    b.set = b.values = (payload) => { b.payload = payload; return b; };
    b.onConflictDoUpdate = () => b;
    b.then = (resolve, reject) => Promise.resolve().then(() => {
      const name = b.table.__name;
      if (failTable === name && op !== 'select') throw new Error('synthetic database failure');
      const list = data[name] ||= [];
      if (op === 'select') return list.filter(row => matches(row, b.cond));
      calls.writes.push({ op, table: name, payload: structuredClone(b.payload), cond: b.cond });
      if (op === 'insert') list.push(...(Array.isArray(b.payload) ? b.payload : [b.payload]));
      if (op === 'update') list.filter(row => matches(row, b.cond)).forEach(row => Object.assign(row, b.payload));
      if (op === 'delete') data[name] = list.filter(row => !matches(row, b.cond));
      return [];
    }).then(resolve, reject);
    return b;
  }
  const db = {
    select: selection => builder('select', null, selection),
    insert: table => builder('insert', table),
    update: table => builder('update', table),
    delete: table => builder('delete', table),
    query: new Proxy({}, { get: (_, table) => ({
      findMany: async options => (data[table] || []).filter(row => matches(row, options?.where)),
      findFirst: async options => (data[table] || []).find(row => matches(row, options?.where)),
    }) }),
  };
  const drizzle = {
    eq: (col, value) => ({ op: 'eq', col, value }),
    and: (...parts) => ({ op: 'and', parts }),
    desc: x => x, inArray: () => null, ilike: () => null, or: () => null,
    sql: () => null,
  };
  const modules = {
    '@/lib/db': { db }, '@/lib/db/schema': schema, 'drizzle-orm': drizzle,
    'next/cache': { revalidatePath() {} },
    '@clerk/nextjs/server': {
      auth: async () => { calls.auth++; return { userId: actor }; },
      currentUser: async () => { calls.currentUser++; return null; },
    },
    '@/actions/telegram': { sendEventRegistrationNotification: async () => {}, sendServiceRegistrationNotification: async () => {} },
    './notification': { createNotification: async () => {} },
    nodemailer: { __esModule: true, default: { createTransport: () => ({ sendMail: async () => { calls.mails++; } }) } },
    '@supabase/supabase-js': { createClient: () => ({ storage: { from: () => ({
      upload: async (objectPath, file) => { calls.uploads.push({ objectPath, file }); return { error: null }; },
      getPublicUrl: objectPath => ({ data: { publicUrl: 'https://synthetic.invalid/' + objectPath } }),
    }) } }) },
  };
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const sourceModule = { exports: {} };
  const context = vm.createContext({ module: sourceModule, exports: sourceModule.exports,
    require: id => { if (!(id in modules)) throw new Error('Blocked import: ' + id); return modules[id]; },
    process: { env: {} }, console: { log() {}, error() {} }, URL, URLSearchParams, Date, Math,
  });
  vm.runInContext(output, context, { filename: file });
  return { action: sourceModule.exports, calls, data };
}
const cases = [];
const probe = (name, fn) => cases.push([name, fn]);
probe('SEC-01 guest role escalation reaches DB write', async () => {
  const f = fixture('actions/user.ts', { rows: { users: [{ id: 'synthetic-attacker', role: 'client' }] } });
  assert.equal((await f.action.updateUserRoleAction('synthetic-attacker', 'superadmin')).success, true);
  assert.equal(f.data.users[0].role, 'superadmin'); assert.equal(f.calls.auth, 0);
});
probe('SEC-02 guest reads sensitive synthetic profile fields', async () => {
  const f = fixture('actions/user.ts', { rows: { users: [{ id: 'synthetic-victim', jewishStatus: 'synthetic-status', childrenData: [{ name: 'Synthetic child' }] }] } });
  assert.equal((await f.action.getAllUsers())[0].childrenData[0].name, 'Synthetic child'); assert.equal(f.calls.auth, 0);
});
probe('SEC-03 guest overwrites another family', async () => {
  const f = fixture('actions/user.ts', { rows: { users: [{ id: 'synthetic-victim' }] } });
  assert.equal((await f.action.updateFamilyProfile('synthetic-victim', null, [{ name: 'Injected synthetic child' }])).success, true);
  assert.equal(f.data.users[0].hasChildren, true); assert.equal(f.calls.auth, 0);
});
probe('SEC-03 guest completes victim profile without required status', async () => {
  const f = fixture('actions/user.ts');
  assert.equal((await f.action.completeUserProfile('synthetic-victim', {})).success, true);
  assert.equal(f.data.users[0].isProfileComplete, true); assert.equal(f.data.users[0].agreedToPrivacy, true);
  assert.equal(f.data.users[0].jewishStatus, undefined);
});
probe('SEC-04 guest updates event and payment URL', async () => {
  const f = fixture('actions/event.ts', { rows: { events: [{ id: 'synthetic-event', paymentUrl: 'https://payments.invalid/old' }] } });
  assert.equal((await f.action.updateEvent('synthetic-event', { paymentUrl: 'https://synthetic.invalid/redirect' })).success, true);
  assert.equal(f.data.events[0].paymentUrl, 'https://synthetic.invalid/redirect'); assert.equal(f.calls.auth, 0);
});
probe('SEC-05 omitted amount marks priced closed event as paid', async () => {
  const f = fixture('actions/event.ts', { rows: { users: [{ id: 'synthetic-victim', isProfileComplete: false }], events: [{ id: 'synthetic-event', isFree: false, price: '100', isRegistrationClosed: true, status: 'completed' }] } });
  assert.equal((await f.action.registerForEvent('synthetic-event', 'synthetic-victim')).success, true);
  assert.equal(f.data.eventParticipants[0].status, 'paid'); assert.equal(f.calls.auth, 0);
});
probe('SEC-06 child selection and creation accepted without eligibility or ownership', async () => {
  const f = fixture('actions/event.ts', { rows: { users: [{ id: 'synthetic-father', jewishStatus: 'not-jewish', childrenData: [] }], events: [{ id: 'synthetic-event', isFree: true }] } });
  await f.action.registerForEvent('synthetic-event', 'synthetic-father', null, { family: { child_999: true }, extraKids: -7 }, { newChild: { name: 'Synthetic child', dateOfBirth: '2020-01-01' } });
  assert.equal(f.data.users[0].childrenData.length, 1); assert.equal(f.data.eventParticipants[0].extraData.family.child_999, true);
});
probe('SEC-06 both authenticated child update variants ignore parental eligibility', async () => {
  for (const file of ['actions/kids.actions.ts', 'actions/kids-profile.ts']) {
    const f = fixture(file, { actor: 'synthetic-father', rows: { users: [{ id: 'synthetic-father', jewishStatus: 'not-jewish' }] } });
    assert.equal((await f.action.updateUserChildren([{ name: 'Synthetic child' }])).success, true);
    assert.equal(f.data.users[0].childrenData.length, 1);
  }
});
probe('SEC-06 guest creates Kids application', async () => {
  const f = fixture('actions/kids.actions.ts');
  assert.equal((await f.action.submitKidsApplication({ programTitle: 'Synthetic', parentFirstName: 'Synthetic', parentLastName: 'Parent', phone: 'synthetic', email: 'synthetic@example.invalid', children: [{ name: 'Synthetic child' }] })).success, true);
  assert.equal(f.data.kidsApplications[0].userId, null);
});
probe('SEC-07 guest registers victim for service', async () => {
  const f = fixture('actions/service.ts', { rows: { services: [{ id: 'synthetic-service', isActive: false }], users: [{ id: 'synthetic-victim' }] } });
  assert.equal((await f.action.registerForService('synthetic-service', 'synthetic-victim', 'synthetic')).success, true);
  assert.equal(f.data.serviceParticipants[0].userId, 'synthetic-victim'); assert.equal(f.calls.auth, 0);
});
probe('SEC-08 two concurrent event requests create duplicates', async () => {
  const f = fixture('actions/event.ts', { rows: { events: [{ id: 'synthetic-event' }], users: [{ id: 'synthetic-user' }] } });
  await Promise.all([f.action.registerForEvent('synthetic-event', 'synthetic-user'), f.action.registerForEvent('synthetic-event', 'synthetic-user')]);
  assert.equal(f.data.eventParticipants.length, 2);
});
probe('SEC-08 two concurrent service requests create duplicates', async () => {
  const f = fixture('actions/service.ts');
  await Promise.all([f.action.registerForService('synthetic-service', 'synthetic-user', 'synthetic'), f.action.registerForService('synthetic-service', 'synthetic-user', 'synthetic')]);
  assert.equal(f.data.serviceParticipants.length, 2);
});
probe('SEC-09 profile commits before missing event validation', async () => {
  const f = fixture('actions/event.ts', { rows: { users: [{ id: 'synthetic-user', childrenData: [] }] } });
  assert.equal((await f.action.registerForEvent('missing-event', 'synthetic-user', null, {}, { newChild: { name: 'Synthetic child', dateOfBirth: '2020-01-01' } })).success, false);
  assert.equal(f.data.users[0].childrenData.length, 1);
});
probe('SEC-09 profile remains changed when participant DB write fails', async () => {
  const f = fixture('actions/event.ts', { rows: { users: [{ id: 'synthetic-user', childrenData: [] }], events: [{ id: 'synthetic-event' }] }, failTable: 'eventParticipants' });
  assert.equal((await f.action.registerForEvent('synthetic-event', 'synthetic-user', null, {}, { newChild: { name: 'Synthetic child', dateOfBirth: '2020-01-01' } })).success, false);
  assert.equal(f.data.users[0].childrenData.length, 1);
});
probe('SEC-10 guest can delete video and task', async () => {
  for (const [file, name] of [['actions/video.ts', 'deleteVideo'], ['actions/task.ts', 'deleteTaskAction']]) {
    const f = fixture(file); assert.equal((await f.action[name]('synthetic-object')).success, true); assert.equal(f.calls.auth, 0); assert.equal(f.calls.writes[0].op, 'delete');
  }
});
probe('SEC-11 ordinary client publishes attributed raw HTML', async () => {
  const f = fixture('actions/news.ts', { actor: 'synthetic-client' });
  const content = '<img src=x onerror="globalThis.__auditSyntheticXss=1">';
  assert.equal((await f.action.createNews({ title: 'Synthetic', content, isPinned: true, targetAuthorId: 'synthetic-victim', status: 'published' })).success, true);
  assert.equal(f.data.news[0].isPublished, true); assert.equal(f.data.news[0].content, content); assert.equal(f.data.news[0].authorId, 'synthetic-victim');
});
probe('SEC-12 guest reads unpublished article with complete commenter record', async () => {
  const f = fixture('actions/news.ts', { rows: { news: [{ id: 'synthetic-article', slug: 'synthetic-draft', isPublished: false, status: 'draft', comments: [{ user: { childrenData: [{ name: 'Synthetic child' }], jewishStatus: 'synthetic-status' } }] }] } });
  const article = await f.action.getNewsBySlug('synthetic-draft');
  assert.equal(article.status, 'draft'); assert.equal(article.comments[0].user.childrenData[0].name, 'Synthetic child'); assert.equal(f.calls.auth, 0);
});
probe('SEC-13 authenticated client unpublishes someone else via review', async () => {
  const f = fixture('actions/moderation.actions.ts', { actor: 'synthetic-client', rows: { news: [{ id: 'synthetic-victim-article', authorId: 'synthetic-victim', isPublished: true }] } });
  assert.equal((await f.action.submitForReview('synthetic-victim-article', 'news')).success, true);
  assert.equal(f.data.news[0].isPublished, false);
});
probe('SEC-14 guest upload handler accepts HTML without auth', async () => {
  const f = fixture('actions/news.ts');
  assert.equal((await f.action.uploadImageAction({ get: () => ({ name: 'synthetic.html', type: 'text/html', size: 42 }) })).success, true);
  assert.equal(f.calls.uploads.length, 1); assert.equal(f.calls.auth, 0);
});
probe('SEC-15 retry of pending zero-amount registration reports success but remains pending', async () => {
  const f = fixture('actions/event.ts', { rows: { users: [{ id: 'synthetic-user' }], events: [{ id: 'synthetic-event', isFree: true }], eventParticipants: [{ id: 'synthetic-participant', userId: 'synthetic-user', eventId: 'synthetic-event', status: 'pending' }] } });
  const result = await f.action.registerForEvent('synthetic-event', 'synthetic-user', null, {}, undefined, 0);
  assert.equal(result.success, true); assert.equal(result.paymentUrl, null); assert.equal(f.data.eventParticipants[0].status, 'pending');
});
probe('CONTROL secure role action rejects guest and client', async () => {
  for (const actor of [null, 'synthetic-client']) {
    const f = fixture('actions/role.ts', { actor, rows: { users: [{ id: 'synthetic-client', role: 'client' }] } });
    assert.ok((await f.action.updateUserRole('synthetic-victim', 'admin')).error); assert.equal(f.calls.writes.length, 0);
  }
});
probe('CONTROL secure participant and Kids admin actions reject client', async () => {
  for (const [file, name] of [['actions/event.ts', 'updateEventParticipantStatus'], ['actions/kids.actions.ts', 'updateKidsApplicationStatus']]) {
    const f = fixture(file, { actor: 'synthetic-client', rows: { users: [{ id: 'synthetic-client', role: 'client' }] } });
    assert.equal((await f.action[name]('synthetic-id', 'paid')).success, false); assert.equal(f.calls.writes.length, 0);
  }
});
probe('CONTROL own-children update constrains userId to session', async () => {
  const f = fixture('actions/kids-profile.ts', { actor: 'synthetic-mother', rows: { users: [{ id: 'synthetic-mother' }, { id: 'synthetic-other', childrenData: [] }] } });
  await f.action.updateUserChildren([{ name: 'Synthetic child' }]); assert.equal(f.data.users[1].childrenData.length, 0);
});
(async () => {
  let failures = 0;
  for (const [name, run] of cases) {
    try { await run(); console.log('PASS ' + name); }
    catch (error) { failures++; console.log('FAIL ' + name + ': ' + error.message); }
  }
  console.log(`${cases.length - failures}/${cases.length} audit probes passed; PASS confirms the named current behavior, not security readiness.`);
  process.exitCode = failures ? 1 : 0;
})();
