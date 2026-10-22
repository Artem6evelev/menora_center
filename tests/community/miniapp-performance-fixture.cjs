/* Disposable observability on top of the existing isolated release fixture.
 * SQL text/params are never returned; production source receives no test route. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const fixture=process.env.MINIAPP_UI_FIXTURE||'/tmp/menora-miniapp-ui';
assert.notEqual(process.env.NODE_ENV,'production');assert.ok(fixture.startsWith('/tmp/menora-'));
cp.execFileSync(process.execPath,[path.join(__dirname,'telegram-release-fixture.cjs')],{env:{...process.env,MINIAPP_UI_FIXTURE:fixture},stdio:'inherit'});
const file=path.join(fixture,'lib/db/index.ts'),old=fs.readFileSync(file,'utf8');
assert.ok(old.includes('drizzle(client,{schema})'));
fs.writeFileSync(file,old.replace('drizzle(client,{schema})',`drizzle(client,{schema,logger:{logQuery(query:string){(g.__miniappPerfQueries??=[]).push({kind:query.trim().split(/\\s+/)[0].toUpperCase(),locked:/for update/i.test(query)});}}})`));
const route=path.join(fixture,'app/api/test-performance/route.ts');fs.mkdirSync(path.dirname(route),{recursive:true});
fs.writeFileSync(route,`export const dynamic='force-dynamic';
const local=(r:Request)=>process.env.NODE_ENV==='development'&&['localhost','127.0.0.1'].includes(new URL(r.url).hostname);
export async function GET(r:Request){if(!local(r))return new Response('Local only',{status:403});const rows=(globalThis as any).__miniappPerfQueries??[];return Response.json({testDatabase:'isolated-pglite',operations:rows.length,kinds:rows.reduce((a:any,r:any)=>({...a,[r.kind]:(a[r.kind]??0)+1}),{}),locked:rows.filter((r:any)=>r.locked).length});}
export async function POST(r:Request){if(!local(r))return new Response('Local only',{status:403});(globalThis as any).__miniappPerfQueries=[];return Response.json({testDatabase:'isolated-pglite',reset:true});}`);
const configFile=path.join(fixture,'next.config.mjs'),config=fs.readFileSync(configFile,'utf8');
assert.ok(config.includes('const nextConfig = {'));
fs.writeFileSync(configFile,config.replace('const nextConfig = {','const nextConfig = {\n  onDemandEntries: { maxInactiveAge: 3_600_000, pagesBufferLength: 100 },'));
console.log('Performance fixture: aggregate counters; dev-only compiled-route retention for long browser cohorts, no production setting changes.');
