/* Disposable local preview: real Mini App code/auth/session/SQL, synthetic Telegram key.
 * No fake login route is added to the product. Refuses production or non-/tmp destinations. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),fixture=process.env.MINIAPP_UI_FIXTURE||'/tmp/menora-miniapp-ui';
assert.notEqual(process.env.NODE_ENV,'production');assert.ok(fixture.startsWith('/tmp/menora-'));
cp.execFileSync(process.execPath,[path.join(__dirname,'http-fixture.cjs')],{cwd:root,env:{...process.env,COMMUNITY_HTTP_FIXTURE:fixture},stdio:'inherit'});
const write=(file,body)=>{fs.mkdirSync(path.dirname(path.join(fixture,file)),{recursive:true});fs.writeFileSync(path.join(fixture,file),body);};
write('.env.local',`NEXT_PUBLIC_APP_URL=http://127.0.0.1:3342
NEXT_PUBLIC_SUPABASE_URL=https://synthetic.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=synthetic
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_${Buffer.from('synthetic.clerk.accounts.dev$').toString('base64')}
CLERK_SECRET_KEY=sk_test_synthetic
DATABASE_URL=postgresql://synthetic:synthetic@127.0.0.1:1/synthetic
TELEGRAM_BOT_TOKEN=123456:synthetic-miniapp-ui-key
MENORAH_MINIAPP_PREVIEW=1
NEXT_TELEMETRY_DISABLED=1
`);
write('app/api/test-miniapp-state/route.ts',`import {db} from '@/lib/db';
export const dynamic='force-dynamic';
const local=(request:Request)=>process.env.NODE_ENV==='development' && ['127.0.0.1','localhost'].includes(new URL(request.url).hostname) && typeof (db as any).$client?.exec==='function';
export async function GET(request:Request){if(!local(request))return new Response('Local synthetic fixture only',{status:403});const pg=(db as any).$client;return Response.json({testDatabase:'isolated-pglite',users:(await pg.query('SELECT * FROM users')).rows,identities:(await pg.query('SELECT user_id,provider,provider_user_id,disabled_at FROM user_identities')).rows,contacts:(await pg.query('SELECT * FROM telegram_contacts')).rows,sessions:(await pg.query('SELECT user_id,expires_at,revoked_at FROM telegram_miniapp_sessions')).rows});}
export async function POST(request:Request){if(!local(request))return new Response('Local synthetic fixture only',{status:403});const {id,kind,language='ru'}=await request.json();
if(!Number.isSafeInteger(id)||id<760000||id>790000||!['home','profile','filter','legacy','resources','male','giyur-unknown','giyur-advanced','giyur-completed','giyur-male'].includes(kind))return new Response('Invalid synthetic fixture',{status:400});
const pg=(db as any).$client,owner='mnr_fixture_'+id,giyur=kind.startsWith('giyur'),gender=kind==='male'||kind==='giyur-male'?'male':'female',affiliation=kind==='resources'?'none':giyur?'giyur':'maternal',stage=kind==='giyur-completed'||kind==='giyur-male'?'completed':kind==='giyur-advanced'?'advanced':null;
const hasChildren=['home','male','giyur-unknown','giyur-advanced','giyur-completed','giyur-male'].includes(kind);
const children=hasChildren?[{id:'synthetic-child-'+id,name:'Synthetic child',dateOfBirth:'2020-01-01',gender:'female'}]:[];
await pg.query('INSERT INTO users(id,email,first_name,last_name,phone,date_of_birth,city,city_id,marital_status,agreed_to_privacy,is_profile_complete,gender,affiliation,giyur_stage,filter_version,filter_completed_at,has_children,children_data) VALUES($1,NULL,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now(),$15,$16)',[owner,'Synthetic','Community','+972501234567','1990-01-01T00:00:00.000Z','Ришон ле-Цион','8300','single',kind!=='profile',!['profile','filter','resources'].includes(kind),gender,affiliation,stage,['filter','legacy'].includes(kind)?1:2,hasChildren,children]);
await pg.query("INSERT INTO user_identities(user_id,provider,provider_user_id) VALUES($1,'telegram',$2)",[owner,String(id)]);await pg.query('INSERT INTO telegram_contacts(user_id,telegram_user_id,language_code) VALUES($1,$2,$3)',[owner,String(id),language]);return Response.json({ok:true,testDatabase:'isolated-pglite'});}
`);
console.log('Mini App fixture prepared: '+fixture+'; no remote DB, no product token, no Bot API.');
