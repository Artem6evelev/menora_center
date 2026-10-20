/* Read-only historical compatibility check. Remote changes are owner-run SQL only. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const dotenv=require('dotenv'),postgres=require('postgres'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
const config={...dotenv.parse(fs.readFileSync(path.join(root,'.env'))),...dotenv.parse(fs.readFileSync(path.join(root,'.env.local')))};
if(process.argv.includes('--apply-current-environment'))throw new Error('Remote apply mode removed; owner uses SUPABASE_MANUAL_MIGRATION.sql in SQL Editor');
const sql=postgres(config.DATABASE_URL,{max:1,connect_timeout:5,prepare:false});
const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'lib/db/schema.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:mod,exports:mod.exports,require});
const schema=mod.exports;
const db=require('drizzle-orm/postgres-js').drizzle(sql,{schema});
const {desc}=require('drizzle-orm');
const projection={orderBy:[desc(schema.videos.createdAt)],with:{author:{columns:{firstName:true,lastName:true},with:{authorProfile:{columns:{slug:true}}}}}};
const query=db.query.videos.findMany(projection).toSQL();
const out=path.join(root,'docs/implementation-2026-10-20/evidence');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const evidence={checkedAt:new Date().toISOString(),environment:'DATABASE_URL from local env files; production deployment identity unverified',mode:'READ ONLY',authorAlias:'videos_author is public.users joined by videos.author_id = users.id',videoAuthorProjection:['first_name','last_name','author_profiles.slug']};
 const inspect=()=>sql.begin('read only',async tx=>{
  const cols=await tx`select column_name,data_type,is_nullable from information_schema.columns where table_schema='public' and table_name='users' and column_name in ('gender','affiliation','filter_version','filter_revision','giyur_stage') order by 1`;
  const videos=await tx.unsafe(query.sql,query.params);
  return {filterColumns:cols,projectedVideoQuerySucceeded:true,videoCount:videos.length};
 });
 evidence.before=await inspect();

 fs.writeFileSync(path.join(out,'environment-readonly.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify({mode:evidence.mode,before:evidence.before,after:evidence.after,businessDataUnchanged:evidence.businessDataUnchanged}));
})().catch(error=>{console.error(JSON.stringify({status:'FAILED; transaction rolled back if active',code:error.code||error.cause?.code||error.name}));process.exitCode=1;}).finally(()=>sql.end({timeout:2}));
