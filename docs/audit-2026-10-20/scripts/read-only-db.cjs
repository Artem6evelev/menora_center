// Read-only metadata and aggregate checks. Never prints connection strings or rows.
const fs=require('node:fs'), path=require('node:path');
const dotenv=require('dotenv'), postgres=require('postgres');
const root=path.resolve(__dirname,'../../..');
const config={...dotenv.parse(fs.readFileSync(path.join(root,'.env'))),...dotenv.parse(fs.readFileSync(path.join(root,'.env.local')))};
const sql=postgres(config.DATABASE_URL,{max:1,connect_timeout:5,idle_timeout:2,prepare:false});
(async()=>{
 const result={checked_at:new Date().toISOString(),environment:'DATABASE_URL resolved from local .env.local; deployment identity not established',mode:'BEGIN READ ONLY; metadata + aggregates only'};
 try {
  Object.assign(result,await sql.begin('read only',async tx=>{
   await tx`SET LOCAL statement_timeout = '5000ms'`;
   const mode=await tx`SHOW transaction_read_only`;
   const tables=await tx`SELECT c.relname AS name,c.relrowsecurity AS rls,c.relforcerowsecurity AS force_rls,has_table_privilege('anon',c.oid,'SELECT') AS anon_select,has_table_privilege('authenticated',c.oid,'SELECT') AS authenticated_select FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' ORDER BY 1`;
   const columns=await tx`SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position`;
   const constraints=await tx`SELECT c.relname AS table_name,co.conname AS name,co.contype AS type,pg_get_constraintdef(co.oid) AS definition FROM pg_constraint co JOIN pg_class c ON c.oid=co.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' ORDER BY 1,2`;
   const policies=await tx`SELECT tablename,cmd,roles,qual,with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname`;
   const aggregates={};
   for(const table of ['users','events','event_participants','service_participants','kids_applications']) {
    if(tables.some(t=>t.name===table)) aggregates[table]=await tx`SELECT count(*)::int AS count FROM ${tx(table)}`;
   }
   const usersSummary=await tx`SELECT count(*)::int AS total,count(*) FILTER (WHERE is_profile_complete)::int AS complete,count(*) FILTER (WHERE jewish_status IS NULL OR btrim(jewish_status)='')::int AS missing_status,count(*) FILTER (WHERE jewish_status IS NOT NULL AND btrim(jewish_status)<>'' AND jewish_status NOT IN ('Соблюдающий еврей','Светский еврей','Еврей по материнской линии','Еврей по отцовской линии','Готовлюсь к Гиюру','Прошел гиюр','Интересуюсь иудаизмом'))::int AS unknown_status,count(*) FILTER (WHERE jsonb_typeof(children_data)='array' AND children_data<>'[]'::jsonb)::int AS profiles_with_children,coalesce(sum(CASE WHEN jsonb_typeof(children_data)='array' THEN jsonb_array_length(children_data) ELSE 0 END),0)::int AS child_entries,count(*) FILTER (WHERE jsonb_typeof(children_data)<>'array')::int AS invalid_children_container FROM users`;
   const emailDuplicates=await tx`SELECT count(*)::int AS duplicate_email_groups FROM (SELECT lower(btrim(email)) FROM users GROUP BY 1 HAVING count(*)>1) d`;
   const registrationDuplicates=await tx`SELECT count(*)::int AS duplicate_event_user_groups FROM (SELECT event_id,user_id FROM event_participants GROUP BY 1,2 HAVING count(*)>1) d`;
   const historicalRegistrations=await tx`SELECT count(*)::int AS total,count(*) FILTER(WHERE status='paid')::int AS paid,count(*) FILTER(WHERE status='pending')::int AS pending,count(*) FILTER(WHERE status='abandoned')::int AS abandoned,count(*) FILTER(WHERE extra_data::text LIKE '%child_%')::int AS contains_index_child_reference FROM event_participants`;
   const dbRole=await tx`SELECT rolsuper AS superuser,rolbypassrls AS bypass_rls FROM pg_roles WHERE rolname=current_user`;
   const indexes=await tx`SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname`;
   const storageBuckets=await tx`SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets ORDER BY id`;
   const storagePolicies=await tx`SELECT tablename,cmd,roles,qual,with_check FROM pg_policies WHERE schemaname='storage' ORDER BY tablename,policyname`;
   const dbObjects=await tx`SELECT c.relname AS name,c.relkind AS kind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('v','m') ORDER BY 1`;
   const privilegedFunctions=await tx`SELECT p.proname AS name,p.prosecdef AS security_definer,pg_get_function_result(p.oid) AS return_type,oidvectortypes(p.proargtypes) AS arguments,has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef ORDER BY 1`;
   const triggers=await tx`SELECT event_object_table,trigger_name,event_manipulation,action_timing FROM information_schema.triggers WHERE event_object_schema='public' ORDER BY event_object_table,trigger_name`;
   const storagePrivileges=await tx`SELECT has_table_privilege('anon','storage.objects','INSERT') AS anon_insert,has_table_privilege('anon','storage.objects','SELECT') AS anon_select,c.relrowsecurity AS rls FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='storage' AND c.relname='objects'`;
   const migrationTables=await tx`SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema IN ('drizzle','supabase_migrations') AND table_type='BASE TABLE' ORDER BY table_schema,table_name`;
   const eventTriggers=await tx`SELECT e.evtname AS name,e.evtevent AS event,e.evtenabled AS enabled,p.proname AS function_name FROM pg_event_trigger e JOIN pg_proc p ON p.oid=e.evtfoid ORDER BY 1`;
   const migrationCounts=[];
   for(const m of migrationTables){const counts=await tx`SELECT count(*)::int AS count FROM ${tx(m.table_schema+'.'+m.table_name)}`;migrationCounts.push({...m,...counts[0]});}
   return {status:'read succeeded',event_triggers:eventTriggers,migration_counts:migrationCounts,transaction_mode:mode,tables,columns,constraints,indexes,policies,aggregates,users_summary:usersSummary,email_duplicates:emailDuplicates,registration_duplicates:registrationDuplicates,historical_registrations:historicalRegistrations,connection_role:dbRole,storage_buckets:storageBuckets,storage_policies:storagePolicies,public_views:dbObjects,public_security_definer_functions:privilegedFunctions,public_triggers:triggers,storage_object_privileges:storagePrivileges,migration_table_metadata:migrationTables};
  }));
 } catch(e){result.status='NOT VERIFIED';result.error_code=e.code||e.cause?.code||e.name;result.reason='Read-only connection or query failed; raw error suppressed to protect environment details';}
 finally {await sql.end({timeout:2});}
 fs.writeFileSync(path.join(root,'docs/audit-2026-10-20/evidence/db-readonly.json'),JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify({status:result.status,error_code:result.error_code,table_count:result.tables?.length,aggregates:result.aggregates},null,2));
})().catch(()=>{console.error('Read-only diagnostic failed; sensitive error suppressed');process.exitCode=1});
