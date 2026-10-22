/* Disposable native PostgreSQL, synthetic data only. No .env, remote URL or API. */
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),net=require('net'),assert=require('node:assert/strict');
const postgres=require('postgres'),{readMigrationFiles,validateHistory}=require('../../scripts/migration-history.cjs');
const baseline=require('../../scripts/adoption-baseline.json');
const root=path.resolve(__dirname,'../..'),out=process.env.COMMUNITY_TEST_OUTPUT||path.join(root,'docs/production-candidate-telegram/evidence');
const checks=[];async function test(name,fn){await fn();checks.push({name,status:'PASS'});console.log('PASS '+name);}
(async()=>{
 assert.notEqual(process.env.NODE_ENV,'production');
 const {default:EmbeddedPostgres}=await import('/tmp/menora-native-postgres-runtime/node_modules/embedded-postgres/dist/index.js');
 const port=35433;await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(port,'127.0.0.1',()=>s.close(resolve));});
 const directory=fs.mkdtempSync('/tmp/menora-adoption-pg-');
 const cluster=new EmbeddedPostgres({databaseDir:directory,user:'menora_adoption_local',password:'synthetic-local-only',port,persistent:false,createPostgresUser:false,initdbFlags:['--locale=C','--encoding=UTF8'],postgresFlags:['-h','127.0.0.1','-k',directory],onLog:()=>{},onError:()=>{}});
 const clients=[],fixture=fs.mkdtempSync('/tmp/menora-adoption-runner-');let started=false;
 const config=db=>({host:'127.0.0.1',port,user:'menora_adoption_local',password:'synthetic-local-only',database:db,max:4,prepare:false,onnotice:()=>{}});
 const connect=db=>{const sql=postgres(config(db));clients.push(sql);return sql;};
 const execute=async(sql,text)=>{const c=await sql.reserve();try{return await c.unsafe(text);}catch(e){await c.unsafe('ROLLBACK');throw e;}finally{c.release();}};
 const ledger=async sql=>Array.from(await sql`SELECT id,hash,created_at FROM drizzle.__drizzle_migrations ORDER BY id`).map(r=>({...r}));
 const manual=fs.readFileSync(root+'/docs/miniapp-identity-v1/MANUAL_SQL.sql','utf8');
 const migrations=readMigrationFiles({migrationsFolder:root+'/drizzle'});
 try{
 await cluster.initialise();await cluster.start();started=true;
 const admin=connect('postgres');await admin.unsafe('CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;');
 await cluster.createDatabase('adoption_fresh');await cluster.createDatabase('adoption_legacy');
 const fresh=connect('adoption_fresh'),legacy=connect('adoption_legacy');
 fs.cpSync(root+'/drizzle',fixture+'/drizzle',{recursive:true});fs.mkdirSync(fixture+'/scripts');
 for(const f of ['migrate.cjs','migration-history.cjs','adoption-baseline.json'])fs.copyFileSync(root+'/scripts/'+f,fixture+'/scripts/'+f);
 fs.symlinkSync(root+'/node_modules',fixture+'/node_modules');
 const runner=async(database,success=true)=>{
 const env={PATH:process.env.PATH,HOME:process.env.HOME,DATABASE_URL:`postgresql://menora_adoption_local:synthetic-local-only@127.0.0.1:${port}/${database}`};
 const result=await new Promise((resolve,reject)=>{let stdout='',stderr='';const child=cp.spawn(process.execPath,[fixture+'/scripts/migrate.cjs'],{cwd:fixture,env});child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);child.once('error',reject);child.once('exit',code=>resolve({code,stdout,stderr}));});
 if(success)assert.equal(result.code,0,result.stderr);else assert.notEqual(result.code,0);return result;
 };
 await test('native fresh: ordinary project runner executes canonical chain plus real no-op adoption marker',async()=>{await runner('adoption_fresh');const rows=await ledger(fresh);assert.equal(rows.length,14);assert.equal(validateHistory(rows,migrations,28),'canonical');assert.equal(rows[13].hash,baseline.marker.hash);});
 // Produce only a synthetic next migration in the disposable copy, never in product history.
 const journal=JSON.parse(fs.readFileSync(fixture+'/drizzle/meta/_journal.json','utf8'));
 const next=journal.entries.at(-1).idx+1,tag=String(next).padStart(4,'0')+'_synthetic_future_probe';
 fs.writeFileSync(fixture+'/drizzle/'+tag+'.sql','CREATE TABLE public.adoption_future_probe(executions integer NOT NULL,backend_pid integer NOT NULL);\n--> statement-breakpoint\nINSERT INTO public.adoption_future_probe VALUES(1,pg_backend_pid());\n');
 journal.entries.push({idx:next,version:'7',when:baseline.marker.when+1,tag,breakpoints:true});fs.writeFileSync(fixture+'/drizzle/meta/_journal.json',JSON.stringify(journal));
 await test('native fresh: synthetic common future migration executes once; second runner is no-op',async()=>{await Promise.all([runner('adoption_fresh'),runner('adoption_fresh')]);const before=await ledger(fresh);await runner('adoption_fresh');assert.deepEqual(await ledger(fresh),before);assert.equal((await fresh`SELECT sum(executions)::integer AS n FROM adoption_future_probe`)[0].n,1);});
 // Schema model of the confirmed baseline, with the exact historical ledger (not fake canonical entries).
 for(const m of migrations.slice(0,9))await execute(legacy,'BEGIN;'+m.sql.join('\n')+'COMMIT;');
 await legacy.unsafe('CREATE SCHEMA drizzle;CREATE TABLE drizzle.__drizzle_migrations(id serial PRIMARY KEY,hash text NOT NULL,created_at bigint);');
 for(const e of baseline.legacy)await legacy`INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES(${e.hash},${e.created_at})`;
 await legacy.unsafe("INSERT INTO users(id,email,first_name,source,telegram_chat_id,children_data,spouse_name) SELECT 'tg_'||g,'tg_'||g||'@telegram.bot','Synthetic','telegram_bot',g::text,'[{\"id\":\"preserved-child\",\"name\":\"Synthetic child\"}]'::jsonb,'Synthetic spouse' FROM generate_series(101,211) g;");
 const member='user_'+'A'.repeat(27);
 await legacy`INSERT INTO users(id,email,affiliation,gender,filter_version,filter_completed_at,agreed_to_privacy,city_id) VALUES(${member},'synthetic@example.invalid','giyur','female',2,now(),true,'8300')`;
 await legacy.unsafe("INSERT INTO events(id,title,is_free) VALUES('synthetic-event','Synthetic event',false);INSERT INTO event_participants(id,event_id,user_id,status,extra_data) SELECT 'synthetic-registration-'||g,'synthetic-event','tg_101',CASE WHEN g%2=0 THEN 'paid' ELSE 'confirmed' END,jsonb_build_object('totalAmount',123,'children',jsonb_build_array('preserved-child')) FROM generate_series(1,43) g;");
 const originalLedger=await ledger(legacy);
 const data=async()=>({...((await legacy.unsafe(require('../../scripts/adoption-sql.cjs').preservationQuery()))[0])});
 const before=await data();
 await test('native legacy: permanent PRECHECK recognizes exact 17 rows and returns complete object baseline',async()=>{const r=await execute(legacy,fs.readFileSync(root+'/docs/miniapp-identity-v1/PRECHECK.sql','utf8'));const pre=r.find(x=>x[0]?.precheck)?.[0].precheck;assert(pre);assert.equal(pre.assessment,'SAFE TO ADOPT');assert.equal(pre.registration_baseline.registrations,43);assert.equal(pre.legacy.legacy_telegram_users,111);assert.equal(pre.registration_baseline.fingerprint,before.registration_fingerprint);});
 await test('native runner rejects legacy chain without adoption before DDL',async()=>{await runner('adoption_legacy',false);assert.deepEqual(await ledger(legacy),originalLedger);});
 const marker={id:18,hash:baseline.marker.hash,created_at:String(baseline.marker.when)};
 const valid=[...originalLedger,marker];
 const negatives=[
 ['changed legacy hash',r=>{r[0].hash='a'.repeat(64);}],
 ['changed timestamp',r=>{r[0].created_at=String(+r[0].created_at+1);}],
 ['reordered rows',r=>{[r[0],r[1]]=[r[1],r[0]];}],
 ['partial 16-row legacy chain',r=>r.splice(3,1)],
 ['18 unknown rows',r=>r.forEach(x=>x.hash='b'.repeat(64))],
 ['duplicate legacy row',r=>r.splice(1,0,{...r[0]})],
 ['legacy without marker',r=>r.pop()],
 ['wrong marker hash',r=>{r[17].hash='c'.repeat(64);}],
 ['fake appended canonical history',r=>{r.splice(17,0,...baseline.canonical.map(e=>({hash:e.hash,created_at:e.created_at})));}]
 ];
 for(const[name,mutate]of negatives)await test('negative native ledger: '+name,async()=>{const rows=structuredClone(valid);mutate(rows);assert.throws(()=>validateHistory(rows,migrations,28),/history mismatch/);});
 await test('negative native baseline: incompatible schema aborts entire adoption without marker or release tables',async()=>{await legacy.unsafe('ALTER TABLE users ALTER COLUMN filter_revision DROP NOT NULL');await assert.rejects(execute(legacy,manual),/incompatible baseline/);assert.deepEqual(await ledger(legacy),originalLedger);assert.equal((await legacy`SELECT to_regclass('public.user_identities') AS t`)[0].t,null);assert.deepEqual(await data(),before);await legacy.unsafe('ALTER TABLE users ALTER COLUMN filter_revision SET NOT NULL');});
 await test('native legacy: atomic concurrent owner adoption on independent connections records one marker',async()=>{const c1=await legacy.reserve(),c2=await legacy.reserve();try{const p1=(await c1`SELECT pg_backend_pid() AS p`)[0].p,p2=(await c2`SELECT pg_backend_pid() AS p`)[0].p;assert.notEqual(p1,p2);await Promise.all([c1.unsafe(manual),c2.unsafe(manual)]);}finally{c1.release();c2.release();}const rows=await ledger(legacy);assert.deepEqual(rows.slice(0,17),originalLedger);assert.equal(rows.length,18);assert.equal(rows[17].hash,baseline.marker.hash);assert.equal(validateHistory(rows,migrations,28),'adopted-legacy');assert.deepEqual(await data(),before);});
 for(const[name,mutate]of negatives)await test('negative ordinary runner and owner SQL on native DB: '+name,async()=>{
 const clean=await ledger(legacy),bad=structuredClone(clean);mutate(bad);
 const restore=async rows=>{await legacy.unsafe('DELETE FROM drizzle.__drizzle_migrations');for(let i=0;i<rows.length;i++)await legacy`INSERT INTO drizzle.__drizzle_migrations(id,hash,created_at) VALUES(${i+1},${rows[i].hash},${rows[i].created_at})`;await legacy.unsafe("SELECT setval(pg_get_serial_sequence('drizzle.__drizzle_migrations','id'),(SELECT max(id) FROM drizzle.__drizzle_migrations))");};
 await restore(bad);const badBefore=await ledger(legacy);await runner('adoption_legacy',false);if(name!=='legacy without marker')await assert.rejects(execute(legacy,manual),/history mismatch/);assert.deepEqual(await ledger(legacy),badBefore);assert.deepEqual(await data(),before);await restore(clean);
 });
 await test('native 111-user backfill preserves canonical IDs, family/filter data; creates unknown-consent contacts once',async()=>{const [r]=await legacy.unsafe("SELECT count(*)::int AS n,count(*) FILTER(WHERE affiliation IS NOT NULL OR gender IS NOT NULL OR filter_version IS NOT NULL OR filter_completed_at IS NOT NULL)::int AS invented,count(*) FILTER(WHERE email IS NOT NULL)::int AS fake FROM users WHERE source='telegram_bot'");assert.deepEqual({...r},{n:111,invented:0,fake:0});const[c]=await legacy.unsafe("SELECT count(*)::int AS n,count(*) FILTER(WHERE marketing_status<>'unknown' OR marketing_opt_in_at IS NOT NULL)::int AS invented FROM telegram_contacts");assert.deepEqual({...c},{n:111,invented:0});});
 await test('native postcheck proves schema/security/identity/marker; rejects a different production fingerprint',async()=>{const post=fs.readFileSync(root+'/docs/miniapp-identity-v1/POSTCHECK.sql','utf8');const result=await execute(legacy,post);const r=result.find(x=>x[0]?.postcheck)[0].postcheck;assert.equal(r.lineage,'legacy-adopted');assert.equal(r.ledger.legacy_matches,17);assert.equal(r.ledger.legacy_markers,1);assert.equal(r.security.exposed_grants,0);assert.equal(r.identity_integrity.contacts,111);assert.equal(r.production_registration_baseline_matches,false);assert.equal(r.assessment,'BLOCKER');const substituted=post.replaceAll(baseline.productionEvidence.registrationFingerprint,before.registration_fingerprint);const checked=await execute(legacy,substituted);assert.equal(checked.find(x=>x[0]?.postcheck)[0].postcheck.assessment,'PASS');assert.deepEqual(await data(),before);});
 await test('native repeat after future ownership merge preserves survivor, subscriptions and identity/contact timestamps',async()=>{await legacy`UPDATE telegram_contacts SET user_id=${member},marketing_status='unsubscribed',unsubscribed_at=now() WHERE telegram_user_id='101'`;await legacy`UPDATE user_identities SET user_id=${member} WHERE provider='telegram' AND provider_user_id='101'`;await legacy.unsafe("UPDATE users SET identity_disabled_at=now() WHERE id='tg_101'");const snap=Array.from(await legacy`SELECT to_jsonb(t) AS row FROM telegram_contacts t ORDER BY id`),usersBefore=await data();await execute(legacy,manual);assert.deepEqual(Array.from(await legacy`SELECT to_jsonb(t) AS row FROM telegram_contacts t ORDER BY id`),snap);assert.deepEqual(await data(),usersBefore);assert.equal((await ledger(legacy)).length,18);});
 await test('native adopted legacy: ordinary runner skips canonical 0000-0012, executes common future once on new backend',async()=>{await runner('adoption_legacy');const after=await ledger(legacy);assert.deepEqual(after.slice(0,17),originalLedger);assert.equal(after.length,19);assert.equal(after.filter(x=>x.hash===baseline.marker.hash).length,1);assert.equal((await legacy`SELECT sum(executions)::int AS n FROM adoption_future_probe`)[0].n,1);await runner('adoption_legacy');assert.deepEqual(await ledger(legacy),after);});
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'adoption-native-results.json'),JSON.stringify({checks,passed:checks.length,failed:0,environment:(await admin`SELECT version() AS v`)[0].v,independentConnections:true,productionConnected:false,productionChanged:false,syntheticLegacyUsers:111,syntheticRegistrations:43,productionFingerprintSubstitutedOnlyInLocalTest:true},null,2)+'\n');console.log('TOTAL '+checks.length+' PASS');
 }finally{for(const c of clients)await c.end({timeout:2});if(started)await cluster.stop();fs.rmSync(fixture,{recursive:true,force:true});console.log('Disposable native adoption cluster stopped; no remote access.');}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
