/* Real production modules + Node crypto + Drizzle/PGlite + NextResponse cookies.
 * Synthetic env only, no .env load, no remote DB, no Bot API or Clerk calls. */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), crypto = require('node:crypto'), ts = require('typescript');
process.env.NODE_PATH = path.join(process.env.COMMUNITY_TEST_RUNTIME || '/tmp/menora-filter-test-runtime', 'node_modules');
require('node:module').Module._initPaths();
const { PGlite } = require(path.join(process.env.COMMUNITY_TEST_RUNTIME || '/tmp/menora-filter-test-runtime', 'node_modules/@electric-sql/pglite'));
const { drizzle } = require('drizzle-orm/pglite');
const { migrate } = require('drizzle-orm/pglite/migrator');
const { eq } = require('drizzle-orm');
const root = path.resolve(__dirname, '../..'), output = process.env.COMMUNITY_TEST_OUTPUT || path.join(root, 'docs/miniapp-auth-v1/evidence');
const env = { NODE_ENV: 'development', TELEGRAM_BOT_TOKEN: '123456:synthetic-unit-test-token', NEXT_PUBLIC_APP_URL: 'http://localhost:3999' };
const cookieJar = new Map(), cache = new Map(), checks = [];
let db;
function source(file) {
  const absolute = path.join(root, file);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const mod = { exports: {} }; cache.set(absolute, mod);
  const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText;
  function localRequire(id) {
    if (id === 'server-only') return {};
    if (id === '@/lib/db') return { db };
    if (id === 'next/headers') return { cookies: async () => ({ get: name => cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined }) };
    if (id.startsWith('@/') || id.startsWith('.')) {
      const resolved = id.startsWith('@/') ? id.slice(2) : path.relative(root, path.resolve(path.dirname(absolute), id));
      return source(resolved.endsWith('.ts') ? resolved : resolved + '.ts');
    }
    if (['node:crypto', 'drizzle-orm', 'drizzle-orm/pg-core', 'next/server'].includes(id)) return require(id);
    throw new Error('Blocked import: ' + id);
  }
  vm.runInNewContext(code, { module: mod, exports: mod.exports, require: localRequire, process: { env },
    console: { log() { throw new Error('Unexpected auth log'); }, error() { throw new Error('Unexpected auth log'); } },
    Date, Buffer, URL, URLSearchParams, TextDecoder, crypto: crypto.webcrypto }, { filename: file });
  return mod.exports;
}
const plain = value => JSON.parse(JSON.stringify(value));
const now = () => Math.floor(Date.now() / 1000);
function signed(overrides = {}, userOverrides = {}) {
  const fields = { auth_date: String(now()), user: JSON.stringify({ id: 700001, first_name: 'Synthetic', ...userOverrides }), ...overrides };
  for (const [key, value] of Object.entries(fields)) if (value === undefined) delete fields[key];
  const check = Object.keys(fields).sort().map(key => key + '=' + fields[key]).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();
  return new URLSearchParams({ ...fields, hash: crypto.createHmac('sha256', secret).update(check).digest('hex') }).toString();
}
function changed(raw, key, value) { const fields = new URLSearchParams(raw); value === undefined ? fields.delete(key) : fields.set(key, value); return fields.toString(); }
async function test(name, fn) { await fn(); checks.push({ name, status: 'PASS' }); console.log('PASS ' + name); }
async function rejects(fn, status) { await assert.rejects(async () => fn(), error => error.status === status); }
function request(body, headers = {}, url = '/api/telegram/miniapp/bootstrap') {
  return new Request('http://localhost:3999' + url, { method: 'POST', headers: { origin: env.NEXT_PUBLIC_APP_URL, 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
(async () => {
  const init = source('lib/telegram/miniapp-init-data.ts'), config = source('lib/telegram/miniapp-config.ts');
  await test('independent Python HMAC fixture: decoded UTF-8, plus, future field and signature are signed', async () => {
    // Generated with Python stdlib hmac/hashlib/urlencode, not this suite signer.
    // Telegram official docs publish pseudocode, not a concrete bot-token test vector.
    const raw = 'auth_date=1792627200&query_id=synthetic-query&user=%7B%22id%22%3A700001%2C%22first_name%22%3A%22Synthetic+%2B+%D0%AE%D0%B7%D0%B5%D1%80%22%2C%22last_name%22%3A%22Fixture%22%7D&start_param=autumn_26&future_field=signed-future&signature=synthetic-ed25519-field&hash=6e9eb57232ab70efcbbbcf2201fc77f0fed7034410c3e0c6b1e30b85dda741b7';
    const original = Date.now; Date.now = () => 1792627200 * 1000;
    try { const value = init.validateTelegramMiniAppInitData(raw); assert.equal(value.user.firstName, 'Synthetic + Юзер'); assert.equal(value.startParam, 'autumn_26'); }
    finally { Date.now = original; }
  });
  await test('valid signed user supports ID string, optional Telegram fields and frozen proof', async () => {
    const value = init.validateTelegramMiniAppInitData(signed({}, { id: 2 ** 52 - 1, last_name: 'Fixture', username: 'fixture', language_code: 'ru', photo_url: 'https://example.invalid/photo', allows_write_to_pm: true, is_premium: true }));
    assert.equal(value.user.id, String(2 ** 52 - 1)); assert.equal(value.user.allowsWriteToPm, true); assert.equal(value.user.isPremium, true);
    assert.ok(Object.isFrozen(value) && Object.isFrozen(value.user));
  });
  for (const [name, key, value] of [
    ['first_name tamper', 'user', JSON.stringify({ id: 700001, first_name: 'Changed' })],
    ['user ID tamper', 'user', JSON.stringify({ id: 700002, first_name: 'Synthetic' })],
    ['start_param tamper', 'start_param', 'changed'], ['wrong hash', 'hash', '0'.repeat(64)],
    ['additional signed field tamper', 'future_field', 'changed'], ['signature field tamper', 'signature', 'changed'],
  ]) await test(name + ' rejected before trust', () => rejects(() => init.validateTelegramMiniAppInitData(changed(signed({ start_param: 'first', future_field: 'future', signature: 'present' }), key, value)), 401));
  for (const [name, raw] of [
    ['missing hash', changed(signed(), 'hash', undefined)], ['missing auth_date', signed({ auth_date: undefined })],
    ['short hash', changed(signed(), 'hash', 'aa')], ['nonhex hash', changed(signed(), 'hash', 'x'.repeat(64))],
    ['duplicate key', signed() + '&auth_date=1'], ['bad percent encoding', signed() + '&bad=%XX'],
    ['ambiguous canonical newline', signed({ future_field: 'x\ny=z' })], ['malformed user JSON', signed({ user: '{' })],
    ['missing user', signed({ user: undefined })], ['array user', signed({ user: '[]' })],
    ['unsafe numeric ID', signed({}, { id: Number.MAX_SAFE_INTEGER + 1 })], ['string ID', signed({}, { id: '700001' })],
    ['missing first name', signed({}, { first_name: undefined })], ['untrusted boolean string', signed({}, { allows_write_to_pm: 'true' })],
    ['non-HTTPS photo', signed({}, { photo_url: 'javascript:alert(1)' })], ['oversize initData', 'x'.repeat(16385)],
  ]) await test(name + ' malformed rejected', () => rejects(() => init.validateTelegramMiniAppInitData(raw), 400));
  await test('expired auth_date rejected', () => rejects(() => init.validateTelegramMiniAppInitData(signed({ auth_date: String(now() - 901) })), 401));
  await test('future auth_date over 60 seconds rejected', () => rejects(() => init.validateTelegramMiniAppInitData(signed({ auth_date: String(now() + 61) })), 401));
  await test('bounded future clock skew accepted', async () => { init.validateTelegramMiniAppInitData(signed({ auth_date: String(now() + 30) })); });
  await test('age env honors valid bound and invalid values retain secure 900 default', async () => {
    for (const bad of ['0', '-1', 'NaN', 'Infinity', '999999999999999999999', '901x', ' 900', '86401']) {
      env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS = bad; assert.equal(config.initDataMaxAgeSeconds(), 900);
      await rejects(() => init.validateTelegramMiniAppInitData(signed({ auth_date: String(now() - 901) })), 401);
    }
    env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS = '60'; await rejects(() => init.validateTelegramMiniAppInitData(signed({ auth_date: String(now() - 61) })), 401);
    delete env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS;
  });
  await test('missing bot config fails closed', async () => { const raw = signed(), token = env.TELEGRAM_BOT_TOKEN; delete env.TELEGRAM_BOT_TOKEN;
    try { await rejects(() => init.validateTelegramMiniAppInitData(raw), 503); } finally { env.TELEGRAM_BOT_TOKEN = token; } });
  await test('malformed signed start_param ignored without denying authentication', async () => {
    for (const value of ['person@example.invalid', '../admin', 'x'.repeat(65), '']) assert.equal(init.validateTelegramMiniAppInitData(signed({ start_param: value })).startParam, null);
  });

  const pg = new PGlite(), schema = source('lib/db/schema.ts'); db = drizzle(pg, { schema });
  await migrate(db, { migrationsFolder: path.join(root, 'drizzle') });
  await pg.exec('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;');
  const userService = source('lib/telegram/miniapp-user.ts'), sessions = source('lib/telegram/miniapp-session.ts');
  const bootstrap = source('app/api/telegram/miniapp/bootstrap/route.ts'), logout = source('app/api/telegram/miniapp/logout/route.ts');
  const sessionRoute = source('app/api/telegram/miniapp/session/route.ts');
  const validated = (id = 700001, fields = {}, user = {}) => init.validateTelegramMiniAppInitData(signed(fields, { id, ...user }));
  const row = async (table, column, value) => (await pg.query(`SELECT * FROM ${table} WHERE ${column}=$1`, [value])).rows[0];
  const count = async table => (await pg.query(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n;
  const userSnapshot = async id => plain(await row('users', 'id', id));
  const contactSnapshot = async id => plain(await row('telegram_contacts', 'telegram_user_id', String(id)));
  const remember = response => { const cookie = response.cookies.get(config.miniAppCookieName()); assert.ok(cookie); cookieJar.set(cookie.name, cookie.value); return cookie.value; };
  let first, token;
  try {
    await test('new Telegram subject creates exactly one opaque canonical user', async () => {
      first = await userService.bootstrapTelegramMiniAppUser(validated(700001, { start_param: 'first_26' }));
      assert.match(first.id, /^mnr_[0-9a-f-]{36}$/); assert.equal(await count('users'), 1);
    });
    await test('new identity uses telegram primary verified subject, never username', async () => {
      const identity = await row('user_identities', 'user_id', first.id); assert.equal(identity.provider, 'telegram'); assert.equal(identity.provider_instance, 'primary');
      assert.equal(identity.provider_user_id, '700001'); assert.ok(identity.verified_at);
    });
    await test('new Telegram contact is backend-owned and is subscribed on verified bootstrap', async () => {
      const contact = await contactSnapshot(700001); assert.equal(contact.user_id, first.id); assert.equal(contact.marketing_status, 'subscribed');
      assert.ok(contact.marketing_opt_in_at); assert.equal(contact.allows_write_to_pm, false);
    });
    await test('new profile has NULL email, affiliation, gender, giyur and filter; no privacy consent', async () => {
      const user = await userSnapshot(first.id);
      for (const key of ['email', 'affiliation', 'gender', 'giyur_stage', 'filter_version', 'filter_completed_at']) assert.equal(user[key], null);
      assert.equal(user.is_profile_complete, false); assert.equal(user.agreed_to_privacy, false); assert.equal(user.role, 'client'); assert.equal(user.source, 'telegram_miniapp');
      assert.equal(userService.miniAppProfile(first).nextStep, 'filter');
    });
    await test('Mini App never derives private chat ID even from signed group chat or write permission', async () => {
      await userService.bootstrapTelegramMiniAppUser(validated(700001, { chat: JSON.stringify({ id: -100999, type: 'supergroup' }) }, { allows_write_to_pm: true }));
      assert.equal((await contactSnapshot(700001)).telegram_chat_id, null); assert.equal((await userSnapshot(first.id)).telegram_chat_id, null);
      assert.equal((await contactSnapshot(700001)).marketing_status, 'subscribed');
    });
    await test('repeated bootstrap preserves canonical profile, family, filter, consent and account role', async () => {
      await db.update(schema.users).set({ firstName: 'Canonical name', gender: 'female', affiliation: 'giyur', giyurStage: 'advanced', filterVersion: 2,
        filterCompletedAt: new Date(), filterRevision: 7, isProfileComplete: true, agreedToPrivacy: true, cityId: '8300', childrenData: [{ id: 'kept-child', name: 'Synthetic child' }] }).where(eq(schema.users.id, first.id));
      const before = await userSnapshot(first.id);
      const result = await userService.bootstrapTelegramMiniAppUser(validated(700001, { start_param: 'second' }, { first_name: 'New Telegram name', username: 'updated', language_code: 'he', is_premium: true }));
      assert.equal(result.id, first.id); assert.deepEqual(await userSnapshot(first.id), before);
      assert.equal(await count('users'), 1); assert.equal(await count('user_identities'), 1); assert.equal(await count('telegram_contacts'), 1);
      assert.equal((await contactSnapshot(700001)).first_name, 'New Telegram name');
    });
    await test('first attribution write-once, last valid launch updates and invalid launch does not erase', async () => {
      let contact = await contactSnapshot(700001); assert.equal(contact.first_start_param, 'first_26'); assert.equal(contact.last_start_param, 'second');
      await userService.bootstrapTelegramMiniAppUser(validated(700001, { start_param: 'invalid/person' }));
      contact = await contactSnapshot(700001); assert.equal(contact.first_start_param, 'first_26'); assert.equal(contact.last_start_param, 'second');
    });
    await test('initially absent attribution records first later valid launch once', async () => {
      await userService.bootstrapTelegramMiniAppUser(validated(700002));
      await userService.bootstrapTelegramMiniAppUser(validated(700002, { start_param: 'later' }));
      assert.equal((await contactSnapshot(700002)).first_start_param, 'later');
    });
    await test('omitted optional Telegram metadata preserves known values and provenance', async () => {
      await pg.exec("UPDATE user_identities SET metadata=metadata||'{\"provenance\":\"synthetic-import\"}' WHERE provider_user_id='700001'");
      const before = await contactSnapshot(700001);
      await userService.bootstrapTelegramMiniAppUser(validated(700001));
      const after = await contactSnapshot(700001);
      for (const key of ['username', 'language_code', 'photo_url', 'allows_write_to_pm']) assert.equal(after[key], before[key]);
      const identity = await row('user_identities', 'provider_user_id', '700001');
      assert.equal(identity.metadata.provenance, 'synthetic-import'); assert.equal(identity.metadata.isPremium, true);
    });
    for (const status of ['subscribed', 'unsubscribed', 'blocked']) await test(status + ' marketing state and delivery/chat metadata survive Telegram refresh', async () => {
      await pg.query(`UPDATE telegram_contacts SET marketing_status=$1,marketing_opt_in_at=now(),unsubscribed_at=now(),blocked_at=now(),telegram_chat_id='800001',last_delivery_error_code='403' WHERE telegram_user_id='700001'`, [status]);
      const before = await contactSnapshot(700001); await userService.bootstrapTelegramMiniAppUser(validated(700001, {}, { allows_write_to_pm: true }));
      const after = await contactSnapshot(700001);
      for (const key of ['marketing_status', 'marketing_opt_in_at', 'unsubscribed_at', 'blocked_at', 'telegram_chat_id', 'last_delivery_error_code', 'is_primary', 'first_seen_at']) assert.deepEqual(after[key], before[key]);
    });
    await test('legacy contact without identity keeps existing canonical user and creates one identity', async () => {
      await db.insert(schema.users).values({ id: 'legacy-contact', email: null, firstName: 'Preserved' });
      await db.insert(schema.telegramContacts).values({ userId: 'legacy-contact', telegramUserId: '700003' });
      const before = await count('users'); const result = await userService.bootstrapTelegramMiniAppUser(validated(700003));
      assert.equal(result.id, 'legacy-contact'); assert.equal(await count('users'), before);
      assert.equal((await row('user_identities', 'provider_user_id', '700003')).user_id, 'legacy-contact');
    });
    await test('exact legacy bot key created after migration is reused without inventing chat or rewriting email', async () => {
      await db.insert(schema.users).values({ id: 'tg_700004', email: 'tg_700004@telegram.bot' });
      const result = await userService.bootstrapTelegramMiniAppUser(validated(700004)); assert.equal(result.id, 'tg_700004');
      assert.equal(result.email, 'tg_700004@telegram.bot'); assert.equal((await contactSnapshot(700004)).telegram_chat_id, null);
    });
    await test('identity without a contact recreates safe contact and retains current owner', async () => {
      await db.insert(schema.userIdentities).values({ userId: 'legacy-contact', provider: 'telegram', providerUserId: '700005' });
      const result = await userService.bootstrapTelegramMiniAppUser(validated(700005)); assert.equal(result.id, 'legacy-contact');
      assert.equal((await contactSnapshot(700005)).is_primary, false);
    });
    await test('disabled identity denies bootstrap without creating session or resetting disabled state', async () => {
      await pg.exec("UPDATE user_identities SET disabled_at=now() WHERE provider_user_id='700002'"); const before = await count('users');
      await rejects(() => userService.bootstrapTelegramMiniAppUser(validated(700002)), 403); assert.equal(await count('users'), before);
    });
    await test('disabled canonical user denies bootstrap', async () => {
      await pg.exec("UPDATE users SET identity_disabled_at=now() WHERE id='tg_700004'");
      await rejects(() => userService.bootstrapTelegramMiniAppUser(validated(700004)), 403);
    });
    await test('identity/contact owner conflict fails closed with safe generic response and unchanged owners', async () => {
      await pg.exec("UPDATE telegram_contacts SET user_id='tg_700004' WHERE telegram_user_id='700005'");
      const response = await bootstrap.POST(request({ initData: signed({}, { id: 700005 }) })); assert.equal(response.status, 409);
      assert.deepEqual(await response.json(), { ok: false, error: 'account_unavailable' }); assert.equal(response.headers.get('set-cookie'), null);
      assert.equal((await contactSnapshot(700005)).user_id, 'tg_700004'); assert.equal((await row('user_identities', 'provider_user_id', '700005')).user_id, 'legacy-contact');
    });
    await test('unsafe DTO cannot bypass runtime proof and reach bootstrap', () => rejects(() => userService.bootstrapTelegramMiniAppUser({ user: { id: '999999', firstName: 'Unsafe' }, authDate: now(), startParam: null }), 401));
    await test('a failed session insert rolls back tentative user, identity and contact together', async () => {
      const before = await count('users');
      await assert.rejects(userService.withTelegramMiniAppUser(validated(700010), async (tx, principal) => {
        await tx.insert(schema.telegramMiniappSessions).values({ userId: principal.user.id, identityId: principal.identity.id, tokenHash: 'not-a-hash', expiresAt: new Date(Date.now() + 60000) });
      }));
      assert.equal(await count('users'), before); assert.equal(await row('telegram_contacts', 'telegram_user_id', '700010'), undefined);
      assert.equal(await row('user_identities', 'provider_user_id', '700010'), undefined);
    });
    await test('parallel bootstrap calls for the same subject converge without orphan users (PGlite serial transaction scheduler)', async () => {
      const before = await count('users'); const results = await Promise.all(Array.from({ length: 8 }, () => userService.bootstrapTelegramMiniAppUser(validated(700011))));
      assert.equal(new Set(results.map(user => user.id)).size, 1); assert.equal(await count('users'), before + 1);
      assert.equal((await pg.query("SELECT count(*)::int AS n FROM user_identities WHERE provider_user_id='700011'")).rows[0].n, 1);
    });
    await test('actual provider-subject unique violation rolls back tentative user then safely retries lookup', async () => {
      await db.insert(schema.users).values({ id: 'race-winner', email: null });
      await db.insert(schema.userIdentities).values({ userId: 'race-winner', provider: 'telegram', providerUserId: '700012' });
      const original = db.transaction.bind(db), before = await count('users'); let hideOnce = true;
      db.transaction = (fn, options) => original(tx => {
        const proxy = new Proxy(tx, { get(target, key) {
          if (key !== 'select') { const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value; }
          return (...args) => { const query = target.select(...args), from = query.from.bind(query);
            query.from = table => { const builder = from(table); if (table !== schema.userIdentities || !hideOnce) return builder;
              const where = builder.where.bind(builder); builder.where = (...clauses) => { const result = where(...clauses), lock = result.for.bind(result);
                result.for = (...locks) => { if (hideOnce) { hideOnce = false; return Promise.resolve([]); } return lock(...locks); }; return result; }; return builder; }; return query; };
        } }); return fn(proxy);
      }, options);
      try { const result = await userService.bootstrapTelegramMiniAppUser(validated(700012)); assert.equal(result.id, 'race-winner'); assert.equal(hideOnce, false); }
      finally { db.transaction = original; }
      assert.equal(await count('users'), before); assert.equal((await contactSnapshot(700012)).user_id, 'race-winner');
    });
    await test('nextStep uses existing filter version and policy in filter/resources/profile/home order', async () => {
      const policy = source('lib/community/policy.ts'), base = { ...first, filterVersion: policy.FILTER_VERSION, filterCompletedAt: new Date(), gender: 'female', affiliation: 'maternal', isProfileComplete: true };
      for (const [override, expected] of [[{ filterVersion: null }, 'filter'], [{ filterVersion: 1 }, 'filter'], [{ filterCompletedAt: null }, 'filter'], [{ gender: null }, 'filter'], [{ affiliation: 'none', gender: null, isProfileComplete: false }, 'resources'], [{ isProfileComplete: false }, 'profile'], [{}, 'home'], [{ affiliation: 'giyur', giyurStage: null }, 'home']]) {
        assert.equal(userService.miniAppProfile({ ...base, ...override }).nextStep, expected);
      }
    });
    await test('bootstrap HTTP response contains only minimal profile, no-store and HttpOnly SameSite cookie', async () => {
      const response = await bootstrap.POST(request({ initData: signed() })); assert.equal(response.status, 200);
      const json = await response.json(); assert.deepEqual(Object.keys(json).sort(), ['ok', 'profile']);
      assert.deepEqual(Object.keys(json.profile).sort(), ['affiliation', 'filterCompleted', 'firstName', 'nextStep', 'profileComplete']);
      assert.equal(json.profile.nextStep, 'home'); assert.equal(response.headers.get('cache-control'), 'no-store');
      const cookie = response.headers.get('set-cookie'); assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=lax/i); assert.match(cookie, /Path=\//); assert.match(cookie, /Max-Age=86400/);
      token = remember(response); assert.equal(token.length, 43); assert.ok(!JSON.stringify(json).includes(token));
    });
    await test('database stores SHA-256 only, token is 256-bit random, not provider token', async () => {
      const hash = crypto.createHash('sha256').update(token).digest('hex'), stored = await row('telegram_miniapp_sessions', 'token_hash', hash);
      assert.equal(stored.user_id, first.id); assert.equal(stored.token_hash.length, 64); assert.equal(Buffer.from(token, 'base64url').length, 32);
      assert.ok(!JSON.stringify(stored).includes(token)); assert.notEqual(token, env.TELEGRAM_BOT_TOKEN);
    });
    await test('valid cookie resolves canonical Mini App user independently of Clerk and updates last seen', async () => {
      const user = await sessions.currentMiniAppUser(); assert.equal(user.id, first.id); assert.equal((await sessions.requireMiniAppUser()).id, first.id);
      const response = await sessionRoute.GET(); assert.equal(response.status, 200); assert.equal((await response.json()).profile.firstName, 'Canonical name');
    });
    await test('missing or malformed cookie is unauthenticated', async () => {
      cookieJar.clear(); assert.equal(await sessions.currentMiniAppUser(), null); await rejects(sessions.requireMiniAppUser, 401);
      cookieJar.set(config.miniAppCookieName(), 'malformed'); assert.equal(await sessions.currentMiniAppUser(), null);
      const response = await sessionRoute.GET(); assert.equal(response.status, 401); assert.equal(response.headers.get('cache-control'), 'no-store');
    });
    await test('unknown well-formed cookie is unauthenticated', async () => { cookieJar.set(config.miniAppCookieName(), crypto.randomBytes(32).toString('base64url')); assert.equal(await sessions.currentMiniAppUser(), null); });
    await test('expired session is unauthenticated', async () => {
      const response = await bootstrap.POST(request({ initData: signed() })); const raw = remember(response), hash = crypto.createHash('sha256').update(raw).digest('hex');
      await pg.query("UPDATE telegram_miniapp_sessions SET created_at=now()-interval '2 days',expires_at=now()-interval '1 second' WHERE token_hash=$1", [hash]);
      assert.equal(await sessions.currentMiniAppUser(), null);
    });
    await test('revoked session is unauthenticated', async () => {
      cookieJar.set(config.miniAppCookieName(), token); await sessions.revokeCurrentMiniAppSession(); assert.equal(await sessions.currentMiniAppUser(), null);
    });
    for (const kind of ['identity', 'user']) await test('live ' + kind + ' disable immediately rejects existing session', async () => {
      const response = await bootstrap.POST(request({ initData: signed() })); remember(response);
      await pg.query(kind === 'identity' ? 'UPDATE user_identities SET disabled_at=now() WHERE user_id=$1' : 'UPDATE users SET identity_disabled_at=now() WHERE id=$1', [first.id]);
      assert.equal(await sessions.currentMiniAppUser(), null);
      await pg.query(kind === 'identity' ? 'UPDATE user_identities SET disabled_at=NULL WHERE user_id=$1' : 'UPDATE users SET identity_disabled_at=NULL WHERE id=$1', [first.id]);
    });
    await test('session FK prevents identity/user ownership mismatch and invalid hash/lifetime', async () => {
      const identity = await row('user_identities', 'provider_user_id', '700001');
      for (const overrides of [{ userId: 'legacy-contact' }, { tokenHash: 'raw-token' }, { expiresAt: new Date(0) }]) {
        await assert.rejects(db.insert(schema.telegramMiniappSessions).values({ userId: first.id, identityId: identity.id, tokenHash: crypto.randomBytes(32).toString('hex'), expiresAt: new Date(Date.now() + 60000), ...overrides }));
      }
    });
    await test('Clerk identity cannot authenticate through a Mini App session', async () => {
      const [identity] = await db.insert(schema.userIdentities).values({ userId: first.id, provider: 'clerk', providerUserId: 'synthetic-clerk' }).returning();
      const raw = crypto.randomBytes(32).toString('base64url');
      await db.insert(schema.telegramMiniappSessions).values({ userId: first.id, identityId: identity.id, tokenHash: crypto.createHash('sha256').update(raw).digest('hex'), expiresAt: new Date(Date.now() + 60000) });
      cookieJar.set(config.miniAppCookieName(), raw); assert.equal(await sessions.currentMiniAppUser(), null);
      await db.delete(schema.telegramMiniappSessions).where(eq(schema.telegramMiniappSessions.identityId, identity.id));
    });
    await test('logout revokes only current session, clears cookie and preserves user/identity/marketing', async () => {
      const one = await bootstrap.POST(request({ initData: signed() })), two = await bootstrap.POST(request({ initData: signed() }));
      const raw = remember(one), other = two.cookies.get(config.miniAppCookieName()).value;
      const before = await userSnapshot(first.id), contact = await contactSnapshot(700001), identity = plain(await row('user_identities', 'provider_user_id', '700001'));
      const response = await logout.POST(request({}, {}, '/api/telegram/miniapp/logout')); assert.equal(response.status, 200);
      assert.match(response.headers.get('set-cookie'), /Max-Age=0/); assert.match(response.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
      assert.ok((await row('telegram_miniapp_sessions', 'token_hash', crypto.createHash('sha256').update(raw).digest('hex'))).revoked_at);
      assert.equal(await sessions.currentMiniAppUser(), null);
      cookieJar.set(config.miniAppCookieName(), other); assert.equal((await sessions.currentMiniAppUser()).id, first.id);
      assert.deepEqual(await userSnapshot(first.id), before); assert.deepEqual(await contactSnapshot(700001), contact);
      assert.deepEqual(plain(await row('user_identities', 'provider_user_id', '700001')), identity);
    });
    await test('logout without a session is idempotent', async () => { cookieJar.clear(); assert.equal((await logout.POST(request({}))).status, 200); });
    await test('production cookie is host-only HttpOnly Secure SameSite=Lax with bounded TTL', async () => {
      env.NODE_ENV = 'production'; env.NEXT_PUBLIC_APP_URL = 'https://menorah.example.invalid'; env.TELEGRAM_MINIAPP_SESSION_TTL_SECONDS = '3600';
      const response = await bootstrap.POST(request({ initData: signed() })); assert.equal(response.status, 200);
      const cookie = response.headers.get('set-cookie'); assert.match(cookie, /^__Host-menorah_miniapp_session=/); assert.match(cookie, /Secure/); assert.match(cookie, /HttpOnly/); assert.match(cookie, /Max-Age=3600/); assert.ok(!/Domain=/i.test(cookie));
      for (const value of ['0', '-1', 'NaN', 'Infinity', '604801', '60x']) { env.TELEGRAM_MINIAPP_SESSION_TTL_SECONDS = value; assert.equal(config.miniAppSessionTtlSeconds(), 86400); }
      delete env.TELEGRAM_MINIAPP_SESSION_TTL_SECONDS; env.NODE_ENV = 'development'; env.NEXT_PUBLIC_APP_URL = 'http://localhost:3999';
    });
    await test('cross-site bootstrap/logout denied without cookie issuance or session revocation', async () => {
      const before = await count('telegram_miniapp_sessions');
      for (const route of [bootstrap, logout]) for (const headers of [{ origin: 'https://attacker.example.invalid' }, { origin: 'null' }, { 'sec-fetch-site': 'cross-site' }]) {
        const response = await route.POST(request({ initData: signed() }, headers)); assert.equal(response.status, 403); assert.equal(response.headers.get('set-cookie'), null);
      }
      assert.equal(await count('telegram_miniapp_sessions'), before);
    });
    for (const [name, body, headers, expected] of [
      ['invalid JSON', '{', {}, 400], ['array body', [], {}, 400], ['extra unsafe identity input', { initData: signed(), initDataUnsafe: { user: { id: 1 } } }, {}, 400],
      ['non-JSON', { initData: signed() }, { 'content-type': 'text/plain' }, 415], ['declared oversize', { initData: signed() }, { 'content-length': '16385' }, 413],
      ['streamed oversize', { initData: 'x'.repeat(16385) }, {}, 413], ['invalid signature', { initData: changed(signed(), 'hash', 'a'.repeat(64)) }, {}, 401],
    ]) await test('HTTP ' + name + ' rejected with no-store and no cookie', async () => {
      const response = await bootstrap.POST(request(body, headers)); assert.equal(response.status, expected); assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(response.headers.get('set-cookie'), null);
    });
    await test('stream limit counts bytes despite misleading Content-Length', async () => {
      const response = await bootstrap.POST(request({ initData: 'я'.repeat(9000) }, { 'content-length': '1' })); assert.equal(response.status, 413);
    });
    await test('unknown database errors are generic and never include driver details', async () => {
      const original = db.transaction; db.transaction = async () => { throw new Error('synthetic-secret-query'); };
      try { const response = await bootstrap.POST(request({ initData: signed() })); assert.equal(response.status, 503); assert.deepEqual(await response.json(), { ok: false, error: 'temporarily_unavailable' }); }
      finally { db.transaction = original; }
    });
    await test('production refuses absent or insecure origin configuration', async () => {
      env.NODE_ENV = 'production';
      for (const url of ['', 'http://menorah.example.invalid']) {
        env.NEXT_PUBLIC_APP_URL = url; const response = await bootstrap.POST(request({ initData: signed() })); assert.equal(response.status, 503);
      }
      env.NODE_ENV = 'development'; env.NEXT_PUBLIC_APP_URL = 'http://localhost:3999';
      const req = request({ initData: signed() }); req.headers.delete('origin'); assert.equal((await bootstrap.POST(req)).status, 403);
    });
    await test('sessions backend-only RLS/grants, duplicate hashes and FK postcheck are explicit', async () => {
      assert.equal((await pg.query("SELECT relrowsecurity FROM pg_class WHERE oid='public.telegram_miniapp_sessions'::regclass")).rows[0].relrowsecurity, true);
      for (const role of ['anon', 'authenticated']) { await pg.exec('SET ROLE ' + role); try { await assert.rejects(pg.query('SELECT * FROM telegram_miniapp_sessions'), /permission denied/); } finally { await pg.exec('RESET ROLE'); } }
      const post = await pg.exec(fs.readFileSync(path.join(root, 'docs/miniapp-identity-v1/POSTCHECK.sql'), 'utf8'));
      const diagnostic=post[1].rows[0].postcheck;
      assert.equal(diagnostic.identity_integrity.invalid_sessions,0);
      assert.equal((await pg.query('SELECT count(*) AS n FROM (SELECT token_hash FROM telegram_miniapp_sessions GROUP BY token_hash HAVING count(*)>1) d')).rows[0].n,0);
      const stored = (await pg.query('SELECT * FROM telegram_miniapp_sessions LIMIT 1')).rows[0];
      await assert.rejects(db.insert(schema.telegramMiniappSessions).values({ userId: stored.user_id, identityId: stored.identity_id, tokenHash: stored.token_hash, expiresAt: new Date(Date.now() + 60000) }));
    });
  } finally { await pg.close(); }
  // Exercise the exact unified owner artifact, not just generated ORM DDL.
  const manual = fs.readFileSync(path.join(root, 'docs/miniapp-identity-v1/MANUAL_SQL.sql'), 'utf8');
  // Frozen owner adoption tests use its exact historical release. Auth/session
  // behavior above still runs the complete CURRENT native migration chain.
  const historicalFolder=fs.mkdtempSync('/tmp/menora-auth-adoption-');fs.mkdirSync(historicalFolder+'/meta');
  const historicalJournal=JSON.parse(fs.readFileSync(root+'/drizzle/meta/_journal.json'));historicalJournal.entries=historicalJournal.entries.slice(0,14);
  fs.writeFileSync(historicalFolder+'/meta/_journal.json',JSON.stringify(historicalJournal));
  for(const entry of historicalJournal.entries)fs.copyFileSync(root+'/drizzle/'+entry.tag+'.sql',historicalFolder+'/'+entry.tag+'.sql');
  async function migrated() { const database = new PGlite(); await migrate(drizzle(database), { migrationsFolder: historicalFolder });
    await database.exec('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;'); return database; }
  async function applyManual(database) { try { await database.exec(manual); } catch (error) { await database.exec('ROLLBACK'); throw error; } }
  await test('unified Step 2+3 rerun preserves existing sessions, revoked state and canonical data', async () => {
    const database = await migrated();
    try {
      await database.exec("INSERT INTO users(id,email,children_data) VALUES('synthetic-person',NULL,'[{\"id\":\"kept\"}]'); INSERT INTO user_identities(id,user_id,provider,provider_user_id) VALUES('00000000-0000-4000-8000-000000000001','synthetic-person','telegram','710001'); INSERT INTO telegram_contacts(user_id,telegram_user_id) VALUES('synthetic-person','710001');");
      await database.query("INSERT INTO telegram_miniapp_sessions(user_id,identity_id,token_hash,expires_at,revoked_at) VALUES('synthetic-person','00000000-0000-4000-8000-000000000001',$1,now()+interval '1 day',now())", ['a'.repeat(64)]);
      const before = (await database.query('SELECT to_jsonb(s) AS value FROM telegram_miniapp_sessions s')).rows;
      await applyManual(database); await applyManual(database);
      assert.deepEqual((await database.query('SELECT to_jsonb(s) AS value FROM telegram_miniapp_sessions s')).rows, before);
      assert.deepEqual((await database.query("SELECT children_data FROM users WHERE id='synthetic-person'")).rows[0].children_data, [{ id: 'kept' }]);
    } finally { await database.close(); }
  });
  await test('unified repeat removes session table and column grants and restores RLS', async () => {
    const database = await migrated();
    try {
      await database.exec('ALTER TABLE telegram_miniapp_sessions DISABLE ROW LEVEL SECURITY; GRANT SELECT ON telegram_miniapp_sessions TO PUBLIC; GRANT SELECT(token_hash) ON telegram_miniapp_sessions TO anon;');
      await applyManual(database);
      assert.equal((await database.query("SELECT relrowsecurity FROM pg_class WHERE oid='public.telegram_miniapp_sessions'::regclass")).rows[0].relrowsecurity, true);
      assert.equal((await database.query("SELECT has_column_privilege('anon','telegram_miniapp_sessions','token_hash','SELECT') AS allowed")).rows[0].allowed, false);
    } finally { await database.close(); }
  });
  for (const [name, sql, pattern] of [
    ['nullable hash', 'ALTER TABLE telegram_miniapp_sessions ALTER COLUMN token_hash DROP NOT NULL', /incompatible table/],
    ['wrong lifetime constraint', 'ALTER TABLE telegram_miniapp_sessions DROP CONSTRAINT telegram_miniapp_sessions_lifetime_check; ALTER TABLE telegram_miniapp_sessions ADD CONSTRAINT telegram_miniapp_sessions_lifetime_check CHECK(true)', /incompatible table/],
    ['wrong owner FK', 'ALTER TABLE telegram_miniapp_sessions DROP CONSTRAINT telegram_miniapp_sessions_identity_owner_fk; ALTER TABLE telegram_miniapp_sessions ADD CONSTRAINT telegram_miniapp_sessions_identity_owner_fk FOREIGN KEY(identity_id) REFERENCES user_identities(id)', /incompatible table/],
    ['public policy', 'CREATE POLICY public_sessions ON telegram_miniapp_sessions FOR SELECT TO PUBLIC USING(true)', /unexpected RLS policies/],
    ['inherited grants', 'CREATE ROLE synthetic_session_reader; GRANT synthetic_session_reader TO anon; GRANT SELECT ON telegram_miniapp_sessions TO synthetic_session_reader', /inherited\/owner privilege/],
    ['wrong owner unique index', 'ALTER TABLE telegram_miniapp_sessions DROP CONSTRAINT telegram_miniapp_sessions_identity_owner_fk; DROP INDEX user_identities_id_user_id_idx; CREATE UNIQUE INDEX user_identities_id_user_id_idx ON user_identities(user_id,id)', /incompatible identity owner index/],
  ]) await test('session partial rollout fails atomically: ' + name, async () => {
    const database = await migrated();
    try { await database.exec(sql); await assert.rejects(applyManual(database), pattern); }
    finally { await database.close(); }
  });
  fs.rmSync(historicalFolder,{recursive:true,force:true});
  fs.mkdirSync(output, { recursive: true }); fs.writeFileSync(path.join(output, 'miniapp-auth-results.json'), JSON.stringify({ environment: 'Node crypto, real NextResponse, native Drizzle migrations, isolated PGlite 0.5.10; synthetic data', remoteDatabaseTouched: false, realTelegramLaunch: false, concurrency: 'Promise.all on PGlite serial scheduler plus actual unique-violation rollback/retry fault injection; no independent PostgreSQL connections', checks }, null, 2) + '\n');
  console.log(`${checks.length}/${checks.length} Mini App auth checks passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
