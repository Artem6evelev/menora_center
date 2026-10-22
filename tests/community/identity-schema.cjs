/* Step 2 only: actual PostgreSQL/WASM, SQL artifacts, constraints and grants.
 * No remote env, network, Telegram auth/bootstrap, linking or merge service. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {generateMigration}=require('drizzle-kit/api');
const {PGlite}=require(path.join(process.env.COMMUNITY_TEST_RUNTIME||'/tmp/menora-filter-test-runtime','node_modules/@electric-sql/pglite'));
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'docs/miniapp-identity-v1');
const manual=fs.readFileSync(path.join(dir,'MANUAL_SQL.sql'),'utf8');
const body=fs.readFileSync(path.join(root,'drizzle/0009_miniapp_identity_v1.sql'),'utf8');
const pre=fs.readFileSync(path.join(dir,'PRECHECK.sql'),'utf8'),post=fs.readFileSync(path.join(dir,'POSTCHECK.sql'),'utf8');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'drizzle/meta/0008_snapshot.json')));
const empty={...baseline,tables:{},schemas:{},enums:{},sequences:{},roles:{},policies:{},views:{}};
const A='user_'+'A'.repeat(27),B='user_'+'B'.repeat(27);
const names=['user_identities','telegram_contacts','user_identity_link_attempts','user_identity_merge_log'];
const checks=[],evidence={environment:'isolated PGlite; synthetic data only',remoteDatabaseTouched:false,checks};
let baselineSql;
async function fresh(seed=true){
 const pg=new PGlite();await pg.exec(baselineSql);
 await pg.exec('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;');
 if(seed)await pg.query(`INSERT INTO users(id,email,first_name,source,telegram_chat_id,children_data,affiliation,gender,filter_version,filter_completed_at)
 VALUES ('tg_101','tg_101@telegram.bot','Synthetic','telegram_bot','101','[{"id":"preserved-child","name":"Synthetic child"}]',NULL,NULL,NULL,NULL),
 ('tg_303','real@example.invalid','Synthetic','telegram_bot',NULL,'[]',NULL,NULL,NULL,NULL),
 ($1,'clerk@example.invalid','Synthetic',NULL,NULL,'[]','maternal','female',2,'2026-10-20'),
 ($2,'second@example.invalid','Synthetic',NULL,'202','[]','giyur','female',2,'2026-10-20'),
 ('user_bad','other@example.invalid','Synthetic',NULL,NULL,'[]',NULL,NULL,NULL,NULL)`,[A,B]);
 if(seed)await pg.exec(`INSERT INTO events(id,title,is_free) VALUES('identity-event','Preserved synthetic event',false);
 INSERT INTO event_participants(id,event_id,user_id,status,extra_data) VALUES('identity-ticket','identity-event','tg_101','paid','{"totalAmount":123,"children":[{"id":"preserved-child"}]}');`);
 return pg;
}
async function users(pg){return(await pg.query('SELECT to_jsonb(u) AS value FROM users u ORDER BY id')).rows.map(r=>r.value);}
async function identityRows(pg){const result={};for(const table of names)result[table]=(await pg.query('SELECT to_jsonb(t) AS value FROM '+table+' t ORDER BY id')).rows;return result;}
async function apply(pg){try{await pg.exec(manual);}catch(e){await pg.exec('ROLLBACK');throw e;}}
async function test(name,fn){await fn();checks.push({name,status:'PASS'});console.log('PASS '+name);}
async function rejected(pg,sql,pattern){await assert.rejects(pg.exec(sql),pattern);}
async function backendOnly(pg){
 for(const name of names){
  assert.equal((await pg.query('SELECT relrowsecurity FROM pg_class WHERE oid=$1::regclass',['public.'+name])).rows[0].relrowsecurity,true);
  for(const role of ['anon','authenticated']){
   assert.equal((await pg.query('SELECT has_table_privilege($1,$2,\'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER\') AS allowed',[role,'public.'+name])).rows[0].allowed,false);
   await pg.exec('SET ROLE '+role);
   try{await assert.rejects(pg.query('SELECT * FROM public.'+name),/permission denied/);}finally{await pg.exec('RESET ROLE');}
  }
 }
}
(async()=>{
 baselineSql=(await generateMigration(empty,baseline)).join('\n');
 await test('unified manual artifact matches the deterministic 0009 + 0010 builder without changing native history',async()=>{
  assert.equal(manual,require('../../scripts/build-miniapp-manual-sql.cjs').buildMiniappManualSql());
  assert.match(pre,/BEGIN TRANSACTION READ ONLY/);assert.match(post,/BEGIN TRANSACTION READ ONLY/);
 });
 const pg=await fresh();
 try{
  const before=await users(pg),ticketBefore=(await pg.query('SELECT to_jsonb(p) AS value FROM event_participants p')).rows;
  await test('READ ONLY PRECHECK reports real counts and ambiguous Clerk IDs without modifying profiles',async()=>{
   const result=await pg.exec(pre);evidence.precheckSynthetic=result[1].rows[0];
   assert.equal(evidence.precheckSynthetic.total_users,5);assert.equal(evidence.precheckSynthetic.clerk_shaped_users,2);
   assert.equal(evidence.precheckSynthetic.legacy_tg_users,2);assert.equal(evidence.precheckSynthetic.ambiguous_user_ids,1);
   assert.deepEqual(await users(pg),before);
  });
  await test('manual upgrade keeps IDs/family/filter/paid history, clears only the exact fake address and imports no marketing consent or fresh verification',async()=>{
   await pg.exec('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO PUBLIC,anon,authenticated;');
   await apply(pg);
   const expected=structuredClone(before);expected.find(u=>u.id==='tg_101').email=null;
   assert.deepEqual(await users(pg),expected);assert.deepEqual((await pg.query('SELECT to_jsonb(p) AS value FROM event_participants p')).rows,ticketBefore);
   const ids=(await pg.query('SELECT * FROM user_identities')).rows;assert.equal(ids.length,5);
   assert.ok(ids.every(i=>i.verified_at===null));assert.ok(!ids.some(i=>i.user_id==='user_bad'));
   const contacts=(await pg.query('SELECT * FROM telegram_contacts ORDER BY telegram_user_id')).rows;
   assert.equal(contacts.length,3);assert.ok(contacts.every(c=>c.marketing_status==='unknown'&&!c.allows_write_to_pm&&c.marketing_opt_in_at===null));
   assert.equal(contacts.find(c=>c.telegram_user_id==='303').telegram_chat_id,null);
   assert.equal(contacts.find(c=>c.telegram_user_id==='202').first_name,null,'Do not copy a Clerk profile name into Telegram metadata');
  });
  await test('backend-only RLS and grants deny anon/authenticated despite inherited PUBLIC defaults',async()=>{await backendOnly(pg);});
  await test('Telegram-first canonical users accept NULL email; provider/FK/primary/active Clerk invariants are enforced',async()=>{
   await pg.exec("INSERT INTO users(id,email) VALUES('opaque-telegram-first',NULL)");
   await rejected(pg,`INSERT INTO user_identities(user_id,provider,provider_user_id) VALUES('${A}','other','x')`,/provider_check/);
   await rejected(pg,"INSERT INTO user_identities(user_id,provider,provider_user_id) VALUES('missing','telegram','999')",/foreign key/);
   await rejected(pg,`INSERT INTO user_identities(user_id,provider,provider_user_id) VALUES('${A}','telegram','101')`,/duplicate key/);
   await rejected(pg,`INSERT INTO user_identities(user_id,provider,provider_user_id) VALUES('${A}','clerk','another-subject')`,/active_clerk_per_user/);
   await rejected(pg,"INSERT INTO telegram_contacts(user_id,telegram_user_id) VALUES('tg_101','999')",/one_primary_per_user/);
  });
  await test('link attempts store hash-only unique tokens with bounded lifetime and a consumption marker',async()=>{
   await rejected(pg,"INSERT INTO user_identity_link_attempts(user_id,provider,token_hash,expires_at) VALUES('tg_101','clerk','raw-token',now()+interval '5 minutes')",/hash_check/);
   const hash='a'.repeat(64);
   await pg.query("INSERT INTO user_identity_link_attempts(user_id,provider,token_hash,expires_at) VALUES('tg_101','clerk',$1,now()+interval '5 minutes')",[hash]);
   await rejected(pg,`INSERT INTO user_identity_link_attempts(user_id,provider,token_hash,expires_at) VALUES('tg_101','clerk','${hash}',now()+interval '5 minutes')`,/duplicate key/);
   await pg.query('UPDATE user_identity_link_attempts SET consumed_at=now() WHERE token_hash=$1 AND consumed_at IS NULL RETURNING id',[hash]);
   assert.equal((await pg.query('UPDATE user_identity_link_attempts SET consumed_at=now() WHERE token_hash=$1 AND consumed_at IS NULL RETURNING id',[hash])).rows.length,0);
   await rejected(pg,`UPDATE user_identity_link_attempts SET consumed_at=expires_at+interval '1 second' WHERE token_hash='${hash}'`,/lifetime_check/);
  });
  await test('rerun never resubscribes, reactivates, rewrites metadata or timestamps',async()=>{
   await pg.exec("UPDATE telegram_contacts SET marketing_status='unsubscribed',unsubscribed_at=now(),last_start_param='synthetic-later',last_delivery_error_code='403' WHERE telegram_user_id='101'; UPDATE user_identities SET disabled_at=now(),metadata='{}' WHERE provider='telegram' AND provider_user_id='101';");
   const before=await identityRows(pg);await apply(pg);assert.deepEqual(await identityRows(pg),before);
  });
  await test('future merged ownership with two Telegram identities/contacts survives rerun and keeps one primary',async()=>{
   // Simulated future database state only; no merge service is implemented here.
   await pg.query("UPDATE telegram_contacts SET is_primary=false,user_id=$1 WHERE telegram_user_id='101'",[B]);
   await pg.query("UPDATE user_identities SET user_id=$1 WHERE provider='telegram' AND provider_user_id='101'",[B]);
   const before=await identityRows(pg),people=await users(pg);await apply(pg);
   assert.deepEqual(await identityRows(pg),before);assert.deepEqual(await users(pg),people);
   assert.equal((await pg.query("SELECT count(*)::int AS n FROM telegram_contacts WHERE user_id=$1",[B])).rows[0].n,2);
   assert.equal((await pg.query("SELECT count(*)::int AS n FROM telegram_contacts WHERE user_id=$1 AND is_primary",[B])).rows[0].n,1);
  });
  await test('merge audit allows INSERT but rejects UPDATE/DELETE/TRUNCATE without requiring the source profile to survive',async()=>{
   await pg.query("INSERT INTO user_identity_merge_log(source_user_id,target_user_id,trigger_provider,reason) VALUES('deleted-source',$1,'clerk','synthetic proof')",[B]);
   for(const sql of ["UPDATE user_identity_merge_log SET reason='changed'",'DELETE FROM user_identity_merge_log','TRUNCATE user_identity_merge_log'])await rejected(pg,sql,/append-only/);
   assert.equal((await pg.query('SELECT count(*)::int AS n FROM user_identity_merge_log')).rows[0].n,1);
  });
  await test('rerun restores the audit mutation guard if a privileged operator disabled it',async()=>{
   await pg.exec('ALTER TABLE user_identity_merge_log DISABLE TRIGGER user_identity_merge_log_no_mutation');
   await apply(pg);await rejected(pg,'DELETE FROM user_identity_merge_log',/append-only/);
  });
  await test('READ ONLY POSTCHECK confirms contacts/identity owners, unique subjects, RLS and no public effective grants',async()=>{
   const snapshot=await identityRows(pg),result=await pg.exec(post);evidence.postcheckSynthetic=result[1].rows[0];
   assert.equal(evidence.postcheckSynthetic.fake_emails_remaining,0);
   for(const n of [2,3,4,5,6,7,8,9,10]){
    if([5,6].includes(n))assert.equal(Object.values(result[n].rows[0])[0],0);
    else assert.deepEqual(result[n].rows,[]);
   }
   assert.deepEqual(await identityRows(pg),snapshot);await backendOnly(pg);
  });
 }finally{await pg.close();}
 for(const [name,seed] of [
  ['negative group chat',"INSERT INTO users(id,email,telegram_chat_id) VALUES('tg_-10','tg_-10@telegram.bot','-10')"],
  ['tg ID/chat mismatch',"INSERT INTO users(id,email,telegram_chat_id) VALUES('tg_101','tg_101@telegram.bot','102')"],
  ['duplicate subject without a proven mapping',`INSERT INTO users(id,email,telegram_chat_id) VALUES('tg_101','tg_101@telegram.bot',NULL),('${A}','real@example.invalid','101')`],
 ])await test('PRECHECK detects '+name+' and manual migration refuses atomically',async()=>{
  const pg=await fresh(false);try{
   await pg.exec(seed);const before=await users(pg);const result=await pg.exec(pre);
   assert.ok(result[2].rows.length||result[4].rows.length);await assert.rejects(apply(pg),/ambiguous|duplicate legacy/);
   assert.deepEqual(await users(pg),before);assert.equal((await pg.query("SELECT to_regclass('public.user_identities') AS table_name")).rows[0].table_name,null);
   assert.equal((await pg.query("SELECT is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='email'")).rows[0].is_nullable,'NO');
  }finally{await pg.close();}
 });
 const ddl=body.slice(0,body.indexOf('-- Fail atomically'));
 await test('import can create multiple missing Telegram contacts for an already proven survivor with exactly one primary',async()=>{
  const pg=await fresh();try{
   await pg.exec('BEGIN;'+ddl+'COMMIT;');
   await pg.query("INSERT INTO user_identities(user_id,provider,provider_user_id) VALUES($1,'telegram','101'),($1,'telegram','202')",[B]);
   await apply(pg);
   assert.equal((await pg.query('SELECT count(*)::int AS n FROM telegram_contacts WHERE user_id=$1',[B])).rows[0].n,2);
   assert.equal((await pg.query('SELECT count(*)::int AS n FROM telegram_contacts WHERE user_id=$1 AND is_primary',[B])).rows[0].n,1);
   const before=await identityRows(pg);await apply(pg);assert.deepEqual(await identityRows(pg),before);
  }finally{await pg.close();}
 });
 for(const [name,defect] of [
  ['wrong nullable/default contract',"ALTER TABLE user_identities ALTER COLUMN provider_instance DROP NOT NULL"],
  ['wrong default',"ALTER TABLE user_identities ALTER COLUMN provider_instance SET DEFAULT 'unexpected'"],
  ['wrong check with the expected name',"ALTER TABLE user_identities DROP CONSTRAINT user_identities_provider_check; ALTER TABLE user_identities ADD CONSTRAINT user_identities_provider_check CHECK(provider='clerk')"],
  ['wrong partial unique index',"DROP INDEX user_identities_active_clerk_per_user_idx; CREATE UNIQUE INDEX user_identities_active_clerk_per_user_idx ON user_identities(user_id)"],
  ['wrong foreign key',"ALTER TABLE user_identities DROP CONSTRAINT user_identities_user_id_users_id_fk; ALTER TABLE user_identities ADD CONSTRAINT user_identities_user_id_users_id_fk FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT"],
  ['public policy',"CREATE POLICY unsafe_identity_access ON user_identities USING(true)"],
  ['inherited grant',"CREATE ROLE inherited_reader; GRANT SELECT ON user_identities TO inherited_reader; GRANT inherited_reader TO anon"],
 ])await test('incompatible partial rollout fails closed: '+name,async()=>{
  const pg=await fresh();try{await pg.exec('BEGIN;'+ddl+'COMMIT;');await pg.exec(defect);
   const before=await users(pg);await assert.rejects(apply(pg),/incompatible|unexpected RLS|inherited\/owner/);assert.deepEqual(await users(pg),before);
  }finally{await pg.close();}
 });
 await test('repeat removes direct table and column grants without altering existing records',async()=>{
  const pg=await fresh();try{await apply(pg);const before=await identityRows(pg);
   await pg.exec('GRANT SELECT ON user_identities TO PUBLIC; GRANT SELECT(provider_user_id) ON user_identities TO anon');
   await apply(pg);await backendOnly(pg);assert.deepEqual(await identityRows(pg),before);
  }finally{await pg.close();}
 });
 const out=process.env.COMMUNITY_TEST_OUTPUT||path.join(dir,'evidence');fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'identity-results.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log(`${checks.length}/${checks.length} identity schema checks passed; remote database not touched.`);
})().catch(e=>{console.error(e);process.exitCode=1});
