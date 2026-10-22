/* Real source/actions + isolated PostgreSQL/WASM. Identity/cookies/delivery are
 * injected; this suite does NOT prove real Google OAuth or browser behavior. */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const ts = require('typescript');
const runtime = process.env.COMMUNITY_TEST_RUNTIME || '/tmp/menora-filter-test-runtime';
process.env.NODE_PATH = path.join(runtime, 'node_modules');
require('node:module').Module._initPaths();
const { PGlite } = require('@electric-sql/pglite');
const { drizzle } = require('drizzle-orm/pglite');
const { migrate } = require('drizzle-orm/pglite/migrator');
const { generateDrizzleJson, generateMigration } = require('drizzle-kit/api');
const { eq, and } = require('drizzle-orm');
const root = path.resolve(__dirname, '../..');
const output = process.env.COMMUNITY_TEST_OUTPUT || path.join(root, 'docs/spec-update-2026-10-21/evidence');
fs.mkdirSync(output, { recursive: true });
let db, actor = null, browser = 'a', currentHeaders = new Headers();
const jars = new Map(), cookieOptions = [], cache = new Map(), afterCallbacks = [];
const secret = 'whsec_' + Buffer.alloc(32, 7).toString('base64');
const jar = () => { if (!jars.has(browser)) jars.set(browser, new Map()); return jars.get(browser); };
function source(file) {
  const full = path.join(root, file);
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  if (cache.has(full)) return cache.get(full).exports;
  const sourceModule = { exports: {} }; cache.set(full, sourceModule);
  function localRequire(id) {
    if (id === 'server-only') return {};
    if (id === '@supabase/supabase-js') return { createClient() { throw new Error('Storage unavailable in isolated test'); } };
    if (id === '@/lib/db') return { db };
    if (id === '@clerk/nextjs/server') return {
      auth: async () => ({ userId: actor }),
      currentUser: async () => actor ? { id: actor, firstName: 'Identity name', lastName: 'Identity surname', imageUrl: '',
        primaryEmailAddressId: 'primary', emailAddresses: [{ id: 'primary', emailAddress: actor + '@example.invalid' }] } : null,
    };
    if (id === 'next/headers') return { headers: async () => currentHeaders,
      cookies: async () => ({ get: name => jar().has(name) ? { value: jar().get(name) } : undefined,
        set(name, value, options) { cookieOptions.push({ name, ...options }); if (options.maxAge === 0) jar().delete(name); else jar().set(name, value); } }) };
    if (id === 'next/cache') return { revalidatePath() {} };
    if (id === 'next/navigation') return { redirect(location) { throw Object.assign(new Error('redirect'), { location }); } };
    if (id === 'next/server') return { after: fn => afterCallbacks.push(fn), NextResponse: { json: (body, init) => new Response(JSON.stringify(body), init) } };
    if ((id === '@/actions/telegram' || id === '@/lib/telegram/notifications')) return { sendEventRegistrationNotification: async () => {}, sendServiceRegistrationNotification: async () => {} };
    if (id === 'nodemailer') return { createTransport: () => ({ sendMail: async () => { throw new Error('Delivery blocked by test'); } }) };
    if (id.startsWith('@/') || id.startsWith('.')) {
      const stem = id.startsWith('@/') ? id.slice(2) : path.relative(root, path.resolve(path.dirname(full), id));
      for (const candidate of [stem, stem + '.ts', stem + '.tsx', stem + '/index.ts']) if (fs.existsSync(path.join(root, candidate)) && fs.statSync(path.join(root, candidate)).isFile()) return source(candidate);
    }
    if (['zod', 'drizzle-orm', 'drizzle-orm/pg-core', 'node:crypto', 'svix'].includes(id)) return require(id);
    throw new Error('Blocked external import ' + id);
  }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX,
  }}).outputText, { module: sourceModule, exports: sourceModule.exports, require: localRequire,
    process: { env: { NODE_ENV: 'test', CLERK_WEBHOOK_SECRET: secret } }, console: { log() {}, error() {} },
    crypto: crypto.webcrypto, Buffer, Date, Math, Set, Map, URL, URLSearchParams, Response, Request, Headers }, { filename: file });
  return sourceModule.exports;
}
const schema = source('lib/db/schema.ts');
const checks = [];
async function test(name, fn) { await fn(); checks.push({name,status:'PASS'}); console.log('PASS '+name); }
const payload = extra => ({ affiliation:'maternal',gender:'female',expectedRevision:0,firstName:'Synthetic',lastName:'Member',phone:'+972501234567',dateOfBirth:'1990-02-03',city:'Ришон ле-Цион',cityId:'8300',maritalStatus:'single',spouseName:null,hasChildren:false,agreedToPrivacy:true,...extra });
const child = extra => ({draftId:crypto.randomUUID(),name:'Synthetic child',dateOfBirth:'2020-01-01',gender:'female',...extra});
async function row(id) { return (await db.select().from(schema.users).where(eq(schema.users.id,id)))[0]; }
async function location(query) { try { await source('app/auth/complete/page.tsx').default({searchParams:Promise.resolve(query)});throw new Error('No redirect'); } catch(error) { if(error.location)return error.location;throw error; } }
(async()=>{
  const pg=new PGlite(); db=drizzle(pg,{schema});
  const current=generateDrizzleJson(schema),baseline=structuredClone(current); delete baseline.tables['public.users'].columns.city_id;
  const empty={...baseline,tables:{},schemas:{},enums:{},sequences:{},roles:{},policies:{},views:{}};
  await pg.exec(require('./schema-ddl.cjs').orderSchemaDdl(await generateMigration(empty,baseline)).join('\n'));
  await pg.exec(`INSERT INTO users(id,email,city,filter_version,filter_completed_at,affiliation,gender,is_profile_complete,children_data) VALUES ('legacy','legacy@example.invalid','Historical free value',2,'2026-10-20','maternal','female',true,'[{"id":"old-child","name":"Historical child","dateOfBirth":"2020-01-01"}]');
    INSERT INTO events(id,title,is_free,status) VALUES ('event-a','Approved real database title',true,'planned'),('event-b','Second real title',true,'planned'),('event-hidden','Hidden title',true,'cancelled');
    INSERT INTO event_participants(id,event_id,user_id,status,extra_data) VALUES ('old-ticket','event-a','legacy','paid','{"family":{"child_0":true}}');`);
  const sql=fs.readFileSync(path.join(root,'docs/spec-update-2026-10-21/MANUAL_SQL.sql'),'utf8');
  await test('owner SQL adds nullable city_id, repeats without changing accounts/filter/history or inventing child gender',async()=>{
    const before=await pg.query("select to_jsonb(t) as value from users t order by id");
    await pg.exec(sql); await pg.exec(sql);
    const after=await pg.query("select to_jsonb(t)-'city_id' as value from users t order by id");
    assert.deepEqual(after.rows,before.rows); assert.equal((await row('legacy')).childrenData[0].gender,undefined);
    assert.equal((await db.select().from(schema.eventParticipants))[0].status,'paid');
  });
  for(const defect of ['wrong-city-type','missing-base-column']) await test('owner SQL refuses '+defect+' and preserves incompatible schema for inspection',async()=>{
    const other=new PGlite();await other.exec(require('./schema-ddl.cjs').orderSchemaDdl(await generateMigration(empty,baseline)).join('\n'));
    if(defect==='wrong-city-type')await other.exec('ALTER TABLE users ADD COLUMN city_id integer');
    else await other.exec('ALTER TABLE users DROP COLUMN filter_revision');
    await assert.rejects(other.exec(sql));await other.exec('ROLLBACK');
    const column=(await other.query("select data_type from information_schema.columns where table_schema='public' and table_name='users' and column_name='city_id'")).rows;
    assert.equal(column.length,defect==='wrong-city-type'?1:0);if(column.length)assert.equal(column[0].data_type,'integer');await other.close();
  });
  const profile=source('actions/community.ts'), progress=source('actions/community-progress.ts'), drafts=source('actions/community-drafts.ts');
  const children=source('actions/community-children.ts'), events=source('actions/event.ts'), policy=source('lib/community/policy.ts');
  const journey=source('lib/community/journey.ts');
  await test('third branch needs no gender, preserves old data and completes filter without granting admission',async()=>{
    actor='legacy';const result=await profile.saveResourceChoice(actor,{affiliation:'none',expectedRevision:0});assert.equal(result.success,true);
    const saved=await row(actor);assert.equal(saved.gender,'female');assert.equal(saved.city,'Historical free value');assert.equal(saved.childrenData[0].id,'old-child');
    assert.equal(policy.hasFilterProfile(saved),true);assert.equal(policy.communityAccess(saved).canRegisterSelf,false);
    actor='none-new'; assert.equal((await profile.saveResourceChoice(actor,{affiliation:'none',expectedRevision:0})).success,true);
    assert.equal((await row(actor)).gender,null);assert.equal(policy.hasFilterProfile(await row(actor)),true);
    assert.equal((await events.registerForEvent('event-a',actor)).success,false);
  });
  await test('explicit hasChildren=false persists for a father without deleting children or granting child permissions',async()=>{
    actor='family-flag';await db.insert(schema.users).values({id:actor,email:actor+'@example.invalid',gender:'male',affiliation:'maternal',hasChildren:true,isProfileComplete:true,filterVersion:2,filterCompletedAt:new Date(),childrenData:[{id:'family-old',name:'Preserved child',dateOfBirth:'2020-01-01'}]});
    const saved=await profile.saveCommunityProfile(actor,payload({gender:'male',hasChildren:false}));assert.equal(saved.success,true);
    const person=await row(actor);assert.equal(person.hasChildren,false);assert.equal(person.childrenData[0].id,'family-old');assert.equal(person.childrenData[0].gender,undefined);assert.equal(person.childrenData[0].affiliation,undefined);assert.equal(policy.communityAccess(person).canManageChildren,false);
  });
  await test('city IDs require a known canonical name; stale IDs, arbitrary city strings and foreign redirects fail',async()=>{
    actor='new-city';
    for(const data of [payload({cityId:null}),payload({cityId:'9999'}),payload({city:'Changed after selecting'}),payload({returnTo:'https://outside.invalid'})]) assert.equal((await profile.saveCommunityProfile(actor,data)).success,false);
    const saved=await profile.saveCommunityProfile(actor,payload({returnTo:'/events/event-a'}));assert.equal(saved.success,true);assert.equal(saved.redirectTo,'/events/event-a');
    assert.equal((await row(actor)).cityId,'8300');assert.equal((await row(actor)).city,'Ришон ле-Цион');
    assert.equal((await profile.saveCommunityProfile(actor,payload({expectedRevision:1,cityId:null}))).success,false);
  });
  await test('legacy free-text city remains unchanged without guessed normalization',async()=>{
    actor='legacy';const result=await profile.saveCommunityProfile(actor,payload({expectedRevision:1,city:'Historical free value',cityId:null}));assert.equal(result.success,true);assert.equal((await row(actor)).cityId,null);
  });
  await test('Russian, Hebrew and English search variants share one stable city ID',async()=>{
    const cities=source('lib/community/cities.ts');
    for(const query of ['Ришон-ле-Цион','ראשון לציון','RISHON LEZIYYON'])assert.equal(cities.searchLocalities(query)[0].id,'8300');
    assert.equal(cities.searchLocalities('thereisnosuchcity').length,0);
  });
  await test('CRM filters on canonical locality ID and counts genderless completed resource profiles',async()=>{
    actor='crm-admin';await db.insert(schema.users).values({id:actor,email:actor+'@example.invalid',role:'admin',affiliation:'none',filterVersion:2,filterCompletedAt:new Date()});
    const people=source('actions/user.ts');const result=await people.getUsersPaginated(1,100,'',{cityId:'8300'});
    assert.ok(result.users.length);assert.ok(result.users.every(user=>user.cityId==='8300'));assert.ok(!result.users.some(user=>user.id==='legacy'));
    const completed=await people.getUsersPaginated(1,100,'',{filterCompletion:'passed'});assert.ok(completed.users.some(user=>user.id==='none-new'));
  });
  await test('anonymous full draft rejects foreign existing child IDs and missing/invalid new child gender',async()=>{
    actor=null;browser='invalid-children';
    for(const item of [{id:'old-child',name:'Forged',dateOfBirth:'2020-01-01',gender:'female'},{name:'Missing',dateOfBirth:'2020-01-01'},{name:'Invalid',dateOfBirth:'2020-01-01',gender:'other'}]){
      const id=crypto.randomUUID();assert.equal((await drafts.prepareRegistrationDraft(payload({hasChildren:true,childrenData:[item]}),id)).success,false);
      assert.equal((await db.select().from(schema.communityRegistrationDrafts).where(eq(schema.communityRegistrationDrafts.id,id))).length,0);
    }
  });
  let attempt;
  await test('anonymous child saves/edits/removes in protected partial draft and survives fresh read',async()=>{
    actor=null;browser='draft-tab';attempt=crypto.randomUUID();
    let form={affiliation:'maternal',gender:'female',hasChildren:true,childrenData:[child()]};
    assert.equal((await progress.saveRegistrationProgress(form,attempt,'/events/event-a')).success,true);
    assert.equal(await progress.canResumeRegistrationAttempt(attempt,'/events/event-a'),true);assert.equal(await progress.canResumeRegistrationAttempt(attempt,'/events/event-b'),false);
    const tokenOption=cookieOptions.at(-1);assert.equal(tokenOption.httpOnly,true);
    let restored=await source('lib/community/drafts.ts').readRegistrationDraft(attempt,null);const stable=restored.payload.form.childrenData[0].draftId;
    form={...form,childrenData:[{...form.childrenData[0],name:'Edited child'},child({name:'Second child',gender:'male'})]};
    assert.equal((await progress.saveRegistrationProgress(form,attempt,'/events/event-b')).success,true);
    form.childrenData=form.childrenData.slice(0,1);assert.equal((await progress.saveRegistrationProgress(form,attempt)).success,true);
    restored=await source('lib/community/drafts.ts').readRegistrationDraft(attempt,null);assert.equal(restored.payload.form.childrenData.length,1);assert.equal(restored.payload.form.childrenData[0].draftId,stable);assert.equal(restored.payload.returnTo,'/events/event-a');
    browser='foreign-browser';assert.equal(await progress.canResumeRegistrationAttempt(attempt,'/events/event-a'),false);assert.equal(await source('lib/community/drafts.ts').readRegistrationDraft(attempt,null),null);
    assert.equal((await progress.saveRegistrationProgress(form,attempt)).success,false);
    browser='draft-tab';
  });
  await test('draft data binds to authenticated Clerk ID, persists child gender and returns to its original event',async()=>{
    actor=null;const d=await source('lib/community/drafts.ts').readRegistrationDraft(attempt,null);
    assert.equal((await drafts.prepareRegistrationDraft(payload({hasChildren:true,childrenData:d.payload.form.childrenData}),attempt,'/events/event-b')).success,true);
    actor='oauth-new';assert.equal(await location({draft:attempt}),'/register?resume=1&draft='+attempt);
    const saved=await drafts.completeRegistrationDraft(attempt);assert.equal(saved.success,true);assert.equal(saved.redirectTo,'/events/event-a');
    const u=await row(actor);assert.equal(u.childrenData[0].gender,'female');assert.equal(u.childrenData[0].affiliation,undefined);assert.equal(u.childrenData[0].parentId,actor);assert.ok(u.childrenData[0].id);assert.equal(u.cityId,'8300');
    assert.equal((await db.select().from(schema.users).where(eq(schema.users.id,actor))).length,1);
    actor='different-account';assert.equal((await drafts.completeRegistrationDraft(attempt)).success,false);
  });
  await test('a draft bound during OAuth cannot be rewritten anonymously or rebound to a different account',async()=>{
    browser='bound-attempt';actor=null;const id=crypto.randomUUID();
    assert.equal((await drafts.prepareRegistrationDraft(payload({hasChildren:true,childrenData:[child()]}),id,'/events/event-a')).success,true);
    actor='bound-owner';assert.equal(await source('lib/community/drafts.ts').bindRegistrationAttempt(id,actor),true);
    const before=(await db.select().from(schema.communityRegistrationDrafts).where(eq(schema.communityRegistrationDrafts.id,id)))[0];
    actor=null;assert.equal((await drafts.prepareRegistrationDraft(payload(),id,'/events/event-b')).success,false);
    const after=(await db.select().from(schema.communityRegistrationDrafts).where(eq(schema.communityRegistrationDrafts.id,id)))[0];
    assert.deepEqual(after.payload,before.payload);
    actor='other-owner';assert.equal((await drafts.completeRegistrationDraft(id)).success,false);
    actor='bound-owner';const saved=await drafts.completeRegistrationDraft(id);assert.equal(saved.success,true);assert.equal(saved.redirectTo,'/events/event-a');assert.equal((await row(actor)).childrenData.length,1);
  });
  await test('editing and deleting existing child preserves ID, paid ticket and immutable historical snapshot',async()=>{
    actor='legacy';const old=(await row(actor)).childrenData[0];
    assert.equal((await children.saveOwnChildren([{id:old.id,name:'Edited historical child',dateOfBirth:old.dateOfBirth,gender:'male'}])).success,true);
    const edited=(await row(actor)).childrenData[0];assert.equal(edited.id,old.id);assert.equal(edited.gender,'male');
    assert.equal((await children.saveOwnChildren([{id:edited.id,name:edited.name,dateOfBirth:edited.dateOfBirth,gender:'male'}])).success,true);assert.equal((await row(actor)).childrenData.length,1);
    assert.equal((await children.saveOwnChildren([])).success,true);assert.equal((await row(actor)).childrenData.length,0);
    const ticket=(await db.select().from(schema.eventParticipants).where(eq(schema.eventParticipants.id,'old-ticket')))[0];assert.equal(ticket.status,'paid');assert.equal(ticket.extraData.childrenSnapshot[0].name,'Historical child');assert.equal(ticket.extraData.childrenSnapshot[0].gender,undefined);
  });
  await test('child gender/ownership and giyur restrictions are enforced in direct server calls',async()=>{
    actor='new-city';assert.equal((await children.saveOwnChildren([{name:'No gender',dateOfBirth:'2020-01-01'}])).success,false);
    assert.equal((await children.saveOwnChildren([child({id:'foreign-id'})])).success,false);
    for(const [id,gender,stage] of [['father','male','completed'],['unknown-stage','female',null],['advanced-stage','female','advanced']]){
      actor=id;await db.insert(schema.users).values({id,email:id+'@example.invalid',affiliation:'giyur',gender,giyurStage:stage,filterVersion:2,filterCompletedAt:new Date(),isProfileComplete:true,childrenData:[{id:id+'-old',name:'Kept child',dateOfBirth:'2020-01-01'}]});
      assert.equal((await events.registerForEvent('event-a',actor)).success,true);
      assert.equal((await events.registerForEvent('event-b',actor,null,{childIds:[id+'-old']})).success,false);
      assert.equal((await children.saveOwnChildren([child()])).success,false);
      assert.equal((await profile.saveCommunityProfile(actor,payload({affiliation:'giyur',gender,giyurStage:'completed'}))).success,true);assert.equal((await row(actor)).giyurStage,stage);
    }
    actor='unknown-stage';assert.equal((await profile.saveGiyurStage({stage:'completed',expectedRevision:1})).success,true);
    assert.equal((await children.saveOwnChildren([child()])).success,true);
  });
  await test('current member returns directly, old member completes filter and returns to the same event',async()=>{
    browser='current';actor='new-city';let id=crypto.randomUUID();assert.equal((await progress.ensureRegistrationAttempt(id,'/events/event-b')).success,true);assert.equal(await location({draft:id}),'/events/event-b');
    browser='old';actor=null;id=crypto.randomUUID();assert.equal((await progress.ensureRegistrationAttempt(id,'/events/event-a')).success,true);
    actor='old-member';await db.insert(schema.users).values({id:actor,email:actor+'@example.invalid',filterVersion:1,isProfileComplete:true});
    assert.equal(await location({draft:id}),'/register?returnTo=%2Fevents%2Fevent-a&draft='+id);
    const saved=await drafts.completeRegistrationDraft(id,payload());assert.equal(saved.success,true);assert.equal(saved.redirectTo,'/events/event-a');
  });
  await test('parallel tabs keep separate targets; event titles/return destinations do not disclose hidden data',async()=>{
    actor=null;browser='parallel';const a=crypto.randomUUID(),b=crypto.randomUUID();await progress.ensureRegistrationAttempt(a,'/events/event-a');await progress.ensureRegistrationAttempt(b,'/events/event-b');
    assert.equal((await journey.readJourney({draft:a,returnTo:'/events/event-b'},null)).target,'/events/event-a');assert.equal((await journey.readJourney({draft:b},null)).target,'/events/event-b');
    const target=source('lib/community/event-return.ts');assert.equal(await target.publicEventTitle('event-a'),'Approved real database title');assert.equal(await target.publicEventTitle('event-hidden'),null);
    assert.equal(await target.eventDestination('/events/deleted'),'/dashboard/events?notice=event-unavailable');assert.equal(await target.eventDestination('//outside.invalid'),'/dashboard/events');
    actor='none-new';assert.equal(await location({draft:a}),'/register?result=resources');
  });
  fs.writeFileSync(path.join(output,'spec-results.json'),JSON.stringify({database:'isolated PGlite, real SQL/Drizzle/actions',identity:'mock Clerk',checks},null,2)+'\n');
  await pg.close(); console.log(checks.length+'/'+checks.length+' spec checks passed');
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
