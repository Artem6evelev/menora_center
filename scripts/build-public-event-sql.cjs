/* Local deterministic artifact builder. Never connects to a database. */
const fs=require('node:fs'),path=require('node:path');
const {readMigrationFiles}=require('drizzle-orm/migrator');
const root=path.resolve(__dirname,'..'),baseline=require('./adoption-baseline.json');
function buildPublicEventSql(){
 const migrations=readMigrationFiles({migrationsFolder:path.join(root,'drizzle')}),last=migrations.at(-1);
 const journal=JSON.parse(fs.readFileSync(path.join(root,'drizzle/meta/_journal.json'))),tag=journal.entries.at(-1).tag;
 if(!tag.endsWith('_public_event_intake'))throw new Error('Select the explicit public-event release before rebuilding this frozen artifact');
 const row=m=>({hash:m.hash,created_at:String(m.created_at??m.folderMillis)});
 const canonical=migrations.slice(0,-1).map(row),legacy=[...baseline.legacy.map(row),...migrations.slice(baseline.canonical.length,-1).map(row)];
 const old0004=canonical.map((r,i)=>i===4?{...r,hash:'34124c4a9c89a348323b834556d45e41c7d2d2f1364c1e96e9f9a27b99f3a7bb'}:r);
 const before=[canonical,old0004,legacy],after=before.map(chain=>[...chain,row(last)]);
 const actual=`(SELECT coalesce(jsonb_agg(jsonb_build_object('hash',hash,'created_at',created_at::text) ORDER BY created_at,id),'[]'::jsonb) FROM drizzle.__drizzle_migrations)`;
 const match=chains=>chains.map(chain=>`${actual} = '${JSON.stringify(chain)}'::jsonb`).join(' OR ');
 const current=match(before),complete=match(after),body=fs.readFileSync(path.join(root,'drizzle',tag+'.sql'),'utf8');
 const snapshot=JSON.parse(fs.readFileSync(path.join(root,'drizzle/meta',String(journal.entries.at(-1).idx).padStart(4,'0')+'_snapshot.json')));
 function columnCheck(table,only){
  const expected=Object.values(snapshot.tables['public.'+table].columns).filter(c=>!only||only.includes(c.name))
   .map(c=>({name:c.name,type:c.type,not_null:c.notNull||c.primaryKey})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);
  return `(SELECT coalesce(jsonb_agg(jsonb_build_object('name',attname,'type',format_type(atttypid,atttypmod),'not_null',attnotnull) ORDER BY attname COLLATE "C"),'[]'::jsonb) FROM pg_attribute WHERE attrelid=to_regclass('public.${table}') AND attnum>0 AND NOT attisdropped${only?' AND attname IN ('+only.map(name=>"'"+name+"'").join(',')+')':''}) = '${JSON.stringify(expected)}'::jsonb`;
 }
 const paymentColumns=columnCheck('event_payment_attempts',['opened_at','last_opened_at','open_count','last_opened_source']);
 const newColumns=['event_interests','event_interest_limits'].map(table=>columnCheck(table));
 const eventColumns=columnCheck('events',['admission_policy','visibility']);
 const preservation=`SELECT jsonb_object_agg(name,fingerprint) FROM (
 SELECT 'users' name, md5(coalesce(string_agg(to_jsonb(t)::text,'' ORDER BY id),'')) fingerprint FROM public.users t
 UNION ALL SELECT 'participants',md5(coalesce(string_agg(to_jsonb(t)::text,'' ORDER BY id),'')) FROM public.event_participants t
 UNION ALL SELECT 'payments',md5(coalesce(string_agg(to_jsonb(t)::text,'' ORDER BY id),'')) FROM public.event_payment_attempts t
 UNION ALL SELECT 'kids',md5(coalesce(string_agg(to_jsonb(t)::text,'' ORDER BY id),'')) FROM public.kids_applications t
 UNION ALL SELECT 'events',md5(coalesce(string_agg((to_jsonb(t)-'admission_policy'-'visibility')::text,'' ORDER BY id),'')) FROM public.events t) fingerprints`;
 const manual=`-- Owner-only future execution. Review READ_ONLY_PRECHECK.sql first; no production execution by the agent.
-- Requires the existing adopted/canonical chain through payment intent tracking.
BEGIN;
SET LOCAL search_path=pg_catalog,public;
SET LOCAL lock_timeout='5s';
SELECT pg_advisory_xact_lock(7811397441042027::bigint);
LOCK TABLE drizzle.__drizzle_migrations IN EXCLUSIVE MODE;
DO $history$ BEGIN IF NOT (${current} OR ${complete}) THEN RAISE EXCEPTION 'Unknown or changed migration history. No reconciliation or schema changes permitted.'; END IF;
 IF NOT (${paymentColumns}) THEN RAISE EXCEPTION 'Payment baseline schema incompatible'; END IF;
END $history$;
LOCK TABLE public.users, public.events, public.event_participants, public.event_payment_attempts, public.kids_applications IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE menorah_public_event_preservation ON COMMIT DROP AS SELECT (${preservation}) AS fingerprints;
DO $apply$ BEGIN
 IF NOT (${complete}) THEN
  ${body}
  IF EXISTS(SELECT 1 FROM public.events WHERE admission_policy <> 'restricted') THEN RAISE EXCEPTION 'Legacy event restrictions changed'; END IF;
  INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES('${last.hash}',${last.folderMillis});
 END IF;
END $apply$;
DO $preserved$ BEGIN
 IF (SELECT fingerprints FROM menorah_public_event_preservation) IS DISTINCT FROM (${preservation}) THEN RAISE EXCEPTION 'Existing business data changed'; END IF;
 IF NOT (${complete}) THEN RAISE EXCEPTION 'Unexpected migration ledger'; END IF;
 IF NOT (${newColumns.join(' AND ')} AND ${eventColumns}) THEN RAISE EXCEPTION 'Unexpected interest or admission schema'; END IF;
 IF EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename IN ('event_interests','event_interest_limits')) THEN RAISE EXCEPTION 'Interest policies must remain server-only'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class WHERE oid IN ('public.event_interests'::regclass,'public.event_interest_limits'::regclass) AND NOT relrowsecurity) THEN RAISE EXCEPTION 'Interest tables require RLS'; END IF;
END $preserved$;
DO $privileges$ DECLARE r text; BEGIN
 IF EXISTS(SELECT 1 FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a WHERE c.oid IN ('public.event_interests'::regclass,'public.event_interest_limits'::regclass) AND a.grantee=0) THEN RAISE EXCEPTION 'Interest tables expose PUBLIC grants'; END IF;
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
   IF (has_table_privilege(r,'public.event_interests','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR has_table_privilege(r,'public.event_interest_limits','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) THEN RAISE EXCEPTION 'Interest table grants are unsafe'; END IF;
  END IF;
 END LOOP;
END $privileges$;
COMMIT;
`;
 const precheck=`-- Read-only, no user/profile values. Unknown ledger or missing payment schema is a BLOCKER.
BEGIN TRANSACTION READ ONLY;
SELECT (${current}) AS ledger_ready_for_migration, (${complete}) AS ledger_already_applied,
 (${paymentColumns}) AS payment_baseline_ready,
 to_regclass('public.event_interests') IS NOT NULL AS interests_present,
 to_regclass('public.event_interest_limits') IS NOT NULL AS limits_present,
 (SELECT count(*) FROM public.event_participants) AS registrations;
COMMIT;
`;
 return {tag,hash:last.hash,manual,precheck};
}
module.exports={buildPublicEventSql};
if(require.main===module){const artifact=buildPublicEventSql(),folder=path.join(root,'docs/public-events-2026-11-02');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'MANUAL_SQL.sql'),artifact.manual);fs.writeFileSync(path.join(folder,'READ_ONLY_PRECHECK.sql'),artifact.precheck);console.log(JSON.stringify({migration:artifact.tag,files:['MANUAL_SQL.sql','READ_ONLY_PRECHECK.sql'],databaseAccess:false}));}
