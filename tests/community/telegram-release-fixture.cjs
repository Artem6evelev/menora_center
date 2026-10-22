/* Local-only extension of the existing isolated PGlite fixture. No remote credentials. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),fixture=process.env.MINIAPP_UI_FIXTURE||'/tmp/menora-miniapp-ui';assert.notEqual(process.env.NODE_ENV,'production');assert.ok(fixture.startsWith('/tmp/menora-'));
cp.execFileSync(process.execPath,[path.join(__dirname,'miniapp-ui-fixture.cjs')],{env:{...process.env,MINIAPP_UI_FIXTURE:fixture},stdio:'inherit'});
const write=(file,body)=>{fs.mkdirSync(path.dirname(path.join(fixture,file)),{recursive:true});fs.writeFileSync(path.join(fixture,file),body);};
write('lib/telegram/bot-api.ts',`export class TelegramApiError extends Error {constructor(public kind:string,public retryAfter=0){super(kind);}}export async function telegramApi(){throw new TelegramApiError('permanent');}`);
write('app/api/test-release-state/route.ts',`import {db} from '@/lib/db';export const dynamic='force-dynamic';
const local=(request:Request)=>process.env.NODE_ENV==='development'&&['127.0.0.1','localhost'].includes(new URL(request.url).hostname)&&typeof(db as any).$client?.exec==='function';
export async function GET(request:Request){if(!local(request))return new Response('Local only',{status:403});const pg=(db as any).$client;return Response.json({testDatabase:'isolated-pglite',attempts:(await pg.query('select registration_id,amount_agorot,status,confirmed_at from event_payment_attempts')).rows,broadcasts:(await pg.query('select id,recipient_count,status from telegram_broadcasts')).rows,deliveries:(await pg.query('select broadcast_id,status from telegram_broadcast_deliveries')).rows});}
export async function POST(request:Request){if(!local(request))return new Response('Local only',{status:403});const pg=(db as any).$client;
await pg.exec("insert into events(id,title,status,is_free,audience,is_registration_closed)values('release-women','Женская встреча','planned',true,'women',false),('release-men','PRIVATE_MEN_EVENT','planned',true,'men',false),('release-closed','Запись закрыта','planned',true,'all',true) on conflict do nothing");
const options=await request.json().catch(()=>({}));if(options.shareFixture===true)await pg.query("insert into events(id,title,status,is_free,image_url)values($1,'Long synthetic share event','planned',true,'/logos/menora-logo.svg')on conflict do nothing",['synthetic-long-share-'+ 'x'.repeat(80)]);
for(let i=0;i<25;i++){const id='release-audience-'+i,tg=String(860000+i);await pg.query("insert into users(id,first_name,last_name,city,city_id,gender,affiliation,is_profile_complete,filter_version,filter_completed_at)values($1,'Synthetic','Audience','Ришон ле-Цион','8300','female','maternal',true,2,now()) on conflict do nothing",[id]);await pg.query("insert into user_identities(user_id,provider,provider_user_id)values($1,'telegram',$2) on conflict do nothing",[id,tg]);await pg.query("insert into telegram_contacts(user_id,telegram_user_id,telegram_chat_id,username,marketing_status)values($1,$2,$2,$3,'subscribed') on conflict do nothing",[id,tg,'synthetic_'+i]);}return Response.json({testDatabase:'isolated-pglite',ok:true});}
`);
console.log('Release fixture: synthetic CRM, hard-disabled Bot API, no production writes.');
write('app/api/test-payment-state/route.ts', `import {db} from '@/lib/db';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(process.env.NODE_ENV!=='development'||!['127.0.0.1','localhost'].includes(new URL(request.url).hostname)||typeof(db as any).$client?.exec!=='function')return new Response('Local synthetic only',{status:403});
 const {id,mode}=await request.json();
 if(!Number.isSafeInteger(id)||id<760000||id>790000||!['inspect','paid','confirmed','missing','unsafe','price-change'].includes(mode))return new Response('Invalid fixture',{status:400});
 const pg=(db as any).$client,rows=(await pg.query("select user_id from user_identities where provider='telegram' and provider_user_id=$1",[String(id)])).rows;
 if(rows.length!==1)return new Response('Missing synthetic identity',{status:404});const owner=rows[0].user_id;
 if(['paid','confirmed'].includes(mode)){
  await pg.query("update event_participants set status=$1 where user_id=$2 and event_id='fixture-paid'",[mode,owner]);
  await pg.query("update event_payment_attempts set status='paid',confirmed_at=now() where user_id=$1 and event_id='fixture-paid'",[owner]);
 }
 if(mode==='missing'){
  await pg.exec("insert into events(id,title,status,is_free,price,payment_url)values('fixture-no-link','SYNTHETIC_MISSING_PAYMENT','planned',false,'77.00',null)on conflict do nothing");
  await pg.query("insert into event_participants(id,user_id,event_id,phone,status,extra_data)values($1,$2,'fixture-no-link','synthetic','pending',$3)on conflict do nothing",['synthetic-missing-'+id,owner,{amountAgorot:7700}]);
 }
 if(mode==='unsafe')await pg.query("update event_payment_attempts set payment_url='http://example.invalid/unsafe' where user_id=$1 and event_id='fixture-paid'",[owner]);
 if(mode==='price-change')await pg.exec("update events set price='999.00',child_price='999.00' where id='fixture-paid'");
 return Response.json({testDatabase:'isolated-pglite',registrations:(await pg.query('select id,event_id,status,extra_data from event_participants where user_id=$1',[owner])).rows,attempts:(await pg.query('select registration_id,amount_agorot,status,confirmed_at from event_payment_attempts where user_id=$1',[owner])).rows});
}
`);
