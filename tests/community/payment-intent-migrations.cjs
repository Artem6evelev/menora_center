/* Real CLI-generated migration on fresh isolated PostgreSQL 17/18 catalogues. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),out=process.env.COMMUNITY_TEST_OUTPUT||'/tmp/menora-payment-intent-migrations',checks=[];
async function test(name,fn){await fn();checks.push({name,status:'PASS'});console.log('PASS '+name);}
(async()=>{fs.mkdirSync(out,{recursive:true});
const entries=JSON.parse(fs.readFileSync(root+'/drizzle/meta/_journal.json')).entries,latest=entries.at(-1);
assert.match(latest.tag,/^\d{14}_event_payment_intent_tracking$/);
const body=fs.readFileSync(root+'/supabase/migrations/'+latest.tag+'.sql','utf8');assert.equal(body,fs.readFileSync(root+'/drizzle/'+latest.tag+'.sql','utf8'));
for(const [runtime,major]of [['/tmp/menora-pg17-runtime',17],['/tmp/menora-filter-test-runtime',18]]){
 const {PGlite}=require(runtime+'/node_modules/@electric-sql/pglite'),pg=new PGlite();try{
 await pg.exec('create role anon nologin;create role authenticated nologin;');for(const entry of entries.slice(0,-1))await pg.exec(fs.readFileSync(root+'/drizzle/'+entry.tag+'.sql','utf8'));
 await pg.exec("insert into users(id)values('migration-legacy');insert into events(id,title,is_free)values('migration-event','Synthetic',false);insert into event_participants(id,user_id,event_id)values('migration-registration','migration-legacy','migration-event');insert into event_payment_attempts(registration_id,user_id,event_id,amount_agorot,selection_hash,payment_url)values('migration-registration','migration-legacy','migration-event',10000,repeat('a',64),'https://example.invalid');");
 const record=async()=>(await pg.query('select to_jsonb(t) row from event_payment_attempts t')).rows[0].row,before=await record();
 const access=async()=>(await pg.query("select relrowsecurity,relacl::text from pg_class where oid='event_payment_attempts'::regclass")).rows[0],security=await access();
 await pg.exec('begin;'+body+'commit;');
 await test('PG'+major+' upgrade preserves legacy attempt and leaves all opening fields unknown/zero',async()=>{
  const after=await record();for(const key of ['opened_at','last_opened_at','last_opened_source']){assert.equal(after[key],null);delete after[key];}assert.equal(after.open_count,0);delete after.open_count;assert.deepEqual(after,before);
 });
 await test('PG'+major+' actual application cutoff is after legacy creation and before newly created attempts',async()=>{
  const meta=(await pg.query("select col_description('event_payment_attempts'::regclass,(select attnum from pg_attribute where attrelid='event_payment_attempts'::regclass and attname='opened_at')) metadata")).rows[0].metadata;
  const cutoff=new Date(JSON.parse(meta).trackingStartedAt);assert.ok(cutoff>=new Date(before.created_at));
  const now=(await pg.query('select clock_timestamp() n')).rows[0].n;assert.ok(cutoff<=new Date(now));
 });
 await test('PG'+major+' operational RLS, grants, RESTRICT FK and paid history constraints remain unchanged',async()=>{
  assert.deepEqual(await access(),security);assert.equal(security.relrowsecurity,true);
  for(const role of ['anon','authenticated'])assert.equal((await pg.query("select has_table_privilege($1,'event_payment_attempts','SELECT,INSERT,UPDATE,DELETE') allowed",[role])).rows[0].allowed,false);
  assert.equal((await pg.query("select confdeltype from pg_constraint where conrelid='event_payment_attempts'::regclass and confrelid='event_participants'::regclass")).rows[0].confdeltype,'r');
 });
 await test('PG'+major+' opening constraints reject corruption and allow only server channel values',async()=>{
  for(const stmt of ["update event_payment_attempts set open_count=-1","update event_payment_attempts set last_opened_source='other'"])await assert.rejects(pg.exec(stmt));
  await pg.exec("update event_payment_attempts set last_opened_source='telegram';update event_payment_attempts set last_opened_source='website';update event_payment_attempts set last_opened_source=null;");
 });
 }finally{await pg.close();}
}
fs.writeFileSync(path.join(out,'payment-intent-migrations-results.json'),JSON.stringify({checks,productionTouched:false,cliVersion:'2.122.0',migration:latest.tag},null,2)+'\n');console.log('TOTAL '+checks.length+' PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
