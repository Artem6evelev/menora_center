/* Mini App questionnaire routes: real sessions, production writers and isolated native SQL. */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), crypto = require('node:crypto'), ts = require('typescript');
process.env.NODE_PATH = path.join(process.env.COMMUNITY_TEST_RUNTIME || '/tmp/menora-filter-test-runtime', 'node_modules');
require('node:module').Module._initPaths();
const { PGlite } = require(path.join(process.env.COMMUNITY_TEST_RUNTIME || '/tmp/menora-filter-test-runtime', 'node_modules/@electric-sql/pglite'));
const { drizzle } = require('drizzle-orm/pglite');
const { migrate } = require('drizzle-orm/pglite/migrator');
const { eq } = require('drizzle-orm');
const root = path.resolve(__dirname, '../..'), output = process.env.COMMUNITY_TEST_OUTPUT || path.join(root, 'docs/miniapp-ui-v1/evidence');
const env = { NODE_ENV: 'development', TELEGRAM_BOT_TOKEN: '123456:synthetic-unit-test-token', NEXT_PUBLIC_APP_URL: 'http://localhost:3999' };
const cookieJar = new Map(), cache = new Map();
let db;
function source(file) {
  const absolute = path.join(root, file);
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(absolute, 'utf8'));
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const mod = { exports: {} }; cache.set(absolute, mod);
  const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText;
  function localRequire(id) {
    if (id === 'server-only') return {};
    if (id === '@/lib/db') return { db };
    if (id === 'next/headers') return { cookies: async () => ({ get: name => cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined }) };
    if (id.startsWith('@/') || id.startsWith('.')) {
      const resolved = id.startsWith('@/') ? id.slice(2) : path.relative(root, path.resolve(path.dirname(absolute), id));
      return source(/\.(ts|json)$/.test(resolved) ? resolved : resolved + '.ts');
    }
    if (['node:crypto', 'drizzle-orm', 'drizzle-orm/pg-core', 'next/server', 'zod'].includes(id)) return require(id);
    throw new Error('Blocked import: ' + id);
  }
  vm.runInNewContext(code, { module: mod, exports: mod.exports, require: localRequire, process: { env },
    console: { log() { throw new Error('Unexpected auth log'); }, error() { throw new Error('Unexpected auth log'); } },
    Date, Buffer, URL, URLSearchParams, TextDecoder, crypto: crypto.webcrypto }, { filename: file });
  return mod.exports;
}
const plain = value => JSON.parse(JSON.stringify(value)), checks = [];
const { createHmac } = crypto;
function initData(id, language = 'ru', authDate = Math.floor(Date.now()/1000)) {
  const values = { auth_date: String(authDate), user: JSON.stringify({ id, first_name: 'Synthetic', language_code: language }) };
  const secret = createHmac('sha256','WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();
  return new URLSearchParams({ ...values, hash: createHmac('sha256',secret).update(Object.keys(values).sort().map(key => key+'='+values[key]).join('\n')).digest('hex') }).toString();
}
async function test(name, fn) { await fn(); checks.push({name,status:'PASS'}); console.log('PASS '+name); }
const base = 'http://localhost:3999';
function request(body, tag, origin = base) { return new Request(base+'/api/telegram/miniapp/profile', { method:'POST',headers:{origin,'content-type':'application/json',...(tag?{'if-match':tag}:{})}, body:JSON.stringify(body) }); }
(async()=>{
 const pg = new PGlite(), schema = source('lib/db/schema.ts'); db = drizzle(pg,{schema});
 await migrate(db,{migrationsFolder:path.join(root,'drizzle')});
 const resume=source('app/api/telegram/miniapp/session/route.ts'), bootstrap=source('app/api/telegram/miniapp/bootstrap/route.ts'), profile=source('app/api/telegram/miniapp/profile/route.ts'), filter=source('app/api/telegram/miniapp/filter/route.ts');
 const cookie=source('lib/telegram/miniapp-config.ts').miniAppCookieName();
 const read=async()=>{const response=await profile.GET();return{response,data:await response.json(),tag:response.headers.get('etag')};};
 const post=async(route,body,tag,expected=200)=>{const response=await route.POST(request(body,tag));const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));return{response,data,tag:response.headers.get('etag')};};
 const login=async(id)=>{cookieJar.clear();const response=await bootstrap.POST(request({initData:initData(id)}));assert.equal(response.status,200);cookieJar.set(cookie,response.cookies.get(cookie).value);return read();};
 const stored=async(id)=>(await pg.query("SELECT u.* FROM users u JOIN user_identities i ON i.user_id=u.id WHERE i.provider='telegram' AND i.provider_user_id=$1",[String(id)])).rows[0];
 const fields=(override={})=>({firstName:'Synthetic',lastName:'Questionnaire',phone:'+972501234567',dateOfBirth:'1990-01-01',city:'Ришон ле-Цион',cityId:'8300',maritalStatus:'single',spouseName:null,hasChildren:false,agreedToPrivacy:true,...override});
 try {
  await test('profile and filter require Mini App cookie; Clerk/client identity fields cannot authenticate',async()=>{
   assert.equal((await profile.GET()).status,401);await post(filter,{affiliation:'none'},undefined,401);
  });
  let state=await login(750001);
  await test('own profile DTO contains editable fields only, no email/role/identity/stage/revision and an opaque version tag',async()=>{
   assert.equal(state.data.summary.nextStep,'filter');assert.match(state.tag,/^"[0-9a-f]{64}"$/);
   for(const key of ['id','userId','email','role','filterRevision','giyurStage','telegramUserId'])assert.ok(!Object.hasOwn(state.data.profile,key));
   assert.equal(state.data.profile.agreedToPrivacy,false);assert.equal(state.response.headers.get('cache-control'),'no-store');assert.equal(state.data.languageCode,'ru');
  });
  await test('resume rejects a cookie from another Telegram account before returning profile data',async()=>{
   await post(resume,{initData:initData(759999)},undefined,401);
   const before=await pg.query('SELECT count(*)::int AS n FROM users');
   const response=await resume.POST(request({initData:initData(759999)}));assert.deepEqual(await response.json(),{ok:false,error:'session_mismatch'});
   assert.deepEqual((await pg.query('SELECT count(*)::int AS n FROM users')).rows,before.rows);
  });
  await test('valid cookie may resume its own older signed launch without extending expiry or issuing a session',async()=>{
   const before=(await pg.query('SELECT id,expires_at FROM telegram_miniapp_sessions ORDER BY id')).rows;
   const raw=initData(750001,'ru',Math.floor(Date.now()/1000)-3600);await post(resume,{initData:raw},undefined);
   assert.deepEqual((await pg.query('SELECT id,expires_at FROM telegram_miniapp_sessions ORDER BY id')).rows,before);
   await post(bootstrap,{initData:raw},undefined,401);
  });
  await test('resume still rejects tampered raw proof and requires an active cookie',async()=>{
   const raw=initData(750001).replace('Synthetic','Tampered');await post(resume,{initData:raw},undefined,401);
   const saved=cookieJar.get(cookie);cookieJar.clear();await post(resume,{initData:initData(750001)},undefined,401);cookieJar.set(cookie,saved);
  });
  await test('questionnaire cannot bypass current filter',async()=>{await post(profile,fields(),state.tag,403);});
  await test('maternal and giyur filter require gender server-side',async()=>{for(const affiliation of ['maternal','giyur'])await post(filter,{affiliation},state.tag,400);});
  await test('filter strictly rejects extra identity/role/stage fields and unknown categories',async()=>{
   for(const body of [{affiliation:'other'},{affiliation:'maternal',gender:'other'},{affiliation:'maternal',gender:'female',userId:'someone'},{affiliation:'giyur',gender:'female',giyurStage:'completed'},{affiliation:'maternal',gender:'female',role:'admin'}])await post(filter,body,state.tag,400);
  });
  await test('maternal female filter stamps shared FILTER_VERSION and opens questionnaire with prospective child permission',async()=>{
   state=await post(filter,{affiliation:'maternal',gender:'female'},state.tag);assert.equal(state.data.summary.nextStep,'profile');assert.equal(state.data.permissions.canEditChildren,true);
   const row=await stored(750001);assert.equal(row.filter_version,source('lib/community/policy.ts').FILTER_VERSION);assert.equal(row.is_profile_complete,false);assert.equal(row.affiliation,'maternal');
  });
  for(const [label,override] of [['privacy consent',{agreedToPrivacy:false}],['canonical city mismatch',{city:'Different city'}],['unknown locality',{cityId:'9999'}],['future birth date',{dateOfBirth:'2099-01-01'}],['spouse required',{maritalStatus:'married'}]])await test('shared validation rejects '+label+' without changing user',async()=>{
   const before=plain(await stored(750001));await post(profile,fields(override),state.tag,400);assert.deepEqual(plain(await stored(750001)),before);
  });
  await test('child requires name, birth date and explicit gender; foreign child ID denied',async()=>{
   for(const child of [{name:'Synthetic child',dateOfBirth:'2020-01-01'},{name:'Synthetic child',dateOfBirth:'2020-01-01',gender:'female',id:'foreign-child'}])await post(profile,fields({hasChildren:true,childrenData:[child]}),state.tag,400);
  });
  await test('Telegram-first full profile needs no email and saves own child, canonical city, consent and home',async()=>{
   state=await post(profile,fields({hasChildren:true,childrenData:[{name:'Synthetic child',dateOfBirth:'2020-01-01',gender:'female'}]}),state.tag);
   const row=await stored(750001);assert.equal(row.email,null);assert.equal(row.city_id,'8300');assert.equal(row.city,'Ришон ле-Цион');assert.equal(row.agreed_to_privacy,true);assert.equal(row.is_profile_complete,true);
   assert.equal(state.data.summary.nextStep,'home');assert.equal(row.children_data.length,1);assert.equal(row.children_data[0].parentId,row.id);assert.equal(row.children_data[0].gender,'female');
  });
  await test('profile GET after save preserves data; repeat bootstrap never resets questionnaire',async()=>{
   const before=plain(await stored(750001));state=await login(750001);assert.equal(state.data.summary.nextStep,'home');assert.equal(state.data.profile.agreedToPrivacy,true);assert.equal(state.data.profile.childrenData.length,1);assert.deepEqual(plain(await stored(750001)),before);
  });
  await test('opaque stale version rejects overwrite and keeps current user',async()=>{
   const previous=state.tag;state=await post(profile,fields({firstName:'Edited',hasChildren:true,childrenData:state.data.profile.childrenData}),state.tag);await post(profile,fields({firstName:'Stale'}),previous,409);assert.equal((await stored(750001)).first_name,'Edited');
  });
  await test('profile strictly forbids affiliation/gender/stage/role/email/owner injection',async()=>{
   for(const extra of [{affiliation:'none'},{gender:'male'},{giyurStage:'completed'},{role:'admin'},{email:'invented@example.invalid'},{userId:'foreign'},{expectedRevision:0}])await post(profile,{...fields(),...extra},state.tag,400);
  });
  await test('same-origin enforcement and bounded body protect both write routes',async()=>{
   for(const route of [filter,profile]){assert.equal((await route.POST(request(fields(),state.tag,'https://attacker.example.invalid'))).status,403);assert.equal((await route.POST(request({x:'x'.repeat(17000)},state.tag))).status,413);}
  });
  await test('own child edit and delete preserve historical registration snapshot and paid status',async()=>{
   const row=await stored(750001),child=row.children_data[0];
   await pg.query("INSERT INTO events(id,title,is_free) VALUES('miniapp-history','Synthetic',true)");
   await pg.query("INSERT INTO event_participants(id,event_id,user_id,status,extra_data) VALUES('miniapp-history-ticket','miniapp-history',$1,'paid',$2)",[row.id,{family:{child_0:true},totalAmount:123}]);
   state=await post(profile,fields({hasChildren:true,childrenData:[{id:child.id,name:'Edited child',dateOfBirth:'2020-01-01',gender:'male'}]}),state.tag);
   assert.equal(state.data.profile.childrenData[0].name,'Edited child');
   state=await post(profile,fields({childrenData:[]}),state.tag);assert.equal((await stored(750001)).children_data.length,0);
   const ticket=(await pg.query("SELECT * FROM event_participants WHERE id='miniapp-history-ticket'")).rows[0];assert.equal(ticket.status,'paid');assert.equal(ticket.extra_data.totalAmount,123);assert.equal(ticket.extra_data.childrenSnapshot[0].id,child.id);
  });
  for(const [id,affiliation,gender,stage,childPermission] of [[750002,'maternal','male',null,false],[750003,'giyur','female',null,false],[750004,'giyur','female','advanced',false],[750005,'giyur','female','completed',true],[750006,'giyur','male','completed',false]])await test(`${affiliation}/${gender}/${stage}: server permits self questionnaire and enforces child editing`,async()=>{
   let person=await login(id);person=await post(filter,{affiliation,gender},person.tag);const owner=await stored(id);
   await pg.query('UPDATE users SET giyur_stage=$1,children_data=$2 WHERE id=$3',[stage,[{id:'existing-'+id,name:'Existing synthetic child',dateOfBirth:'2020-01-01',gender:'female'}],owner.id]);
   person=await read();assert.equal(person.data.permissions.canEditChildren,childPermission);
   if(!childPermission)await post(profile,fields({hasChildren:true,childrenData:[{name:'Forbidden',dateOfBirth:'2020-01-01',gender:'female'}]}),person.tag,400);
   person=await post(profile,fields({hasChildren:true,...(childPermission?{childrenData:person.data.profile.childrenData}:{})}),person.tag);assert.equal(person.data.summary.nextStep,'home');assert.equal((await stored(id)).children_data[0].id,'existing-'+id);
   if(!childPermission){person=await post(profile,fields({hasChildren:true,childrenData:[]}),person.tag);assert.equal((await stored(id)).children_data.length,1);}
  });
  await test('none requires no gender, remains resources and cannot POST full questionnaire',async()=>{
   let person=await login(750007);person=await post(filter,{affiliation:'none'},person.tag);assert.equal(person.data.summary.nextStep,'resources');assert.equal(person.data.profile.gender,null);assert.equal(person.data.permissions.canEditChildren,false);await post(profile,fields(),person.tag,403);
  });
  await test('changing to none preserves old children, consent, history and profile fields',async()=>{
   let person=await login(750003),before=plain(await stored(750003));person=await post(filter,{affiliation:'none'},person.tag);const after=plain(await stored(750003));
   for(const key of ['children_data','first_name','city_id','agreed_to_privacy','giyur_stage'])assert.deepEqual(after[key],before[key]);assert.equal(person.data.summary.nextStep,'resources');
  });
  await test('profile GET ignores untrusted target query and only uses current session owner',async()=>{const result=await profile.GET(new Request(base+'?userId=foreign'));assert.equal((await result.json()).profile.firstName,(await stored(750003)).first_name);});
  await test('revoked cookie cannot write questionnaire or filter',async()=>{await source('lib/telegram/miniapp-session.ts').revokeCurrentMiniAppSession();assert.equal((await profile.GET()).status,401);await post(filter,{affiliation:'none'},state.tag,401);});
  await test('disabled identity is rechecked before profile mutation',async()=>{const person=await login(750006);await pg.exec("UPDATE user_identities SET disabled_at=now() WHERE provider_user_id='750006'");await post(profile,fields(),person.tag,401);});
 }finally{await pg.close();}
 fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'miniapp-ui-server-results.json'),JSON.stringify({environment:'production API/services + synthetic Telegram HMAC + native migrations + isolated PGlite',remoteDatabaseTouched:false,checks},null,2)+'\n');console.log(`${checks.length}/${checks.length} Mini App UI server checks passed`);
})().catch(error=>{console.error(error);process.exitCode=1;});
