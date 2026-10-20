/* Native Drizzle migrator + isolated PostgreSQL/WASM. Never reads real env. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const runtime = process.env.COMMUNITY_TEST_RUNTIME || '/tmp/menora-filter-test-runtime';
process.env.NODE_PATH = [path.join(runtime, 'node_modules'), process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
require('node:module').Module._initPaths();
const { PGlite } = require('@electric-sql/pglite');
const { drizzle } = require('drizzle-orm/pglite');
const { migrate } = require('drizzle-orm/pglite/migrator');
const { generateDrizzleJson, generateMigration } = require('drizzle-kit/api');
const { validateHistory, readMigrationFiles } = require('../../scripts/migration-history.cjs');
const root = path.resolve(__dirname, '../..');
const folder = path.join(root, 'drizzle');
const journal = JSON.parse(fs.readFileSync(path.join(folder, 'meta/_journal.json')));
const migrations = readMigrationFiles({ migrationsFolder: folder });
const sourceModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, 'lib/db/schema.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { module: sourceModule, exports: sourceModule.exports, require, crypto: crypto.webcrypto });
const current = generateDrizzleJson(sourceModule.exports);
const empty = { ...current, tables: {}, schemas: {}, enums: {}, sequences: {}, roles: {}, policies: {}, views: {} };
const checks = [];
function pass(name) { checks.push({ name, status: 'PASS' }); console.log('PASS ' + name); }
const rows = async pg => (await pg.query('select hash, created_at from drizzle.__drizzle_migrations order by created_at, id')).rows;
async function metadata(pg) {
  const columns = (await pg.query(`select table_name,column_name,data_type,udt_name,character_maximum_length,is_nullable,column_default
    from information_schema.columns where table_schema='public' order by table_name,ordinal_position`)).rows;
  // Migration ADD COLUMN order differs from a fresh ORM CREATE; order is not part of the API contract.
  columns.sort((a, b) => (a.table_name + '.' + a.column_name).localeCompare(b.table_name + '.' + b.column_name));
  const constraints = (await pg.query(`select t.relname as table_name,pg_get_constraintdef(c.oid) as definition
    from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public' order by t.relname,pg_get_constraintdef(c.oid)`)).rows;
  const indexes = (await pg.query(`select tablename,indexname,indexdef from pg_indexes where schemaname='public' order by tablename,indexname`)).rows;
  const rls = (await pg.query(`select relname,relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' order by relname`)).rows;
  return { columns, constraints, indexes, rls };
}
async function fingerprint(pg) {
  const result = {};
  for (const table of ['users', 'events', 'event_participants', 'kids_applications', 'service_participants', 'news', 'videos']) {
    result[table] = (await pg.query(`select md5(coalesce(string_agg((to_jsonb(t)-'gender'-'affiliation'-'filter_version'-'filter_revision'-'giyur_stage'-'filter_completed_at'-'identity_disabled_at')::text,'' order by id),'')) as hash,count(*)::int as count from public."${table}" t`)).rows[0];
  }
  return result;
}
async function repeat(pg) {
  const before = await rows(pg), schemaBefore = await metadata(pg);
  const executed = [];
  const traced = drizzle(pg, { logger: { logQuery(query) { executed.push(query); } } });
  await migrate(traced, { migrationsFolder: folder });
  assert.deepEqual(await rows(pg), before);
  assert.deepEqual(await metadata(pg), schemaBefore);
  assert.ok(!executed.some(sql => /^\s*(alter|revoke|insert into|create (unique )?index)/i.test(sql)));
  validateHistory(await rows(pg), migrations, 17);
  return { ledgerRows: before.length, migrationStatementsReapplied: 0, schemaUnchanged: true };
}

(async () => {
  const evidence = { environment: 'Isolated PGlite 0.5.10; native drizzle-orm/pglite/migrator, same PgDialect and drizzle/ files as postgres-js runner', realDatabaseTouched: false, checks };
  let pg = new PGlite();
  try {
    await pg.exec((await generateMigration(empty, current)).join('\n'));
    evidence.expected = await metadata(pg);
  } finally { await pg.close(); }

  pg = new PGlite();
  try {
    const db = drizzle(pg);
    await migrate(db, { migrationsFolder: folder });
    assert.deepEqual(await metadata(pg), evidence.expected);
    validateHistory(await rows(pg), migrations, 17);
    assert.equal((await rows(pg)).length, journal.entries.length);
    pass('Empty database: complete native chain matches ORM columns/types/defaults/FKs/checks/indexes/RLS');
    evidence.emptyLedger = await rows(pg);
    pass('Every migration, including 0004/0005/0006, registered by native Drizzle');
    evidence.emptyRepeat = await repeat(pg);
    pass('Second native run on fresh database: no migration statements reapplied, journal/schema unchanged');
  } finally { await pg.close(); }

  const prefix = fs.mkdtempSync(path.join(os.tmpdir(), 'menora-native-prefix-'));
  fs.mkdirSync(path.join(prefix, 'meta'));
  fs.writeFileSync(path.join(prefix, 'meta/_journal.json'), JSON.stringify({ ...journal, entries: journal.entries.slice(0, 4) }));
  for (const entry of journal.entries.slice(0, 4)) fs.copyFileSync(path.join(folder, entry.tag + '.sql'), path.join(prefix, entry.tag + '.sql'));
  pg = new PGlite();
  try {
    const db = drizzle(pg);
    await migrate(db, { migrationsFolder: prefix });
    const legacy = structuredClone(current);
    delete legacy.tables['public.community_audit'];
    delete legacy.tables['public.community_registration_drafts'];
    for (const col of ['gender', 'affiliation', 'filter_version', 'filter_revision', 'giyur_stage', 'filter_completed_at', 'identity_disabled_at']) delete legacy.tables['public.users'].columns[col];
    legacy.tables['public.users'].checkConstraints = {};
    // Represent the previously observed additive schema drift (families/payments already exist).
    const historical = JSON.parse(fs.readFileSync(path.join(folder, 'meta/0003_snapshot.json')));
    await pg.exec((await generateMigration(historical, legacy)).join('\n'));
    await pg.exec('ALTER TABLE kids_applications RENAME CONSTRAINT kids_applications_user_id_users_id_fk TO kids_applications_user_id_fkey');
    await pg.exec(`
      INSERT INTO users(id,email,is_profile_complete,jewish_status,spouse_name,children_data,telegram_chat_id)
      VALUES ('legacy-father','father@example.invalid',true,'Еврей по материнской линии','Preserved spouse','[{"id":"old-child","name":"Preserved child","dateOfBirth":"2020-01-01"}]','synthetic-chat'),
      ('legacy-giyur','giyur@example.invalid',true,'Гиюр завершён или нахожусь на продвинутом этапе',NULL,'[]',NULL);
      INSERT INTO events(id,title,is_free,payment_url,child_price) VALUES ('old-event','Preserved event',false,'https://example.invalid/payment','25');
      INSERT INTO event_participants(id,event_id,user_id,status,extra_data) VALUES ('old-ticket','old-event','legacy-father','paid','{"children":[{"id":"old-child","name":"Preserved child"}],"totalAmount":125}');
      INSERT INTO kids_applications(id,program_title,parent_first_name,parent_last_name,email,phone,children,user_id,status)
      VALUES ('00000000-0000-4000-8000-000000000001','Preserved program','Synthetic','Father','father@example.invalid','synthetic','[{"id":"old-child","name":"Preserved child"}]','legacy-father','approved');
      INSERT INTO services(id,title) VALUES ('old-service','Preserved service');
      INSERT INTO service_participants(id,service_id,user_id,phone,status) VALUES ('old-service-ticket','old-service','legacy-father','synthetic','paid');
      INSERT INTO news(title,slug,content,author_id,status) VALUES ('Preserved news','preserved','Synthetic','legacy-father','published');
      INSERT INTO videos(title,link,author_id,status) VALUES ('Preserved video','https://example.invalid/video','legacy-father','published');
    `);
    const before = await fingerprint(pg);
    validateHistory(await rows(pg), migrations, 16);
    await migrate(db, { migrationsFolder: folder });
    assert.deepEqual(await fingerprint(pg), before);
    assert.deepEqual(await metadata(pg), evidence.expected);
    assert.equal((await pg.query("select count(*)::int as count from pg_constraint where conrelid='public.kids_applications'::regclass and contype='f'")).rows[0].count, 1);
    pass('Equivalent pre-existing child FK with a different name is retained without a duplicate');
    assert.deepEqual((await pg.query(`select gender,affiliation,giyur_stage,filter_version,filter_revision from users where id='legacy-giyur'`)).rows[0], { gender: null, affiliation: null, giyur_stage: null, filter_version: null, filter_revision: 0 });
    evidence.upgrade = { businessBefore: before, businessAfter: await fingerprint(pg), ledger: await rows(pg), unknownAnswersRemainNull: true };
    pass('Old synthetic schema: native upgrade preserves children/families/paid registrations/content and unknown giyur');
    evidence.upgradeRepeat = await repeat(pg);
    assert.deepEqual(await fingerprint(pg), before);
    pass('Second native run after upgrade: no migrations reapplied, business rows preserved');
    assert.throws(() => validateHistory([], migrations, 16), /no canonical ledger/);
    assert.throws(() => validateHistory([{ hash: 'another-chain', created_at: 1773916312666 }], migrations, 16), /mismatch/);
    const changed = await rows(pg); changed[1] = { ...changed[1], hash: 'tampered' };
    assert.throws(() => validateHistory(changed, migrations, 17), /mismatch/);
    pass('Migration preflight rejects existing untracked schema, foreign chain and changed checksums');
    const compatible = await rows(pg); compatible[4] = { ...compatible[4], hash: '34124c4a9c89a348323b834556d45e41c7d2d2f1364c1e96e9f9a27b99f3a7bb' };
    const normalize = value => value.replaceAll('--> statement-breakpoint', '').replace(/\s/g, '');
    assert.equal(normalize(fs.readFileSync(path.join(folder, '0004_community_filtering.sql'), 'utf8')), normalize(fs.readFileSync(path.join(root, 'docs/implementation-2026-10-20/acceptance/evidence/0004-before-native-fix.sql'), 'utf8')));
    validateHistory(compatible, migrations, 17);
    pass('Already registered 0004 v1 remains compatible with statement-boundary-only v2');
  } finally { await pg.close(); fs.rmSync(prefix, { recursive: true, force: true }); }

  const output = path.join(root, 'docs/implementation-2026-10-20/acceptance/evidence/migration-results.json');
  fs.writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n');
  console.log(`${checks.length}/${checks.length} native migration checks passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
