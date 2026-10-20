/* Real source/actions + isolated PostgreSQL/WASM. Identity/cookies/delivery are
 * injected; this suite does NOT prove real Google OAuth or browser behavior. */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const ts = require('typescript');
const runtime = process.env.COMMUNITY_TEST_RUNTIME || '/tmp/menora-filter-test-runtime';
process.env.NODE_PATH = path.join(runtime, 'node_modules');
require('node:module').Module._initPaths();
const { PGlite } = require('@electric-sql/pglite');
const { drizzle } = require('drizzle-orm/pglite');
const { migrate } = require('drizzle-orm/pglite/migrator');
const { generateDrizzleJson, generateMigration } = require('drizzle-kit/api');
const { eq, and } = require('drizzle-orm');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'docs/production-readiness-2026-10-20/evidence');
fs.mkdirSync(output, { recursive: true });
let db, actor = null, browser = 'a', currentHeaders = new Headers();
const jars = new Map(), cookieOptions = [], cache = new Map(), afterCallbacks = [];
const secret = 'whsec_' + Buffer.alloc(32, 7).toString('base64');
const jar = () => { if (!jars.has(browser)) jars.set(browser, new Map()); return jars.get(browser); };
function source(file) {
  const full = path.join(root, file);
  if (cache.has(full)) return cache.get(full).exports;
  const sourceModule = { exports: {} }; cache.set(full, sourceModule);
  function localRequire(id) {
    if (id === 'server-only') return {};
    if (id === '@supabase/supabase-js') return { createClient() { throw new Error('Storage unavailable in isolated test'); } };
    if (id === '@/lib/db') return { db };
    if (id === '@clerk/nextjs/server') return {
      auth: async () => ({ userId: actor }),
      currentUser: async () => actor ? { id: actor, firstName: 'Identity name', lastName: 'Identity surname', imageUrl: '',
        primaryEmailAddressId: 'primary', emailAddresses: [{ id: 'primary', emailAddress: actor + '@example.invalid' }] } : null,
    };
    if (id === 'next/headers') return { headers: async () => currentHeaders,
      cookies: async () => ({ get: name => jar().has(name) ? { value: jar().get(name) } : undefined,
        set(name, value, options) { cookieOptions.push({ name, ...options }); if (options.maxAge === 0) jar().delete(name); else jar().set(name, value); } }) };
    if (id === 'next/cache') return { revalidatePath() {} };
    if (id === 'next/navigation') return { redirect(location) { throw Object.assign(new Error('redirect'), { location }); } };
    if (id === 'next/server') return { after: fn => afterCallbacks.push(fn), NextResponse: { json: (body, init) => new Response(JSON.stringify(body), init) } };
    if (id === '@/actions/telegram') return { sendEventRegistrationNotification: async () => {}, sendServiceRegistrationNotification: async () => {} };
    if (id === 'nodemailer') return { createTransport: () => ({ sendMail: async () => { throw new Error('Delivery blocked by test'); } }) };
    if (id.startsWith('@/') || id.startsWith('.')) {
      const stem = id.startsWith('@/') ? id.slice(2) : path.relative(root, path.resolve(path.dirname(full), id));
      for (const candidate of [stem, stem + '.ts', stem + '.tsx', stem + '/index.ts']) if (fs.existsSync(path.join(root, candidate)) && fs.statSync(path.join(root, candidate)).isFile()) return source(candidate);
    }
    if (['zod', 'drizzle-orm', 'drizzle-orm/pg-core', 'node:crypto', 'svix'].includes(id)) return require(id);
    throw new Error('Blocked external import ' + id);
  }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX,
  }}).outputText, { module: sourceModule, exports: sourceModule.exports, require: localRequire,
    process: { env: { NODE_ENV: 'test', CLERK_WEBHOOK_SECRET: secret } }, console: { log() {}, error() {} },
    crypto: crypto.webcrypto, Buffer, Date, Math, Set, Map, URL, URLSearchParams, Response, Request, Headers }, { filename: file });
  return sourceModule.exports;
}
const schema = source('lib/db/schema.ts');
const current = generateDrizzleJson(schema);
const manual = fs.readFileSync(path.join(root, 'docs/production-readiness-2026-10-20/SUPABASE_MANUAL_MIGRATION.sql'), 'utf8');
const checks = [];
async function test(name, fn) { await fn(); checks.push({ name, status: 'PASS' }); console.log('PASS ' + name); }
const payload = extra => ({ affiliation: 'maternal', gender: 'female', expectedRevision: 0,
  firstName: 'Persisted given', lastName: 'Persisted surname', phone: '+972501234567', dateOfBirth: '1990-02-03',
  city: 'Synthetic city', maritalStatus: 'married', spouseName: 'Persisted spouse', hasChildren: false,
  agreedToPrivacy: true, ...extra });
async function row(id) { return (await db.select().from(schema.users).where(eq(schema.users.id, id)))[0]; }
async function legacyDatabase() {
  const pg = new PGlite(); const baseline = structuredClone(current);
  delete baseline.tables['public.community_audit']; delete baseline.tables['public.community_registration_drafts'];
  for (const col of ['gender','affiliation','giyur_stage','filter_version','filter_revision','filter_completed_at','identity_disabled_at']) delete baseline.tables['public.users'].columns[col];
  baseline.tables['public.users'].checkConstraints = {};
  const empty = { ...baseline, tables: {}, schemas: {}, enums: {}, sequences: {}, roles: {}, policies: {}, views: {} };
  await pg.exec((await generateMigration(empty, baseline)).join('\n'));
  await pg.exec(`INSERT INTO users(id,email,first_name,has_children,children_data,jewish_status) VALUES ('legacy','legacy@example.invalid','Unchanged legacy',false,'[{"name":"Preserved child","dateOfBirth":"2020-01-01"}]','Unchanged historical answer');
    INSERT INTO events(id,title,is_free,price) VALUES ('history','Synthetic history',false,'100');
    INSERT INTO event_participants(id,event_id,user_id,status,extra_data) VALUES ('history-ticket','history','legacy','paid','{"family":{"child_0":true}}');
    INSERT INTO kids_applications(program_title,parent_first_name,parent_last_name,email,phone,children,user_id) VALUES ('History','Synthetic','Family','legacy@example.invalid','synthetic','[{"name":"Preserved child"}]','legacy');`);
  return pg;
}
async function fingerprint(pg) {
  const result = {};
  for (const table of ['users','events','event_participants','kids_applications']) result[table] = (await pg.query(`select count(*)::int as count, md5(coalesce(string_agg((to_jsonb(t)-'gender'-'affiliation'-'giyur_stage'-'filter_version'-'filter_revision'-'filter_completed_at'-'identity_disabled_at')::text,'' order by id),'')) as hash from "${table}" t`)).rows[0];
  return result;
}
async function clerkEvent(type, id) {
  const body = JSON.stringify({ type, data: { id, first_name: 'Webhook must not overwrite', last_name: 'Identity surname', image_url: '',
    primary_email_address_id: 'primary', email_addresses: [{ id: 'primary', email_address: id + '@example.invalid' }] } }, null, 2);
  const when = new Date(), msg = 'msg_synthetic_' + crypto.randomUUID();
  const signature = new (require('svix').Webhook)(secret).sign(msg, when, body);
  currentHeaders = new Headers({ 'svix-id': msg, 'svix-timestamp': String(Math.floor(when.getTime() / 1000)), 'svix-signature': signature });
  return source('app/api/webhooks/clerk/route.ts').POST(new Request('http://synthetic.invalid/webhook', { method: 'POST', body }));
}

(async () => {
  for (const state of ['before0004', 'has0004and0005', 'partialEmpty']) {
    const pg = await legacyDatabase();
    try {
      if (state === 'has0004and0005') for (const file of ['0004_community_filtering.sql','0005_giyur_stage.sql']) await pg.exec(fs.readFileSync(path.join(root, 'drizzle', file), 'utf8'));
      if (state === 'partialEmpty') await pg.exec(`alter table users add column gender text; create table community_audit(id uuid primary key default gen_random_uuid()); create table community_registration_drafts(id uuid primary key default gen_random_uuid(), token_hash text not null);`);
      await test('Manual SQL ' + state + ': complete additive effect and unchanged business history', async () => {
        const before = await fingerprint(pg); await pg.exec(manual); assert.deepEqual(await fingerprint(pg), before);
        const [old] = (await pg.query("select gender,affiliation,filter_version,filter_completed_at from users where id='legacy'")).rows;
        assert.deepEqual(old, { gender: null, affiliation: null, filter_version: null, filter_completed_at: null });
        await pg.exec(`update users set affiliation='none',gender='female',filter_version=2,filter_completed_at='2026-10-20T08:00:00Z' where id='legacy'`);
        const saved = (await pg.query("select to_jsonb(t) as data from users t where id='legacy'")).rows;
        await pg.exec(manual);
        assert.deepEqual((await pg.query("select to_jsonb(t) as data from users t where id='legacy'")).rows, saved);
        assert.equal((await pg.query("select count(*)::int as count from information_schema.tables where table_schema in ('drizzle','supabase_migrations')")).rows[0].count, 0);
      });
    } finally { await pg.close(); }
  }
  for (const state of ['wrongType', 'wrongCheck', 'wrongDefault', 'wrongNamedCheck', 'wrongIndex', 'wrongFK', 'missingEventFK']) {
    const pg = await legacyDatabase();
    try {
      const faults = {
        wrongType:'alter table users add column gender integer',
        wrongCheck:"alter table users add column gender text; alter table users add constraint users_gender_check check(gender is null or gender='arbitrary')",
        wrongDefault:"alter table users add column affiliation text default 'none'",
        wrongNamedCheck:"alter table users add column gender text; alter table users add constraint alternate_filter_check check(gender is null or gender='female')",
        missingEventFK:'alter table event_participants drop constraint event_participants_user_id_users_id_fk',
        wrongIndex:'drop index telegram_chat_id_idx; create index telegram_chat_id_idx on users(telegram_chat_id)',
        wrongFK:'alter table kids_applications drop constraint kids_applications_user_id_users_id_fk; alter table kids_applications add constraint kids_applications_user_id_users_id_fk foreign key(user_id) references users(id) on delete cascade'
      };
      await pg.exec(faults[state]);
      await test('Manual SQL rejects ' + state + ' atomically instead of silently skipping', async () => {
        const before = await fingerprint(pg); await assert.rejects(pg.exec(manual)); await pg.exec('ROLLBACK');
        assert.deepEqual(await fingerprint(pg), before);
        assert.equal((await pg.query("select count(*)::int as count from information_schema.columns where table_name='users' and column_name='filter_completed_at'")).rows[0].count, 0);
      });
    } finally { await pg.close(); }
  }

  const pg = new PGlite(); db = drizzle(pg, { schema });
  try {
    await migrate(db, { migrationsFolder: path.join(root, 'drizzle') });
    const child = { id: 'legacy-child', parentId: 'legacy', name: 'Preserved child', dateOfBirth: '2020-01-01' };
    await db.insert(schema.users).values([
      { id: 'legacy', email: 'legacy@example.invalid', firstName: 'Old name', role: 'client', isProfileComplete: true,
        affiliation: 'maternal', gender: 'female', filterVersion: 1, childrenData: [child], source: 'Preserved source' },
      { id: 'old-admin', email: 'old-admin@example.invalid', role: 'admin', isProfileComplete: true, affiliation: 'maternal', gender: 'male', filterVersion: 1 },
      ...['admin','super','other','none'].map(id => ({ id, email: id + '@example.invalid', role: id === 'super' ? 'superadmin' : id === 'admin' ? 'admin' : 'client',
        gender: 'male', affiliation: 'none', filterVersion: 2, filterCompletedAt: new Date(), isProfileComplete: false })),
      { id: 'father', email: 'father@example.invalid', gender: 'male', affiliation: 'maternal', filterVersion: 2, filterCompletedAt: new Date(), isProfileComplete: true, childrenData: [{ ...child, id: 'father-child', parentId: 'father' }] },
    ]);
    await db.insert(schema.events).values([{ id: 'free', title: 'Synthetic free', isFree: true },{ id: 'paid', title: 'Synthetic paid', isFree: false, price: '100', childPrice: '25', paymentUrl: 'https://example.invalid/payment' }]);
    await db.insert(schema.eventParticipants).values({ id: 'historic-paid', eventId: 'paid', userId: 'legacy', status: 'paid', extraData: { family: { child_0: true } } });
    const profile = source('actions/community.ts'), drafts = source('actions/community-drafts.ts'), events = source('actions/event.ts');
    const policy = source('lib/community/policy.ts'), people = source('actions/user.ts'), messages = source('actions/notification.ts');
    const cookieName = source('lib/community/drafts.ts').draftCookieName;
    await test('Old complete profile and active admin session both require fixed version2; direct event/admin calls deny', async () => {
      actor = 'legacy'; assert.equal(policy.hasFilterProfile(await row(actor)), false); assert.equal(await events.getEventById('free'), null);
      assert.equal((await events.registerForEvent('free', actor)).success, false);
      actor = 'old-admin'; await assert.rejects(people.getAllUsers()); assert.equal((await row(actor)).role, 'admin');
      assert.equal(policy.communityAccess(await row(actor)).canRegisterSelf, false);
    });
    await test('Full questionnaire roundtrip: every field, explicit false and preserved omitted family/source', async () => {
      actor = 'legacy'; const result = await profile.saveCommunityProfile(actor, payload()); assert.equal(result.success, true);
      assert.equal(result.redirectTo, '/dashboard/events'); const saved = await row(actor);
      for (const field of ['firstName','lastName','phone','city','maritalStatus','spouseName','hasChildren','agreedToPrivacy','affiliation','gender']) assert.equal(saved[field], payload()[field]);
      assert.equal(saved.dateOfBirth.toISOString().slice(0,10), '1990-02-03'); assert.equal(saved.giyurStage, null);
      assert.equal(saved.childrenData[0].id, child.id); assert.equal(saved.source, 'Preserved source');
      assert.equal(saved.filterVersion, 2); assert.ok(saved.filterCompletedAt); assert.equal(saved.id, 'legacy');
      actor = null; actor = 'legacy'; assert.equal((await row(actor)).firstName, 'Persisted given');
      actor = 'admin'; assert.equal((await people.getAllUsers()).find(x => x.id === 'legacy').spouseName, 'Persisted spouse');
    });
    await test('Explicit clear/list/false persist; stale revision and service-field injection reject', async () => {
      actor = 'legacy'; const old = await row(actor);
      const result = await profile.saveCommunityProfile(actor, payload({ expectedRevision: old.filterRevision, source: '', maritalStatus: 'single', spouseName: null, childrenData: [] }));
      assert.equal(result.success, true); const saved = await row(actor);
      assert.equal(saved.source, ''); assert.equal(saved.spouseName, null); assert.equal(saved.hasChildren, false); assert.deepEqual(saved.childrenData, []);
      assert.equal((await profile.saveCommunityProfile(actor, payload({ expectedRevision: old.filterRevision }))).success, false);
      assert.equal((await profile.saveCommunityProfile(actor, { ...payload({ expectedRevision: saved.filterRevision }), filterVersion: 2, filterCompletedAt: new Date(), role: 'admin' })).success, false);
      assert.equal((await row(actor)).role, 'client'); assert.equal((await db.select().from(schema.eventParticipants).where(eq(schema.eventParticipants.id, 'historic-paid')))[0].status, 'paid');
    });
    await test('Signed third branch completes filter independently of full form, preserves history and remains denied', async () => {
      actor = 'old-admin'; const result = await profile.saveResourceChoice(actor, { affiliation: 'none', gender: 'male', expectedRevision: 0 });
      assert.equal(result.success, true); assert.equal(policy.hasFilterProfile(await row(actor)), true); assert.equal(result.access.canRegisterSelf, false);
      assert.equal((await row(actor)).role, 'admin'); assert.equal((await events.registerForEvent('free', actor)).success, false);
      assert.ok(Array.isArray(await people.getAllUsers()));
      actor = 'none'; assert.equal((await row(actor)).isProfileComplete, false); assert.equal(policy.hasFilterProfile(await row(actor)), true);
    });
    await test('CRM filters use three persisted categories and completion, never the historical status enum', async () => {
      actor = 'admin'; const res = await people.getUsersPaginated(1, 100, '', { affiliation: 'maternal', filterCompletion: 'passed' });
      assert.ok(res.users.some(x => x.id === 'legacy')); assert.ok(res.users.every(x => x.affiliation === 'maternal' && x.filterVersion === 2 && x.filterCompletedAt));
      const required = await people.getUsersPaginated(1, 100, '', { filterCompletion: 'required' }); assert.equal(required.users.length, 0);
    });
    const attempt = crypto.randomUUID(); let copiedCookies;
    await test('Anonymous submitted form is in DB before OAuth, HttpOnly bound, and creates no identified profile', async () => {
      actor = null; browser = 'draft';
      const result = await drafts.prepareRegistrationDraft(payload({ hasChildren: true, childrenData: [{ name: 'New linked child', dateOfBirth: '2020-03-04' }] }), attempt);
      assert.equal(result.success, true); assert.equal((await db.select().from(schema.users).where(eq(schema.users.id, 'new-google'))).length, 0);
      const [draft] = await db.select().from(schema.communityRegistrationDrafts).where(eq(schema.communityRegistrationDrafts.id, attempt));
      assert.equal(draft.payload.spouseName, 'Persisted spouse'); assert.equal(draft.ownerId, null); assert.equal(draft.consumedAt, null);
      assert.equal(cookieOptions.at(-1).httpOnly, true); assert.equal(cookieOptions.at(-1).sameSite, 'lax');
      assert.notEqual(draft.tokenHash, jar().get(cookieName(attempt)));
      copiedCookies = new Map(jar());
      assert.equal((await drafts.prepareRegistrationDraft(payload({ hasChildren: true, childrenData: [{ name: 'New linked child', dateOfBirth: '2020-03-04' }] }), attempt)).success, true);
      assert.equal((await db.select().from(schema.communityRegistrationDrafts).where(eq(schema.communityRegistrationDrafts.id, attempt))).length, 1);
    });
    await test('Verified-identity seam consumes draft atomically, keeps one Clerk-ID profile and child ownership', async () => {
      actor = 'new-google'; const result = await drafts.completeRegistrationDraft(attempt); assert.equal(result.success, true); assert.equal(result.redirectTo, '/dashboard/events');
      const saved = await row(actor); assert.equal(saved.firstName, 'Persisted given'); assert.equal(saved.email, 'new-google@example.invalid');
      assert.equal(saved.childrenData[0].parentId, actor); assert.ok(saved.childrenData[0].id); assert.equal(saved.role, 'client');
      const [draft] = await db.select().from(schema.communityRegistrationDrafts).where(eq(schema.communityRegistrationDrafts.id, attempt));
      assert.equal(draft.ownerId, actor); assert.ok(draft.consumedAt); assert.deepEqual(draft.payload, {});
      browser = 'replay'; jars.set(browser, new Map(copiedCookies));
      const replay = await drafts.completeRegistrationDraft(attempt); assert.equal(replay.success, true); assert.equal((await row(actor)).filterRevision, saved.filterRevision);
      assert.equal((await db.select().from(schema.users).where(eq(schema.users.id, actor))).length, 1);
      browser = 'wrong-account'; jars.set(browser, new Map(copiedCookies)); actor = 'other'; assert.equal((await drafts.completeRegistrationDraft(attempt)).success, false);
    });
    await test('Failure after profile write rolls back profile, children, draft claim and completion stamp', async () => {
      actor = null; browser = 'failure'; const id = crypto.randomUUID(); assert.equal((await drafts.prepareRegistrationDraft(payload(), id)).success, true);
      await pg.exec(`CREATE FUNCTION synthetic_fail_claim() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic draft failure'; END $$; CREATE TRIGGER synthetic_fail_claim BEFORE UPDATE ON community_registration_drafts FOR EACH ROW EXECUTE FUNCTION synthetic_fail_claim();`);
      actor = 'failed-google'; assert.equal((await drafts.completeRegistrationDraft(id)).success, false); assert.equal(await row(actor), undefined);
      const [draft] = await db.select().from(schema.communityRegistrationDrafts).where(eq(schema.communityRegistrationDrafts.id, id)); assert.equal(draft.ownerId, null); assert.equal(draft.consumedAt, null);
      await pg.exec('DROP TRIGGER synthetic_fail_claim ON community_registration_drafts; DROP FUNCTION synthetic_fail_claim()');
      assert.equal((await drafts.completeRegistrationDraft(id)).success, true);
    });
    await test('Two pending attempts cannot overwrite a completed current profile; explicit review keeps the draft', async () => {
      actor = null; browser = 'two-tabs'; const first = crypto.randomUUID(), second = crypto.randomUUID();
      assert.equal((await drafts.prepareRegistrationDraft(payload(), first)).success, true);
      assert.equal((await drafts.prepareRegistrationDraft(payload({ firstName: 'Other submitted answer' }), second)).success, true);
      actor = 'two-tabs-user'; assert.equal((await drafts.completeRegistrationDraft(first)).success, true);
      assert.equal((await drafts.completeRegistrationDraft(second)).success, false); assert.equal((await row(actor)).firstName, 'Persisted given');
      const [pending] = await db.select().from(schema.communityRegistrationDrafts).where(eq(schema.communityRegistrationDrafts.id, second)); assert.equal(pending.consumedAt, null);
    });
    await test('Explicit review and third-branch save consume the original draft atomically and deny another identity', async () => {
      actor='review-account'; assert.equal((await profile.saveCommunityProfile(actor,payload())).success,true);
      for(const resource of [false,true]) {
        actor=null;browser='review-'+resource;const id=crypto.randomUUID();assert.equal((await drafts.prepareRegistrationDraft(payload(),id)).success,true);
        const copied=new Map(jar());actor='review-account';const before=await row(actor);
        assert.equal((await drafts.completeRegistrationDraft(id)).success,false);assert.equal((await row(actor)).filterRevision,before.filterRevision);
        const input=resource?{affiliation:'none',gender:'female',expectedRevision:before.filterRevision}:payload({firstName:'Explicit reviewed',expectedRevision:before.filterRevision});
        const saved=await drafts.completeRegistrationDraft(id,input);assert.equal(saved.success,true);assert.equal(saved.access.canViewEvents,!resource);
        const [draft]=await db.select().from(schema.communityRegistrationDrafts).where(eq(schema.communityRegistrationDrafts.id,id));
        assert.equal(draft.ownerId,actor);assert.ok(draft.consumedAt);assert.deepEqual(draft.payload,{});
        browser='review-other-'+resource;jars.set(browser,copied);actor='other';assert.equal((await drafts.completeRegistrationDraft(id)).success,false);
      }
    });
    await test('Manual SQL after actual form completion is repeatable and never resets v2 or saved fields', async () => {
      const before = await pg.query('select id,to_jsonb(t) as value from users t order by id'); await pg.exec(manual);
      assert.deepEqual((await pg.query('select id,to_jsonb(t) as value from users t order by id')).rows, before.rows);
      assert.equal(policy.hasFilterProfile(await row('new-google')), true);
    });
    await test('Clerk signed create/update/replay preserve questionnaire; deleted identity preserves history but loses access', async () => {
      assert.equal((await clerkEvent('user.created', 'new-google')).status, 200); assert.equal((await clerkEvent('user.updated', 'new-google')).status, 200);
      assert.equal((await row('new-google')).firstName, 'Persisted given'); assert.equal((await row('new-google')).filterVersion, 2);
      assert.equal((await clerkEvent('user.deleted', 'legacy')).status, 200); assert.ok((await row('legacy')).identityDisabledAt);
      assert.equal((await db.select().from(schema.eventParticipants).where(eq(schema.eventParticipants.id, 'historic-paid')))[0].status, 'paid');
      actor = 'legacy'; assert.equal(await events.getEventById('free'), null);
      currentHeaders = new Headers(); assert.equal((await source('app/api/webhooks/clerk/route.ts').POST(new Request('http://synthetic.invalid', { method: 'POST', body: '{}' }))).status, 400);
    });
    await test('Private people/tags/chat/notification actions deny foreign IDs, guests, forged sender and ordinary bulk', async () => {
      await db.insert(schema.notifications).values([{ id: 'private-other', userId: 'other', message: 'PRIVATE_OTHER_MESSAGE', title: 'Synthetic', senderId: 'admin' },{ id: 'private-self', userId: 'none', message: 'OWN_MESSAGE', title: 'Synthetic', senderId: 'admin' }]);
      actor = 'none'; await assert.rejects(people.getAllUsers()); assert.equal((await people.updateUserTags('other', ['Injected'])).success, false);
      await assert.rejects(messages.getMyChatHistory('other')); await assert.rejects(messages.getNotificationHistory('other')); await assert.rejects(messages.getConversation('admin', 'other'));
      assert.equal((await messages.markAsRead('private-other')).success, false); assert.equal((await messages.deleteNotification('private-other')).success, false);
      assert.equal((await messages.sendBulkCrmMessages(['other'], 'forged')).success, false);
      assert.equal((await messages.getMyChatHistory('none'))[0].message, 'OWN_MESSAGE');
      actor = null; await assert.rejects(messages.getUserNotifications('none'));
      actor = 'admin'; assert.equal((await messages.createNotification('none', 'Synthetic', 'Allowed test message', '/dashboard', 'forged-user', 'crm_personal')).success, false);
      assert.ok((await messages.getNotificationHistory('other')).some(x => x.message === 'PRIVATE_OTHER_MESSAGE'));
    });
    await test('Public article/comments expose only public author fields; private task/admin getters require fresh staff', async () => {
      await db.insert(schema.news).values({title:'Synthetic public article',slug:'synthetic-public',content:'Synthetic',authorId:'other',isPublished:true});
      const article = await source('actions/news.ts').getNewsBySlug('synthetic-public');
      assert.ok(article.author); assert.equal(article.author.id,'other');
      for(const key of ['email','phone','gender','childrenData','affiliation','role']) assert.equal(key in article.author,false);
      await db.insert(schema.users).values({id:'unchecked-admin',email:'unchecked@example.invalid',role:'admin',filterVersion:1,isProfileComplete:true});
      actor='unchecked-admin'; await assert.rejects(source('actions/kids.actions.ts').getKidsApplications());
      actor='none'; await assert.rejects(source('actions/task.ts').getAllTasks());
      assert.equal((await source('actions/task.ts').updateTaskAction('unknown',{creatorId:'forged'})).success,false);
      await assert.rejects(source('actions/dashboard.ts').getDashboardStats());
      actor='admin'; assert.ok(Array.isArray(await source('actions/task.ts').getAllTasks()));
    });
    await test('Bot settings deny ordinary/stale admin and arbitrary fields, update one known row only', async () => {
      const settings=source('actions/bot-settings.ts'),input={notificationGroupId:'-100123',eventsTopicId:'10',servicesTopicId:'20'};
      actor='none'; assert.equal((await settings.updateBotSettings(input)).success,false);
      actor='unchecked-admin'; assert.equal((await settings.updateBotSettings(input)).success,false);
      actor='admin'; assert.equal((await settings.updateBotSettings({...input,id:'injected'})).success,false);
      assert.equal((await settings.updateBotSettings(input)).success,true);
      const rows=await db.select().from(schema.botSettings);assert.equal(rows.length,1);assert.equal(rows[0].notificationGroupId,'-100123');
      await db.insert(schema.botSettings).values({id:'unexpected-second'});
      assert.equal((await settings.updateBotSettings({...input,notificationGroupId:'-999'})).success,false);
      assert.equal((await db.select().from(schema.botSettings)).find(x=>x.id==='main').notificationGroupId,'-100123');
    });
    await test('Role changes require current superadmin and a known role, with no email-based elevation', async () => {
      const roles = source('actions/role.ts'); actor = 'none'; assert.ok((await roles.updateUserRole('none', 'superadmin')).error);
      actor = 'admin'; assert.ok((await roles.updateUserRole('none', 'admin')).error);
      actor = 'super'; assert.ok((await roles.updateUserRole('none', 'invented-role')).error);
      assert.equal((await roles.updateUserRole('other', 'author')).success, true); assert.equal((await row('other')).role, 'author');
      assert.ok((await roles.updateUserRole('super', 'client')).error);
    });
    await test('Restricted payments reject paid operations, manual paid status and every webhook without changing history', async () => {
      actor = 'new-google'; assert.equal((await events.registerForEvent('paid', actor)).success, false);
      assert.equal((await events.registerForEvent('free', actor)).success, true);
      const free = (await db.select().from(schema.eventParticipants).where(and(eq(schema.eventParticipants.userId, actor), eq(schema.eventParticipants.eventId, 'free'))))[0]; assert.equal(free.status, 'confirmed');
      actor = 'admin'; assert.equal((await events.updateEventParticipantStatus(free.id, 'paid')).success, false);
      assert.equal((await events.deleteEventParticipant('historic-paid')).success, false);
      const webhook = await source('app/api/webhooks/shutafim/route.ts').POST(new Request('http://synthetic.invalid', { method: 'POST', body: JSON.stringify({ custom1: free.id, status: 'paid' }) }));
      assert.equal(webhook.status, 503); assert.equal((await db.select().from(schema.eventParticipants).where(eq(schema.eventParticipants.id, free.id)))[0].status, 'confirmed');
    });
    await test('Father/admin exception keeps father status and logs actor/reason; ordinary account cannot use it', async () => {
      const admin = source('actions/community-admin.ts'); const request = { requestId: crypto.randomUUID(), parentId: 'father', childIds: ['father-child'], kind: 'program', programTitle: 'Synthetic manual', reason: 'Synthetic father-only exception' };
      actor = 'none'; assert.equal((await admin.registerChildManually(request)).success, false);
      actor = 'admin'; assert.equal((await admin.registerChildManually(request)).success, true);
      assert.equal((await row('father')).affiliation, 'maternal');
      const [audit] = await db.select().from(schema.communityAudit).where(eq(schema.communityAudit.id, request.requestId)); assert.equal(audit.actorId, 'admin'); assert.equal(audit.reason, request.reason);
      actor = 'father'; assert.equal((await source('actions/community-children.ts').saveOwnChildren([{ name: 'Forbidden', dateOfBirth: '2020-01-01' }])).success, false);
    });
    fs.writeFileSync(path.join(output, 'production-results.json'), JSON.stringify({ engine: 'PGlite/Drizzle real SQL + current source; mock identity/cookies, no real OAuth/browser/network', manualSqlSha256: crypto.createHash('sha256').update(manual).digest('hex'), checks }, null, 2) + '\n');
    console.log(`${checks.length}/${checks.length} production checks passed`);
  } finally { await pg.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
