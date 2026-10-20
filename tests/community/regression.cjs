/* Synthetic integration tests: real actions + Drizzle + PostgreSQL/WASM. No real env/network. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const { generateDrizzleJson, generateMigration } = require('drizzle-kit/api');
const runtime = process.env.COMMUNITY_TEST_RUNTIME || '/tmp/menora-filter-test-runtime';
let PGlite;
try { ({PGlite}=require('@electric-sql/pglite')); } catch { ({PGlite}=require(path.join(runtime, 'node_modules/@electric-sql/pglite'))); }
process.env.NODE_PATH = path.join(runtime, "node_modules");
require("node:module").Module._initPaths();
const { drizzle } = require('drizzle-orm/pglite');
const { eq, and } = require('drizzle-orm');
const ROOT = path.resolve(__dirname, '../..');
let db, actor = null;
const cache = new Map(), notifications = [], afterCallbacks = [];
function source(file) {
  const absolute = path.join(ROOT, file);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const sourceModule = { exports: {} }; cache.set(absolute, sourceModule);
  const output = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
  }}).outputText;
  function localRequire(id) {
    if (id === 'server-only') return {};
    if (id === '@/lib/db') return { db };
    if (id === '@clerk/nextjs/server') return {
      auth: async () => ({ userId: actor }),
      currentUser: async () => actor ? { id: actor, firstName: 'Synthetic', lastName: 'Member', imageUrl: '', primaryEmailAddressId: 'primary', emailAddresses: [{ id: 'primary', emailAddress: `${actor}@example.invalid` }] } : null,
    };
    if (id === 'next/cache') return { revalidatePath() {} };
    if (id === 'next/navigation') return { redirect(location) { throw Object.assign(new Error('redirect'), { location }); } };
    if (id === 'next/server') return { after: callback => afterCallbacks.push(callback) };
    if (id === '@/actions/telegram') return { sendEventRegistrationNotification: async (...args) => notifications.push(args) };
    if (id === 'nodemailer') return { createTransport: () => ({ sendMail: async () => { throw new Error('External delivery blocked by test'); } }) };
    if (id.startsWith('@/') || id.startsWith('.')) {
      const resolved = id.startsWith('@/') ? id.slice(2) : path.relative(ROOT, path.resolve(path.dirname(absolute), id));
      for (const candidate of [resolved, resolved + '.ts', resolved + '.tsx', resolved + '/index.ts']) if (fs.existsSync(path.join(ROOT, candidate)) && fs.statSync(path.join(ROOT, candidate)).isFile()) return source(candidate);
      throw new Error('Missing source module: ' + resolved);
    }
    if (['zod','drizzle-orm','drizzle-orm/pg-core','node:crypto'].includes(id)) return require(id);
    throw new Error('Blocked import: ' + id);
  }
  vm.runInNewContext(output, { module: sourceModule, exports: sourceModule.exports, require: localRequire,
    process: { env: {} }, console: { log() {}, error() {} }, URL, URLSearchParams,
    Date, Math, Set, Map, crypto: crypto.webcrypto, Buffer }, { filename: file });
  return sourceModule.exports;
}
const checks = [];
async function test(name, fn) { await fn(); checks.push({ name, status: 'PASS' }); console.log('PASS ' + name); }
const profilePayload = (override = {}) => ({ affiliation: 'maternal', gender: 'female', expectedRevision: 0,
  firstName: 'Synthetic', lastName: 'Member', phone: '+972501234567', dateOfBirth: '1990-01-01', city: 'Synthetic city',
  maritalStatus: 'single', spouseName: null, hasChildren: false, childrenData: [], agreedToPrivacy: true, ...override });
(async () => {
  const schema = source('lib/db/schema.ts'); const pg = new PGlite(); db = drizzle(pg, { schema });
  const current = generateDrizzleJson(schema);
  const baseline = structuredClone(current); delete baseline.tables['public.community_audit'];
  for (const column of ['gender','affiliation','filter_version','filter_revision','giyur_stage']) delete baseline.tables['public.users'].columns[column];
  baseline.tables['public.users'].checkConstraints = {};
  const empty = { ...baseline, tables: {}, schemas: {}, enums: {}, sequences: {}, roles: {}, policies: {}, views: {} };
  const statements = await generateMigration(empty, baseline);
  await pg.exec(statements.join('\n'));
  await pg.exec(`INSERT INTO users(id,email,is_profile_complete,jewish_status,children_data) VALUES ('legacy','legacy@example.invalid',true,'Еврей по материнской линии','[{"name":"Original child","dateOfBirth":"2020-01-01"}]');`);
  await test('video author projection works on baseline without any filtering columns', async () => {
    await pg.exec(`INSERT INTO videos(id,title,link,author_id) VALUES ('00000000-0000-4000-8000-000000000001','Synthetic video','https://example.invalid/video','legacy');`);
    const result=await source('actions/video.ts').getVideos();assert.equal(result.length,1);assert.equal(result[0].title,'Synthetic video');
  });
  const migration = ['0004_community_filtering.sql','0005_giyur_stage.sql'].map(file=>fs.readFileSync(path.join(ROOT,'drizzle',file),'utf8')).join('\n');
  await test('additive migration preserves legacy fields and child entries', async () => {
    await pg.exec(migration);
    const row = (await pg.query(`SELECT gender,affiliation,filter_version,filter_revision,jewish_status,children_data FROM users WHERE id='legacy'`)).rows[0];
    assert.equal(row.gender,null); assert.equal(row.affiliation,null); assert.equal(row.filter_version,null); assert.equal(row.filter_revision,0);
    assert.equal(row.jewish_status,'Еврей по материнской линии'); assert.equal(row.children_data[0].name,'Original child');
  });
  await test('migration is idempotent; database rejects unknown affiliation/gender', async () => {
    await pg.exec(migration);
    await assert.rejects(pg.query(`UPDATE users SET gender='unknown' WHERE id='legacy'`));
    await assert.rejects(pg.query(`UPDATE users SET affiliation='unknown' WHERE id='legacy'`));
  });
  const { users, events, eventParticipants, kidsApplications, communityAudit } = schema;
  const policy = source('lib/community/policy.ts');
  const filter = source('actions/community.ts');
  const event = source('actions/event.ts');
  const kids = source('actions/kids.actions.ts');
  const childrenAction = source('actions/community-children.ts');
  const admin = source('actions/community-admin.ts');
  const legacyEvent = source('actions/event-registration.ts');
  const userActions = source('actions/user.ts');
  const oldChildren = source('actions/kids-profile.ts');
  const ownChild = { id: 'child-mom', parentId: 'mom', name: 'Own child', dateOfBirth: '2020-02-01' };
  await db.insert(users).values([
    { id:'mom',email:'mom@example.invalid',gender:'female',affiliation:'maternal',filterVersion:2,filterCompletedAt:new Date("2026-10-20T00:00:00Z"),isProfileComplete:true,childrenData:[ownChild] },
    { id:'mom-other',email:'mom-other@example.invalid',gender:'female',affiliation:'maternal',filterVersion:2,filterCompletedAt:new Date("2026-10-20T00:00:00Z"),isProfileComplete:true,childrenData:[{...ownChild,id:'child-other',parentId:'mom-other'}] },
    { id:'father',email:'father@example.invalid',gender:'male',affiliation:'maternal',filterVersion:2,filterCompletedAt:new Date("2026-10-20T00:00:00Z"),isProfileComplete:true,childrenData:[{...ownChild,id:'child-father',parentId:'father'}] },
    { id:'father-unknown',email:'father-unknown@example.invalid',gender:'male' },
    { id:'father-none',email:'father-none@example.invalid',gender:'male',affiliation:'none',filterVersion:2,filterCompletedAt:new Date("2026-10-20T00:00:00Z"),isProfileComplete:true },
    { id:'giyur',email:'giyur@example.invalid',gender:'female',affiliation:'giyur',filterVersion:2,filterCompletedAt:new Date("2026-10-20T00:00:00Z"),isProfileComplete:true },
    { id:'new-google',email:'new-google@example.invalid' },
    { id:'admin',email:'admin@example.invalid',role:'admin',affiliation:'none',gender:'male',filterVersion:2,filterCompletedAt:new Date('2026-10-20T00:00:00Z') },
  ]);
  for (const id of ['event-free','event-paid','event-closed','event-fault','event-history','event-parallel','event-manual','event-child-complete']) await db.insert(events).values({ id,title:'Synthetic event',status:'planned',isFree:id!=='event-paid',price:'100',childPrice:'25',paymentUrl:'https://payments.example.invalid/pay?campaign=keep',isRegistrationClosed:id==='event-closed' });
  await test('policy separates current completion, personal admission and staff authority', async () => {
    const mom = (await db.select().from(users).where(eq(users.id,'mom')))[0];
    const dad = (await db.select().from(users).where(eq(users.id,'father')))[0];
    assert.equal(policy.communityAccess(mom).canRegisterChildren,true); assert.equal(policy.communityAccess(dad).canRegisterSelf,true); assert.equal(policy.communityAccess(dad).canManageChildren,false);
    assert.equal(policy.communityAccess({isProfileComplete:true}).canViewEvents,false);
    assert.equal(policy.communityAccess({gender:'female',affiliation:'giyur',filterVersion:2,filterCompletedAt:new Date("2026-10-20T00:00:00Z"),isProfileComplete:true}).canRegisterSelf,true);
    assert.equal(policy.communityAccess({gender:'male',affiliation:'giyur',filterVersion:2,filterCompletedAt:new Date("2026-10-20T00:00:00Z"),isProfileComplete:true}).canRegisterSelf,true);
    assert.equal(policy.communityAccess({gender:'female',affiliation:'giyur',filterVersion:2,filterCompletedAt:new Date("2026-10-20T00:00:00Z"),isProfileComplete:true}).canManageChildren,false);
    assert.equal(policy.communityAccess({role:'admin'}).canViewEvents,false); assert.equal(policy.communityAccess({role:'admin'}).canRegisterSelf,false);
  });
  for (const gender of ['female','male']) for (const affiliation of ['maternal','giyur']) {
    for (const stage of affiliation === 'giyur' ? [null,'advanced','completed'] : [null]) {
      await test(`${gender} ${affiliation}/${stage}: form persists, admits self and enforces child rights`, async () => {
        actor = `admission-${gender}-${affiliation}-${stage}`;
        await db.insert(users).values({id:actor,email:actor+'@example.invalid',childrenData:[{id:actor+'-child',name:'Existing child',dateOfBirth:'2020-01-01'}]});
        const canChildren = gender === 'female' && (affiliation === 'maternal' || stage === 'completed');
        const data = profilePayload({gender,affiliation,hasChildren:true,childrenData:canChildren ? [{id:actor+'-child',name:'Existing child',dateOfBirth:'2020-01-01'}] : []});
        if (stage !== null) data.giyurStage = stage;
        const saved = await filter.saveCommunityProfile(actor,data);
        assert.equal(saved.success,true); assert.equal(saved.redirectTo,'/dashboard/events');
        assert.equal(saved.access.canRegisterSelf,true); assert.equal(saved.access.canViewEvents,true);
        const profile = (await db.select().from(users).where(eq(users.id,actor)))[0];
        assert.equal(profile.giyurStage,stage); assert.equal(profile.affiliation,affiliation);
        assert.equal(profile.childrenData.length,1);
        assert.equal((await event.getEventById('event-free')).id,'event-free');
        assert.equal((await event.registerForEvent('event-free',actor)).success,true);
        assert.equal(saved.access.canRegisterChildren,canChildren);
        assert.equal((await event.registerForEvent('event-paid',actor,undefined,{childIds:[actor+'-child']})).success,canChildren);
        assert.equal((await childrenAction.saveOwnChildren([{id:actor+'-child',name:'Existing child',dateOfBirth:'2020-01-01'},{name:'New child',dateOfBirth:'2021-01-01'}])).success,canChildren);
      });
    }
  }
  await test('return paths reject external, protocol-relative, encoded slash and OAuth loops', async () => {
    for (const url of ['https://outside.example.invalid','//outside.example.invalid','/\\outside.example.invalid','/events/%2Foutside','/sso-callback','/sign-in','/auth/complete?returnTo=/auth/complete','/events/test\n']) assert.equal(policy.safeReturnTo(url),'/dashboard');
    assert.equal(policy.safeReturnTo('/events/event-free'),'/events/event-free');
  });
  await test('guest receives no event list, details, categories or foreign family', async () => {
    actor = null; assert.equal(await event.getEventById('event-free'),null);
    assert.equal((await event.getEvents()).length,0); assert.equal((await event.getPublicEventsPaginated()).events.length,0);
    assert.equal((await event.getEventCategories()).length,0); assert.equal(await event.getUserFamilyData('mom'),null);
    assert.equal((await event.registerForEvent('event-free','mom')).success,false);
  });
  await test('new Google account cannot skip questionnaire using the login branch', async () => {
    actor='new-google'; assert.equal(await event.getEventById('event-free'),null);
    assert.equal((await event.registerForEvent('event-free',actor)).success,false);
  });
  await test('missing/unknown fields, foreign user ID and forged role do not complete a profile', async () => {
    actor='new-google';
    for (const value of [{},profilePayload({affiliation:'unknown'}),profilePayload({gender:'unknown'}),profilePayload({role:'admin'}),profilePayload({hasChildren:true,childrenData:[]})]) assert.equal((await filter.saveCommunityProfile(actor,value)).success,false);
    assert.equal((await filter.saveCommunityProfile('mom',profilePayload())).success,false);
    assert.equal((await db.select().from(users).where(eq(users.id,actor)))[0].isProfileComplete,false);
  });
  await test('maternal questionnaire persists separate fields and survives a fresh read', async () => {
    actor='new-google'; const result=await filter.saveCommunityProfile(actor,profilePayload()); assert.equal(result.success,true);
    const saved=(await db.select().from(users).where(eq(users.id,actor)))[0]; assert.equal(saved.gender,'female'); assert.equal(saved.affiliation,'maternal'); assert.equal(saved.filterVersion,2); assert.ok(saved.filterCompletedAt); assert.equal(saved.filterRevision,1); assert.equal(saved.isProfileComplete,true);
    assert.equal((await event.getEventById('event-free')).id,'event-free');
  });
  await test('combined giyur saves full form without inferring completion or child rights', async () => {
    actor='giyur'; const result=await filter.saveCommunityProfile(actor,profilePayload({affiliation:'giyur'})); assert.equal(result.success,true); assert.equal(result.access.canRegisterSelf,true);
    assert.equal((await childrenAction.saveOwnChildren([{name:'New child',dateOfBirth:'2020-01-01'}])).success,false);
  });
  await test('advanced giyur woman registers herself but no child through every existing entry point', async () => {
    actor='giyur';
    assert.equal((await filter.saveGiyurStage({stage:'advanced',expectedRevision:1})).success,true);
    await db.update(users).set({childrenData:[{id:'giyur-old-child',name:'Existing child',dateOfBirth:'2020-01-01'}]}).where(eq(users.id,actor));
    assert.equal((await event.registerForEvent('event-free',actor)).success,true);
    const child={name:'Forbidden child',dateOfBirth:'2020-01-01'};
    assert.equal((await filter.saveCommunityProfile(actor,profilePayload({affiliation:'giyur',giyurStage:'advanced',expectedRevision:2,childrenData:[child]}))).success,false);
    assert.equal((await childrenAction.saveOwnChildren([child])).success,false);
    assert.equal((await oldChildren.updateUserChildren([child])).success,false);
    assert.equal((await kids.updateUserChildren([child])).success,false);
    assert.equal((await userActions.updateFamilyProfile(actor,'Spouse',[child])).success,false);
    assert.equal((await event.registerForEvent('event-paid',actor,undefined,{childIds:['giyur-old-child']})).success,false);
    assert.equal((await event.registerForEvent('event-paid',actor,undefined,{}, {newChild:child})).success,false);
    assert.equal((await kids.submitKidsApplication({programTitle:'Synthetic',childIds:['giyur-old-child']})).success,false);
  });
  await test('one-field completion clarification grants eligible mother child rights, without replacing profile/history', async () => {
    actor='giyur';
    assert.equal((await filter.saveGiyurStage({stage:'completed',expectedRevision:0})).success,false);
    assert.equal((await filter.saveGiyurStage({stage:'completed',expectedRevision:2,parentId:'mom'})).success,false);
    const before=(await db.select().from(users).where(eq(users.id,actor)))[0];
    assert.equal((await filter.saveGiyurStage({stage:'completed',expectedRevision:2})).success,true);
    const after=(await db.select().from(users).where(eq(users.id,actor)))[0];
    assert.equal(after.firstName,before.firstName);assert.deepEqual(after.childrenData,before.childrenData);assert.equal(after.giyurStage,'completed');
    assert.equal((await event.registerForEvent('event-child-complete',actor,undefined,{childIds:['giyur-old-child']})).success,true);
    assert.equal((await childrenAction.saveOwnChildren([{id:'giyur-old-child',name:'Existing child',dateOfBirth:'2020-01-01'},{name:'New allowed child',dateOfBirth:'2021-01-01'}])).success,true);
    assert.equal((await filter.saveGiyurStage({stage:'advanced',expectedRevision:3})).success,true);
    assert.equal((await event.registerForEvent('event-child-complete',actor,undefined,{childIds:['giyur-old-child']})).success,false);
  });
  await test('third branch accepts only minimal choice, preserves family and revokes fresh actions', async () => {
    actor='mom'; assert.equal((await filter.saveResourceChoice(actor,profilePayload({affiliation:'none'}))).success,false);
    const result=await filter.saveResourceChoice(actor,{affiliation:'none',gender:'female',expectedRevision:0}); assert.equal(result.success,true);
    const saved=(await db.select().from(users).where(eq(users.id,actor)))[0]; assert.equal(saved.childrenData[0].id,'child-mom'); assert.equal(saved.affiliation,'none');
    assert.equal((await event.registerForEvent('event-free',actor,undefined,{family:{self:true}})).success,false);
    assert.equal((await filter.saveCommunityProfile(actor,profilePayload({childrenData:[{id:'child-mom',name:'Own child',dateOfBirth:'2020-02-01'}]}))).success,false);
    assert.equal((await filter.saveCommunityProfile(actor,profilePayload({expectedRevision:1,hasChildren:true,childrenData:[{id:'child-mom',name:'Own child',dateOfBirth:'2020-02-01'}]}))).success,true);
  });
  await test('father cannot create child via profile, either legacy action, family update or event', async () => {
    actor='father'; const child={name:'Forbidden child',dateOfBirth:'2020-01-01'};
    assert.equal((await filter.saveCommunityProfile(actor,profilePayload({gender:'male',childrenData:[child]}))).success,false);
    assert.equal((await kids.updateUserChildren([child])).success,false); assert.equal((await oldChildren.updateUserChildren([child])).success,false);
    assert.equal((await userActions.updateFamilyProfile(actor,null,[child])).success,false);
    assert.equal((await event.registerForEvent('event-free',actor,undefined,{family:{self:true}}, {newChild:child})).success,false);
    assert.equal((await db.select().from(users).where(eq(users.id,actor)))[0].childrenData.length,1);
  });
  await test('father cannot enroll an already existing child or use anonymous child counts', async () => {
    actor='father';
    assert.equal((await event.registerForEvent('event-free',actor,undefined,{family:{self:true,child_0:true}})).success,false);
    assert.equal((await event.registerForEvent('event-free',actor,undefined,{childIds:['child-father']})).success,false);
    assert.equal((await event.registerForEvent('event-free',actor,undefined,{extraKids:1})).success,false);
    assert.equal((await kids.submitKidsApplication({programTitle:'Synthetic',childIds:['child-father']})).success,false);
  });
  await test('mother cannot read/update foreign parent or inject foreign child IDs/parentId/gender', async () => {
    actor='mom'; assert.equal(await event.getUserFamilyData('mom-other'),null);
    assert.equal((await childrenAction.saveOwnChildren([], 'mom-other')).success,false);
    assert.equal((await kids.updateUserChildren([{id:'child-other',name:'Other child',dateOfBirth:'2020-02-01'}])).success,false);
    assert.equal((await kids.updateUserChildren([{...ownChild}])).success,false); // parentId from client is rejected
    assert.equal((await event.registerForEvent('event-free',actor,undefined,{childIds:['child-other']})).success,false);
    assert.equal((await event.registerForEvent('event-free',actor,undefined,{family:{self:true},gender:'female'})).success,false);
  });
  await test('mother saves a new child and enrolls only linked children in a program', async () => {
    actor='mom'; const result=await kids.updateUserChildren([{id:'child-mom',name:'Own child',dateOfBirth:'2020-02-01'},{name:'New child',dateOfBirth:'2022-01-01'}]); assert.equal(result.success,true); assert.ok(result.children[1].id);
    assert.equal((await kids.submitKidsApplication({programTitle:'Synthetic program',childIds:[result.children[1].id],parentFirstName:'Forged name'})).success,true);
    assert.equal((await kids.submitKidsApplication({programTitle:'Synthetic',childIds:['child-other']})).success,false);
    const application=(await db.select().from(kidsApplications).where(eq(kidsApplications.userId,actor)))[0]; assert.equal(application.children[0].parentId,'mom'); assert.notEqual(application.parentFirstName,'Forged name');
  });
  await test('Shutafim uses server prices and ignores client amount; changed selection reprices one pending record', async () => {
    actor='mom';
    const profile=(await db.select().from(users).where(eq(users.id,actor)))[0];
    const paid=(await db.select().from(events).where(eq(events.id,'event-paid')))[0];
    const prepared=source('lib/community/registration.ts').prepareEventRegistration(profile,paid,{family:{self:true},childIds:['child-mom']});
    assert.equal(prepared.totalAmount,125);assert.equal(prepared.extraData.childrenSnapshot[0].id,'child-mom');
    const result=await event.registerForEvent('event-paid',actor,undefined,{family:{self:true},childIds:['child-mom']},undefined,0);
    assert.equal(result.success,true);
    const url = new URL(result.paymentUrl);
    for (const [key,value] of Object.entries({price:'125',quantity:'1',cur:'ILS',payments:'1',lang:'ru',campaign:'keep'})) assert.equal(url.searchParams.get(key),value);
    const [pending] = await db.select().from(eventParticipants).where(and(eq(eventParticipants.eventId,'event-paid'),eq(eventParticipants.userId,actor)));
    assert.equal(pending.status,'pending'); assert.equal(url.searchParams.get('custom1'),pending.id);
    const again = await event.registerForEvent('event-paid',actor,undefined,{extraAdults:2},undefined,0.01);
    assert.equal(again.success,true); assert.equal(new URL(again.paymentUrl).searchParams.get('price'),'300');
    const rows = await db.select().from(eventParticipants).where(and(eq(eventParticipants.eventId,'event-paid'),eq(eventParticipants.userId,actor)));
    assert.equal(rows.length,1); assert.equal(rows[0].id,pending.id); assert.equal(rows[0].status,'pending');
    actor='admin'; assert.equal((await event.updateEventParticipantStatus(pending.id,'paid')).success,false);
    assert.equal((await event.updateEventParticipantStatus(pending.id,'confirmed')).success,false);
    assert.equal((await db.select().from(eventParticipants).where(eq(eventParticipants.id,pending.id)))[0].status,'pending');
  });
  await test('closed event fails before child creation; legacy registration delegates to policy', async () => {
    actor='mom'; const before=(await db.select().from(users).where(eq(users.id,actor)))[0].childrenData.length;
    assert.equal((await event.registerForEvent('event-closed',actor,undefined,{}, {newChild:{name:'Must not persist',dateOfBirth:'2020-01-01'}})).success,false);
    assert.equal((await db.select().from(users).where(eq(users.id,actor)))[0].childrenData.length,before);
    actor='father'; assert.equal((await legacyEvent.registerForEvent('event-free',actor,{childIds:['child-father']})).success,false);
  });
  await test('ordinary account cannot elevate role or invoke manual/admin event operations', async () => {
    actor='father'; assert.equal((await userActions.updateUserRoleAction(actor,'superadmin')).success,false);
    assert.equal((await event.updateEvent('event-free',{title:'Forged'})).success,false);
    assert.equal((await admin.registerChildManually({requestId:crypto.randomUUID(),parentId:'father-none',childIds:[],newChild:{name:'Synthetic child',dateOfBirth:'2020-01-01'},kind:'program',programTitle:'Synthetic',reason:'Synthetic exception reason'})).success,false);
    await assert.rejects(admin.getManualParent('mom'));
  });
  await test("admin manual exception records actor/reason and never changes father's status", async () => {
    actor='admin'; const request={requestId:crypto.randomUUID(),parentId:'father-none',childIds:[],newChild:{name:'Manual child',dateOfBirth:'2019-01-01'},kind:'program',programTitle:'Synthetic manual',reason:'Synthetic father-only exception'};
    const result=await admin.registerChildManually(request); assert.equal(result.success,true);
    const record=(await db.select().from(communityAudit).where(eq(communityAudit.id,request.requestId)))[0]; assert.equal(record.actorId,'admin'); assert.equal(record.parentId,'father-none'); assert.equal(record.details.statusChanged,false);
    assert.equal((await db.select().from(users).where(eq(users.id,'father-none')))[0].affiliation,'none');
    assert.equal((await admin.registerChildManually(request)).success,true); assert.equal((await db.select().from(communityAudit).where(eq(communityAudit.id,request.requestId))).length,1);
    const before=(await db.select().from(users).where(eq(users.id,'father')))[0];
    const exception=await admin.registerChildManually({...request,requestId:crypto.randomUUID(),parentId:'father'}); assert.equal(exception.success,true);
    const after=(await db.select().from(users).where(eq(users.id,'father')))[0]; assert.equal(after.affiliation,before.affiliation); assert.equal(after.jewishStatus,before.jewishStatus); assert.equal(policy.communityAccess(after).canRegisterSelf,policy.communityAccess(before).canRegisterSelf);
  });
  await test('admin free child exception preserves unknown father status and is idempotent', async () => {
    actor='admin'; const input={requestId:crypto.randomUUID(),parentId:'father-unknown',childIds:[],newChild:{name:'Manual event child',dateOfBirth:'2020-01-01'},kind:'event',eventId:'event-manual',reason:'Synthetic father-only situation'};
    const r=await admin.registerChildManually(input);assert.equal(r.success,true);assert.equal(r.paymentUrl,null);
    const again=await admin.registerChildManually(input);assert.equal(again.paymentUrl,r.paymentUrl);
    const father=(await db.select().from(users).where(eq(users.id,'father-unknown')))[0];assert.equal(father.affiliation,null);assert.equal(father.jewishStatus,null);assert.equal(father.filterVersion,null);
    const participant=(await db.select().from(eventParticipants).where(eq(eventParticipants.id,r.id)))[0];assert.equal(participant.status,'confirmed');assert.equal(participant.extraData.family.self,false);
  });
  await test('admin paid child exception opens priced iframe link, preserves father status and audit on replay', async () => {
    const before=(await db.select().from(users).where(eq(users.id,'father')))[0];
    const input={requestId:crypto.randomUUID(),parentId:'father',childIds:['child-father'],kind:'event',eventId:'event-paid',reason:'Synthetic father-only exception'};
    actor='father'; assert.equal((await admin.registerChildManually(input)).success,false);
    actor='admin'; const result=await admin.registerChildManually(input); assert.equal(result.success,true);
    assert.equal(new URL(result.paymentUrl).searchParams.get('price'),'25');
    assert.equal((await admin.registerChildManually(input)).paymentUrl,result.paymentUrl);
    const after=(await db.select().from(users).where(eq(users.id,'father')))[0];
    assert.equal(after.affiliation,before.affiliation); assert.equal(after.jewishStatus,before.jewishStatus);
    assert.equal((await db.select().from(eventParticipants).where(eq(eventParticipants.id,result.id)))[0].status,'pending');
    const audits=await db.select().from(communityAudit).where(eq(communityAudit.id,input.requestId));
    assert.equal(audits.length,1); assert.equal(audits[0].actorId,'admin'); assert.equal(audits[0].reason,input.reason);
  });
  await test('historical positional child identity is snapshotted before profile edit', async () => {
    actor='legacy'; const old=source('lib/community/children.ts').profileChildren(actor,(await db.select().from(users).where(eq(users.id,actor)))[0].childrenData)[0];
    await db.insert(eventParticipants).values({eventId:'event-history',userId:actor,phone:'synthetic',status:'paid',extraData:{family:{child_0:true}}});
    assert.equal((await filter.saveCommunityProfile(actor,profilePayload({hasChildren:true,childrenData:[{id:old.id,name:'Renamed child',dateOfBirth:'2020-01-01'}]}))).success,true);
    const record=(await db.select().from(eventParticipants).where(eq(eventParticipants.eventId,'event-history')))[0]; assert.equal(record.extraData.childrenSnapshot[0].name,'Original child');
    assert.equal((await db.select().from(users).where(eq(users.id,actor)))[0].jewishStatus,'Еврей по материнской линии');
  });
  await test('database failure after family update rolls back child and registration together', async () => {
    actor='mom'; const before=(await db.select().from(users).where(eq(users.id,actor)))[0].childrenData.length;
    await pg.exec(`CREATE FUNCTION reject_test_registration() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.event_id='event-fault' THEN RAISE EXCEPTION 'synthetic failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_test_registration BEFORE INSERT ON event_participants FOR EACH ROW EXECUTE FUNCTION reject_test_registration();`);
    const result=await event.registerForEvent('event-fault',actor,undefined,{family:{self:true}},{newChild:{name:'Rollback child',dateOfBirth:'2020-01-01'}}); assert.equal(result.success,false);assert.ok(!result.message.includes('synthetic failure'));assert.ok(!result.message.includes('insert into'));
    assert.equal((await db.select().from(users).where(eq(users.id,actor)))[0].childrenData.length,before);
    assert.equal((await db.select().from(eventParticipants).where(eq(eventParticipants.eventId,'event-fault'))).length,0);
  });
  await test('repeat/concurrent transaction entry creates one logical free registration', async () => {
    actor='mom'; const results=await Promise.all([event.registerForEvent('event-parallel',actor),event.registerForEvent('event-parallel',actor)]); assert.ok(results.every(item=>item.success));
    assert.equal((await db.select().from(eventParticipants).where(eq(eventParticipants.eventId,'event-parallel'))).length,1);
  });
  await test('fresh profile changes revoke old prepared registration requests', async () => {
    actor='mom-other'; await db.update(users).set({gender:'male'}).where(eq(users.id,actor));
    assert.equal((await event.registerForEvent('event-free',actor,undefined,{childIds:['child-other']})).success,false);
    await db.update(users).set({affiliation:'none'}).where(eq(users.id,actor)); assert.equal(await event.getEventById('event-free'),null);
  });
  await pg.close();
  const result={engine:'PGlite 0.5.10 PostgreSQL/WASM, Drizzle real SQL/transactions; auth and external side effects injected',limitations:['Not real Clerk/Google OAuth or browser E2E','PGlite serializes transactions; multi-connection PostgreSQL locking/load not measured','No real DB, external delivery or payments'],checks};
  const output=path.join(process.env.COMMUNITY_TEST_OUTPUT || path.join(ROOT,'docs/implementation-2026-10-20'),'regression-results.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
  console.log(`${checks.length}/${checks.length} regression scenarios passed. External side effects disabled.`);
})().catch(error=>{ console.error(error.stack);process.exitCode=1; });
