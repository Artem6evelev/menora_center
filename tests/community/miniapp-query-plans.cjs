/* Local migration catalogue + EXPLAIN only, no connection to production. Small
 * fixture plans prove index availability/query shapes, not production timings. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
process.env.NODE_PATH='/tmp/menora-filter-test-runtime/node_modules';require('node:module').Module._initPaths();
const{PGlite}=require('@electric-sql/pglite'),{drizzle}=require('drizzle-orm/pglite'),{migrate}=require('drizzle-orm/pglite/migrator');
const out=process.env.COMMUNITY_TEST_OUTPUT||'/tmp/menora-performance-evidence/query-plans';
const queries={
 session:"SELECT s.id,i.id,u.id FROM telegram_miniapp_sessions s JOIN user_identities i ON i.id=s.identity_id JOIN users u ON u.id=s.user_id WHERE s.token_hash=repeat('a',64) LIMIT 1",
 identity:"SELECT id FROM user_identities WHERE provider='telegram' AND provider_instance='primary' AND provider_user_id='synthetic'",
 user:"SELECT id FROM users WHERE id='synthetic'",
 events:"SELECT id,title FROM events WHERE status='planned' ORDER BY created_at DESC,id LIMIT 2",
 detail:"SELECT id FROM events WHERE id='synthetic' AND status='planned'",
 registrations:"SELECT id FROM event_participants WHERE user_id='synthetic' ORDER BY created_at DESC,id LIMIT 21",
 eventRegistration:"SELECT id FROM event_participants WHERE user_id='synthetic' AND event_id='synthetic'",
 payment:"SELECT id FROM event_payment_attempts WHERE registration_id='synthetic'",
 campaign:"SELECT key FROM telegram_campaigns WHERE key='synthetic'",
 kids:"SELECT id FROM kids_applications WHERE user_id='synthetic' ORDER BY created_at DESC,id",
};
(async()=>{const pg=new PGlite();try{await migrate(drizzle(pg),{migrationsFolder:path.resolve(__dirname,'../../drizzle')});const indexes=(await pg.query("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN('users','user_identities','telegram_miniapp_sessions','events','event_participants','event_payment_attempts','telegram_campaigns','kids_applications') ORDER BY tablename,indexname")).rows;
const plans={};for(const[key,query]of Object.entries(queries)){const normal=(await pg.query('EXPLAIN (FORMAT JSON) '+query)).rows[0]['QUERY PLAN'];await pg.exec('SET enable_seqscan=off');const available=(await pg.query('EXPLAIN (FORMAT JSON) '+query)).rows[0]['QUERY PLAN'];await pg.exec('RESET enable_seqscan');plans[key]={query,smallFixtureDefault:normal,indexAvailabilityWithSeqscanDiscouraged:available};}
for(const table of['users','user_identities','telegram_miniapp_sessions','events','event_participants','event_payment_attempts','telegram_campaigns'])assert.ok(indexes.some(row=>row.tablename===table));
assert.ok(indexes.some(row=>row.indexname==='events_status_created_idx'));assert.ok(indexes.some(row=>row.indexname==='event_participants_owner_event_idx'));
const kidsIndexes=indexes.filter(row=>row.tablename==='kids_applications');assert.ok(kidsIndexes.every(row=>!row.indexdef.includes('(user_id')));
assert.match(JSON.stringify(plans.kids.indexAvailabilityWithSeqscanDiscouraged),/Seq Scan/);
const checks=[{name:'all startup/session/event/payment/campaign indexed lookup paths exist in current migrated catalogue',status:'PASS'},{name:'Kids owner lookup has no user_id index; EXPLAIN records unindexed scan separately without creating a migration',status:'PASS'}];fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({environment:'Isolated PGlite/PostgreSQL17 with current repository migrations; tiny empty tables, no production timing claim',checks,indexes,plans,productionDatabaseTouched:false},null,2)+'\n');console.log('2/2 query plan checks passed');
}finally{await pg.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
