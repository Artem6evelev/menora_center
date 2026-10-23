/* Test-only extension; adds no deployable route or migration. */
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const fixture = process.env.MINIAPP_UI_FIXTURE || '/tmp/menora-event-delete-fixture';
cp.execFileSync(process.execPath, [path.join(__dirname, 'miniapp-performance-fixture.cjs')], {
  env: { ...process.env, MINIAPP_UI_FIXTURE: fixture }, stdio: 'inherit',
});
const file = path.join(fixture, 'app/api/test-event-delete/route.ts');
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, `import {db} from '@/lib/db';
export const dynamic='force-dynamic';
const local=(r:Request)=>process.env.NODE_ENV==='development'&&['127.0.0.1','localhost'].includes(new URL(r.url).hostname)&&typeof(db as any).$client?.exec==='function';
export async function GET(r:Request){
 if(!local(r))return new Response('Local isolated fixture only',{status:403});
 const pg=(db as any).$client;
 return Response.json({testDatabase:'isolated-pglite',participants:(await pg.query("select id,status from event_participants where event_id='delete-ui-event' order by id")).rows,attempts:(await pg.query("select registration_id,status from event_payment_attempts where event_id='delete-ui-event' order by registration_id")).rows});
}
export async function POST(r:Request){
 if(!local(r))return new Response('Local isolated fixture only',{status:403});
 const body=await r.json(),pg=(db as any).$client;
 if(body.mode==='demote'){await pg.query("update users set role='client' where id='fixture-admin'");return Response.json({ok:true});}
 if(body.mode==='remove'){await pg.query("delete from event_payment_attempts where registration_id='delete-ui-target'");await pg.query("delete from event_participants where id='delete-ui-target'");return Response.json({ok:true});}
 const free=body.free===true,status=body.status??(free?'confirmed':'pending'),attempt=body.attempt===undefined?(free?null:'pending'):body.attempt;
 if(!['pending','confirmed','paid'].includes(status)||(attempt!==null&&!['pending','cancelled','paid'].includes(attempt)))return new Response('Invalid synthetic fixture',{status:400});
 await pg.query("insert into users(id,first_name,role,affiliation,gender,is_profile_complete,filter_version,filter_completed_at) values('fixture-delete-target','DELETE_UI_TARGET','client','maternal','female',true,2,now()),('fixture-delete-control','DELETE_UI_CONTROL','client','maternal','female',true,2,now())");
 await pg.query("insert into events(id,title,status,is_free,price,payment_url) values('delete-ui-event','DELETE_UI_EVENT','planned',$1,'100.25','https://pay.shutafim.org.il/synthetic')",[free]);
 await pg.query("insert into event_participants(id,user_id,event_id,phone,status) values('delete-ui-target','fixture-delete-target','delete-ui-event','synthetic',$1),('delete-ui-control','fixture-delete-control','delete-ui-event','synthetic','confirmed')",[status]);
 if(attempt)await pg.query("insert into event_payment_attempts(registration_id,user_id,event_id,amount_agorot,selection_hash,payment_url,status) values('delete-ui-target','fixture-delete-target','delete-ui-event',10025,$1,'https://pay.shutafim.org.il/synthetic?custom1=delete-ui-target',$2)",['0'.repeat(64),attempt]);
 return Response.json({testDatabase:'isolated-pglite',ok:true});
}
`);
console.log('Deletion fixture prepared: synthetic rows only; real CRM action/UI/SQL, no remote access.');
