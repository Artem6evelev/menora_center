/* Shared, deterministic SQL contracts. Never connects to a database. */
const fs = require('node:fs');
const path = require('node:path');
const baseline = require('./adoption-baseline.json');
const root = path.resolve(__dirname, '..');
const quote = v => "'" + String(v).replaceAll("'", "''") + "'";
function operationalContract() {
  const result = {};
  for (const name of ['0009_miniapp_identity_v1', '0010_telegram_miniapp_sessions', '0011_telegram_release_candidate'])
    Object.assign(result, JSON.parse(fs.readFileSync(path.join(root, 'drizzle', name + '.sql'), 'utf8').match(/\$expected\$(.*?)\$expected\$/s)[1]));
  for (const table of Object.values(result)) table.constraints = table.constraints.filter(c => c.type !== 'n');
  result.user_identities.indexes.push({name:'user_identities_id_user_id_idx',definition:'CREATE UNIQUE INDEX user_identities_id_user_id_idx ON public.user_identities USING btree (id, user_id)',valid:true});
  result.user_identities.indexes.sort((a,b) => a.name < b.name ? -1 : 1);
  return result;
}
function schemaCTEs() {
  return `core_expected AS (SELECT key AS table_name,value AS spec FROM jsonb_each(${quote(JSON.stringify(baseline.core))}::jsonb)),
core_status AS (
 SELECT e.table_name,c.oid,
 c.relkind='r' AND c.relrowsecurity AND NOT row_security_active(c.oid)
 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(e.spec->'columns') col
   LEFT JOIN pg_attribute a ON a.attrelid=c.oid AND a.attname=col->>'name' AND a.attnum>0 AND NOT a.attisdropped
   LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
   WHERE a.attnum IS NULL OR format_type(a.atttypid,a.atttypmod)<>col->>'type'
   OR (NOT(e.table_name='users' AND col->>'name'='email') AND a.attnotnull<>(col->>'not_null')::boolean)
   OR pg_get_expr(d.adbin,d.adrelid) IS DISTINCT FROM col->>'default')
 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(e.spec->'constraints') k WHERE NOT EXISTS(
   SELECT 1 FROM pg_constraint x WHERE x.conrelid=c.oid AND x.convalidated
   AND x.contype::text=k->>'type' AND pg_get_constraintdef(x.oid)=k->>'definition')) AS compatible
 FROM core_expected e LEFT JOIN pg_namespace n ON n.nspname='public'
 LEFT JOIN pg_class c ON c.relnamespace=n.oid AND c.relname=e.table_name
),
op_expected AS (SELECT key AS table_name,value AS spec FROM jsonb_each(${quote(JSON.stringify(operationalContract()))}::jsonb)),
op_status AS (
 SELECT e.table_name,c.oid,c.relrowsecurity,
 c.relkind='r' AND c.relrowsecurity AND NOT row_security_active(c.oid)
 AND NOT EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid)
 AND e.spec=jsonb_build_object(
 'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attname) FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),
 'constraints',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',k.conname,'type',k.contype,'definition',pg_get_constraintdef(k.oid),'validated',k.convalidated) ORDER BY k.conname),'[]'::jsonb) FROM pg_constraint k WHERE k.conrelid=c.oid AND k.contype<>'n'),
 'indexes',(SELECT jsonb_agg(jsonb_build_object('name',i.indexname,'definition',i.indexdef,'valid',x.indisvalid) ORDER BY i.indexname) FROM pg_indexes i JOIN pg_namespace ns ON ns.nspname=i.schemaname JOIN pg_class ic ON ic.relnamespace=ns.oid AND ic.relname=i.indexname JOIN pg_index x ON x.indexrelid=ic.oid WHERE i.schemaname='public' AND i.tablename=e.table_name)) AS compatible
 FROM op_expected e LEFT JOIN pg_namespace n ON n.nspname='public'
 LEFT JOIN pg_class c ON c.relnamespace=n.oid AND c.relname=e.table_name
),
backend AS (SELECT oid FROM op_status UNION ALL SELECT oid FROM core_status WHERE table_name IN('community_audit','community_registration_drafts')),
security_status AS (
 SELECT (SELECT count(*) FROM backend b JOIN pg_class c ON c.oid=b.oid CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) p WHERE p.grantee=0)
 +(SELECT count(*) FROM backend b JOIN pg_attribute a ON a.attrelid=b.oid CROSS JOIN LATERAL aclexplode(a.attacl) p WHERE a.attnum>0 AND NOT a.attisdropped AND p.grantee=0)
 +(SELECT count(*) FROM backend b CROSS JOIN pg_roles r WHERE b.oid IS NOT NULL AND r.rolname IN('anon','authenticated') AND (has_table_privilege(r.oid,b.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=b.oid AND a.attnum>0 AND NOT a.attisdropped AND has_column_privilege(r.oid,b.oid,a.attnum,'SELECT,INSERT,UPDATE,REFERENCES')))) AS exposed_grants,
 (SELECT count(*) FROM backend b JOIN pg_policy p ON p.polrelid=b.oid) AS policies
),
query_index_status AS (
 SELECT v.name,c.oid,i.indisvalid AND pg_get_indexdef(c.oid)=v.definition AS compatible
 FROM (VALUES ('events_status_created_idx','CREATE INDEX events_status_created_idx ON public.events USING btree (status, created_at, id)'),('event_participants_owner_event_idx','CREATE INDEX event_participants_owner_event_idx ON public.event_participants USING btree (user_id, event_id, created_at)')) v(name,definition)
 LEFT JOIN pg_class c ON c.oid=to_regclass('public.'||v.name) LEFT JOIN pg_index i ON i.indexrelid=c.oid
)`;
}
function schemaAssertion(release) {
  return `DO $adoption_schema$ DECLARE bad text; BEGIN
 WITH ${schemaCTEs()}
 SELECT string_agg(table_name,',') INTO bad FROM core_status WHERE compatible IS DISTINCT FROM true;
 IF bad IS NOT NULL THEN RAISE EXCEPTION 'Adoption incompatible baseline: %',bad; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_index i WHERE i.indrelid='public.users'::regclass AND i.indisunique AND i.indisvalid AND i.indpred IS NULL AND i.indexprs IS NULL AND i.indnkeyatts=1 AND (SELECT attname FROM pg_attribute WHERE attrelid=i.indrelid AND attnum=i.indkey[0])='telegram_chat_id') THEN RAISE EXCEPTION 'Adoption requires unique legacy Telegram cache'; END IF;
 IF EXISTS(SELECT 1 FROM event_participants p LEFT JOIN users u ON u.id=p.user_id LEFT JOIN events e ON e.id=p.event_id WHERE u.id IS NULL OR e.id IS NULL) THEN RAISE EXCEPTION 'Adoption orphan registration'; END IF;
 ${release ? `WITH ${schemaCTEs()}
 SELECT string_agg(table_name,',') INTO bad FROM op_status WHERE compatible IS DISTINCT FROM true;
 IF bad IS NOT NULL THEN RAISE EXCEPTION 'Adoption incompatible release schema: %',bad; END IF;
 WITH ${schemaCTEs()} SELECT string_agg(name,',') INTO bad FROM query_index_status WHERE compatible IS DISTINCT FROM true;
 IF bad IS NOT NULL THEN RAISE EXCEPTION 'Adoption incompatible release indexes: %',bad; END IF;
 WITH ${schemaCTEs()} SELECT 'exposed backend privileges/policies' INTO bad FROM security_status WHERE exposed_grants<>0 OR policies<>0;
 IF bad IS NOT NULL THEN RAISE EXCEPTION 'Adoption security mismatch'; END IF;
 IF EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.users'::regclass AND attname='email' AND attnotnull) THEN RAISE EXCEPTION 'Adoption requires nullable email'; END IF;
 IF EXISTS(SELECT 1 FROM telegram_contacts c LEFT JOIN user_identities i ON i.provider='telegram' AND i.provider_instance='primary' AND i.provider_user_id=c.telegram_user_id WHERE i.id IS NULL OR i.user_id<>c.user_id)
 OR EXISTS(SELECT 1 FROM telegram_contacts GROUP BY user_id HAVING count(*) FILTER(WHERE is_primary)<>1)
 OR EXISTS(SELECT 1 FROM telegram_miniapp_sessions s LEFT JOIN user_identities i ON i.id=s.identity_id WHERE i.id IS NULL OR i.user_id<>s.user_id OR i.provider<>'telegram' OR i.provider_instance<>'primary')
 OR EXISTS(SELECT 1 FROM event_payment_attempts a LEFT JOIN event_participants p ON p.id=a.registration_id WHERE p.id IS NULL OR p.user_id<>a.user_id OR p.event_id<>a.event_id)
 OR EXISTS(SELECT 1 FROM telegram_broadcast_deliveries d LEFT JOIN telegram_contacts c ON c.id=d.contact_id LEFT JOIN telegram_broadcasts b ON b.id=d.broadcast_id WHERE c.id IS NULL OR b.id IS NULL)
 THEN RAISE EXCEPTION 'Adoption identity/registration integrity mismatch'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.user_identity_merge_log'::regclass AND tgname='user_identity_merge_log_no_mutation' AND tgenabled IN('O','A')) THEN RAISE EXCEPTION 'Adoption audit guard missing'; END IF;` : ''}
 END $adoption_schema$;`.replace(/[ \t]+$/gm, '');
}
function historyCTEs() {
 const current=[...baseline.canonical,{tag:baseline.marker.tag,hash:baseline.marker.hash,created_at:baseline.marker.when}];
 const refs=[...current.map((e,i)=>['canonical',i+1,e]),...baseline.legacy.map((e,i)=>['legacy',i+1,e])];
 return `history_reference(lineage,position,hash,created_at) AS (VALUES ${refs.map(([l,i,e])=>`(${quote(l)},${i},${quote(e.hash)},${e.created_at}::bigint)`).join(',')}),
 history_object AS(SELECT to_regclass('drizzle.__drizzle_migrations') AS oid),
 history_rows AS(SELECT row_number() OVER(ORDER BY x.id) AS position,x.hash,x.created_at FROM history_object h CROSS JOIN LATERAL XMLTABLE('/*/row' PASSING CASE WHEN h.oid IS NULL THEN XMLPARSE(DOCUMENT '<empty/>') ELSE pg_catalog.table_to_xml(h.oid,false,false,'') END COLUMNS id bigint PATH 'id',hash text PATH 'hash',created_at bigint PATH 'created_at') x),
 history_state AS(SELECT count(*) AS rows,
 count(*) FILTER(WHERE EXISTS(SELECT 1 FROM history_reference r WHERE r.lineage='canonical' AND r.position=h.position AND r.created_at=h.created_at AND (r.hash=h.hash OR(r.position=5 AND h.hash='34124c4a9c89a348323b834556d45e41c7d2d2f1364c1e96e9f9a27b99f3a7bb')))) AS canonical_matches,
 count(*) FILTER(WHERE EXISTS(SELECT 1 FROM history_reference r WHERE r.lineage='legacy' AND r.position=h.position AND r.created_at=h.created_at AND r.hash=h.hash)) AS legacy_matches,
 count(*) FILTER(WHERE h.position=${baseline.legacy.length+1} AND h.hash=${quote(baseline.marker.hash)} AND h.created_at=${baseline.marker.when}) AS legacy_markers FROM history_rows h),
 lineage AS(SELECT *,CASE WHEN rows=${current.length} AND canonical_matches=rows THEN 'canonical-adopted'
 WHEN rows=${baseline.legacy.length} AND legacy_matches=rows THEN 'legacy-ready'
 WHEN rows=${baseline.legacy.length+1} AND legacy_matches=${baseline.legacy.length} AND legacy_markers=1 THEN 'legacy-adopted'
 WHEN rows>0 AND rows<${current.length} AND canonical_matches=rows THEN 'canonical-prefix'
 ELSE 'unknown' END AS state FROM history_state)`;
}
function historyGuard() {
 return `DO $adoption_history$ DECLARE state text; BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid=to_regclass('drizzle.__drizzle_migrations') AND relkind='r')
 OR EXISTS(SELECT 1 FROM (VALUES('id','integer'),('hash','text'),('created_at','bigint')) v(name,type)
 LEFT JOIN pg_attribute a ON a.attrelid=to_regclass('drizzle.__drizzle_migrations') AND a.attname=v.name AND a.attnum>0 AND NOT a.attisdropped
 WHERE a.attnum IS NULL OR format_type(a.atttypid,a.atttypmod)<>v.type)
 OR NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid=to_regclass('drizzle.__drizzle_migrations') AND contype='p' AND convalidated AND pg_get_constraintdef(oid)='PRIMARY KEY (id)')
 THEN RAISE EXCEPTION 'Adoption history mismatch: incompatible ledger schema'; END IF;
 WITH ${historyCTEs()} SELECT l.state INTO state FROM lineage l;
 IF state NOT IN('legacy-ready','legacy-adopted','canonical-adopted') THEN RAISE EXCEPTION 'Adoption history mismatch; no changes applied'; END IF;
 END $adoption_history$;`;
}
function preservationQuery() {
 return `SELECT (SELECT count(*) FROM users) AS users_count,
 (SELECT md5(coalesce(string_agg((to_jsonb(u)-'email')::text,'' ORDER BY id),'')) FROM users u) AS users_without_email,
 (SELECT md5(coalesce(string_agg(jsonb_build_array(id,CASE WHEN id ~ '^tg_[1-9][0-9]{0,15}$' AND email=id||'@telegram.bot' THEN NULL ELSE email END)::text,'' ORDER BY id),'')) FROM users) AS normalized_emails,
 (SELECT count(*) FROM event_participants) AS registrations,
 (SELECT md5(coalesce(string_agg(to_jsonb(p)::text,'' ORDER BY id),'')) FROM event_participants p) AS registration_fingerprint,
 (SELECT md5(coalesce(string_agg(to_jsonb(e)::text,'' ORDER BY id),'')) FROM events e) AS events,
 (SELECT md5(coalesce(string_agg(to_jsonb(k)::text,'' ORDER BY id),'')) FROM kids_applications k) AS child_applications,
 (SELECT md5(coalesce(string_agg(to_jsonb(d)::text,'' ORDER BY id),'')) FROM community_registration_drafts d) AS drafts`;
}
module.exports={baseline,quote,schemaCTEs,schemaAssertion,historyCTEs,historyGuard,preservationQuery};
