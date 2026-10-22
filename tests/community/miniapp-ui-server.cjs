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
let db, clientFetch;
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
    Date, Buffer, URL, URLSearchParams, TextDecoder, crypto: crypto.webcrypto,
    fetch: (...args) => clientFetch(...args) }, { filename: file });
  return mod.exports;
}
const plain = value => JSON.parse(JSON.stringify(value)), checks = [];
const { createHmac } = crypto;
function initData(id, language = 'ru', authDate = Math.floor(Date.now()/1000), metadata = {}) {
  const values = { auth_date: String(authDate), user: JSON.stringify({ id, first_name: 'Synthetic', language_code: language, ...metadata }) };
  const secret = createHmac('sha256','WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();
  return new URLSearchParams({ ...values, hash: createHmac('sha256',secret).update(Object.keys(values).sort().map(key => key+'='+values[key]).join('\n')).digest('hex') }).toString();
}
async function test(name, fn) { await fn(); checks.push({name,status:'PASS'}); console.log('PASS '+name); }
const base = 'http://localhost:3999';
function request(body, tag, origin = base) { return new Request(base+'/api/telegram/miniapp/profile', { method:'POST',headers:{origin,'content-type':'application/json',...(tag?{'if-match':tag}:{})}, body:JSON.stringify(body) }); }
(async()=>{
 const queries=[],queryMeasurements=[];
 const measure=label=>queryMeasurements.push({label,statements:queries.length,kinds:queries.reduce((a,q)=>{const k=q.trim().split(/\s+/)[0].toUpperCase();a[k]=(a[k]??0)+1;return a;},{}),locked:queries.filter(q=>/for update/i.test(q)).length});
 const pg = new PGlite(), schema = source('lib/db/schema.ts'); db = drizzle(pg,{schema,logger:{logQuery(query){queries.push(query);}}});
 await migrate(db,{migrationsFolder:path.join(root,'drizzle')});
 const resume=source('app/api/telegram/miniapp/session/route.ts'), bootstrap=source('app/api/telegram/miniapp/bootstrap/route.ts'), profile=source('app/api/telegram/miniapp/profile/route.ts'), filter=source('app/api/telegram/miniapp/filter/route.ts');
 const cookie=source('lib/telegram/miniapp-config.ts').miniAppCookieName();
 const read=async()=>{const response=await profile.GET();return{response,data:await response.json(),tag:response.headers.get('etag')};};
 const post=async(route,body,tag,expected=200)=>{const response=await route.POST(request(body,tag));const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));return{response,data,tag:response.headers.get('etag')};};
 const login=async(id,language='ru')=>{cookieJar.clear();const response=await bootstrap.POST(request({initData:initData(id,language)}));assert.equal(response.status,200);cookieJar.set(cookie,response.cookies.get(cookie).value);return read();};
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
  // Real client adapter + routes + SQL, with a transport that changes cache validators.
  // No user/profile update occurs between reading the form and its first submission.
  const client=source('lib/telegram/miniapp-client.ts');
  let transport='missing';
  clientFetch=async(url,options={})=>{
   const headers=new Headers(options.headers);headers.set('origin',base);headers.delete('if-match');
   const req=new Request(base+url,{...options,headers});
   const response=options.method==='POST'?await (url.endsWith('/filter')?filter:profile).POST(req):await profile.GET();
   const outgoing=new Headers(response.headers),etag=outgoing.get('etag');
   if(transport==='missing')outgoing.delete('etag');
   else outgoing.set('etag',transport==='weak'?'W/'+etag:'"transport-representation-tag"');
   return new Response(response.body,{status:response.status,headers:outgoing});
  };
  let newSubject=750100;
  for(const language of ['ru','he','en'])for(const mode of ['missing','weak','replaced'])await test(`${language}/${mode}: bootstrap, technical resync, first giyur/male filter and questionnaire save advance to home`,async()=>{
   transport=mode;const id=newSubject++;await login(id,language);
   const first=await client.miniAppRequest('profile');assert.equal(first.data.summary.nextStep,'filter');
   const filtered=await client.miniAppRequest('filter',{body:{affiliation:'giyur',gender:'male'},tag:first.tag});
   assert.equal(filtered.data.summary.nextStep,'profile');assert.equal(filtered.data.languageCode,language);
   assert.equal(filtered.data.permissions.canEditChildren,false);assert.ok(!Object.hasOwn(filtered.data.profile,'giyurStage'));
   const before=await stored(id);
   const synced=await bootstrap.POST(request({initData:initData(id,language,undefined,{first_name:'Technical metadata',username:'synthetic_resynced',photo_url:'https://example.invalid/photo'})}));
   assert.equal(synced.status,200);cookieJar.set(cookie,synced.cookies.get(cookie).value);
   assert.equal((await stored(id)).filter_revision,before.filter_revision);
   assert.equal((await pg.query('SELECT username FROM telegram_contacts WHERE user_id=$1',[before.id])).rows[0].username,'synthetic_resynced');
   const completed=await client.miniAppRequest('profile',{body:fields(),tag:filtered.tag});
   assert.equal(completed.data.summary.nextStep,'home');assert.equal(completed.data.profile.agreedToPrivacy,true);
   const saved=await stored(id);assert.equal(saved.giyur_stage,null);assert.equal(saved.city_id,'8300');
   assert.equal(source('lib/community/policy.ts').communityAccess((await db.select().from(schema.users).where(eq(schema.users.id,saved.id)))[0]).canRegisterSelf,true);
   assert.equal((await client.miniAppRequest('profile')).data.summary.nextStep,'home');
  });
  await test('another real filter request still conflicts with the loaded body version and preserves the winning answers',async()=>{
   await login(750120);const loaded=await client.miniAppRequest('profile');
   await client.miniAppRequest('filter',{body:{affiliation:'maternal',gender:'female'},tag:loaded.tag});
   await assert.rejects(()=>client.miniAppRequest('filter',{body:{affiliation:'giyur',gender:'male'},tag:loaded.tag}),error=>error.status===409&&error.code==='profile_changed');
   assert.equal((await stored(750120)).affiliation,'maternal');
  });
  await test('website Clerk writer keeps revision checks and its update conflicts with an open Mini App questionnaire',async()=>{
   const loaded=await client.miniAppRequest('profile'),owner=await stored(750120);
   const identity={id:owner.id,firstName:'Synthetic',lastName:'Clerk',primaryEmailAddressId:'primary',emailAddresses:[{id:'primary',emailAddress:'clerk@example.invalid'}]};
   const writer=source('lib/community/profile-write.ts');
   await db.transaction(tx=>writer.writeCommunityProfile(tx,identity,{...fields({firstName:'Website winner'}),affiliation:'maternal',gender:'female',expectedRevision:owner.filter_revision}));
   await assert.rejects(()=>client.miniAppRequest('profile',{body:fields({firstName:'Stale Mini App'}),tag:loaded.tag}),error=>error.status===409&&error.code==='profile_changed');
   await assert.rejects(()=>db.transaction(tx=>writer.writeCommunityProfile(tx,identity,{...fields({firstName:'Stale website'}),affiliation:'maternal',gender:'female',expectedRevision:owner.filter_revision})));
   assert.equal((await stored(750120)).first_name,'Website winner');
  });
  await test('missing, malformed and stale body versions never fall back to a fresh header or bypass the lock',async()=>{
   const fresh=await read();
   for(const version of [null,'','*','"invalid"','"'+ '0'.repeat(64)+'"'])await post(profile,{...fields(),profileVersion:version},fresh.tag,409);
   await post(profile,fields(),undefined,409);
  });

  const start=source('app/api/telegram/miniapp/start/route.ts');
  const startAs=async(id,extra={},expected=200,raw=initData(id))=>{
   const response=await start.POST(request({initData:raw,...extra}));const data=await response.json();
   assert.equal(response.status,expected,JSON.stringify(data));
   const issued=response.cookies.get(cookie);if(issued)cookieJar.set(cookie,issued.value);
   return{response,data,tag:data.profileVersion};
  };
  await pg.exec("INSERT INTO events(id,title,status,is_free,description) VALUES('startup-event','Synthetic startup','planned',true,'DETAIL_ONLY_DESCRIPTION'),('startup-two','Synthetic second','planned',true,'DETAIL_ONLY_DESCRIPTION')");
  await test('unified start creates a new real canonical identity/session and returns filter in one response',async()=>{
   cookieJar.clear();queries.length=0;const first=await startAs(750200);measure('new-user-start');assert.equal(first.data.sessionCreated,true);
   assert.equal(first.data.summary.nextStep,'filter');assert.match(first.tag,/^"[0-9a-f]{64}"$/);
   assert.equal(first.data.destination,'home');assert.equal(first.data.homeEvents.length,0);
   assert.equal(first.response.headers.get('cache-control'),'no-store');assert.equal(first.data.profile.gender,null);
  });
  await test('returning Home start resumes its subject, includes at most two compact events, and does not lock or write',async()=>{
   await login(750001);queries.length=0;const result=await startAs(750001);measure('returning-home-start');
   assert.equal(result.data.sessionCreated,false);assert.equal(result.data.summary.nextStep,'home');
   assert.equal(result.data.homeEvents.length,2);assert.equal(result.data.profile.firstName,(await stored(750001)).first_name);
   assert.ok(result.data.homeEvents.every(e=>e.shareUrl&&!Object.hasOwn(e,'description')&&!Object.hasOwn(e,'childPrice')&&!Object.hasOwn(e,'status')));
   assert.equal(queries.some(q=>/for update|^update |^insert /i.test(q)),false,queries.join('\n'));
   assert.equal(queries.filter(q=>/^select /i.test(q)).length,5);
  });
  await test('startup touch is throttled and never extends session expiry',async()=>{
   await pg.exec("UPDATE telegram_miniapp_sessions SET created_at=now()-interval '20 minutes',last_seen_at=now()-interval '10 minutes' WHERE revoked_at IS NULL");
   const before=(await pg.query('SELECT id,expires_at FROM telegram_miniapp_sessions ORDER BY id')).rows;
   queries.length=0;await startAs(750001);assert.equal(queries.filter(q=>/^update /i.test(q)).length,1);
   queries.length=0;await startAs(750001);assert.equal(queries.filter(q=>/^update /i.test(q)).length,0);
   assert.deepEqual((await pg.query('SELECT id,expires_at FROM telegram_miniapp_sessions ORDER BY id')).rows,before);
  });
  await test('all ordinary Mini App GET routes authorize without row locks or lastSeen writes',async()=>{
   const before=(await pg.query('SELECT id,last_seen_at FROM telegram_miniapp_sessions ORDER BY id')).rows;
   for(const [route,url]of[['profile','profile'],['session','session'],['events','events'],['events','events?id=startup-event'],['registrations','registrations'],['kids','kids'],['subscription','subscription'],['launch','launch?event=startup-event']]){
    queries.length=0;const response=await source('app/api/telegram/miniapp/'+route+'/route.ts').GET(new Request(base+'/api/telegram/miniapp/'+url));
    assert.equal(response.status,200,route+': '+await response.text());measure('GET '+url);
    assert.equal(queries.some(q=>/for update|^update |^insert /i.test(q)),false,route+queries.join('\n'));
    assert.ok(queries[0].includes('inner join "user_identities"')&&queries[0].includes('inner join "users"'));
   }
   assert.deepEqual((await pg.query('SELECT id,last_seen_at FROM telegram_miniapp_sessions ORDER BY id')).rows,before);
  });
  await test('Kids response carries one coherent canonical snapshot/version, consent, city and children',async()=>{
   const response=await source('app/api/telegram/miniapp/kids/route.ts').GET();assert.equal(response.status,200);
   const data=await response.json(),canonical=await read();assert.equal(data.profileVersion,canonical.data.profileVersion);
   assert.equal(data.profileSnapshot.profileVersion,canonical.data.profileVersion);
   assert.deepEqual({...data.profileSnapshot.profile,childrenData:data.children},canonical.data.profile);
   assert.equal(data.profileSnapshot.profile.agreedToPrivacy,true);assert.equal(data.profileSnapshot.profile.cityId,'8300');
  });
  await test('ad launch and Kids destinations survive unified startup; launch preview stays bounded',async()=>{
   const ad=await startAs(750001,{event:'startup-event',section:'kids'});assert.equal(ad.data.destination,'events');
   assert.equal(ad.data.launchEvent.id,'startup-event');assert.ok(ad.data.launchEvent.lead.length<=280);assert.ok(!Object.hasOwn(ad.data.launchEvent,'description'));assert.equal(ad.data.homeEvents.length,0);
   const kids=await startAs(750001,{section:'kids'});assert.equal(kids.data.destination,'kids');assert.equal(kids.data.launchEvent,null);
  });
  await test('cookie from another account is replaced only after fresh signed subject validation; no family data leaks',async()=>{
   const next=await startAs(750200);assert.equal(next.data.sessionCreated,true);assert.equal(next.data.summary.nextStep,'filter');
   assert.deepEqual(next.data.profile.childrenData,[]);assert.notEqual(next.tag,source('lib/telegram/miniapp-profile.ts').miniAppProfileTag((await db.select().from(schema.users).where(eq(schema.users.id,(await stored(750001)).id)))[0]));
   const row=await stored(750200);assert.ok(row.filter_version<source('lib/community/policy.ts').FILTER_VERSION);
  });
  await test('expired session starts fresh with fresh proof and rejects an old proof',async()=>{
   await pg.exec("UPDATE telegram_miniapp_sessions SET created_at=now()-interval '20 minutes',last_seen_at=now()-interval '10 minutes',expires_at=now()-interval '1 second' WHERE user_id=(SELECT user_id FROM user_identities WHERE provider_user_id='750200')");
   await startAs(750200,{},401,initData(750200,'ru',Math.floor(Date.now()/1000)-3600));
   assert.equal((await startAs(750200)).data.sessionCreated,true);
  });
  await test('existing valid session accepts its own older signed launch but rejects tampering',async()=>{
   assert.equal((await startAs(750200,{},200,initData(750200,'ru',Math.floor(Date.now()/1000)-3600))).data.sessionCreated,false);
   await startAs(750200,{},401,initData(750200).replace('Synthetic','Tampered'));
  });
  await test('revoked own session is rejected, not silently replaced',async()=>{
   await source('lib/telegram/miniapp-session.ts').revokeCurrentMiniAppSession();
   const count=(await pg.query('SELECT count(*)::int AS n FROM telegram_miniapp_sessions')).rows;
   await startAs(750200,{},401);assert.deepEqual((await pg.query('SELECT count(*)::int AS n FROM telegram_miniapp_sessions')).rows,count);
  });
  for(const disable of ['identity','user'])await test('disabled '+disable+' is rejected on both resume and fresh bootstrap',async()=>{
   const id=disable==='identity'?750201:750202;cookieJar.clear();await startAs(id);
   await pg.exec(disable==='identity'?"UPDATE user_identities SET disabled_at=now() WHERE provider_user_id='750201'":"UPDATE users SET identity_disabled_at=now() WHERE id=(SELECT user_id FROM user_identities WHERE provider_user_id='750202')");
   await startAs(id,{},401);cookieJar.clear();await startAs(id,{},403);
  });
  await test('start keeps same-origin, body limit, strict hints and signed raw identity requirements',async()=>{
   assert.equal((await start.POST(request({initData:initData(750001)},null,'https://attacker.example.invalid'))).status,403);
   assert.equal((await start.POST(request({initData:'x'.repeat(17000)}))).status,413);
   for(const extra of[{userId:'foreign'},{section:'admin'},{event:'x'.repeat(151)},{campaign:'x'.repeat(65)}])await startAs(750001,extra,400);
   cookieJar.clear();await startAs(750001,{},400,'user=untrusted');
  });
  await test('unified startup snapshot retains optimistic locking against a real competing edit',async()=>{
   cookieJar.clear();let loaded=await startAs(750203);
   loaded=await post(filter,{affiliation:'giyur',gender:'male'},loaded.tag);
   const snapshot=await startAs(750203);await post(profile,fields({firstName:'Winner'}),snapshot.tag);
   await post(profile,fields({firstName:'Stale'}),snapshot.tag,409);assert.equal((await stored(750203)).first_name,'Winner');
   assert.equal((await startAs(750203)).data.summary.nextStep,'home');assert.equal((await stored(750203)).giyur_stage,null);
  });
 }finally{await pg.close();}
 fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'miniapp-query-counts.json'),JSON.stringify({environment:'isolated PGlite, production route/services with one shared Drizzle logger, short IDs; counts exclude SQL BEGIN/COMMIT',measurements:queryMeasurements},null,2)+'\n');fs.writeFileSync(path.join(output,'miniapp-ui-server-results.json'),JSON.stringify({environment:'production API/services + synthetic Telegram HMAC + native migrations + isolated PGlite',remoteDatabaseTouched:false,checks},null,2)+'\n');console.log(`${checks.length}/${checks.length} Mini App UI server checks passed`);
})().catch(error=>{console.error(error);process.exitCode=1;});
