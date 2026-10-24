/* Disposable UI fixture only. Production sources never import this generator. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),fixture=process.env.MINIAPP_UI_FIXTURE||'/tmp/menora-payment-intent-fixture-20261024';
assert.ok(fixture.startsWith('/tmp/menora-'));assert.notEqual(process.env.NODE_ENV,'production');
cp.execFileSync(process.execPath,[path.join(__dirname,'event-participant-delete-fixture.cjs')],{env:{...process.env,MINIAPP_UI_FIXTURE:fixture},stdio:'inherit'});
const migration=JSON.parse(fs.readFileSync(root+'/drizzle/meta/_journal.json')).entries.at(-1).tag;
const cutoff=fs.readFileSync(root+'/drizzle/'+migration+'.sql','utf8').split('--> statement-breakpoint')[1];
const file=path.join(fixture,'app/api/test-payment-intent/route.ts');fs.mkdirSync(path.dirname(file),{recursive:true});
fs.writeFileSync(path.join(fixture,'lib/telegram/bot-api.ts'),`export class TelegramApiError extends Error {constructor(public kind:string,public retryAfter=0){super(kind);}}
export async function telegramApi(method:string,body:unknown){const g=globalThis as any;(g.__intentBotCalls??=[]).push({method,body});if(g.__intentBotBlocked)throw new TelegramApiError('blocked');return {message_id:1};}`);
fs.writeFileSync(file,`import {db} from '@/lib/db';
export const dynamic='force-dynamic';
const local=(r:Request)=>process.env.NODE_ENV==='development'&&['127.0.0.1','localhost'].includes(new URL(r.url).hostname)&&typeof(db as any).$client?.exec==='function';
export async function GET(r:Request){if(!local(r))return new Response('Local only',{status:403});const pg=(db as any).$client;return Response.json({testDatabase:'isolated-pglite',attempts:(await pg.query('select registration_id,user_id,status,amount_agorot,opened_at,last_opened_at,open_count,last_opened_source,confirmed_at from event_payment_attempts order by registration_id')).rows,registrations:(await pg.query('select id,user_id,status from event_participants order by id')).rows,contacts:(await pg.query('select user_id,marketing_status,blocked_at from telegram_contacts')).rows,calls:(globalThis as any).__intentBotCalls??[]});}
export async function POST(r:Request){if(!local(r))return new Response('Local only',{status:403});const pg=(db as any).$client,body=await r.json(),g=globalThis as any;
 if(body.mode==='demote'){await pg.exec("update users set role='client' where id='fixture-admin'");return Response.json({ok:true});}
 if(body.mode==='blocked'){await pg.exec("update telegram_contacts set blocked_at=now() where user_id='fixture-intent-opened'");return Response.json({ok:true});}
 if(body.mode==='seed'){
  g.__intentBotCalls=[];g.__intentBotBlocked=false;await pg.exec(${JSON.stringify(cutoff)});
  await pg.exec("insert into events(id,title,date,status,is_free,price,payment_url)values('intent-ui-event','PAYMENT_INTENT_UI_EVENT','2026-12-10','planned',false,'150','https://pay.shutafim.org.il/synthetic')");
  for(const [kind,status]of [['opened','pending'],['unopened','pending'],['legacy','pending'],['paid','paid'],['confirmed','confirmed']]){
   const owner='fixture-intent-'+kind,id='intent-ui-'+kind;
   await pg.query("insert into users(id,first_name,last_name,email,phone,spouse_name,role,affiliation,gender,filter_version,filter_completed_at,is_profile_complete)values($1,$2,'Synthetic','intent@example.invalid','+972501234567','Synthetic spouse','client','maternal','female',2,now(),true)",[owner,'INTENT_'+kind.toUpperCase()]);
   await pg.query("insert into event_participants(id,event_id,user_id,phone,status,extra_data)values($1,'intent-ui-event',$2,'+972501234567',$3,$4)",[id,owner,status,{family:{self:true,spouse:true},childrenSnapshot:[{id:'intent-child',name:'Snapshot child',dateOfBirth:'2020-01-01'}],extraAdults:0,extraKids:0}]);
   if(kind!=='confirmed')await pg.query("insert into event_payment_attempts(registration_id,user_id,event_id,amount_agorot,selection_hash,payment_url,status)values($1,$2,'intent-ui-event',15000,$3,'https://pay.shutafim.org.il/synthetic',$4)",[id,owner,'a'.repeat(64),status==='paid'?'paid':'pending']);
  }
  await pg.exec("update event_payment_attempts set opened_at=now()-interval '1 day',last_opened_at=now(),open_count=2,last_opened_source='telegram' where registration_id='intent-ui-opened';update event_payment_attempts set created_at='2000-01-01' where registration_id='intent-ui-legacy'");
  await pg.exec("insert into user_identities(user_id,provider,provider_user_id)values('fixture-intent-opened','telegram','785599');insert into telegram_contacts(user_id,telegram_user_id,telegram_chat_id,username,marketing_status)values('fixture-intent-opened','785599','785599','intent_user','unsubscribed')");
 }
 return Response.json({ok:true,testDatabase:'isolated-pglite'});
}
`);
console.log('Payment intent fixture: simulated local delivery only, actual UI/actions/SQL.');
