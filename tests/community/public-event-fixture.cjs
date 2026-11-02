/* Local disposable fixture only. No real env, user identities or deliveries. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const fixture=process.env.MINIAPP_UI_FIXTURE||'/tmp/menora-public-event-ui';
cp.execFileSync(process.execPath,[path.join(__dirname,'miniapp-performance-fixture.cjs')],{env:{...process.env,MINIAPP_UI_FIXTURE:fixture},stdio:'inherit'});
const route=path.join(fixture,'app/api/test-public-events/route.ts');fs.mkdirSync(path.dirname(route),{recursive:true});
fs.writeFileSync(route,`import {db} from '@/lib/db';export const dynamic='force-dynamic';
function local(r:Request){return process.env.NODE_ENV==='development'&&['localhost','127.0.0.1'].includes(new URL(r.url).hostname)&&typeof(db as any).$client?.exec==='function';}
export async function POST(r:Request){if(!local(r))return new Response('Local synthetic only',{status:403});const pg=(db as any).$client;
await pg.exec("insert into events(id,title,description,image_url,date,time,location,is_free,price,child_price,payment_url,status,is_registration_closed,admission_policy,visibility)values('public-restricted','PUBLIC_SYNTHETIC_FULL_DETAILS','Full public description. All conditions, schedule and location are visible before onboarding.','/logos/menora-logo.svg','2026-12-10','18:30','Synthetic hall',false,'100.10','25.25','https://shutaf.im/synthetic','planned',false,'restricted','public'),('public-open','OPEN_SYNTHETIC_EVENT','Open to all public description.','/logos/menora-logo.svg','2026-12-11','19:00','Synthetic hall',false,'100.10','25.25','https://shutaf.im/synthetic','planned',false,'open','public'),('public-hidden','PRIVATE_SYNTHETIC_INVITE','PRIVATE description',null,null,null,null,true,null,null,null,'planned',false,'restricted','invite_only') on conflict do nothing");
return Response.json({testDatabase:'isolated-pglite',ok:true});}
export async function GET(r:Request){if(!local(r))return new Response('Local synthetic only',{status:403});const pg=(db as any).$client;return Response.json({testDatabase:'isolated-pglite',interests:(await pg.query('select id,event_id,user_id,source,intake_status,decision,invitation_consent from event_interests')).rows,registrations:(await pg.query('select event_id,user_id,status from event_participants')).rows,users:(await pg.query('select count(*) n from users')).rows[0].n});}
`);
console.log('Public event fixture prepared: '+fixture+'; synthetic DB, no real Google OAuth or outbound messages.');
